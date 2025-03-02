import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Fieldset, Input, Stack, Box, HStack, VStack, Text } from "@chakra-ui/react";
import { Field } from "../components/ui/field";
import {
  NativeSelectField,
  NativeSelectRoot,
} from "../components/ui/native-select";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SuccessPopup from '../components/SuccessPopup';
import './register.css';

import {
    AccordionItem,
    AccordionItemContent,
    AccordionItemTrigger,
    AccordionRoot,
} from "../components/ui/accordion"

/*概要説明等
目的：
    新規ユーザーが追加情報を入力するための登録フォームを提供
主な機能：
    ユーザー情報入力フォームの表示
    Google認証で取得した基本情報の表示
    GitHubユーザー名などの追加情報の収集
    登録情報のバックエンドへの送信
重要なポイント：
    Googleログインで取得した情報を初期値として表示
    必要な追加情報を収集
    登録完了後にダッシュボードへ遷移
*/

function Register() {
    const { user, completeRegistration } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        notificationEmail: user?.email || '',
        gitName: '',
        time: '21:30'
    });

    const [selectedEmailOption, setSelectedEmailOption] = useState('google');

    //エラー状態の管理
    const [errors, setErrors] = useState({
        googleId: '',
        notificationEmail: '',
        gitName: '',
        time: ''
    });

    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    //デバック
    React.useEffect(() => {
        console.log('Current user:', user);
    }, [user]);

    // useEffectを追加してuseGoogleEmailの変更を監視
    React.useEffect(() => {
        if (selectedEmailOption === 'google') {
            setFormData((prevData) => ({
                ...prevData,
                notificationEmail: user?.email || ''
            }));
        }
    }, [selectedEmailOption, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    googleId: user.uid,
                    notificationEmail: formData.notificationEmail,
                    gitName: formData.gitName,
                    time: formData.time
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                handleRegistrationComplete();
            } else {
                // エラーメッセージをポップアップで表示
                if (data.errors) {
                    Object.values(data.errors).forEach(error => {
                        toast.error(error);
                    });
                }
                setErrors(data.errors || {});
            }
        } catch (error) {
            console.error("登録エラー:", error);
            toast.error("登録中にエラーが発生しました。");
        }
    };

    const handleEmailOptionChange = (value) => {
        setSelectedEmailOption(value);
        if (value === 'google') {
            setFormData(prev => ({
                ...prev,
                notificationEmail: user?.email || ''
            }));
        }
    };

    const handleHourChange = (e) => {
        const newHour = e.target.value;
        const [_, minutes] = formData.time.split(':');
        setFormData({...formData, time: `${newHour}:${minutes}`});
    };

    const handleMinuteChange = (e) => {
        const newMinute = e.target.value;
        const [hours, _] = formData.time.split(':');
        setFormData({...formData, time: `${hours}:${newMinute}`});
    };

    const handleRegistrationComplete = () => {
        //localStorageに登録完了フラグをセット(これ無いとダッシュボードに遷移しない)
        localStorage.setItem(`registered_${user.uid}`, 'true');
        setShowSuccessPopup(true);
    };

    const handlePopupClose = () => {
        setShowSuccessPopup(false);
    };

    const emailOptions = [
        {
            value: 'google',
            title: 'Googleに登録されたメールアドレスを使用',
            description: user?.email
        },
        {
            value: 'custom',
            title: '自分で入力',
            description: '別のメールアドレスを使用'
        }
    ];

    // <ToastContainer />このコンポーネントがポップアップ表示管理
    return (
        <Box className="container">
            <form onSubmit={handleSubmit}>
                <Fieldset.Root size="lg">
                    <Stack spacing={4}>
                        <Fieldset.Legend className="fieldset__legend">ユーザー登録</Fieldset.Legend>
                        <Fieldset.HelperText className="fieldset__helperText">
                            以下に必要な情報を入力してください。
                        </Fieldset.HelperText>
                    </Stack>

                    <Fieldset.Content>
                        <Field label="通知用メールアドレスの選択">
                            <VStack align="stretch" spacing={4}>
                                <HStack spacing={3} align="stretch">
                                    <Box 
                                        p={3} 
                                        border="1px solid" 
                                        borderColor={selectedEmailOption === 'google' ? "blue.500" : "gray.200"}
                                        borderRadius="md"
                                        cursor="pointer"
                                        onClick={() => handleEmailOptionChange('google')}
                                        bg={selectedEmailOption === 'google' ? "blue.50" : "white"}
                                        flex="1"
                                        maxW="50%"
                                        transition="all 0.2s"
                                        _hover={{
                                            borderColor: "blue.500",
                                            bg: "blue.50"
                                        }}
                                    >
                                        <Text fontWeight="bold" fontSize="sm">
                                            Googleに登録されたメールアドレスを使用
                                        </Text>
                                        <Text color="gray.600" fontSize="sm" mt={1}>
                                            {user?.email}
                                        </Text>
                                    </Box>
                                    <Box 
                                        p={3}
                                        border="1px solid" 
                                        borderColor={selectedEmailOption === 'custom' ? "blue.500" : "gray.200"}
                                        borderRadius="md"
                                        cursor="pointer"
                                        onClick={() => handleEmailOptionChange('custom')}
                                        bg={selectedEmailOption === 'custom' ? "blue.50" : "white"}
                                        flex="1"
                                        maxW="50%"
                                        transition="all 0.2s"
                                        _hover={{
                                            borderColor: "blue.500",
                                            bg: "blue.50"
                                        }}
                                    >
                                        <Text fontWeight="bold" fontSize="sm">
                                            自分で入力
                                        </Text>
                                        <Text color="gray.600" fontSize="sm" mt={1}>
                                            別のメールアドレスを使用
                                        </Text>
                                    </Box>
                                </HStack>
                                {selectedEmailOption === 'custom' && (
                                    <Input
                                        mt={2}
                                        type="email"
                                        value={formData.notificationEmail}
                                        onChange={(e) => setFormData({...formData, notificationEmail: e.target.value})}
                                        placeholder="me@example.com"
                                        width="100%"
                                        fontSize="sm"
                                        borderColor="gray.300"
                                    />
                                )}
                            </VStack>
                        </Field>

                        <Field label="Gitユーザー名">
                            <VStack align="stretch" spacing={2}>
                                <Input
                                    type="text"
                                    value={formData.gitName}
                                    onChange={(e) => setFormData({...formData, gitName: e.target.value})}
                                    required
                                    className="chakra-input"
                                />
                                <AccordionRoot collapsible>
                                    <AccordionItem value="git-help">
                                        <AccordionItemTrigger className="accordion-trigger">
                                            Gitユーザー名とは？
                                        </AccordionItemTrigger>
                                        <AccordionItemContent>
                                            <VStack align="start" spacing={2}>
                                                <Text>
                                                    自分のGitHubのプロフィールURLの末尾の文字列です。
                                                </Text>
                                                <Box p={2} bg="gray.50" borderRadius="md">
                                                    <Text>
                                                        例：https://github.com/<Text as="span" fontWeight="bold" color="blue.500">TanakaTaro</Text>
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.600" mt={1}>
                                                        この場合、ユーザー名は「TanakaTaro」となります
                                                    </Text>
                                                </Box>
                                            </VStack>
                                        </AccordionItemContent>
                                    </AccordionItem>
                                </AccordionRoot>
                            </VStack>
                        </Field>

                        <Field label="通知時間">
                            <Stack direction={{ base: "column", md: "row" }} alignItems="center" spacing={2}>
                                <NativeSelectRoot>
                                    <NativeSelectField
                                        name="hour"
                                        items={Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))}
                                        value={formData.time.split(':')[0]}
                                        onChange={handleHourChange}
                                        backgroundColor="gray.100"
                                        borderColor="gray.300"
                                        width="100%"
                                    />
                                </NativeSelectRoot>
                                <span>:</span>
                                <NativeSelectRoot>
                                    <NativeSelectField
                                        name="minute"
                                        items={['00', '15', '30', '45']}
                                        value={formData.time.split(':')[1]}
                                        onChange={handleMinuteChange}
                                        backgroundColor="gray.100"
                                        borderColor="gray.300"
                                        width="100%"
                                    />
                                </NativeSelectRoot>
                            </Stack>
                        </Field>
                    </Fieldset.Content>

                    <Button type="submit" className="chakra-button">
                        登録
                    </Button>
                </Fieldset.Root>
            </form>
            
            <SuccessPopup
                isOpen={showSuccessPopup}
                onClose={handlePopupClose}
                message="登録が完了しました"
            />
            
            <ToastContainer />
        </Box>
    );
}

export default Register;
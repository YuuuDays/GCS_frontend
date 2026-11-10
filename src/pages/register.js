import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Stack, Box, HStack, VStack, Text, FormControl, FormLabel, FormHelperText, Heading } from "@chakra-ui/react";

import {
  NativeSelectField,
  NativeSelectRoot,
} from "../components/ui/native-select";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginRedirect from '../components/LoginRedirect';
import DisplayPopup from '../components/DisplayPopup';
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
    const { user, auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const temporaryToken = location.state?.temporaryToken;
    const [formData, setFormData] = useState({
        notificationEmail: user?.email || '',
        gitName: '',
        time: '21:00'
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
        // console.log('Current user:', user);
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

    useEffect(() => {
        // registerページに来たときにbodyにクラスを追加
        document.body.classList.add('register-page-active');
        
        // コンポーネントのアンマウント時にクラスを削除
        return () => {
            document.body.classList.remove('register-page-active');
        };
    }, []);

    const registerUser = async (userData) => {
        try {
            if (!user) {
                toast.error('ユーザーがログインしていません。再ログインしてください。');
                setTimeout(() => {
                    navigate('/welcome');
                }, 2000);
                return;
            }
            const token = await user.getIdToken();
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('登録エラー:', error);
            return { success: false, error: error.message };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await registerUser({
                notificationEmail: formData.notificationEmail,
                gitName: formData.gitName,
                time: formData.time
            });

            if (result.success) {
                setShowSuccessPopup(true);
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                if (result.errors) {
                    Object.values(result.errors).forEach(error => {
                        toast.error(error);
                    });
                }
                setErrors(result.errors || {});
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
        <div className="register-page">
            <Box className="container">
                <LoginRedirect user={user} />
                <form onSubmit={handleSubmit}>
                    <Box borderWidth="1px" borderRadius="lg" p={6}>
                        <Stack spacing={4}>
                            <Heading size="lg">ユーザー登録</Heading>
                            <Text color="gray.600">
                                以下に必要な情報を入力してください。
                            </Text>
                        </Stack>

                        <Box mt={6}>
                            <VStack spacing={6} align="stretch">
                                <FormControl>
                                    <FormLabel>通知用メールアドレスの選択</FormLabel>
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
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Gitユーザー名</FormLabel>
                                    <VStack align="stretch" spacing={2}>
                                        <Input
                                            type="text"
                                            value={formData.gitName}
                                            onChange={(e) => setFormData({...formData, gitName: e.target.value})}
                                            required
                                            className="chakra-input"
                                        />
                                        <AccordionRoot allowToggle>
                                            <AccordionItem>
                                                <AccordionItemTrigger>
                                                    <Text
                                                        display="block !important"
                                                        visibility="visible !important"
                                                        position="relative"
                                                        zIndex="1"
                                                        color="black !important"
                                                        fontSize="md"
                                                        fontWeight="normal"
                                                    >
                                                        Gitユーザー名とは？
                                                    </Text>
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
                                </FormControl>

                                <FormControl>
                                    <FormLabel>通知時間</FormLabel>
                                    <HStack spacing={2} align="center" width="100%">
                                        <NativeSelectRoot style={{ width: '80px' }}>
                                            <NativeSelectField
                                                name="hour"
                                                items={Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))}
                                                value={formData.time.split(':')[0]}
                                                onChange={handleHourChange}
                                                backgroundColor="gray.100"
                                                borderColor="gray.300"
                                            />
                                        </NativeSelectRoot>
                                        <Text>:</Text>
                                        <NativeSelectRoot style={{ width: '80px' }}>
                                            <NativeSelectField
                                                name="minute"
                                                items={['00']}
                                                value={formData.time.split(':')[1]}
                                                onChange={handleMinuteChange}
                                                backgroundColor="gray.100"
                                                borderColor="gray.300"
                                            />
                                        </NativeSelectRoot>
                                    </HStack>
                                </FormControl>
                            </VStack>
                        </Box>

                        <Button 
                            type="submit" 
                            className="chakra-button"
                            mt={6}
                        >
                            登録
                        </Button>
                    </Box>
                </form>
                
                <DisplayPopup
                    isOpen={showSuccessPopup}
                    onClose={handlePopupClose}
                    message="登録が完了しました"
                    redirectPath="/dashboard"
                />
                
                <ToastContainer />
            </Box>
        </div>
    );
}

export default Register;
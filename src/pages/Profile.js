import React, { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Profile.css';
import SuccessPopup from '../components/DisplayPopup';
import DeleteUser from './DeleteUser';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Button } from "@chakra-ui/react";

function Profile() {
    const auth = getAuth();
    const user = auth.currentUser;
    const [userInfo, setUserInfo] = useState(null);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        notificationTime: '',
        gitName: '',
        notificationEmail: ''
    });
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (user) {
                try {
                    const idToken = await user.getIdToken();
                    // console.log("★idToken",idToken);
                    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/user/info`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                    });

                    if (!response.ok) {
                        throw new Error('ユーザー情報の取得に失敗しました');
                    }

                    const data = await response.json();
                    setUserInfo(data);
                    setFormData({
                        // 旧仕様(15分単位)で登録された"21:30"等は"21:00"として表示する
                        notificationTime: data.notificationTime ? `${data.notificationTime.split(':')[0]}:00` : '',
                        gitName: data.gitName || '',
                        notificationEmail: data.notificationEmail || ''
                    });
                } catch (error) {
                    console.error('エラー:', error);
                    setError(error.message);
                }
            }
        };

        fetchUserInfo();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "notificationTime") {
            // 通知は1時間単位のため、分は常に00に切り捨てる
            const [hours] = value.split(':').map(Number);
            const newTime = `${String(hours).padStart(2, '0')}:00`;
            setFormData({
                ...formData,
                [name]: newTime
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleTimeChange = (e) => {
        const { name, value } = e.target;
        const newTime = {
            ...formData,
            [name]: value
        };
        setFormData({
            ...formData,
            notificationTime: `${newTime.notificationHour || formData.notificationTime.split(':')[0]}:${newTime.notificationMinute || formData.notificationTime.split(':')[1]}`
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/user/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ ...formData })
            });

            const data = await response.json();

            if (data.success) {
                setUserInfo(data);
                setShowSuccessPopup(true);
            } else {
                if (data.message) {
                    toast.error(data.message);
                }
                if (data.errors) {
                    Object.values(data.errors).forEach(error => {
                        toast.error(error);
                    });
                }
                setError(data.errors || {});
            }
        } catch (error) {
            console.error('エラー:', error);
            toast.error("更新中にエラーが発生しました。");
        }
    };

    const handlePopupClose = () => {
        setShowSuccessPopup(false);
    };

    return (
        <div className="paddingTop-container">
            <div className="profile-container">
                <h1>プロフィール管理</h1>
                <Tabs>
                <TabList>
                    <Tab>ユーザー編集</Tab>
                    <Tab>ユーザー削除</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        {error && <p className="error">{typeof error === 'string' ? error : 'エラーが発生しました'}</p>}
                        {userInfo ? (
                            <form onSubmit={handleSubmit}>
                                <div className="info-item">
                                    <label>通知メール:</label>
                                    <input
                                        type="email"
                                        name="notificationEmail"
                                        value={formData.notificationEmail}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="info-item">
                                    <label>GitHubユーザー名:</label>
                                    <input
                                        type="text"
                                        name="gitName"
                                        value={formData.gitName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="info-item">
                                    <label>通知時間:</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <select
                                            name="notificationHour"
                                            value={formData.notificationTime.split(':')[0]}
                                            onChange={handleTimeChange}
                                        >
                                            {Array.from({ length: 24 }, (_, hour) => (
                                                <option key={hour} value={String(hour).padStart(2, '0')}>
                                                    {String(hour).padStart(2, '0')}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            name="notificationMinute"
                                            value={formData.notificationTime.split(':')[1]}
                                            onChange={handleTimeChange}
                                        >
                                            {['00'].map(minute => (
                                                <option key={minute} value={minute}>
                                                    {minute}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {userInfo.photoURL && (
                                    <div className="profile-photo">
                                        <img src={userInfo.photoURL} alt="プロフィール写真" />
                                    </div>
                                )}
                                <Button
                                    type="submit"
                                    bg="#3182ce"
                                    color="white"
                                    w="100%"
                                    p={3}
                                    borderRadius="md"
                                    _hover={{
                                        bg: '#2b6cb0',
                                        transform: 'translateY(-2px)'
                                    }}
                                    boxShadow="0 2px 4px rgba(0, 0, 0, 0.1)"
                                >
                                    更新
                                </Button>
                            </form>
                        ) : (
                            <p>ユーザー情報を読み込んでいます...</p>
                        )}
                        <SuccessPopup
                            isOpen={showSuccessPopup}
                            onClose={handlePopupClose}
                            message="更新完了しました"
                            redirectPath="/profile"
                        />
                        <ToastContainer />
                    </TabPanel>
                    <TabPanel>
                        <DeleteUser user={user} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>
        </div>
    );
}

export default Profile; 
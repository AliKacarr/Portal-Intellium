import React, { useState } from 'react';
import { CloseOutlined, LoadingOutlined, MessageOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons';
import './Chatbot.css';
import { Avatar, Input } from 'antd';
import { SendMessage } from './../../Api/ChatbotApi';
import { buildApiUrl } from '../../Api/host';
import { useSelector } from 'react-redux';

const Chatbot = () => {
    const currentUser = useSelector((state) => state.Auth);
    const [showChatbot, setShowChatbot] = useState(false);
    const [message, setMessage] = useState('');
    const [apiProgress, setApiProgress] = useState(false);
    const [chatbox, setChatbox] = useState([
        { id: Date.now(), type: 'incoming', content: 'Merhaba 👋, \nSize bugün nasıl yardımcı olabilirim?' }
    ]);
    function getColorById(id) {
        const customColors = ["#6895D2", "#A4CE95", "#D04848", "#F3B95F", "#FDE767",];
        const index = id % customColors.length;
        return customColors[index];
    }
    const createMessage = (messageContent, type) => {
        const newMessage = {
            id: Date.now(), // Benzersiz ID
            content: messageContent,
            type
        };

        setChatbox(prevChatbox => [...prevChatbox, newMessage]);
    };

    const handleChatbot = () => {
        setShowChatbot(!showChatbot);
    };

    const sendMsg = async () => {
        if (!message) return; // Boş mesaj gönderilmesini önleyin
        setApiProgress(true);
        createMessage(message, "outgoing");
        try {
            const messageBody = { msg: message };
            const response = await SendMessage(messageBody);
            createMessage(response.data.response, "incoming");
        } catch (error) {
            createMessage("Maalesef! Sizi anlamadım.", "incoming");
        }
        setMessage('');
        setApiProgress(false);
    };

    return (
        <div className={`chatbotBody ${showChatbot ? 'show-chatbot' : ''}`}>
            <button className="chatbot-toggler" onClick={handleChatbot}>
                <MessageOutlined />
                <CloseOutlined />
            </button>
            <div className="chatbot">
                <header>
                    <h2>Intellium Asistan</h2>
                </header>
                <ul className="chatbox">
                    {chatbox.map(msg => (
                        <li key={msg.id} className={`chat ${msg.type}`}>
                            {msg.type === "incoming" ? (
                                <RobotOutlined style={{ fontSize: 20, paddingLeft: 6 }} />
                            ) : (
                                currentUser.imageUrl ? (
                                    <Avatar
                                        src={buildApiUrl(currentUser.imageUrl)}
                                        alt={currentUser.name}
                                        className='user-avatar'
                                    />
                                ) :
                                    <Avatar
                                        style={{
                                            backgroundColor: getColorById(
                                                currentUser.id
                                            ),
                                        }}
                                        alt={currentUser.name}
                                        className='user-avatar'
                                    >
                                        {currentUser.name.charAt(0).toUpperCase()}
                                    </Avatar>
                            )}
                            <p>{msg.content}</p>
                        </li>
                    ))}
                </ul>
                <div className="chat-input">
                    <Input.TextArea
                        className='messageArea'
                        placeholder="Mesajınızı girin..."
                        spellCheck="false"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    {apiProgress ? (
                        <LoadingOutlined />
                    ) : (
                        <SendOutlined onClick={sendMsg} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chatbot;

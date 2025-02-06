import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInfo from './components/ChatInfo';

const Chat = () => {
    return (
        <div className='h-screen bg-blue-200 flex justify-center items-center'>
            <div className='h-[97%] w-[97%] bg-gray-900 rounded-3xl flex'>
                <Sidebar />
                <div className="flex flex-col-reverse gap-y-2 md:flex-row md:items-center w-full md:space-x-2">
                    <ChatWindow />
                    <ChatInfo />
                </div>
            </div>
        </div>
    );
};

export default Chat;

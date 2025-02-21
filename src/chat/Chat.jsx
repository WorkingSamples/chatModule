import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import ChatInfo from "./components/ChatInfo";
import { useSelector } from "react-redux";  

const Chat = () => {
  const sidebarOption = useSelector((state) => state.sidebar);
  return (
    // <div className='h-screen bg-blue-200 flex justify-center items-center'>
    <div className="h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="flex flex-col-reverse gap-y-2 md:flex-row md:items-center w-full md:space-x-2">
        <ChatWindow />
        {!sidebarOption?.users && <ChatInfo />}
      </div>
    </div>
    // </div>
  );
};

export default Chat;

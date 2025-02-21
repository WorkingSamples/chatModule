import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../../utils/Loader";

import {
  setActiveChat,
  setOtherUser,
  setSymmetricDecryptedKey,
} from "../../store/chatSlice";
import {
  decryptMessage,
  displayName,
  fetchSymmetricDecryptedKey,
  formattedTime,
  getUserPvtKey,
} from "../../utils/utilityFunction";
import { NameInitial } from "../../components/Utils";

const DisplayNameComponent = ({ chatData, currentUser }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    const fetchName = async () => {
      const name = await displayName(chatData, currentUser);
      setName(name);
    };
    fetchName();
  }, [chatData, currentUser]);

  return <p className="font-bold text-sm">{name}</p>;
};

const ChatList = () => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.loading.chats);
  const { currentUser, usersStatus } = useSelector((state) => state.user);

  const { activeChat, chats, symmetricDecyptedKey } = useSelector(
    (state) => state.chat
  );

  const [userPrivateKey, setUserPrivateKey] = useState(null);
  const [allChats, setAllChats] = useState([]);

  const getAllChats = async () => {
    if (!chats) return [];

    const chatsList = await Promise.all(
      chats.map(async (chat) => {
        try {
          const decryptedKey = await fetchSymmetricDecryptedKey(
            chat.chatId,
            currentUser.uid,
            userPrivateKey
          );

          // Return a new object with the decrypted key
          return {
            ...chat,
            decryptedKey, // Add the decrypted key
          };
        } catch (error) {
          console.error(`Error decrypting key for group :`, error);
          return null; // Return null if there's an error
        }
      })
    );

    // Filter out any null values in case of errors
    setAllChats(chatsList.filter(Boolean));
  };

  useEffect(() => {
    if (userPrivateKey) {
      getAllChats();
    } else {
      getUserPvtKey(currentUser, setUserPrivateKey);
    }
  }, [userPrivateKey, chats]);

  const handleChatClick = async (otherUser, chat) => {
    const chatRoomId = chat.chatId; // Unique chatroom ID based on user IDs
    const decryptedKey = await fetchSymmetricDecryptedKey(
      chatRoomId,
      currentUser.uid,
      userPrivateKey
    );

    dispatch(setSymmetricDecryptedKey(decryptedKey));

    dispatch(setActiveChat(chatRoomId));
    dispatch(setOtherUser(otherUser));
  };

  const InitialName = ({ chat }) => {
    if (chat?.isGroup) {
      const groupName = chat?.groupDetails?.groupName || "";

      const words = groupName.split(" ").filter((word) => word.length > 0); // Split and remove extra spaces

      const firstLetter = words[0]?.substring(0, 1) || ""; // First letter of the first word
      const secondLetter = words[1]?.substring(0, 1) || ""; // First letter of the second word (if exists)

      const groupNameInitial = `${firstLetter}${secondLetter}`.trim();
      return (
        <div className="flex justify-center items-center h-full w-full">
          <p className="font-semibold text-black">{groupNameInitial}</p>
        </div>
      );
    } else {
      const userId = chat?.participants?.filter(
        (participant) => participant !== currentUser?.uid
      )[0];

      return <NameInitial id={userId} />;
    }
  };

  const ActivityStatus = ({ chat }) => {
    if (chat?.isGroup) return;
    const otherParticipantId = chat?.participants?.filter(
      (participant) => participant !== currentUser?.uid
    )[0];

    return (
      usersStatus.find((el) => el?.userId === otherParticipantId)?.status ===
        "online" && (
        <span className="absolute bg-green-500 rounded-full w-4 h-4 -right-[0.5px] -bottom-1"></span>
      )
    );
  };

  return (
    <div className="w-72 overflow-y-scroll mt-4">
      {loading ? (
        <Loader />
      ) : allChats && allChats.length > 0 ? (
        allChats.map((chat, index) => (
          <div
            key={index}
            className={`p-4 border-b flex items-center cursor-pointer ${
              chat.chatId === activeChat && "bg-gray-200"
            }`}
            onClick={() => handleChatClick(chat.user, chat)}
          >
            <div className="w-12 h-12 rounded-lg relative bg-gray-300">
              <ActivityStatus chat={chat} />
              <InitialName chat={chat} />
            </div>  
            <div className="ml-4">
              <div className="flex gap-x-2 items-center justify-between">
                <DisplayNameComponent
                  chatData={chat}
                  currentUser={currentUser}
                />
                {chat?.isGroup && (
                  <span className="bg-gray-400 mr-2 text-white shadow-md text-xs p-1 rounded-md">
                    group
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 truncate w-32">
                {chat?.messages[chat?.messages?.length - 1]?.text
                  ? decryptMessage(
                      chat?.messages[chat?.messages?.length - 1]?.text,
                      chat.decryptedKey
                    )
                  : chat?.messages[chat?.messages?.length - 1]?.file && "file"}
              </p>
            </div>
            <span className="ml-auto text-xs">
              {chat?.messages?.length !== 0 &&
                formattedTime(
                  chat?.messages[chat?.messages.length - 1]?.timestamp
                )}
            </span>
          </div>
        ))
      ) : (
        <div className="flex justify-center items-center text-sm font-semibold">
          No Chats Available
        </div>
      )}
    </div>
  );
};

export default ChatList;

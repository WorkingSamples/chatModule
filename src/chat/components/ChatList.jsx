import React, { useState, useEffect } from 'react';
import InputField from '../../components/InputField';
import { FaSearch } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../../utils/Loader';
import moment from 'moment';
import { setActiveChat, setMessages, setOtherUser, setSymmetricDecryptedKey } from '../../store/chatSlice';
import { decryptMessage, displayName, fetchSymmetricDecryptedKey, getUserPvtKey } from '../../utils/utilityFunction';

const DisplayNameComponent = ({ chatData, currentUser }) => {
    const [name, setName] = useState("");

    useEffect(() => {
        const fetchName = async () => {
            const name = await displayName(chatData, currentUser);
            setName(name);
        };
        fetchName();
    }, [chatData, currentUser]);

    return <p className="font-bold">{name}</p>;
};

const ChatList = () => {
    const dispatch = useDispatch()
    const loading = useSelector((state) => state.loading.chats);
    const currentUser = useSelector((state) => state.user.currentUser)

    const { activeChat, chats,symmetricDecyptedKey } = useSelector((state) => state.chat);

    const [userPrivateKey,setUserPrivateKey] = useState(null)
    const [allChats,setAllChats] = useState([])

    const getAllChats = async () => {
        if (!chats) return [];

        const chatsList = await Promise.all(
            chats
                .map(async (chat) => {
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
                        console.error(
                            `Error decrypting key for group ${group.chatId}:`,
                            error
                        );
                        return null; // Return null if there's an error
                    }
                })
        );

        // Filter out any null values in case of errors
        setAllChats(chatsList.filter(Boolean))
    };

     useEffect(() => {
            if (userPrivateKey) {
                getAllChats()
            } else {
                getUserPvtKey(currentUser, setUserPrivateKey)
            }
        }, [userPrivateKey, chats])


    const handleChatClick = async (otherUser, chat) => {
        const chatRoomId = chat.chatId // Unique chatroom ID based on user IDs
        const decryptedKey = await fetchSymmetricDecryptedKey(chatRoomId, currentUser.uid, userPrivateKey);
        
        dispatch(setSymmetricDecryptedKey(decryptedKey));

        dispatch(setActiveChat(chatRoomId));
        dispatch(setOtherUser(otherUser));
    };


    return (
        <div className="w-72 overflow-y-scroll mt-4">
            {loading ? <Loader /> : (allChats && allChats.length > 0 ? allChats.map((chat, index) => (
                <div key={index}
                    className={`p-4 border-b flex items-center cursor-pointer ${chat.chatId === activeChat && "bg-gray-200"}`}
                    onClick={() => handleChatClick(chat.user, chat)}>
                    <div className="w-12 h-12 rounded-lg bg-gray-300"></div>
                    <div className="ml-4">
                        <DisplayNameComponent chatData={chat} currentUser={currentUser} />
                        {/* <p className="font-bold">{displayName(chat,currentUser)}</p> */}
                        <p className="text-sm text-gray-600">
                            {
                                chat?.messages[chat?.messages?.length - 1]?.text ? decryptMessage(chat?.messages[chat?.messages?.length - 1]?.text,chat.decryptedKey) : (chat?.messages[chat?.messages?.length - 1]?.file && "file")
                            }
                        </p>
                    </div>
                    <span className="ml-auto text-xs">{chat?.messages[chat?.messages.length - 1]?.timestamp && moment(chat?.messages[chat?.messages.length - 1]?.timestamp).format('h:mm A')}</span>
                </div>
            ))
                :
                <div className='flex justify-center items-center text-sm font-semibold'>
                    No Chats Available
                </div>)
            }
        </div>
    );
};

export default ChatList;

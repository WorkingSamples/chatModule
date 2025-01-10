import React, { useState, useEffect } from 'react';
import InputField from '../../components/InputField';
import { FaSearch } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../../utils/Loader';
import moment from 'moment';
import { setActiveChat, setMessages, setOtherUser } from '../../store/chatSlice';
import { displayName } from '../../utils/utilityFunction';

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

    // const chats = useSelector((state) => state.chat.);
    const { messages, otherUser, activeChat, chats } = useSelector((state) => state.chat);

    useEffect(() => {
        console.log("chats:", chats)
    }, [chats])

    const handleChatClick = async (otherUser, chat) => {
        const chatRoomId = chat.chatId // Unique chatroom ID based on user IDs
        dispatch(setActiveChat(chatRoomId));
        dispatch(setOtherUser(otherUser));

        //dispatch messages got from handleChats function of sidebar
        // dispatch(setMessages(chat.messages))

        // Check if the chatroom exists
        // const chatRef = doc(db, "chats", chatRoomId);
        // const chatDoc = await getDoc(chatRef);
        // if (chatDoc.exists()) {
        //     dispatch(setMessages(chatDoc.data().messages || [])); // Load existing messages
        // } else {
        //     dispatch(setMessages([])); // No chatroom exists yet
        // }
    };
    // const chats = [
    //     { name: 'Design chat', lastMessage: 'Hey!', unread: 1, time: '4m' },
    //     { name: 'Osman Campos', lastMessage: 'You: Hey! We are ready...', unread: 0, time: '20m' },
    //     // Add more chats
    // ];

    return (
        <div className="w-72 overflow-y-scroll">
            <div className='relative p-2 mt-2'>
                <input
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    type='text'
                    name='searchUser'
                    value='james'
                    placeholder='Search User'
                />
                <FaSearch className='absolute right-4 top-5 h-4 w-4 cursor-pointer' />
            </div>

            {loading ? <Loader /> : (chats && chats.length > 0 ? chats.map((chat, index) => (
                <div key={index}
                    className={`p-4 border-b flex items-center cursor-pointer ${chat.chatId === activeChat && "bg-gray-200"}`}
                    onClick={() => handleChatClick(chat.user, chat)}>
                    <div className="w-12 h-12 rounded-lg bg-gray-300"></div>
                    <div className="ml-4">
                        <DisplayNameComponent chatData={chat} currentUser={currentUser} />
                        {/* <p className="font-bold">{displayName(chat,currentUser)}</p> */}
                        <p className="text-sm text-gray-600">
                            {
                                chat?.messages[chat?.messages?.length - 1]?.text ? chat?.messages[chat?.messages?.length - 1]?.text : (chat?.messages[chat?.messages?.length - 1]?.file && "file")
                            }
                        </p>
                    </div>
                    <span className="ml-auto text-xs">{ chat?.messages[chat?.messages.length - 1]?.timestamp && moment(chat?.messages[chat?.messages.length - 1]?.timestamp).format('h:mm A')}</span>
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

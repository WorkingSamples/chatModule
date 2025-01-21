import React, { useEffect, useState } from 'react';
import InputField from '../../components/InputField';
import { FaSearch } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../../utils/Loader';
import { setActiveChat, setMessages, setOtherUser, setSymmetricDecryptedKey } from '../../store/chatSlice';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { v4 as uuidv4 } from 'uuid'
import { fetchSymmetricDecryptedKey, getUserPvtKey } from '../../utils/utilityFunction';

const UsersList = () => {
    const dispatch = useDispatch()

    const { users, otherUser, chats } = useSelector((state) => state.chat)
    const currentUser = useSelector((state) => state.user.currentUser)
    const loading = useSelector((state) => state.loading.users)

    const [userPrivateKey, setUserPrivateKey] = useState(null)

    useEffect(() => {
           if (!userPrivateKey) {
               getUserPvtKey(currentUser, setUserPrivateKey)
           }
       }, [])

    const handleUserClick = async (otherUser) => {
        let chatRoomId = null; // Unique chatroom ID based on user IDs

        //if any of the chat{not group} is having currentuser and other user as participant then set chatid as activechat else setup new active chat
        let chat = chats.find((chat) =>
            !chat.isGroup &&
            chat?.participants.includes(currentUser.uid) && chat?.participants.includes(otherUser.uid)
        )
        if (chat) {
            chatRoomId = chat.chatId
            const decryptedKey = await fetchSymmetricDecryptedKey(chatRoomId, currentUser.uid, userPrivateKey);
            
            dispatch(setSymmetricDecryptedKey(decryptedKey));
        } else {
            chatRoomId = uuidv4();
        }

        dispatch(setActiveChat(chatRoomId));
        dispatch(setOtherUser(otherUser));
        // Check if the chatroom exists
        // const chatRef = doc(db, "chats", chatRoomId);
        // const chatDoc = await getDoc(chatRef);
        // if (chatDoc.exists()) {
        //     dispatch(setMessages(chatDoc.data().messages || [])); // Load existing messages
        // } else {
        //     dispatch(setMessages([])); // No chatroom exists yet
        // }
    };

    return (
        <div className="w-72 overflow-y-scroll mt-4">
            {/* <div className='relative p-2 mt-2'>
                <input
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    type='text'
                    name='searchUser'
                    value='james'
                    placeholder='Search User'
                />
                <FaSearch className='absolute right-4 top-5 h-4 w-4 cursor-pointer' />
            </div> */}
            {loading ? <Loader /> : (users && users.length > 0 ? users.map((user, index) => (
                <div key={index} className={`p-4 border-b flex items-center cursor-pointer ${otherUser?.uid === user?.uid && "bg-gray-200"}`} onClick={() => handleUserClick(user)} >
                    <div className="w-12 h-12 rounded-lg bg-gray-300"></div>
                    <div className="ml-4">
                        <p className="font-bold">{user.firstName}{" "}{user.lastName}</p>
                        {/* {messages && activeChat && activeChat.split('_').includes(user.uid) && <p className="text-sm text-gray-600">{messages[messages.length - 1].text}</p>} */}
                    </div>
                    {/* <span className="ml-auto text-xs">{chat.time}</span> */}
                </div>
            ))
                :
                <div className='flex justify-center items-center text-sm font-semibold'>
                    No Users Available
                </div>)
            }
        </div>
    );
};

export default UsersList;

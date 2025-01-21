
import { FaSearch } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../../utils/Loader';
import { setActiveChat, setMessages,setSymmetricDecryptedKey} from '../../store/chatSlice';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import moment from 'moment';
import { useEffect, useState } from 'react';
import forge from 'node-forge';
import {decryptMessage, fetchSymmetricDecryptedKey, getUserPvtKey } from '../../utils/utilityFunction';

const GroupsList = () => {
    const dispatch = useDispatch()

    const { activeChat, chats } = useSelector((state) => state.chat)
    const { currentUser, userPvtKey } = useSelector((state) => state.user)
    const loading = useSelector((state) => state.loading.groups)

    const [groups, setGroups] = useState([])
    const [userPrivateKey, setUserPrivateKey] = useState()


    const getGroupChats = async () => {
        if (!chats) return [];

        const groupChats = await Promise.all(
            chats
                .filter((chat) => chat.isGroup)
                .map(async (group) => {
                    try {
                        const decryptedKey = await fetchSymmetricDecryptedKey(
                            group.chatId,
                            currentUser.uid,
                            userPrivateKey
                        );

                        // Return a new object with the decrypted key
                        return {
                            ...group,
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
        setGroups(groupChats.filter(Boolean))
    };

    //get groupchats as chats changed that is message update
    useEffect(() => {
        if (userPrivateKey) {
            getGroupChats()
        } else {
            getUserPvtKey(currentUser, setUserPrivateKey)
        }
    }, [userPrivateKey, chats])




    const handleGroupClick = async (group) => {
        const chatRoomId = group.chatId; // Unique chatroom ID based on user IDs
        dispatch(setActiveChat(chatRoomId));
        // dispatch(setOtherUser(otherUser));

        // //get pvt key of current user to decrypt symmetric key of group
        // const userRef = doc(db, 'users', currentUser.uid)
        // const userDoc = await getDoc(userRef);

        //chatData to get encrypted pvt key of user
        const chatRef = doc(db, "chats", chatRoomId);
        const chatDoc = await getDoc(chatRef);

        //fetch group key of particular user i.e encrypted user's key 
        const decryptedKey = await fetchSymmetricDecryptedKey(chatDoc.data().chatId, currentUser.uid, userPrivateKey);

        //setting group key for current active group chat to decrypt messages in chatwindow.jsx
        dispatch(setSymmetricDecryptedKey(decryptedKey));

        if (chatDoc.exists()) {
            dispatch(setMessages(chatDoc.data().messages || [])); // Load existing messages
        } else {
            dispatch(setMessages([])); // No chatroom exists yet
        }
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
            {loading ? <Loader /> : (groups && groups.length > 0 ? groups.map((group, index) => (
                <div key={index} className={`p-4 border-b flex items-center cursor-pointer ${group.chatId === activeChat && "bg-gray-200"}`}
                    onClick={() => handleGroupClick(group)}
                >
                    <div className="w-12 h-12 rounded-lg bg-gray-300"></div>
                    <div className="ml-4">
                        <p className="font-bold">{group.groupDetails?.groupName}</p>
                        {/* {messages && activeChat && activeChat.split('_').includes(user.uid) && <p className="text-sm text-gray-600">{messages[messages.length - 1].text}</p>} */}

                        <p className="text-sm text-gray-600">
                            {
                                group?.messages[group?.messages?.length - 1]?.text ? decryptMessage(group?.messages[group?.messages?.length - 1]?.text, group.decryptedKey) : (group?.messages[group?.messages?.length - 1]?.file && "file")
                            }
                        </p>
                    </div>
                    <span className="ml-auto text-xs">{group?.messages[group?.messages.length - 1]?.timestamp && moment(group?.messages[group?.messages.length - 1]?.timestamp).format('h:mm A')}</span>
                    {/* <span className="ml-auto text-xs">{chat.time}</span> */}
                </div>
            ))
                :
                <div className='flex justify-center items-center text-sm font-semibold'>
                    No Groups Available
                </div>)
            }
        </div>
    );
};

export default GroupsList;

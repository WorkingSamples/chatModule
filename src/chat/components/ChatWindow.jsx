import React, { useEffect, useRef, useState } from 'react';
import ChatList from './ChatList';
import { BsSend, BsThreeDotsVertical } from 'react-icons/bs';
import { FaMicrophone, FaPaperclip } from 'react-icons/fa';
import { MdCall, MdOutlineChat, MdSearch, MdVideoCall } from 'react-icons/md';
import { FaRegMessage } from 'react-icons/fa6';
import UsersList from './UsersList';
import { useDispatch, useSelector } from 'react-redux';
import { arrayUnion, collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { setChats, setMessages, setSymmetricDecryptedKey } from '../../store/chatSlice';
import { db } from '../../firebase/firebase';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import GroupsList from './GroupsList';
import { AiOutlineClose } from 'react-icons/ai';
import { decryptMessage, displayName, encryptSymmetricKey, fetchSymmetricDecryptedKey, generateSymmetricKey, getUserPvtKey } from '../../utils/utilityFunction';
import toast from 'react-hot-toast';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { ZIM } from "zego-zim-web";
import forge from 'node-forge';
import CryptoJS from "crypto-js";
import axios from 'axios';

const SenderName = ({ senderId }) => {
    const [name, setName] = useState(null)
    useEffect(() => {
        const getSender = async () => {
            const userRef = doc(db, 'users', senderId)
            const userDoc = await getDoc(userRef)
            const userData = userDoc.data();
            const userName = userData?.lastName ? `${userData?.firstName}${" "}${userData?.lastName}` : userData?.firstName
            setName(userName)
        }

        getSender()
    }, [senderId])

    return <p className="font-semibold text-[12px]">{name}</p>
}


const ChatWindow = () => {
    const dispatch = useDispatch()

    const currentUser = useSelector((state) => state.user.currentUser)
    const sidebarOption = useSelector((state) => state.sidebar)
    const { users, messages, otherUser, activeChat, chats, symmetricDecyptedKey } = useSelector((state) => state.chat);

    const [currentMessage, setCurrentMesage] = useState("");
    const [userName, setUserName] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [userPrivateKey, setUserPrivateKey] = useState(null)
    const [loading, setLoading] = useState(false)

    const zpRef = useRef(null);
    const useZegoInstance = (currentUser, roomId) => {

        if (!zpRef.current) {
            const appId = parseInt(import.meta.env.VITE_APP_ZEGO_APP_ID);
            const serverSecret = import.meta.env.VITE_APP_ZEGO_SERVER_SECRET;
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appId,
                serverSecret,
                roomId,
                currentUser.uid,
                `user_${currentUser.uid}`
            );

            const zp = ZegoUIKitPrebuilt.create(kitToken);

            //to solve - {"code":6000121,"message":"API.callInvite: User is not logged in."}
            // var zim = ZIM.getInstance();
            // var userInfo = { userID: currentUser.uid, userName: `user_${currentUser.uid}` };
            // var token = kitToken;

            //to get the token https://github.com/ZEGOCLOUD/zego_server_assistant/blob/master/token/nodejs/sample/sample-base.js
            //https://www.zegocloud.com/docs/zim-web/guides/users/authentication

            // zim.login(userInfo, token)
            //     .then(function () {
            //         // Login successful.
            //         console.log("login in successflly")
            //     })
            //     .catch(function (err) {
            //         // Login failed.
            //         console.log(err, "login failed")
            //     });

            zp.addPlugins({ ZIM });


            zp.setCallInvitationConfig({
                // enableCustomCallInvitationDialog: true,
                onIncomingCallReceived: (callID, caller, callType, callees) => {
                    console.log('Incoming call received:', callID, caller, callType, callees);
                },
                onIncomingCallCanceled: (callID, caller) => {
                    console.log('Incoming call canceled:', callID, caller);
                },
                onIncomingCallTimeout: (callID, caller) => {
                    console.log('Incoming call timed out:', callID, caller);
                },
            });

            zpRef.current = zp;
        }

        return zpRef.current;
    };

    const getDisplayName = async () => {
        setUserName('')

        const chatRef = doc(db, 'chats', activeChat);
        const chatDoc = await getDoc(chatRef);
        const chatData = chatDoc.data()

        let displayUserName;
        if (chatData) {
            displayUserName = displayName(chatData, currentUser)
        } else {
            displayUserName = otherUser?.lastName
                ? `${otherUser?.firstName} ${otherUser?.lastName}`
                : otherUser?.firstName;
        }
        setUserName(displayUserName);
    }

    useEffect(() => {
        if (!userPrivateKey) {
            getUserPvtKey(currentUser, setUserPrivateKey)
        }
    }, [])

    const chatRefHook = useRef(null)

    useEffect(() => {
        chatRefHook?.current?.scrollIntoView({ behavior: "smooth", block: "start" })

        getDisplayName();
    }, [activeChat])

    const sendInvitation = (callees, roomId, currentUser, callType) => {
        const zp = useZegoInstance(currentUser, roomId);

        zp.sendCallInvitation({
            callees: callees.map((id) => ({ userID: id, userName: `user_${id}` })),
            callType: callType === "voice" ? ZegoUIKitPrebuilt.InvitationTypeVoiceCall : ZegoUIKitPrebuilt.InvitationTypeVideoCall,
            timeout: 60,
            customData: JSON.stringify({ roomId }),
        });
    };



    useEffect(() => {
        // Setup a real-time listener for the entire 'chats' collection

        const chatsRef = collection(db, 'chats');

        const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
            const filteredChats = [];
            snapshot.forEach((doc) => {
                const chatData = doc.data();

                // Check if the current user is a participant
                if (chatData?.participants?.includes(currentUser?.uid)) {
                    filteredChats.push({ chatId: doc.id, ...chatData });
                }

                if (
                    chatData?.callDetails?.status === "ringing" &&
                    chatData?.callDetails?.caller !== currentUser.uid
                ) {
                    useZegoInstance(currentUser);
                    // zp.onIncomingCallReceived(chatData.callDetails);
                }

            });

            // Process the updated chats data
            dispatch(setChats(filteredChats));
        });

        return () => unsubscribe(); // Cleanup the listener on unmount
    }, []);

    const encryptMessage = (message, decryptedKey) => {
        const encrypted = CryptoJS.AES.encrypt(message, decryptedKey).toString();
        return encrypted;
    };

    const setupChatRoom = async (chatRef) => {

        const symmetricKey = generateSymmetricKey();
        const encryptedKeys = {};

        // Fetch each participant's public key
        for (const participant of [currentUser.uid, otherUser.uid]) {
            const userDoc = doc(db, "users", participant);
            const userSnapshot = await getDoc(userDoc);

            if (userSnapshot.exists()) {
                const publicKey = userSnapshot.data().publicKey;
                encryptedKeys[participant] = encryptSymmetricKey(symmetricKey, publicKey);
            }
        }

        await setDoc(chatRef, {
            chatId: activeChat,
            groupDetails: {},
            isGroup: false,
            participants: [currentUser.uid, otherUser.uid], // Include both users
            messages: [], // Add both text and file messages
            encryptedKeys
        });
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !loading && currentMessage.trim()) {
            sendMessage();
        }
    };
    const sendMessage = async () => {
        setLoading(true)
        if (!currentMessage.trim() && uploadedFiles.length === 0) return; // Prevent empty messages or empty file uploads

        const chatRoomId = activeChat; // Active chat ID from Redux state
        const messages = [];

        // get chat room data
        const chatRef = doc(db, "chats", chatRoomId);
        const chatDoc = await getDoc(chatRef);

        //setup the chat room and get decrypted symmetric key
        if (!chatDoc.exists()) {
            //setup new chat
            await setupChatRoom(chatRef)
        }

        const decryptedKey = await fetchSymmetricDecryptedKey(chatRoomId, currentUser.uid, userPrivateKey);

        //dispatch decrypted key to decrypt the message
        dispatch(setSymmetricDecryptedKey(decryptedKey))

        const encryptedMsg = encryptMessage(currentMessage, decryptedKey)
        if (currentMessage.trim()) {
            messages.push({
                messageId: uuidv4(),
                senderId: currentUser.uid,
                text: encryptedMsg,
                timestamp: Date.now(),
            });
        }

        // Add uploaded files as separate messages
        const uploadedFileDetails = await Promise.all(
            uploadedFiles.map(async ({ file, messageId }) => {
                let fileUrl = "";
                if (file.type.startsWith("image")) {
                    // For image files, upload them directly to Cloudinary

                    const formData = new FormData();
                    formData.append("file", file.file);
                    formData.append("upload_preset", "demo_upload_preset");   // Replace with your actual upload preset
                    // formData.append("cloud_name", "your_cloud_name"); // Replace with your Cloudinary cloud name

                    const response = await fetch(
                        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME}/upload`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );
                    const data = await response.json();
                    fileUrl = data.secure_url; // Get the secure URL of the uploaded image
                }

                // Return file metadata
                return {
                    messageId,
                    senderId: currentUser.uid,
                    file: {
                        name: file.name,
                        type: file.type,
                        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
                        fileUrl,
                    },
                    timestamp: Date.now(),
                };
            })
        );

        // Add uploaded files as separate messages
        messages.push(...uploadedFileDetails);

        await updateDoc(chatRef, {
            messages: arrayUnion(...messages), // Add the new messages to the existing ones
        });

        // Update Redux states
        setCurrentMesage(""); // Reset the message input
        setUploadedFiles([]); // Clear the uploaded files state after sending the messages
        setLoading(false)
        chatRefHook?.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        // No need to dispatch the message here as onSnapshot function works to dispatch messages when added to the DB
        // dispatch(addMessage({ chatId: chatRoomId, message: newMessage }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const allowedTypes = [
            "application/zip",
            "application/pdf",
            "application/msword",
            "image/jpeg",
            "image/jpg",
            "image/png",
        ];

        // Filter valid files based on type
        const validFiles = files.filter((file) => {
            if (!allowedTypes.includes(file.type)) {
                console.log(`Invalid file type: ${file.name}`);
                return false;
            }
            if (file.size > 2 * 1024 * 1024) { // File size validation (2 MB)
                console.log(`File size exceeds 2 MB: ${file.name}`);
                toast.error(`File size exceeds 2 MB: ${file.name}`)
                return false;
            }
            return true;
        });

        // Map valid files to include necessary data
        const fileData = validFiles.map((file) => ({
            messageId: uuidv4(),
            senderId: currentUser.uid,
            file: {
                file,
                name: file.name,
                type: file.type,
                size: (file.size / 1024 / 1024).toFixed(2) + " MB", // Convert size to MB
                fileUrl: "",  // Empty fileUrl as we're not uploading to Firebase Storage yet
            },
            preview: file.type.includes("image") ? URL.createObjectURL(file) : null, // Preview for images
            timestamp: Date.now(),
        }));

        // Update state with valid files
        if (fileData.length > 0) {
            setUploadedFiles((prevFiles) => [...prevFiles, ...fileData]);
        } else {
            console.log("No valid files to upload.");
        }
    };

    const handleDeleteFile = (index) => {
        setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const initiateCall = async (callType = "voice") => {
        const chatRef = doc(db, "chats", activeChat);
        const roomId = `room-${Math.random().toString(36).substr(2, 9)}`; // Generate unique room ID

        // Update Firestore with call details
        await updateDoc(chatRef, {
            callDetails: {
                caller: currentUser.uid,
                status: "ringing",
                chatId: activeChat,
                roomId: roomId,
            },
        });

        // Fetch the chat document
        const chatSnapshot = await getDoc(chatRef);  // Use getDoc from Firestore 9+
        if (chatSnapshot.exists()) {
            const chatData = chatSnapshot.data();
            const callees = chatData?.participants?.filter(
                (participant) => participant !== currentUser.uid
            );

            // Send invitations via ZegoCloud
            sendInvitation(callees, roomId, currentUser, callType);
        } else {
            console.log("Chat not found");
        }
    };

    return (
        <div className='flex w-[80%] h-[97%] bg-gray-100 rounded-3xl'>
            {/* {console.log(uploadedFiles, "uploaded files")} */}
            {sidebarOption.chats && <ChatList />}
            {sidebarOption.users && <UsersList />}
            {sidebarOption.groups && <GroupsList />}

            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b rounded-tr-3xl">
                    {activeChat ?
                        <div className='flex justify-between items-center'>
                            <div className='flex flex-col'>
                                <h2 className="text-xl font-bold">{userName}</h2>
                                {/* <p className="text-sm text-gray-500">23 members, 10 online</p> */}
                            </div>
                            <div className='flex space-x-4'>
                                {/* <MdSearch size={20} className='text-gray-600  cursor-pointer' /> */}
                                <MdCall size={20} className=' text-gray-600 cursor-pointer' onClick={() => initiateCall("voice")} />
                                <MdVideoCall size={20} className=' text-gray-600 cursor-pointer' onClick={() => initiateCall("video")} />

                                {/* <BsThreeDotsVertical size={20} className='mr-12 text-gray-600 cursor-pointer' /> */}
                            </div>
                        </div>
                        :
                        <div className='text-xl font-bold'>
                            Infinity Chat
                        </div>
                    }
                </div>

                <div className="flex-1 p-4 overflow-y-scroll">
                    {activeChat ? (
                        chats ? (
                            (() => {
                                const activeChatData = chats.find((chat) => chat.chatId === activeChat);

                                if (!activeChatData) {
                                    // Active chat ID is not found in the chats array
                                    return (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="flex flex-col items-center">
                                                <FaRegMessage size={80} className="text-gray-400" />
                                                <span className="text-gray-400 text-lg font-semibold">
                                                    No Conversation
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }

                                if (!activeChatData.messages?.length) {
                                    // Active chat has no messages
                                    return (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="flex flex-col items-center">
                                                <MdOutlineChat size={80} className="text-gray-400" />
                                                <span className="text-gray-400 text-lg font-semibold">
                                                    Start your First Conversation
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }

                                // Render messages
                                return activeChatData.messages.map((msg, index) => {
                                    const isLastMessage = index === activeChatData.messages.length - 1;
                                    return (<div
                                        key={msg.id}
                                        ref={isLastMessage ? chatRefHook : null}
                                        className={`flex ${msg.senderId === currentUser?.uid ? "justify-end" : "justify-start"
                                            } my-3`}
                                    >
                                        {console.log(msg, "msgg", symmetricDecyptedKey)}
                                        {msg.senderId !== currentUser?.uid && (
                                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0 mr-3">
                                                {/* User Avatar Placeholder */}
                                            </div>
                                        )}
                                        <div className="max-w-[80%]">
                                            <div
                                                className={`px-3 py-2 rounded-lg ${msg.senderId === currentUser?.uid
                                                    ? "bg-purple-700 text-white"
                                                    : "bg-gray-200 text-gray-800"
                                                    }`}
                                            >
                                                {msg.senderId !== currentUser?.uid && activeChatData.isGroup && <SenderName senderId={msg.senderId} />}
                                                {/* {currentUser?.firstName} {currentUser?.lastName} */}

                                                {symmetricDecyptedKey && msg.text ? <p>{decryptMessage(msg.text, symmetricDecyptedKey)}</p> : <span className='break-words'>{msg.file.fileUrl}</span>}
                                                {/* {userPrivateKey && <p>{decryptOneonOneMessage(msg.text, userPrivateKey)}</p>}  */}

                                                <div className="text-sm flex justify-between mt-2">
                                                    <span>{moment(msg.timestamp).format("h:mm A")}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {msg.senderId === currentUser?.uid && (
                                            <div className="w-10 h-10 rounded-lg bg-purple-200 flex-shrink-0 ml-3">
                                                {/* User Avatar Placeholder */}
                                            </div>
                                        )}
                                    </div>)
                                });
                            })()
                        ) : (
                            // Chats array is undefined
                            <div className="h-full flex items-center justify-center">
                                <div className="flex flex-col items-center">
                                    <FaRegMessage size={80} className="text-gray-400" />
                                    <span className="text-gray-400 text-lg font-semibold">No Chats</span>
                                </div>
                            </div>
                        )
                    ) : (
                        // No active chat selected
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center">
                                <FaRegMessage size={80} className="text-gray-400" />
                                <span className="text-gray-400 text-lg font-semibold">No Selected Chat</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    {uploadedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center p-2 border rounded-lg mb-2"
                        >
                            {file.preview ? (
                                <img
                                    src={file.preview}
                                    alt={file.file.name}
                                    className="w-12 h-12 object-cover mr-4"
                                />
                            ) : (
                                <span className="w-12 h-12 bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 mr-4">
                                    {file.file.type.split("/")[1].toUpperCase()}
                                </span>
                            )}
                            <div className="flex flex-col flex-grow">
                                <span className="text-gray-800">{file.file.name}</span>
                                <span className="text-gray-500 text-sm">{`(${file.file.size})`}</span>
                            </div>
                            <button
                                onClick={() => handleDeleteFile(index)}
                                className="text-red-500 hover:text-red-700 ml-4"
                            >
                                <AiOutlineClose />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-4 relative bg-white border-t rounded-br-3xl flex">
                    <div className="relative">
                        {/* File Input - Hidden */}
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            multiple
                            onChange={handleFileChange} // Handle file selection
                        />

                        {/* Icon wrapped with a label */}
                        <label htmlFor="file-upload">
                            <FaPaperclip
                                size={20}
                                className="text-gray-600 left-4 top-[11px] absolute cursor-pointer"
                            />
                        </label>
                    </div>
                    <input
                        type="text"
                        className="flex-1 pl-12 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Type a message..."
                        onKeyDown={(e) => handleKeyDown(e)} 
                        value={currentMessage}
                        onChange={(e) => setCurrentMesage(e.target.value)}
                    />
                    <span className='flex absolute right-8 top-[26px] space-x-3'>
                        {/* <FaMicrophone size={20} className='text-gray-600 cursor-pointer' /> */}
                        {loading ? <div className='animate-spin rounded-full border-t-blue-600 h-5 w-5'></div> : <BsSend size={20} className='text-gray-600 cursor-pointer' onClick={sendMessage} />}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;

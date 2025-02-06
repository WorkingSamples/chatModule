import React, { useEffect, useRef, useState } from "react";
import ChatList from "./ChatList";
import { BsSend } from "react-icons/bs";
import { FaPaperclip, FaReply, FaSmileBeam } from "react-icons/fa";
import { MdCall, MdOutlineChat, MdVideoCall } from "react-icons/md";
import { FaRegMessage } from "react-icons/fa6";
import UsersList from "./UsersList";
import { useDispatch, useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { setChats, setSymmetricDecryptedKey } from "../../store/chatSlice";
import { db } from "../../firebase/firebase";
import { v4 as uuidv4 } from "uuid";
import GroupsList from "./GroupsList";
import { AiOutlineClose } from "react-icons/ai";
import {
  decryptMessage,
  displayName,
  encryptSymmetricKey,
  fetchSymmetricDecryptedKey,
  formattedTime,
  generateSymmetricKey,
  getUserPvtKey,
} from "../../utils/utilityFunction";
import toast from "react-hot-toast";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { ZIM } from "zego-zim-web";
import CryptoJS from "crypto-js";
import { NameInitial } from "../../components/Utils";
import EmojiPicker from "emoji-picker-react";
import { setUsersStatus } from "../../store/userSlice";
import { CgBot } from "react-icons/cg";

const SenderName = ({ senderId }) => {
  const [name, setName] = useState(null);
  useEffect(() => {
    const getSender = async () => {
      const userRef = doc(db, "users", senderId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const userName = userData?.lastName
        ? `${userData?.firstName}${" "}${userData?.lastName}`
        : userData?.firstName;
      setName(userName);
    };

    getSender();
  }, [senderId]);

  return <p className="font-semibold text-[12px]">{name}</p>;
};

const ReplyMsgContent = ({ messageId, activeChat, symmetricDecyptedKey }) => {
  const [message, setMessage] = useState(null);
  const getMessage = async () => {
    const chatRef = doc(db, "chats", activeChat);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const chatData = chatSnap.data();
      const foundMessage = chatData?.messages?.find(
        (msg) => msg?.messageId === messageId
      );

      if (foundMessage) {
        setMessage(foundMessage);
      } else {
        console.log("Message not found");
      }
    } else {
      console.log("Chat not found");
    }
  };

  useEffect(() => {
    getMessage();
  }, []);

  return (
    <div>
      {message?.text && (
        <span className="cursor-pointer">
          {decryptMessage(message?.text, symmetricDecyptedKey)}
        </span>
      )}
      {message?.file && <span className="cursor-pointer">File</span>}
    </div>
  );
};

const ChatWindow = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const sidebarOption = useSelector((state) => state.sidebar);
  const { otherUser, activeChat, chats, symmetricDecyptedKey } = useSelector(
    (state) => state.chat
  );

  const [currentMessage, setCurrentMesage] = useState("");
  const [userName, setUserName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [userPrivateKey, setUserPrivateKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emojiPopupOpen, setEmojiPopupOpen] = useState(false);
  const [previewMsg, setPreviewMsg] = useState(null);
  const [botMessages, setBotMessages] = useState([]);

  // const chatRefHook = useRef(null);
  const messageRefs = useRef({}); // Store refs for all messages
  const lastMessageRef = useRef(null);

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
          console.log(
            "Incoming call received:",
            callID,
            caller,
            callType,
            callees
          );
        },
        onIncomingCallCanceled: (callID, caller) => {
          console.log("Incoming call canceled:", callID, caller);
        },
        onIncomingCallTimeout: (callID, caller) => {
          console.log("Incoming call timed out:", callID, caller);
        },
      });

      zpRef.current = zp;
    }

    return zpRef.current;
  };

  const getDisplayName = async () => {
    setUserName("");

    const chatRef = doc(db, "chats", activeChat);
    const chatDoc = await getDoc(chatRef);
    const chatData = chatDoc.data();

    let displayUserName;
    if (chatData) {
      displayUserName = displayName(chatData, currentUser);
    } else {
      displayUserName = otherUser?.lastName
        ? `${otherUser?.firstName} ${otherUser?.lastName}`
        : otherUser?.firstName;
    }
    setUserName(displayUserName);
  };

  useEffect(() => {
    if (!userPrivateKey) {
      getUserPvtKey(currentUser, setUserPrivateKey);
    }
  }, []);

  //track user status - online/offline
  useEffect(() => {
    const userRef = doc(db, "users", currentUser?.uid);

    const setUserOnline = async () => {
      await updateDoc(userRef, { status: "online" });
      // console.log(userDoc.data(), "userdocccc")
      // await axios.post("/api/user-status", { userId, status: "online" });
    };

    const setUserOffline = async () => {
      // await axios.post("/api/user-status", { userId, status: "offline" });
      await updateDoc(userRef, { status: "offline" });
    };

    // Track tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setUserOffline(); // Set offline if user switches tab or minimizes
      } else {
        setUserOnline(); // Set online if user returns
      }
    };

    // Track tab close or browser close
    const handleBeforeUnload = async (event) => {
      event.preventDefault();
      await setUserOffline(); // Mark offline before closing tab
    };

    // Set user online when component mounts
    setUserOnline();

    // Attach event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      setUserOffline();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    //turn of the picker on changing active chat
    setEmojiPopupOpen(false);
    lastMessageRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    getDisplayName();
  }, [activeChat]);

  const sendInvitation = (callees, roomId, currentUser, callType) => {
    const zp = useZegoInstance(currentUser, roomId);

    zp.sendCallInvitation({
      callees: callees.map((id) => ({ userID: id, userName: `user_${id}` })),
      callType:
        callType === "voice"
          ? ZegoUIKitPrebuilt.InvitationTypeVoiceCall
          : ZegoUIKitPrebuilt.InvitationTypeVideoCall,
      timeout: 60,
      customData: JSON.stringify({ roomId }),
    });
  };

  //real-time listener
  useEffect(() => {
    // Setup a real-time listener for the entire 'chats' collection

    //real time message tracking
    const chatsRef = collection(db, "chats");

    //real time user status tracking - online/offline
    const userRef = collection(db, "users");

    const unsubscribeChatDoc = onSnapshot(chatsRef, (snapshot) => {
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

    const unsubscribeUserDoc = onSnapshot(userRef, (snapshot) => {
      const activityStatus = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        activityStatus.push({
          userId: userData?.uid,
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          status: userData?.status,
        });
      });

      dispatch(setUsersStatus(activityStatus));
    });

    return () => {
      unsubscribeChatDoc();
      unsubscribeUserDoc();
    }; // Cleanup the listener on unmount
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
        encryptedKeys[participant] = encryptSymmetricKey(
          symmetricKey,
          publicKey
        );
      }
    }

    await setDoc(chatRef, {
      chatId: activeChat,
      groupDetails: {},
      isGroup: false,
      participants: [currentUser.uid, otherUser.uid], // Include both users
      messages: [], // Add both text and file messages
      encryptedKeys,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading && currentMessage.trim()) {
      sidebarOption?.ai ? sendChatBotMessage() : sendMessage();
    }
  };

  const sendMessage = async () => {
    setEmojiPopupOpen(false);
    setLoading(true);
    if (!currentMessage.trim() && uploadedFiles.length === 0) return; // Prevent empty messages or empty file uploads

    const chatRoomId = activeChat; // Active chat ID from Redux state
    const messages = [];

    // get chat room data
    const chatRef = doc(db, "chats", chatRoomId);
    const chatDoc = await getDoc(chatRef);
  
    //setup the chat room and get decrypted symmetric key
    if (!chatDoc.exists()) {
      //setup new chat
      await setupChatRoom(chatRef);
    }

    const decryptedKey = await fetchSymmetricDecryptedKey(
      chatRoomId,
      currentUser.uid,
      userPrivateKey
    );

    //dispatch decrypted key to decrypt the message
    dispatch(setSymmetricDecryptedKey(decryptedKey));

    const encryptedMsg = encryptMessage(currentMessage, decryptedKey);
    if (currentMessage.trim()) {
      messages.push({
        messageId: uuidv4(),
        replyTo: previewMsg && previewMsg?.messageId,
        senderId: currentUser.uid,
        text: encryptedMsg,
        timestamp: Date.now(),
      });
    }

    // Add uploaded files as separate messages
    const uploadedFileDetails = await Promise.all(
      uploadedFiles.map(async ({ file, messageId }) => {
        let fileUrl = "";
        // if (file.type.startsWith("image")) {
        // For image files, upload them directly to Cloudinary

        const formData = new FormData();
        formData.append("file", file.file);
        formData.append("upload_preset", "demo_upload_preset"); // Replace with your actual upload preset
        // formData.append("cloud_name", "your_cloud_name"); // Replace with your Cloudinary cloud name

        const resourceType = file.type.startsWith("image")
          ? "image"
          : file.type.startsWith("video")
          ? "video"
          : "raw"; // Use "raw" for documents, PDFs, etc.

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${
            import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME
          }/${resourceType}/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        fileUrl = data.secure_url; // Get the secure URL of the uploaded image
        // }

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
    setLoading(false);
    lastMessageRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    //empty previewMsg if there is any
    if (previewMsg) {
      setPreviewMsg(null);
    }
    // No need to dispatch the message here as onSnapshot function works to dispatch messages when added to the DB
    // dispatch(addMessage({ chatId: chatRoomId, message: newMessage }));
  };

  const handleFileChange = (e) => {
    if(!activeChat) return;
    const files = Array.from(e.target.files);

    // Reset the file input value to trigger onChange when the same file is selected again
    e.target.value = "";

    const allowedTypes = [
      "text/csv", // CSV files
      "application/csv", // CSV alternative MIME type
      "application/vnd.ms-excel", // CSV files (older Excel format)
      "application/zip",
      "application/x-zip-compressed", // Windows ZIP MIME type
      "application/x-zip",
      "application/pdf", // PDF files
      "application/msword", // Word documents (DOC, DOCX)
      "application/vnd.ms-excel", // Excel files (XLS, XLSX)
      "image/jpeg", // JPEG images
      "image/jpg", // JPG images
      "image/png", // PNG images
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX files
      "video/mp4", // MP4 video
      "video/webm", // WebM video
      "video/ogg", // OGG video
      "audio/mpeg", // MP3 audio
      "audio/wav", // WAV audio
      "application/rtf", // Rich Text Format
      "text/plain", // Plain text
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX files
    ];

    // Filter valid files based on type
    const validFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        console.log(`Invalid file type: ${file.name}`);
        toast.error(`Invalid file type: ${file.name}`)
        return false;
      }
      if (file.size > 2 * 1024 * 1024) {
        // File size validation (2 MB)
        console.log(`File size exceeds 2 MB: ${file.name}`);
        toast.error(`File size should not more than 2 MB: ${file.name}`);
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
        fileUrl: "", // Empty fileUrl as we're not uploading to Firebase Storage yet
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
    const chatSnapshot = await getDoc(chatRef); // Use getDoc from Firestore 9+
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

  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs?.current[messageId];

    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("blink"); // Highlight message
      setTimeout(() => messageElement.classList.remove("blink"), 2000);
    }
  };

  const sendChatBotMessage = async () => {
      setLoading(true);
    setBotMessages((prev) => [
      ...prev,
      { role: "user", message: currentMessage },
    ]);
    setCurrentMesage("");
    const url = `${import.meta.env.VITE_APP_SERVER_URL}/chat-bot`;
    const responseMsg = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // <-- Add this line
      },
      body: JSON.stringify({ prompt: currentMessage }),
    });

    const responseText = await responseMsg.text(); 
    setBotMessages((prev) => [
      ...prev,
      { role: "assistant", message: responseText },
    ]);
    lastMessageRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setLoading(false);
  };

  return (
    <div className="flex w-[80%] h-[97%] bg-gray-100 rounded-3xl">
  
      {sidebarOption?.chats && <ChatList />}
      {sidebarOption?.users && <UsersList />}
      {sidebarOption?.groups && <GroupsList />}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b rounded-tr-3xl">
          {activeChat ? (
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <div className="flex items-center gap-x-2">
                  <h2 className="text-xl font-bold">{userName}</h2>
               
                </div>
               
              </div>
              {!sidebarOption?.ai && (
                <div className="flex space-x-4">
                 
                  <MdCall
                    size={20}
                    className=" text-gray-600 cursor-pointer"
                    onClick={() => initiateCall("voice")}
                  />
                  <MdVideoCall
                    size={20}
                    className=" text-gray-600 cursor-pointer"
                    onClick={() => initiateCall("video")}
                  />

                </div>
              )}
            </div>
          ) : sidebarOption?.ai ? (
            <>
              <div className="text-xl font-bold flex items-center gap-x-4">
                <CgBot size={40} />
                Chat Bot
              </div>
            </>
          ) : (
            <div className="text-xl font-bold">Infinity Chat</div>
          )}
        </div>

        {sidebarOption?.ai ? (
          <div className="flex-1 p-4 overflow-y-scroll">
            {botMessages.length > 0 ? (
              botMessages?.map((msg, index) => {
                const isLastMessage = index === botMessages.length - 1;
                return (
                  <div
                    key={msg.messageId} // Ensure each item has a unique key
                    ref={(el) => {
                      if (isLastMessage) lastMessageRef.current = el;
                    }}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } my-3`}
                  >
                    <div
                      className={`px-3 py-2 rounded-b-lg ${
                        msg.role === "user"
                          ? "bg-purple-700 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      <ReactMarkdown>{msg?.message}</ReactMarkdown>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center font-medium">
                <div>Having Question ? </div>
                <div> Let's start a short conversation</div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-4 overflow-y-scroll">
            {activeChat ? (
              chats ? (
                (() => {
                  const activeChatData = chats.find(
                    (chat) => chat.chatId === activeChat
                  );

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
                    const isLastMessage =
                      index === activeChatData.messages.length - 1;
                    return (
                      <div
                        key={msg.messageId}
                        ref={(el) => {
                          if (el) {
                            if (!messageRefs.current) {
                              messageRefs.current = {}; // Ensure it is initialized
                            }
                            messageRefs.current[msg.messageId] = el; // Assign the reference correctly
                            if (isLastMessage) lastMessageRef.current = el; // Assign last message ref
                          }
                        }}
                        className={`flex ${
                          msg.senderId === currentUser?.uid
                            ? "justify-end"
                            : "justify-start"
                        } my-3`}
                      >
                        {msg.senderId !== currentUser?.uid && (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0 mr-3">
                            {/* User Avatar Placeholder */}
                            <NameInitial id={msg?.senderId} />
                          </div>
                        )}
                        <div className="flex items-start group">
                          {msg.senderId === currentUser?.uid && (
                            <div className="w-10 h-full flex items-center cursor-pointer text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                              <FaReply
                                className="transform scale-x-[-1]"
                                onClick={() => setPreviewMsg(msg)}
                              />
                            </div>
                          )}

                          <div className="max-w-[80%]">
                            {msg?.replyTo && (
                              <div
                                onClick={() => scrollToMessage(msg?.replyTo)}
                                className="bg-gray-300 rounded-t-lg px-2 flex items-center gap-x-2"
                              >
                                <FaReply className="text-xs text-gray-700" />
                                <ReplyMsgContent
                                  messageId={msg?.replyTo}
                                  activeChat={activeChat}
                                  symmetricDecyptedKey={symmetricDecyptedKey}
                                />
                              </div>
                            )}
                            <div
                              className={`px-3 py-2 rounded-b-lg ${
                                msg.senderId === currentUser?.uid
                                  ? "bg-purple-700 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {msg.senderId !== currentUser?.uid &&
                                activeChatData.isGroup && (
                                  <SenderName senderId={msg.senderId} />
                                )}

                              {symmetricDecyptedKey && msg.text ? (
                                <p>
                                  {decryptMessage(
                                    msg.text,
                                    symmetricDecyptedKey
                                  )}
                                </p>
                              ) : (
                                <a href={msg?.file?.fileUrl} target="_blank">
                                  {msg?.file.type?.startsWith("image") && (
                                    <img
                                      src={msg.file.fileUrl}
                                      className="h-56 w-56"
                                    />
                                  )}
                                  {msg?.file.type?.startsWith("video") && (
                                    <video
                                      src={msg.file.fileUrl}
                                      autoPlay
                                      className="h-56 w-56"
                                    />
                                  )}
                                  {(msg?.file.type?.startsWith("application") ||
                                    msg?.file.type?.startsWith("text") ||
                                    msg?.file.type?.startsWith("audio")) && (
                                    <span>{msg?.file?.type}</span>
                                  )}
                                </a>
                              )}

                              <div className="text-xs flex justify-between mt-2">
                                <span>{formattedTime(msg.timestamp)}</span>
                              </div>
                            </div>
                          </div>

                          {msg.senderId !== currentUser?.uid && (
                            <div className="w-10 h-full flex items-center ml-3 cursor-pointer text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                              <FaReply onClick={() => setPreviewMsg(msg)} />
                            </div>
                          )}
                        </div>

                        {msg.senderId === currentUser?.uid && (
                          <div className="w-10 h-10 rounded-lg bg-purple-200 flex-shrink-0 ml-3">
                            {/* User Avatar Placeholder */}
                            <NameInitial id={msg?.senderId} />
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              ) : (
                // Chats array is undefined
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <FaRegMessage size={80} className="text-gray-400" />
                    <span className="text-gray-400 text-lg font-semibold">
                      No Chats
                    </span>
                  </div>
                </div>
              )
            ) : (
              // No active chat selected
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <FaRegMessage size={80} className="text-gray-400" />
                  <span className="text-gray-400 text-lg font-semibold">
                    No Selected Chat
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* preview files  */}
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
                <span className="w-12 h-12 truncate bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 mr-4">
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

        {/* emoji picker  */}
        {emojiPopupOpen && (
          <div className="mt-[150px] ml-4 absolute z-50 inline-block">
            <EmojiPicker
              onEmojiClick={(data) =>
                setCurrentMesage((prevMessage) => prevMessage + data?.emoji)
              }
            />
          </div>
        )}

        {/* preview reply msg  */}
        {previewMsg && (
          <div className="p-2 px-4 mx-4 rounded-md bg-gray-200 flex justify-between">
            <div className="flex flex-col">
              {previewMsg?.text && (
                <span>
                  {" "}
                  {decryptMessage(previewMsg?.text, symmetricDecyptedKey)}
                </span>
              )}
              {previewMsg?.file && <span>File</span>}
              <span className="text-xs">
                {formattedTime(previewMsg?.timestamp)}
              </span>
            </div>
            <button
              onClick={() => setPreviewMsg(null)}
              className="text-red-500 hover:text-red-700 ml-4"
            >
              <AiOutlineClose />
            </button>
          </div>
        )}

        <div className="p-4 relative bg-white border-t rounded-br-3xl flex">
          {!sidebarOption?.ai && (
            <div className="relative">
              {/* File Input - Hidden */}
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                onChange={handleFileChange} // Handle file selection
              />

              <FaSmileBeam
                size={20}
                className="text-gray-600 left-4 top-[11px] absolute cursor-pointer"
                onClick={() => setEmojiPopupOpen((prev) => !prev)}
              />

              {/* Icon wrapped with a label */}
              <label htmlFor="file-upload">
                <FaPaperclip
                  size={20}
                  className="text-gray-600 left-10 top-[11px] absolute cursor-pointer"
                />
              </label>
            </div>
          )}
          <input
            type="text"
            className={`flex-1 ${
              sidebarOption?.ai ? "pl-4" : "pl-16"
            } border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            placeholder="Type a message..."
            onKeyDown={(e) => handleKeyDown(e)}
            value={currentMessage}
            onChange={(e) => setCurrentMesage(e.target.value)}
          />
          <span className="flex absolute right-8 top-[26px] space-x-3">
            {loading ? (
              <div className="animate-spin rounded-full border-t-blue-600 border-4 h-5 w-5"></div>
            ) : (
              
              <BsSend
                size={20}
                className="text-gray-600 cursor-pointer"
                onClick={sidebarOption?.ai ? sendChatBotMessage : sendMessage}
              />
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;

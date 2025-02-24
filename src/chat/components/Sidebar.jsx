import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { CgBot, CgLogOut } from "react-icons/cg";
import { FaInfinity, FaUsers } from "react-icons/fa";
import { FaMessage, FaPerson, FaUserGroup } from "react-icons/fa6";
import { db } from "../../firebase/firebase";
import { useDispatch, useSelector } from "react-redux";
import {
  clearChatData,
  setActiveChat,
  setGroups,
  setMessages,
  setOtherUser,
  setUsers,
  setUsersWithChat,
} from "../../store/chatSlice";
import { clearUser } from "../../store/userSlice";
import { logout } from "../../firebase/auth";
import { useNavigate } from "react-router-dom";
import { setLoading } from "../../store/loadingSlice";
import { setSidebarOption } from "../../store/sidebarSlice";
import GroupDialogBox from "./GroupDialogueBox";

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sidebarOption = useSelector((state) => state.sidebar);
  const currentUser = useSelector((state) => state.user.currentUser);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    //initially select all chats option
    handleChats();
  }, []);

  const handleChats = async () => {
    dispatch(setActiveChat(null))
    try {
      dispatch(setSidebarOption({ key: "chats", value: true }));
      dispatch(setMessages([]));
      dispatch(setOtherUser(null));
      dispatch(setLoading({ key: "chats", value: true }));

      // Step 1: Query chats where the current user is a participant
      const chatsRef = collection(db, "chats");
      const chatsQuery = query(
        chatsRef,
        where("participants", "array-contains", currentUser.uid),
        where("isGroup", "==", false) // Add the condition for isGroup == false
      );

      const chatsSnapshot = await getDocs(chatsQuery);

      const chatUsers = [];

      // Step 2: Loop through each chat to extract other participants and messages
      for (const chatDoc of chatsSnapshot.docs) {
        const chatId = chatDoc.id;
        const chatData = chatDoc.data();
        const { participants, messages } = chatData;

        // Exclude the current user from the participants
        const otherParticipants = participants.filter(
          (uid) => uid !== currentUser.uid
        );

        // Step 3: Fetch user details for other participants
        const usersRef = collection(db, "users");
        const userPromises = otherParticipants.map((uid) => {
          return query(usersRef, where("uid", "==", uid));
        });

        const userDocs = await Promise.all(userPromises.map((q) => getDocs(q)));

        // Combine user details with their messages
        userDocs.forEach((userSnapshot) => {
          userSnapshot.docs.forEach((userDoc) => {
            const userData = userDoc.data();
            chatUsers.push({
              user: userData,
              chatId,
              messages,
            });
          });
        });
      }
      dispatch(setUsersWithChat(chatUsers));
      dispatch(setLoading({ key: "chats", value: false }));
    } catch (error) {
      console.error("Error fetching users with chats:", error);
      throw error;
    } 
  };

  const getUsers = async () => {
    dispatch(setMessages([]));
    dispatch(setOtherUser(null));

    try {
      // Get a reference to the users collection in Firestore
      const usersRef = collection(db, "users");

      // Create a query to get all users except the current user
      const usersQuery = query(usersRef, where("uid", "!=", currentUser.uid)); // Exclude the current user by UID

      // Get the query snapshot
      const querySnapshot = await getDocs(usersQuery);

      // Map the documents to an array of user data
      const users = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      }));

      // Dispatch the users list to Redux to update the users state
      dispatch(setUsers(users));
    } catch (error) {
      console.error("Error fetching users:", error); // Handle any errors
    } finally {
      dispatch(setLoading({ key: "users", value: false }));
    }
  };

  const handleUsers = () => {
    dispatch(setActiveChat(null))
    dispatch(setSidebarOption({ key: "users", value: true }));
    dispatch(setLoading({ key: "users", value: true }));
    getUsers()
  }

  const handleAddGroup = async () => {
    setIsOpen(true);
    //get users list
    getUsers();
  }

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    dispatch(clearChatData());
    navigate("/auth");
  };

  const handleGroups = async () => {
    dispatch(setActiveChat(null))

    dispatch(setSidebarOption({ key: "groups", value: true }));
    dispatch(setLoading({ key: "groups", value: true }));
    //get groups and dispatch all groups
    try {
      // Get a reference to the users collection in Firestore
      const chatRef = collection(db, "chats");

      // Create a query to get all users except the current user
      const chatQuery = query(chatRef, where("isGroup", "==", true)); // Exclude the current user by UID

      // Get the query snapshot
      const querySnapshot = await getDocs(chatQuery);

      // Map the documents to an array of user data
      const groups = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      }));

      // Dispatch the users list to Redux to update the users state
      dispatch(setGroups(groups));
    } catch (error) {
      console.error("Error fetching groups:", error); // Handle any errors
    } finally {
      dispatch(setLoading({ key: "groups", value: false }));
    }
  }

  const handleChatBot = async()=>{
    dispatch(setActiveChat(null))
    dispatch(setSidebarOption({ key: "ai", value: true }));
  }

  return (
    <>
      <div className="w-35 flex flex-col items-center p-4 h-full">
        <div className="mb-12 cursor-pointer text-gray-700">
          <FaInfinity size={35} />
        </div>
        <div
          onClick={handleUsers}
          className={`mb-6 flex flex-col cursor-pointer items-center text-gray-400 ${sidebarOption?.users
            ? "text-white bg-gray-700"
            : "hover:text-white hover:bg-gray-700"
            }  rounded-lg h-[10%] w-[70px] justify-center`}
        >
          <FaUsers className="h-[24px] w-[24px]" />
          <span className="text-[13px]">Users</span>
        </div>
        <div
          onClick={handleChats}
          className={`mb-6 text-gray-400 flex flex-col cursor-pointer items-center hover:text-white hover:bg-gray-700 rounded-lg h-[10%] w-[70px] justify-center ${sidebarOption?.chats
            ? "text-white bg-gray-700"
            : "hover:text-white hover:bg-gray-700"
            } rounded-lg h-[10%] w-[70px] justify-center`}
        >
          <FaMessage className="h-[24px] w-[24px]" />
          <span className="text-[13px]">All chats</span>
        </div>
        <div
           className={`mb-6 text-gray-400 flex flex-col cursor-pointer items-center hover:text-white hover:bg-gray-700 rounded-lg h-[10%] w-[70px] justify-center ${sidebarOption?.groups
            ? "text-white bg-gray-700"
            : "hover:text-white hover:bg-gray-700"
            } rounded-lg h-[10%] w-[70px] justify-center`}
          onClick={handleGroups}
        >
          <FaUserGroup className="h-[24px] w-[24px]" />
          <span className="text-[13px]">Groups</span>
        </div>
        <div
           className={`mb-6 text-gray-400 flex flex-col cursor-pointer items-center hover:text-white hover:bg-gray-700 rounded-lg h-[10%] w-[70px] justify-center ${sidebarOption?.ai
            ? "text-white bg-gray-700"
            : "hover:text-white hover:bg-gray-700"
            } rounded-lg h-[10%] w-[70px] justify-center`}
          onClick={handleChatBot}
        >
          <CgBot size={40}/>
          <span className="text-[13px]">Bot</span>
        </div>
        <div
          className="mb-6 text-gray-400 flex flex-col cursor-pointer items-center hover:text-white hover:bg-gray-700 rounded-lg h-[10%] w-[70px] justify-center"
          onClick={handleAddGroup}
        >
          <AiOutlinePlusCircle className="h-[24px] w-[24px]" />
          <span className="text-[13px]">Add group</span>
        </div>
      
        <div
          className="mt-auto text-gray-400 flex flex-col cursor-pointer items-center hover:text-white hover:bg-gray-700 rounded-lg h-[10%] w-[70px] justify-center"
          onClick={handleLogout}
        >
          <CgLogOut className="h-[24px] w-[24px]" />
          <span className="text-[13px]">Logout</span>
        </div>
      </div>

      {isOpen && (
        <GroupDialogBox isModalOpen={isOpen} setIsModalOpen={setIsOpen} />
      )}
    </>
  );
};

export default Sidebar;

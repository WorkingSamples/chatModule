import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import Loader from "../../utils/Loader";
import {
  setActiveChat,
  setOtherUser,
  setSymmetricDecryptedKey,
} from "../../store/chatSlice";

import { v4 as uuidv4 } from "uuid";
import {
  fetchSymmetricDecryptedKey,
  getUserPvtKey,
} from "../../utils/utilityFunction";
import { NameInitial } from "../../components/Utils";

const UsersList = () => {
  const dispatch = useDispatch();

  const { users, otherUser, chats } = useSelector((state) => state.chat);
  const { currentUser, usersStatus } = useSelector((state) => state.user);
  const loading = useSelector((state) => state.loading.users);

  const [userPrivateKey, setUserPrivateKey] = useState(null);

  useEffect(() => {
    if (!userPrivateKey) {
      getUserPvtKey(currentUser, setUserPrivateKey);
    }
  }, []);

  const handleUserClick = async (otherUser) => {
    let chatRoomId = null; // Unique chatroom ID based on user IDs

    //if any of the chat{not group} is having currentuser and other user as participant then set chatid as activechat else setup new active chat
    let chat = chats.find(
      (chat) =>
        !chat.isGroup &&
        chat?.participants.includes(currentUser.uid) &&
        chat?.participants.includes(otherUser.uid)
    );
    if (chat) {
      chatRoomId = chat.chatId;
      const decryptedKey = await fetchSymmetricDecryptedKey(
        chatRoomId,
        currentUser.uid,
        userPrivateKey
      );

      dispatch(setSymmetricDecryptedKey(decryptedKey));
    } else {
      chatRoomId = uuidv4();
    }

    dispatch(setActiveChat(chatRoomId));
    dispatch(setOtherUser(otherUser));
  };

  return (
    <div className="w-72 overflow-y-scroll mt-4 scrollbar">
      {loading ? (
        <Loader />
      ) : users && users.length > 0 ? (
        users.map((user, index) => (
          <div
            key={index}
            className={`p-4 border-b flex items-center cursor-pointer ${
              otherUser?.uid === user?.uid && "bg-gray-200"
            }`}
            onClick={() => handleUserClick(user)}
          >
            <div className="relative w-12 h-12 rounded-lg bg-gray-300">
              {usersStatus.find((el) => el?.userId === user?.uid)?.status ===
                "online" && (
                <span className="absolute bg-green-500 rounded-full w-[12px] h-[12px] -right-[0.5px] -bottom-[0.5px]"></span>
              )}
              <NameInitial id={user?.uid} />
            </div>
            <div className="ml-4">
              <p className="font-bold">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="flex justify-center items-center text-sm font-semibold">
          No Users Available
        </div>
      )}
    </div>
  );
};

export default UsersList;

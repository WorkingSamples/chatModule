import { useDispatch, useSelector } from "react-redux";
import Loader from "../../utils/Loader";
import {
  setActiveChat,
  setMessages,
  setSymmetricDecryptedKey,
} from "../../store/chatSlice";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import moment from "moment";
import { useEffect, useState } from "react";

import {
  decryptMessage,
  fetchSymmetricDecryptedKey,
  getUserPvtKey,
} from "../../utils/utilityFunction";

const GroupsList = () => {
  const dispatch = useDispatch();

  const { activeChat, chats } = useSelector((state) => state.chat);
  const { currentUser } = useSelector((state) => state.user);
  const loading = useSelector((state) => state.loading.groups);

  const [groups, setGroups] = useState([]);
  const [userPrivateKey, setUserPrivateKey] = useState();

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
    setGroups(groupChats.filter(Boolean));
  };

  //get groupchats as chats changed that is message update
  useEffect(() => {
    if (userPrivateKey) {
      getGroupChats();
    } else {
      getUserPvtKey(currentUser, setUserPrivateKey);
    }
  }, [userPrivateKey, chats]);


  const handleGroupClick = async (group) => {
    const chatRoomId = group.chatId; // Unique chatroom ID based on user IDs

    // //get pvt key of current user to decrypt symmetric key of group

    //chatData to get encrypted pvt key of user
    const chatRef = doc(db, "chats", chatRoomId);
    const chatDoc = await getDoc(chatRef);
    console.log(chatDoc,"chatdoccc")

    //fetch group key of particular user i.e encrypted user's key
    const decryptedKey = await fetchSymmetricDecryptedKey(
      chatDoc.data().chatId,
      currentUser.uid,
      userPrivateKey
    );

    //setting group key for current active group chat to decrypt messages in chatwindow.jsx
    dispatch(setSymmetricDecryptedKey(decryptedKey));
    dispatch(setActiveChat(chatRoomId));


    if (chatDoc.exists()) {
      dispatch(setMessages(chatDoc.data().messages || [])); // Load existing messages
    } else {
      dispatch(setMessages([])); // No chatroom exists yet
    }
  };

  const InitialName = ({ group }) => {
    const groupName = group?.groupDetails?.groupName || "";

    const words = groupName.split(" ").filter((word) => word.length > 0); // Split and remove extra spaces

    const firstLetter = words[0]?.substring(0, 1) || ""; // First letter of the first word
    const secondLetter = words[1]?.substring(0, 1) || ""; // First letter of the second word (if exists)

    const groupNameInitial = `${firstLetter}${secondLetter}`.trim();
    return (
      <div className="flex justify-center items-center h-full w-full">
        <p className="font-semibold text-black">{groupNameInitial}</p>
      </div>
    );
  };

  return (
    <div className="w-72 overflow-y-scroll mt-4 scrollbar">
      {loading ? (
        <Loader />
      ) : groups && groups.length > 0 ? (
        groups.map((group, index) => (
          <div
            key={index}
            className={`p-4 border-b flex items-center cursor-pointer ${
              group.chatId === activeChat && "bg-gray-200"
            }`}
            onClick={() => handleGroupClick(group)}
          >
            <div className="w-12 h-12 rounded-lg bg-gray-300">
              <InitialName group={group} />
            </div>
            <div className="ml-4">
              <p className="font-bold text-sm">{group.groupDetails?.groupName}</p>
          
              <p className="text-sm text-gray-600  truncate w-32">
                {group?.messages[group?.messages?.length - 1]?.text
                  ? decryptMessage(
                      group?.messages[group?.messages?.length - 1]?.text,
                      group.decryptedKey
                    )
                  : group?.messages[group?.messages?.length - 1]?.file &&
                    "file"}
              </p>
            </div>
            <span className="ml-auto text-[10px]">
              {group?.messages[group?.messages.length - 1]?.timestamp &&
                moment(
                  group?.messages[group?.messages.length - 1]?.timestamp
                ).format("h:mm A")}
            </span>
       
          </div>
        ))
      ) : (
        <div className="flex justify-center items-center text-sm font-semibold">
          No Groups Available
        </div>
      )}
    </div>
  );
};

export default GroupsList;

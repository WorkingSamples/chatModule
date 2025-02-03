import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { db } from "../../firebase/firebase";
import { setLoading } from "../../store/loadingSlice";
import Loader from "../../utils/Loader";
import { NameInitial } from "../../components/Utils";

const ChatInfo = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const activeChat = useSelector((state) => state.chat.activeChat);
  const sidebarOption = useSelector((state) => state.sidebar);
  const loading = useSelector((state) => state.loading.participants);
  const [participants, setParticipants] = useState([]);

  const getParticipants = async () => {
    setParticipants([]);
    dispatch(setLoading({ key: "participants", value: true }));
    const chatRef = doc(db, "chats", activeChat);
    const chatDoc = await getDoc(chatRef);
    const chatData = chatDoc.data();

    // Fetch all user details based on participants UIDs
    const usersCollection = collection(db, "users");
    const userQueries = chatData?.participants.map((uid) =>
      query(usersCollection, where("uid", "==", uid))
    );

    // Fetch all participant data
    const userDocs = await Promise.all(userQueries.map((q) => getDocs(q)));
    const users = userDocs.flatMap((docSnapshot) =>
      docSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );

    setParticipants(users);
    dispatch(setLoading({ key: "participants", value: false }));
  };

  useEffect(() => {
    if (!activeChat || sidebarOption.users) return;
    getParticipants();
  }, [activeChat]);

  return (
    <div className="w-[80%] h-[20%] md:w-[19%] md:h-[97%] flex flex-col space-y-2">
      {/* <div className='bg-white h-[50%] rounded-3xl p-4'>
                <h2 className="text-xl font-bold mb-2">Group Info</h2>
                <h2 className="text-xl font-bold mb-4">Member Info</h2>
                <p className="font-bold">Files</p>
                <ul className="list-disc ml-4">
                    <li>265 photos</li>
                    <li>13 videos</li>
                    <li>378 files</li>
                </ul>
            </div> */}
      <div className="bg-white h-full rounded-3xl p-4">
        {loading ? (
          <Loader />
        ) : activeChat && !sidebarOption.users ? (
          <>
            <h2 className="text-xl font-bold mb-1">
              {participants.length} Members
            </h2>
            {participants.length > 0 &&
              participants?.map((participant, index) => (
                <div className="p-2 border-b flex items-center">
                  <div className="w-10 h-8 rounded-full bg-gray-300">
                    <NameInitial id={participant.uid} />
                  </div>
                  <div className="ml-4 flex justify-between w-full items-center">
                    <p className="font-bold">
                      {participant?.lastName
                        ? `${participant?.firstName}${" "}${
                            participant?.lastName
                          }`
                        : participant?.firstName}
                    </p>
                    <span className="text-[12px] text-gray-400">
                      {currentUser.uid === participant.uid && "You"}
                    </span>
                  </div>
                </div>
              ))}
          </>
        ) : (
          <div className="text-center">No participants</div>
        )}
        {/* <span className="ml-auto text-xs">{chat.time}</span> */}
      </div>
    </div>
  );
};

export default ChatInfo;

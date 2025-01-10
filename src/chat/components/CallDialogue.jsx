import React, { useState } from "react";
import AgoraRTC, { AgoraRTCProvider, LocalUser, RemoteUser, useIsConnected, useJoin, useLocalMicrophoneTrack, usePublish, useRemoteUsers } from "agora-rtc-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { Dialog } from "@headlessui/react";

const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

export const IncomingCallDialog = ({ setIsCallAccepted, isCallAccepted, callDetails, isIncomingCall, setIsIncomingCall, setCallingDialog }) => {
    const currentUser = useSelector((state) => state.user.currentUser);
    const activeChat = useSelector((state) => state.chat.activeChat);

    const acceptCall = async () => {
        setCallingDialog(true)
        setIsIncomingCall(false)
        // const chatRef = doc(db, "chats", activeChat);

        try {
            console.log(activeChat, "activechatt")
            const chatRef = doc(db, "chats", activeChat);

            await updateDoc(chatRef, {
                "callDetails.isAccepted": true,
            });
            toast.success("Call accepted!");
            // setIsModalOpen(false);
        } catch (error) {
            console.error("Error accepting call:", error);
            toast.error("Failed to accept call.");
        }
    };

    const declineCall = async () => {
        setIsCallAccepted(false)
        const chatRef = doc(db, "chats", activeChat);
        try {
            await updateDoc(chatRef, {
                callDetails: {
                    isCalling: false,
                },
            });

            toast.info("Call declined.");
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error declining call:", error);
            toast.error("Failed to decline call.");
        }
    };

    return (
        <Dialog open={isIncomingCall} onClose={() => setIsIncomingCall(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black bg-opacity-30" />
            <div className="fixed inset-0 flex items-center justify-center">
                <Dialog.Panel className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Incoming call</h2>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={declineCall}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                            Decline
                        </button>
                        <button
                            onClick={acceptCall}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Accept
                        </button>
                    </div>

                    {/* <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={endCall}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                            End Call
                        </button>
                    </div> */}
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export const CallingDialogBox = ({ setIsCallAccepted, isCallAccepted, callDetails, callingDialog, setIsCallingDialog }) => {
    // const currentUser = useSelector((state) => state.user.currentUser)
    // console.log(isCallAccepted, "isCallaccepted:", currentUser.uid)

    useJoin({ appid: import.meta.env.VITE_APP_AGORA_APP_ID, channel: 'infinity-chat', token: import.meta.env.VITE_APP_AGORA_TOKEN }, isCallAccepted);

    const { localMicrophoneTrack } = useLocalMicrophoneTrack(isCallAccepted);
    usePublish([localMicrophoneTrack]);

    const remoteUsers = useRemoteUsers();
    // console.log("remote users:", remoteUsers)

    const isConnected = useIsConnected();
    console.log(isConnected, "isConnecteddd")

    const endCall = () => {
        setIsCallAccepted(false)
    }

    return (
        <Dialog open={callingDialog} onClose={() => setIsCallingDialog(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black bg-opacity-30" />
            <div className="fixed inset-0 flex items-center justify-center">
                <Dialog.Panel className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Call</h2>
                    <div className="user">
                        <LocalUser
                            audioTrack={localMicrophoneTrack}
                            micOn={isCallAccepted}
                            cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
                        >
                            <samp className="user-name">You</samp>
                        </LocalUser>
                        {remoteUsers.map((user) => (
                            <div className="user" key={user.uid}>
                                <RemoteUser cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg" user={user}>
                                    <samp className="user-name">{user.uid}</samp>
                                </RemoteUser>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={endCall}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                            End Call
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}





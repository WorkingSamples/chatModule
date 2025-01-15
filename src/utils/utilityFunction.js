import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const getOtherUserInfo = async (otherUserId) => {
    const userRef = doc(db, 'users', otherUserId);
    const userDoc = await getDoc(userRef);
    const otherUserInfo = userDoc.data();

    return otherUserInfo?.lastName
        ? `${otherUserInfo?.firstName} ${otherUserInfo?.lastName}`
        : otherUserInfo?.firstName;
};

export const displayName = async (chatData, currentUser) => {
    if (chatData) {
        if (chatData?.isGroup) {
            return chatData?.groupDetails?.groupName;
        } else {
            const otherUserUid = chatData?.participants?.filter((uid) => uid !== currentUser?.uid);
            return await getOtherUserInfo(otherUserUid[0]);
        }
    } else {
        return await getOtherUserInfo(currentUser?.uid);
    }
};

export const currentUserName = async(currentUser)=>{
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    const currentUserInfo = userDoc.data();

    return currentUserInfo?.lastName
        ? `${currentUserInfo?.firstName} ${currentUserInfo?.lastName}`
        : currentUserInfo?.firstName;
}
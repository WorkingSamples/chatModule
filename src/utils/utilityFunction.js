import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import CryptoJS from "crypto-js";
import forge from "node-forge";
import moment from "moment";

export const getDay = async(messages)=>{

}

export const getOtherUserInfo = async (otherUserId) => {
  const userRef = doc(db, "users", otherUserId);
  const userDoc = await getDoc(userRef);
  const otherUserInfo = userDoc.data();
  console.log(otherUserInfo, "otherUserInfo");

  return otherUserInfo?.lastName
    ? `${otherUserInfo?.firstName} ${otherUserInfo?.lastName}`
    : otherUserInfo?.firstName;
};

export const displayName = async (chatData, currentUser) => {
  if (chatData) {
    if (chatData?.isGroup) {
      return chatData?.groupDetails?.groupName;
    } else {
      const otherUserUid = chatData?.participants?.filter(
        (uid) => uid !== currentUser?.uid
      );
      return await getOtherUserInfo(otherUserUid[0]);
    }
  } else {
    return await getOtherUserInfo(currentUser?.uid);
  }
};

export const currentUserName = async (currentUser) => {
  const userRef = doc(db, "users", currentUser.uid);
  const userDoc = await getDoc(userRef);
  const currentUserInfo = userDoc.data();

  return currentUserInfo?.lastName
    ? `${currentUserInfo?.firstName} ${currentUserInfo?.lastName}`
    : currentUserInfo?.firstName;
};

export const decryptMessage = (encryptedMessage, decryptedSymmetricKey) => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, decryptedSymmetricKey);
  const originalMessage = bytes.toString(CryptoJS.enc.Utf8);
  return originalMessage;
};

export const getUserPvtKey = async (currentUser, setUserPrivateKey) => {
  //get pvt key of current user to decrypt symmetric key of group
  const userRef = doc(db, "users", currentUser.uid);
  const userDoc = await getDoc(userRef);
  setUserPrivateKey(userDoc.data().privateKey);
};

export const decryptOneonOneMessage = (encryptedMessage, userPrivateKey) => {
  console.log(encryptedMessage, "encrypted message", userPrivateKey);
  const privateKeyObj = forge.pki.privateKeyFromPem(userPrivateKey);
  const decodedMessage = forge.util.decode64(encryptedMessage); // Decode Base64
  const decryptedMessage = privateKeyObj.decrypt(decodedMessage, "RSA-OAEP");
  return decryptedMessage; // Original message
};

export const generateSymmetricKey = () => {
  const symmetricKey = CryptoJS.lib.WordArray.random(32).toString(); // 256-bit key
  return symmetricKey;
};

export const encryptSymmetricKey = (symmetricKey, publicKey) => {
  const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
  const encryptedKey = publicKeyObj.encrypt(symmetricKey, "RSA-OAEP");
  return forge.util.encode64(encryptedKey); // Base64 encoded
};

const decryptSymmetricKey = (encryptedKey, privateKey) => {
  const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
  const decryptedKey = privateKeyObj.decrypt(
    forge.util.decode64(encryptedKey),
    "RSA-OAEP"
  );
  return decryptedKey;
};

export const fetchSymmetricDecryptedKey = async (
  chatId,
  userId,
  privateKey
) => {
  // Fetch group details
  const chatRef = doc(db, "chats", chatId);
  const chatDoc = await getDoc(chatRef);

  if (chatDoc.exists()) {
    const encryptedKey = chatDoc.data().encryptedKeys[userId];
    console.log("encrypted key:", encryptedKey, "of user:", userId);

    if (!encryptedKey) {
      throw new Error("Encrypted group key not found for user");
    }

    // Decrypt the symmetric key using the user's private key
    const decryptedKey = decryptSymmetricKey(encryptedKey, privateKey);
    return decryptedKey;
  }

  throw new Error("Group not found");
};

export const getNameInitials = async (uid) => {
  if (!uid) {
    console.error("UID is required to fetch user initials.");
    return "";
  }

  const userRef = doc(db, "users", uid);

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();

      const firstNameInitial = userData?.firstName?.substring(0, 1) || "";
      const lastNameInitial = userData?.lastName?.substring(0, 1) || "";

      return `${firstNameInitial}${lastNameInitial}`.trim();
    } else {
      console.error("User not found.");
      return "";
    }
  } catch (error) {
    console.error("Error fetching user initials:", error);
    return "";
  }
};

export const formattedTime = (timestamp) => {
  const messageTime = moment(timestamp);
  const now = moment();

  // Check if the message is from today
  if (messageTime.isSame(now, "day")) {
    const diffInMinutes = now.diff(messageTime, "minutes");
    const diffInSecs = now.diff(messageTime, "seconds");

    if (diffInSecs < 120) {
      return `${diffInSecs} seconds ago`;
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    }
  }

  // Otherwise, return standard time format
  return messageTime.format("h:mm A");
};

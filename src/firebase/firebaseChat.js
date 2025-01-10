import { db } from './firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

export const sendMessage = async (chatId, message, user) => {
  const chatRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(chatRef, {
    text: message,
    senderId: user.uid,
    senderName: user.displayName,
    createdAt: serverTimestamp(),
  });
};

export const subscribeToMessages = (chatId, callback) => {
  const chatRef = collection(db, 'chats', chatId, 'messages');
  const q = query(chatRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, callback);
};

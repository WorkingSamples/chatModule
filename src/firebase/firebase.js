import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBTxDCWOqXv1YeGLqqsVacGU-xJosI0J70",
  authDomain: "chat-app-be9eb.firebaseapp.com",
  projectId: "chat-app-be9eb",
  storageBucket: "chat-app-be9eb.firebasestorage.app",
  messagingSenderId: "467229505789",
  appId: "1:467229505789:web:27a6e1cd6f3d88b0cd2694"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()

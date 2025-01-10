import { auth, db } from "./firebase"; // Ensure Firestore is initialized
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestore functions
const googleProvider = new GoogleAuthProvider();

export const signup = async (email, password, firstName, lastName) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  //updating profile to save displayName of user
  const displayName = `${firstName} ${lastName}`;
  await updateProfile(user, { displayName });

  // Save user data to Firestore
  await setDoc(doc(db, "users", user.uid), {
    firstName,
    lastName,
    email: user.email,
    uid: user.uid,
  });

  return user;
};

export const login = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  try {
    await signOut(auth); // Firebase clears the session
  } catch (error) {
    console.error("Error logging out: ", error);
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const { displayName } = user;
    await updateProfile(user, { displayName });

    // Save user data to Firestore
    await setDoc(doc(db, "users", user.uid), {
      firstName:displayName,
      email: user.email,
      uid: user.uid,
    });
    return user; // Returns user details
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

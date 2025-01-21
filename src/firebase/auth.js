import { auth, db } from "./firebase"; // Ensure Firestore is initialized
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Firestore functions
import forge from "node-forge";

const googleProvider = new GoogleAuthProvider();

// Generate RSA Key Pair
const generateKeyPair = () => {
  const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);
  const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey);
  return { privateKey: privateKeyPem, publicKey: publicKeyPem };
};

export const signup = async (email, password, firstName, lastName) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  const { privateKey, publicKey } = generateKeyPair();

  //updating profile to save displayName of user
  const displayName = `${firstName} ${lastName}`;
  await updateProfile(user, { displayName });

  // Save user data to Firestore
  await setDoc(doc(db, "users", user.uid), {
    firstName,
    lastName,
    email: user.email,
    uid: user.uid,
    publicKey,
    privateKey,
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

    const { displayName,uid,email } = user;

    // Check if the user already exists in the Firestore `users` collection
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log("user not exist")
      // Generate keys if user does not exist
      const { privateKey, publicKey } = generateKeyPair();

      // Save user data to Firestore
      await setDoc(userDocRef, {
        firstName: displayName,
        email,
        uid,
        publicKey,
        privateKey,
      });
    }
    await updateProfile(user, { displayName });
    return user; // Returns user details
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

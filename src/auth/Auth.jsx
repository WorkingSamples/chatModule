import React, { useState, useTransition } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setStatus } from '../store/userSlice';
import { login, signInWithGoogle, signup } from "../firebase/auth"
import AuthLayout from './components/AuthLayout';
import Signup from './components/Signup';
import Login from './components/Login';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';

const LoginSignup = () => {
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false); // Toggle between Login and Signup
  const [formState, setFormState] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch();

  const validateForm = () => {
    let error = '';

    // Check for all required fields when signing up
    if (isSignup && (!formState.email || !formState.password || !formState.firstName || !formState.lastName)) {
      error = 'All fields are required';
    }

    // Check for email and password when logging in
    if (!isSignup && (!formState.email || !formState.password)) {
      error = 'Email and Password are required';
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (formState.email && !emailRegex.test(formState.email)) {
      error = 'Email must be valid';
    }

    // Validate password length
    if (formState.password && formState.password.length < 6) {
      error = 'Password should be at least 6 characters';
    }

    // Set error and return validation status
    if (error) {
      setErrors(error);
      return false;
    }
    return true;
  };

  const getUserInfo = async (uid, email, message) => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {

      const userInfo = userDoc.data();


      // Dispatch user data to Redux or any state manager
      dispatch(setUser({ uid, email, ...userInfo }));
      dispatch(setStatus("success"));

      toast.success(message);
      navigate('/chat')
    } else {
      toast.error("User information not found in Firestore.");
    }
  }

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      dispatch(setStatus('loading'));
      try {
        setLoading(true); // Start loading
        if (isSignup) {
          await signup(formState.email, formState.password, formState.firstName, formState.lastName)
            .then((userCredential) => {
              const { uid, email } = userCredential; // Extract serializable fields
              getUserInfo(uid, email, "Signup successful!");
            })
            .catch((error) => {
              dispatch(setStatus('error'));
              toast.error(error?.message);
              console.log('Signup Error:', error?.message);
            });
        } else {
          await login(formState.email, formState.password)
            .then((userCredential) => {
              const user = userCredential.user;
  
              const { uid, email } = user; // Extract serializable fields
              getUserInfo(uid, email, "Login successful!");
            })
            .catch((error) => {
              dispatch(setStatus('error'));
              toast.error(error?.message);
              console.error('Login Error:', error);
            });
        }
      } catch (err) {
        dispatch(setStatus('error'));
        console.error('Auth Error:', err);
      } finally {
        setLoading(false); // Stop loading after everything is done
      }
    }
  };
  

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      const { uid, email, displayName } = user; // Extract necessary details
      dispatch(setUser({ uid, email, displayName }));
      toast.success("Login successful!");
      navigate("/chat");
    } catch (error) {
      dispatch(setStatus("error"));
      toast.error(error.message || "Google Sign-In failed.");
    }
  };

  return (
    <>
      <AuthLayout>
        {isSignup ?
          <Signup
            formState={formState}
            setIsSignup={setIsSignup}
            setFormState={setFormState}
            handleSubmit={handleSubmit}
            pending={pending}
            loading={loading}
            errors={errors}
            setErrors={setErrors}
            handleGoogleSignIn={handleGoogleSignIn}
          />
          :
          <Login
            formState={formState}
            setIsSignup={setIsSignup}
            setFormState={setFormState}
            handleSubmit={handleSubmit}
            pending={pending}
            loading={loading}
            errors={errors}
            setErrors={setErrors}
            handleGoogleSignIn={handleGoogleSignIn}
          />}
      </AuthLayout>
    </>
  );
};

export default LoginSignup;

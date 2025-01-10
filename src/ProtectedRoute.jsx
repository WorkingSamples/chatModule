import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { setStatus, setUser } from './store/userSlice';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const ProtectedRoute = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Loading state
    const auth = getAuth();
    const dispatch = useDispatch();

    useEffect(() => {
        //refresh the user from firebase on every render
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log(user, "user on refresh");
                const { uid, email, displayName } = user;
                setCurrentUser({ uid, email, displayName });
                dispatch(setUser({ uid, email, displayName }));
                dispatch(setStatus("success"));
            } else {
                console.log("no user session exists");
                setCurrentUser(null);
            }
            setLoading(false); // Authentication status resolved
        });

        return () => unsubscribe(); // Cleanup subscription
    }, [auth, dispatch]);

    if (loading) {
        return <div>Loading...</div>; // Display a loading indicator
    }

    return currentUser ? <Outlet /> : <Navigate to="/auth" />;
};

export default ProtectedRoute;

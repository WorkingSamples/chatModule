import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Provider } from 'react-redux';
import store from './store';
import './index.css';
import { Toaster } from 'react-hot-toast';
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AgoraRTCProvider client={client}>
      <Provider store={store}>
        <Toaster />
        <App />
      </Provider>
    </AgoraRTCProvider>
  </React.StrictMode>
);

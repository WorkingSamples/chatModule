### Chat Application with Firebase and ZegoCloud

## **Overview**

This web application is a full-featured chat platform that includes real-time messaging, audio/video calling, and group chat functionality. It leverages Firebase Authentication for user management, Firestore for real-time database operations, and ZegoCloud for seamless audio and video communication.

---

## **Features**

### **Authentication System**
- **Sign In/Sign Up/Logout**:
  - Email/Password authentication using Firebase.
  - Google sign-in option via Firebase Authentication.

### **Sidebar**
- **Options**:
  - **All Chats**: Displays a list of all user chats.
  - **Groups**: Lists all groups the user is a member of.
  - **Users**: Shows all registered users.
  - **Add Group**: Allows users to create new groups and add members.

### **Global State Management**
- Implemented using **Redux Toolkit** for managing global states like user information, chat state, active chat details, and more.

### **Dynamic List Rendering**
- The displayed list dynamically  updates based on the sidebar option:
  - **Chats**: Displays all active chats.
  - **Groups**: Lists all available groups.
  - **Users**: Shows all platform users.

### **Real-Time Messaging**
- Messages are sent and received in real-time using Firestore's built-in functions.

### **Group Management**
- Create new groups.
- View participants of the current active chat.

### **Chat Window**
- Dedicated chat window for one-on-one and group conversations.
- Displays real-time message updates.

### **Audio/Video Calling**
- **One-on-One** and **Group Calls** implemented using ZegoCloud SDK.
- High-quality real-time communication for both audio and video calls.

---

## **Tech Stack**

### **Frontend**
- React.js: Core library for building the user interface.
- Redux Toolkit: For managing global state.

### **Backend**
- Firebase Authentication: User authentication and Google provider integration.
- Firestore: Real-time database for messages and group management.

### **Audio/Video Integration**
- ZegoCloud: UiKit for audio and video calling functionality.

---

## **Libraries and Packages**

| **Library/Package**      | **Version** | **Purpose**                                                |
|---------------------------|-------------|------------------------------------------------------------|
| React                    | `19.0.0`   | Frontend development framework.                            |
| Redux Toolkit            | `^9.2.0`    | State management for global application state.             |
| Firebase                 | `^11.1.0`   | Authentication, Firestore database, and real-time updates. |
| ZegoCloud SDK            | `^2.14.0`    | Audio/Video calling functionality.                        |
| React Router Dom           | `^7.1.0`   | Routing and navigation.                                |


## **Setup Instructions**

1. Clone the repository:
 
   git clone https://github.com/WorkingSamples/chatModule.git
  
2. Navigate to the project directory:
   
3. Install dependencies:
 
   npm install
  
4. Set up Firebase:
   - Create a Firebase project and enable Authentication and Firestore.
   - Replace the configuration in `firebase.js` with your Firebase credentials.

5. Configure ZegoCloud:
   - Sign up for ZegoCloud and obtain AppId and keys.
   - Add the keys to .env.

6. Start the development server:
 
   npm run dev
  
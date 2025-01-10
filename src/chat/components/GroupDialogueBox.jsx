import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { useDispatch, useSelector } from "react-redux";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from 'uuid'
import { setGroups } from "../../store/chatSlice";
import { setLoading } from "../../store/loadingSlice";

export default function GroupDialogBox({
  isModalOpen,
  setIsModalOpen
}) {
  const dispatch = useDispatch();
  const users = useSelector((state) => state.chat.users);
  const currentUser = useSelector((state) => state.user.currentUser);
  const sidebarOption = useSelector((state) => state.sidebar);


  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName) {
      alert("Group name is required!");
      return;
    }

    //add current user id too
    selectedUsers.push(currentUser?.uid)
    const chatId = uuidv4(); // Function to generate a unique ID
    const chatRef = doc(db, "chats", chatId);

    const newGroupChat = {
      chatId,
      isGroup: true,
      participants: selectedUsers,
      messages: [],
      groupDetails: {
        groupName: groupName,
        groupIcon: groupIcon,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
      },
      callDetails:null
    };

    await setDoc(chatRef, newGroupChat);
    toast.success("Group chat created successfully!")
    console.log("Group chat created successfully!");

    //load new group in the groupsList if "groups tab" selected in sidebar
    if (sidebarOption.groups) {
      try {
        // Get a reference to the users collection in Firestore
        const chatRef = collection(db, "chats");

        // Create a query to get all users except the current user
        const chatQuery = query(chatRef, where("isGroup", "==", true)); // Exclude the current user by UID

        // Get the query snapshot
        const querySnapshot = await getDocs(chatQuery);

        // Map the documents to an array of user data
        const groups = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
        }));

        // Dispatch the users list to Redux to update the users state
        dispatch(setGroups(groups));
      } catch (error) {
        console.error("Error fetching groups:", error); // Handle any errors
      } finally {
        dispatch(setLoading({ key: "groups", value: false }));
      }
    }
    setIsModalOpen(false); // Close the modal
  };

  return (
    <Dialog
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black bg-opacity-30" />
      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Create Group
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter group name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Group Icon (URL)
            </label>
            <input
              type="text"
              value={groupIcon}
              onChange={(e) => setGroupIcon(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste group icon URL (optional)"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Select Members
            </h3>
            <div className="max-h-48 overflow-y-auto thin-scrollbar">
              {users?.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center justify-between py-2 border-b border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.photoURL || "https://via.placeholder.com/40"}
                      alt={user.displayName || "User"}
                      className="w-8 h-8 rounded-full"
                    />
                    <span>{user.firstName}{" "}{user?.lastName}</span>
                  </div>
                  <button
                    onClick={() => toggleUserSelection(user.uid)}
                    className={`px-3 py-1 text-sm font-medium rounded ${selectedUsers.includes(user.uid)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {selectedUsers.includes(user.uid) ? "Added" : "Add"}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Create Group
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

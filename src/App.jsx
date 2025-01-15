import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginSignup from './auth/Auth';
import ProtectedRoute from './ProtectedRoute';
import Chat from './chat/Chat';
import Call from './call/Call';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/auth" element={<LoginSignup />} />
        <Route path="/call" element={<Call/>} />


        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<Chat />} />
          {/* Add more protected routes here */}
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

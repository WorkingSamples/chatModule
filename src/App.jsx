import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginSignup from './auth/Auth';
import ProtectedRoute from './ProtectedRoute';
import Chat from './chat/Chat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/auth" element={<LoginSignup />} />


        {/* Protected Routes */}
        <Route path="/"  element={<ProtectedRoute />}>
          <Route path='/' element={<Chat />} />
          {/* Add more protected routes here */}
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

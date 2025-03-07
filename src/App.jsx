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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

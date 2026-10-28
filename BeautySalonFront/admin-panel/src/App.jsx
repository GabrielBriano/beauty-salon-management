import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Dashboard from './pages/admin/Dashboard';
import Services from './pages/admin/Services';
import Appointments from './pages/admin/Appointments';
import Stock from './pages/admin/Stock';
import NotFound from './pages/NotFound';
import DashboardLayout from './layouts/DashboardLayout';
import PrivateRoute from './components/PrivateRoute';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import ResetPassword from './pages/auth/ResetPassword';
import Register from './pages/auth/Register';
import './App.css';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import BookingPage from './pages/client/BookingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/book' element={<BookingPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path='/' element={<Dashboard />} />
          <Route path='/services' element={<Services />} />
          <Route path='/appointments' element={<Appointments />} />
          <Route path='/stock' element={<Stock />} />
        </Route>
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
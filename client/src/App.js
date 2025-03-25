import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import SignUp from "./pages/signup";
import Dashboard from "./pages/dashboard";
import AccountManager from "./pages/account-manager"; 
import DataEntry from "./pages/dataentry-list";
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap/dist/js/bootstrap.bundle.min";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function App() {
  const isLoggedIn = localStorage.getItem('token') || false;
  return (
    <Router>
      <Routes>
      <Route path="/" element={
          isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/account-manager" element={<AccountManager />} />
        <Route path="/dataentry-list" element={< DataEntry />} />
      </Routes>
    </Router>
  );
}

export default App;

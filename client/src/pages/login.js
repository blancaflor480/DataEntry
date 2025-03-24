import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import logo from "../style/image/originallogo.png";
import "../style/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");  // Clear previous errors

    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check the user's role in Firestore
      const userDocRef = doc(db, "admin", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role;
        
        // Only allow Super Admin and Admin to access the dashboard
        if (userRole === "Super Admin" || userRole === "Admin") {
          console.log("Login successful! Role:", userRole);
          localStorage.setItem('token', user.uid);
          //console.log("Token saved:", localStorage.getItem('token'));;
          navigate("/dashboard");
        } else {
          // If user role is not Super Admin or Admin
          await auth.signOut(); // Sign them out
          setError("You don't have permission to access the dashboard.");
        }
      } else {
        // If user document doesn't exist in admin collection
        await auth.signOut(); // Sign them out
        setError("User account not found or insufficient permissions.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="login-box p-5 m-5 text-center">
        <div className="logo mb-4">
          <img src={logo} alt="Logo" width="100" height="100" />
          <p className="title mt-2">
            <span className="color-title">MATLEX</span> CORPORATION
          </p>
        </div>
        <h2 className="description mb-4">Log in securely to access the designated dashboard.</h2>
        {error && <div className="error-message p-2 mb-3">{error}</div>}
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group mb-3">
            <label htmlFor="email" className="form-label text-start d-block">Email:</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="password" className="form-label text-start d-block">Password:</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="forgotpassword-link mt-2 text-end">
              <Link to="/forgot">Forgot Password?</Link>
            </p>
          </div>
          <button type="submit" className="login-button w-100">Sign In</button>
        </form>
        <p className="signup-link mt-3">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
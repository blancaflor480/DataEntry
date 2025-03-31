import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import logo from "../style/image/originallogo.png";
import "../style/login.css";
import { FaSpinner } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getClientIP = async () => {
    try {
      // First try a direct IP detection service
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      if (!ipResponse.ok) throw new Error('Primary IP service failed');
      
      const ipData = await ipResponse.json();
      return ipData.ip;
    } catch (error) {
      console.warn("Primary IP detection failed, trying fallback...");
      try {
        // Fallback service
        const fallbackResponse = await fetch('https://ipapi.co/json/');
        if (!fallbackResponse.ok) throw new Error('Fallback IP service failed');
        
        const fallbackData = await fallbackResponse.json();
        return fallbackData.ip;
      } catch (fallbackError) {
        console.error("Could not fetch IP address:", fallbackError);
        return "unknown";
      }
    }
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const ipAddress = await getClientIP();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDocRef = doc(db, "admin", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role;
        const userStatus = userData.status || "Active";
        
        if (userStatus === "Disabled") {
          await auth.signOut();
          setError("Your account has been disabled. Please contact your administrator.");
          setLoading(false);
          return;
        }

        if (userStatus === "Pending") {
          await auth.signOut();
          setError("Your account is pending approval. Please wait for administrator confirmation.");
          setLoading(false);
          return;
        }

        const allowedRoles = ["Super Admin", "Admin", "Manager"];
        if (allowedRoles.includes(userRole)) {
          // Create the login entry with current client-side timestamp first
          const loginEntry = {
            timestamp: new Date().toISOString(), // Use client-side timestamp for array
            ipAddress: ipAddress, 
            deviceInfo: navigator.userAgent
        };

          // Update document with serverTimestamp for lastLogin and client timestamp for array
          await updateDoc(userDocRef, {
            lastLogin: serverTimestamp(), // Server timestamp for lastLogin
            lastLoginIp: ipAddress,
            loginHistory: [...(userData.loginHistory || []), loginEntry]
          });

          localStorage.setItem('token', user.uid);
          localStorage.setItem('userRole', userRole);
          
          const expirationTime = new Date().getTime() + 8 * 60 * 60 * 1000;
          localStorage.setItem('expirationTime', expirationTime.toString());
          
          navigate("/dashboard");
        } else {
          await auth.signOut();
          setError("You don't have permission to access the dashboard.");
        }
      } else {
        // Create new document with client-side timestamp for the first login entry
        await setDoc(doc(db, "admin", user.uid), {
          email: user.email,
          role: "User",
          status: "Active",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          lastLoginIp: ipAddress,
          loginHistory: [{
            timestamp: new Date().toISOString(), // Client-side timestamp
            ipAddress: ipAddress, 
            deviceInfo: navigator.userAgent
          }]
        });
        
        await auth.signOut();
        setError("User account not found. A new document was created, please contact administrator for access.");
      }
    } catch (err) {
      console.error("Login error:", err);
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many login attempts. Account temporarily locked. Try again later or reset your password.");
          break;
        case "auth/user-disabled":
          setError("Your account has been disabled. Please contact your administrator.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
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
              autoComplete="username"
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
              autoComplete="current-password"
              minLength="8"
            />
            <p className="forgotpassword-link mt-2 text-end">
              <Link to="/forgot">Forgot Password?</Link>
            </p>
          </div>
          <button 
            type="submit" 
            className="login-button w-100 d-flex justify-content-center align-items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner me-2" /> 
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        <p className="signup-link mt-3">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
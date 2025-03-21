import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase"; // Import Firestore
import { doc, setDoc } from "firebase/firestore"; // Firestore functions
import { Link } from "react-router-dom";
import logo from "../style/image/originallogo.png"; // Import the logo
import "../style/signup.css"; // Import the CSS file

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Reset error
    setError("");

    // Validate fields
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional user details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        middleName,
        lastName,
        email,
        createdAt: new Date().toISOString(), // Add a timestamp
      });

      alert("Sign up successful!");
      console.log("User created and data saved to Firestore:", user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="signup-box p-4 text-center">
        <div className="logo mb-4">
          <img src={logo} alt="Logo" width="100" height="100" />
          <p className="title mt-2">
            <span className="color-title">MATLEX</span> CORPORATION
          </p>
        </div>
        <h2 className="description mb-4">Create your account to get started.</h2>
        {error && <div className="error-message p-2 mb-3">{error}</div>}
        <form onSubmit={handleSignUp} className="signup-form">
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="firstName" className="form-label text-start d-block">First Name:</label>
              <input
                type="text"
                className={`form-control ${!firstName && error ? "is-invalid" : ""}`}
                id="firstName"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              {!firstName && error && <div className="invalid-feedback text-start">Please enter your first name.</div>}
            </div>
            <div className="col">
              <label htmlFor="middleName" className="form-label text-start d-block">Middle Name:</label>
              <input
                type="text"
                className="form-control"
                id="middleName"
                placeholder="Enter your middle name"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="lastName" className="form-label text-start d-block">Last Name:</label>
              <input
                type="text"
                className={`form-control ${!lastName && error ? "is-invalid" : ""}`}
                id="lastName"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              {!lastName && error && <div className="invalid-feedback text-start">Please enter your last name.</div>}
            </div>
          </div>
          <div className="form-group mb-3">
            <label htmlFor="email" className="form-label text-start d-block">Email:</label>
            <input
              type="email"
              className={`form-control ${!validateEmail(email) && error ? "is-invalid" : ""}`}
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {!validateEmail(email) && error && <div className="invalid-feedback text-start">Please enter a valid email.</div>}
          </div>
          <div className="form-group mb-3">
            <label htmlFor="password" className="form-label text-start d-block">Password:</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className={`form-control ${!validatePassword(password) && error ? "is-invalid" : ""}`}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {!validatePassword(password) && error && <div className="invalid-feedback text-start">Password must be at least 6 characters.</div>}
          </div>
          <div className="form-group mb-3">
            <label htmlFor="confirmPassword" className="form-label text-start d-block">Confirm Password:</label>
            <div className="input-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={`form-control ${password !== confirmPassword && error ? "is-invalid" : ""}`}
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {password !== confirmPassword && error && <div className="invalid-feedback text-start">Passwords do not match.</div>}
          </div>
          <button type="submit" className="signup-button w-100">Sign Up</button>
        </form>
        <p className="login-link mt-3">
          Already have an account? <Link to="/">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
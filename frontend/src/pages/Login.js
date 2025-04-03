import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function Login() {
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // Send login request to backend
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regNo, password }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Login Successful");
      navigate("/form");  // Redirect to form page after login
    } else {
      alert(data.error || "Login Failed");
    }
  };

  return (
    <div className="home-wrapper">
    <nav className="navbar">
        <div className="logo-space"><img src="/logo1.png" alt="Care Point Logo" className="logo" width={150} height={100}/></div>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/form">Student Form</a>
          <a href="/reports">Reports</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>
    <div className="Login">
      <h2 className="Login-Title">Login</h2>
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Reg No" value={regNo} onChange={(e) => setRegNo(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
      <p className="acc">Don't have an account? <a className="signup-link" href="Signup">Sign Up</a></p>
    </div>
    <footer className="footer"><p>
      &copy; 2025 Care Point™ | All Rights Reserved | Contact:{" "}
      <a href="mailto:support@carepoint.com" className="footer-link">support@carepoint.com</a>
      </p></footer>
    </div>
  );
}

export default Login;

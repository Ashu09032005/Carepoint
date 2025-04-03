import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

const Signup = () => {
    const [formData, setFormData] = useState({
        name: "",
        regNo: "",
        phone: "",
        email: "",
        password: "",
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                navigate("/login");
            } else {
                alert("Signup Failed");
            }
        } catch (error) {
            console.error("Error signing up:", error);
            alert("Error signing up");
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
        <div className="Signup">
            <h2 className="Signup-Heading">Signup</h2>
            <form onSubmit={handleSignup}>
                <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
                <input type="text" name="regNo" placeholder="Registration Number" onChange={handleChange} required />
                <input type="text" name="phone" placeholder="Phone Number" onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                <button type="submit">Sign Up</button>
            </form>
        </div>
        <footer className="footer">
        &copy; 2025 Care Point™ | All Rights Reserved | Contact: support@carepoint.com
      </footer>
        </div>
    );
};

export default Signup;
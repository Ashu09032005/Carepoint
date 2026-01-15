import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function Form() {
  const navigate = useNavigate();

  // 🔹 Get logged-in student from localStorage
  const student = JSON.parse(localStorage.getItem("student")); 
  console.log(student);
  // student = { regNo, name, token }

  const [formData, setFormData] = useState({
    workType: "Electrical", // default option
    description: "",
    proof: null,
  });

  // 🔹 Handle text input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Handle file uploads
  const handleFileChange = (e) => {
    setFormData({ ...formData, proof: e.target.files[0] });
  };

  // 🔹 Handle logout
  const handleLogout = () => {
    localStorage.removeItem("student");
    alert("You have been logged out successfully!");
    navigate("/login");
  };

  // 🔹 Submit form
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!student) {
      alert("Please login first!");
      navigate("/login");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("regNo", student.regNo);
    formDataToSend.append("name", student.name);
    formDataToSend.append("block", formData.block || "");
    formDataToSend.append("roomNo", formData.roomNo || "");
    formDataToSend.append("workType", formData.workType);
    formDataToSend.append("comments", formData.description);
    if (formData.proof) {
      formDataToSend.append("proof", formData.proof);
    }

    try {
      const response = await fetch("http://localhost:5000/submit-request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${student.token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Complaint submitted successfully!");
        setFormData({ workType: "Electrical", description: "", proof: null });
      } else {
        alert(`❌ Error: ${data.error || "Failed to submit"}`);
      }
    } catch (error) {
      console.error("❌ Failed to submit form:", error);
      alert("Server error. Try again later.");
    }
  };

  return (
    <div className="home-wrapper">
      {/* 🔹 Navbar */}
      <nav className="navbar">
        <div className="logo-space">
          <img src="/logo1.png" alt="Care Point Logo" className="logo" width={150} height={100} />
        </div>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/form">Submit Complaint</a>
          <a href="/student/reports">My Complaints</a>
          <a href="/mailto:support@carepoint.com">Contact</a>

          {/* ✅ Show logout only if student is logged in */}
          {student && (
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          )}
        </div>
      </nav>

      {/* 🔹 Form Section */}
      <div className="Form-div">
        <div className="form-title">Maintenance Complaint Form</div>

        {student ? (
          <form onSubmit={handleSubmit}>
            <div className="student-info">
              <p><strong>Reg No:</strong> {student.regNo}</p>
              <p><strong>Name:</strong> {student.name}</p>
            </div>

            <input
              type="text"
              name="block"
              value={formData.block || ""}
              placeholder="Enter Block"
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="roomNo"
              value={formData.roomNo || ""}
              placeholder="Enter Room No"
              onChange={handleChange}
              required
            />

            <select name="workType" value={formData.workType} onChange={handleChange} required>
              {["Electrical", "Plumbing", "Laundry", "Internet", "Other"].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <textarea
              name="description"
              value={formData.description}
              placeholder="Describe your issue"
              onChange={handleChange}
              required
            ></textarea>

            <input name="proof" type="file" accept="image/*" onChange={handleFileChange} />
            <button type="submit">Submit</button>
          </form>
        ) : (
          <p style={{ color: "red" }}>Please login first to submit a complaint.</p>
        )}
      </div>

      <div className="page-container">
  {/* your existing content */}

  <footer className="footer">
    <p>
      © 2025 Care Point™ | All Rights Reserved | Contact:{" "}
      <a href="mailto:support@carepoint.com" className="footer-link">
        support@carepoint.com
      </a>
    </p>
  </footer>
</div>
</div>
  );
}

export default Form;

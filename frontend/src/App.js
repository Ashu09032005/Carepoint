import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Reports from "./pages/AdminReports";
import Form from "./pages/Form";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import "./index.css";
function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="logo-space"><img src="/logo1.png" alt="Care Point Logo" className="logo" width={150} height={100} /></div>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/form">Student Form</a>
          <a href="/reports">Reports</a>
          <a href="mailto:support@carepoint.com">Contact</a>
        </div>
      </nav>
      <center><div className="home-container">
        <h1 className="home-title">Welcome to CarePoint</h1>
        <center><div className="button-group">
        <h2 className="home-description">
          Your one-stop platform for managing student reports efficiently.
        </h2>
        <div className="button-group"><button className="primary-btn" onClick={() => navigate("/Login")}>I'm a Student</button>
        <button className="secondary-btn" onClick={() => navigate("/Reports")}>Download Reports</button></div>
        </div></center>
      </div></center>
      <footer className="footer"><p>
      &copy; 2025 Care Point™ | All Rights Reserved | Contact:{" "}
      <a href="mailto:support@carepoint.com" className="footer-link">support@carepoint.com</a>
      </p></footer>
    </div>
  );
}
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Form" element={<Form />} />
        <Route path="/Reports" element={<Reports />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;

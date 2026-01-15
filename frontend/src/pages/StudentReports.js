import React, { useState, useEffect } from "react";
import "../index.css";

function StudentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const student = JSON.parse(localStorage.getItem("student")); // from login

  useEffect(() => {
    if (!student) {
      setMessage("Please log in to view your complaints.");
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/student/reports/${student.regNo}`,
          {
            headers: {
              Authorization: `Bearer ${student.token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          if (data.requests && data.requests.length > 0) {
            setReports(data.requests);
          } else {
            setMessage("You have not submitted any requests yet.");
          }
        } else {
          setMessage(data.error || "Failed to fetch complaints.");
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        setMessage("Server error. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [student]);

  return (
    <div className="page">
      <nav className="navbar">
        <div className="logo-space">
          <img src="/logo1.png" alt="logo" width={150} height={100} />
        </div>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/form">Submit Complaint</a>
          <a href="/student/reports">My Complaints</a>
          <a href="mailto:support@carepoint.com">Contact</a>
        </div>
      </nav>

      <main className="reports-container">
        <h2>My Complaints</h2>
        {loading ? (
          <p>Loading...</p>
        ) : message ? (
          <p>{message}</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Work Type</th>
                <th>Category</th>
                <th>Block</th>
                <th>Room No</th>
                <th>Comments</th>
                <th>Submitted On</th>
                <th>Proof</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.workType}</td>
                  <td>{r.category}</td>
                  <td>{r.block}</td>
                  <td>{r.roomNo}</td>
                  <td>{r.comments}</td>
                  <td>{new Date(r.submitted_at).toLocaleString()}</td>
                  <td>
                    {r.proof ? (
                      <a
                        href={`http://localhost:5000/${r.proof}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      "No Proof"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <footer className="footer">
        <p>
          © 2025 Care Point™ | All Rights Reserved | Contact:{" "}
          <a href="mailto:support@carepoint.com" className="footer-link">
            support@carepoint.com
          </a>
        </p>
      </footer>
    </div>
  );
}

export default StudentReports;

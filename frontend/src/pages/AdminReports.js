import React, { useState } from "react";

const AdminReports = () => {
    const [reportType, setReportType] = useState("student-wise");
    const [value, setValue] = useState("");
    const [reports, setReports] = useState([]);
    const [canDownload, setCanDownload] = useState(false); // ✅ Enable download only after fetching reports

    const fetchReports = async () => {
        try {
            const response = await fetch("http://localhost:5000/get-reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: reportType, value }),
            });

            const data = await response.json();
            setReports(data);
            setCanDownload(true); // ✅ Allow download only if reports are available
        } catch (error) {
            console.error("Error fetching reports:", error);
            setCanDownload(false);
        }
    };

    const downloadReport = async (format) => {
        const response = await fetch(`http://localhost:5000/download/${format}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reports }),  // Send only filtered data
        });
    
        if (!response.ok) {
            alert("Error downloading file");
            return;
        }
    
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `filtered_report.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };
    
    

    return (
        <div className="home-wrapper">
            <nav className="navbar">
                <div className="logo-space">
                    <img src="/logo1.png" alt="Care Point Logo" className="logo" width={150} height={100} />
                </div>
                <div className="nav-links">
                    <a href="/">Home</a>
                    <a href="/form">Student Form</a>
                    <a href="/reports">Reports</a>
                    <a href="/contact">Contact</a>
                </div>
            </nav>
            <div className="Report">
                <h2 className="Heading">Download Reports</h2>
                <select className="selection" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    <option value="student-wise">Student-wise</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="work-type">Type of Work</option>
                </select>
                <div className="val">
                {reportType === "student-wise" && (
                    <input type="text" placeholder="Enter Student Name" value={value} onChange={(e) => setValue(e.target.value)} />
                )}
                {reportType === "monthly" && (
                    <input type="number" placeholder="Enter Month (1-12)" value={value} onChange={(e) => setValue(e.target.value)} />
                )}
                {reportType === "weekly" && (
                    <input type="number" placeholder="Enter Week Number" value={value} onChange={(e) => setValue(e.target.value)} />
                )}
                {reportType === "work-type" && (
                    <input type="text" placeholder="Enter Work Type" value={value} onChange={(e) => setValue(e.target.value)} />
                )}
                </div>

                <button className="btn-fetch" onClick={fetchReports}>Fetch Reports</button>

                {canDownload && (
                    <div className="Download">
                        <h3 className="Download-Heading">Download as:</h3>
                        <button className="Pdf" onClick={() => downloadReport("pdf")}>PDF</button>
                        <button className="Excel" onClick={() => downloadReport("xlsx")}>Excel</button>
                        <button className="Docx" onClick={() => downloadReport("docx")}>Docx</button>
                    </div>
                )}

                <div className="Report-Data">
                    <h3 className="Report-Heading">Report Data:</h3>
                    <pre>{JSON.stringify(reports, null, 2)}</pre>
                </div>
            </div>
            <footer className="footer"><p>
      &copy; 2025 Care Point™ | All Rights Reserved | Contact:{" "}
      <a href="mailto:support@carepoint.com" className="footer-link">support@carepoint.com</a>
      </p></footer>
        </div>
    );
};

export default AdminReports;

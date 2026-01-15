// ===== Dependencies =====
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const nodemailer = require("nodemailer");

const JWT = "b72e0857b00ba31f7ed68be4e607f9f5e66844942db6a99e4444f2c53528b27d";
const app = express();
app.use(cors());
app.use(express.json());

// ===== Database Connection =====
const db = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "Ashu0903#",
    database: "maintenance_db",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("✅ Connected to MySQL database");
});
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "ashita9305@gmail.com", 
        pass: "uigb dzur kihb lbdy",
    },
});
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Auth Header:", authHeader);

  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT);
    console.log("Decoded token:", decoded);
    req.admin = decoded;
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(403).json({ error: "Invalid token" });
  }
};
const verifyStudentToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT);
    req.student = decoded; // include name and regNo in JWT payload
    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(403).json({ error: "Invalid token" });
  }
};




// ===== JWT Secret Key =====


// ===== Student Signup =====
app.post("/student/signup", async (req, res) => {
    const { name, regNo, phone, email, password } = req.body;
    if (!name || !regNo || !phone || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            "INSERT INTO Users (name, regNo, phone, email, password) VALUES (?, ?, ?, ?, ?)",
            [name, regNo, phone, email, hashedPassword],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Database error" });
                }
                res.status(201).json({ message: "Student registered successfully" });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// ===== Student Login =====
app.post("/student/login", (req, res) => {
  const { id: regNo, password } = req.body;
  if (!regNo || !password) return res.status(400).json({ error: "All fields are required" });

  db.query("SELECT * FROM Users WHERE regNo = ?", [regNo], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ regNo: user.regNo, name:user.name, role: "student" }, JWT, { expiresIn: "2h" });

    res.json({
      message: "Login successful",
      user: {
        regNo: user.regNo,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token
    });
  });
});


// ===== Admin Signup =====
// Admin Signup
app.post("/admin/signup", async (req, res) => {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Name, email, password and role are required" });
    }

    // Validate role
    const validRoles = ["SuperAdmin", "MaintenanceStaff"];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }

    // Validate department
    const validDepartments = ["Electrical", "Plumbing", "Laundry", "Internet", "Other", "General"];
    const dept = department && validDepartments.includes(department) ? department : "General";

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO admin (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)",
            [name, email, hashedPassword, role, dept],
            (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(400).json({ error: "Email already registered" });
                    }
                    console.error(err);
                    return res.status(500).json({ error: "Database error" });
                }
                res.status(201).json({ message: "Admin registered successfully" });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// ===== Admin Login =====
app.post("/admin/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    db.query("SELECT * FROM admin WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const admin = results[0];
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        // Generate JWT token
        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role, department: admin.department },
            JWT,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Admin login successful",
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                department: admin.department,
            },
            token,
        });
    });
});




// ===== File Upload (Proof) =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    },
});
const upload = multer({ storage });

// ===== Submit Maintenance Request =====
// Middleware to verify student JWT

// Submit maintenance request
app.post("/submit-request", verifyStudentToken, upload.single("proof"), (req, res) => {
    const { block, roomNo, workType, category, comments } = req.body;
    const regNo = req.student.regNo; // From token
    const name = req.student.name; // From token
    const proof = req.file ? req.file.path : null;

    const sql =
        "INSERT INTO maintenance_requests (regNo, name, block, roomNo, workType, category, comments, proof, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";

    const values = [regNo, name, block, roomNo, workType, category, comments, proof];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        // Find admin for this workType
        db.query(
            "SELECT email FROM admin WHERE department = ? AND is_active = TRUE LIMIT 1",
            [workType],
            (err, adminResult) => {
                if (err || adminResult.length === 0) {
                    console.error("Admin not found for work type:", workType);
                    return res.json({ message: "Request submitted successfully, but no admin email found." });
                }

                const adminEmail = adminResult[0].email;

                const mailOptions = {
                    from: "youradminemail@gmail.com",
                    to: adminEmail,
                    subject: `New ${workType} Request from ${name}`,
                    html: `
                        <h3>New Maintenance Request Submitted</h3>
                        <p><strong>Student Name:</strong> ${name}</p>
                        <p><strong>Reg No:</strong> ${regNo}</p>
                        <p><strong>Block:</strong> ${block}</p>
                        <p><strong>Room No:</strong> ${roomNo}</p>
                        <p><strong>Work Type:</strong> ${workType}</p>
                        <p><strong>Category:</strong> ${category}</p>
                        <p><strong>Comments:</strong> ${comments}</p>
                        <p><strong>Proof File:</strong> ${req.file ? req.file.filename : "None"}</p>
                        <hr>
                        <p>Check the CarePoint dashboard for details.</p>
                    `,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email Error:", error);
                        return res.status(500).json({ message: "Request saved, but email failed to send." });
                    } else {
                        console.log("Email sent to:", adminEmail);
                        res.json({ message: `Request submitted successfully, email sent to ${adminEmail}` });
                    }
                });
            }
        );
    });
});



// ===== Fetch Student Requests =====
app.get("/student/reports/:regNo", verifyStudentToken, (req, res) => {
  const { regNo } = req.params;

  db.query("SELECT * FROM maintenance_requests WHERE regNo = ?", [regNo], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) {
      return res.json({ message: "You have not submitted any requests yet.", requests: [] });
    }
    res.json({ requests: results });
  });
});

// Get reports for admin department
app.get("/admin/reports/:department", (req, res) => {
    const { department } = req.params;

    if (!department) {
        return res.status(400).json({ error: "Department is required" });
    }

    const sql = "SELECT * FROM maintenance_requests WHERE workType = ?";
    db.query(sql, [department], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            return res.json({ message: "No reports found for your department", reports: [] });
        }

        res.json({ reports: results });
    });
});
app.get("/admin/reports", verifyAdminToken, (req, res) => {
    const department = req.admin.department; // department from JWT

    const sql = "SELECT * FROM maintenance_requests WHERE workType = ?";
    db.query(sql, [department], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ reports: results });
    });
});
app.post("/admin/download/pdf", verifyAdminToken, async (req, res) => {
  try {
    const { reports } = req.body;
    if (!reports || reports.length === 0) {
      return res.status(400).json({ error: "No data" });
    }

    const doc = new PDFDocument({ margin: 30 });
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=reports.pdf");
      res.send(pdfBuffer);
    });

    doc.fontSize(18).text("Department Reports", { align: "center" });
    doc.moveDown();

    reports.forEach((r, i) => {
      doc.fontSize(12).text(`${i + 1}. ${r.name} | ${r.workType} | ${r.block}-${r.roomNo}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});
app.post("/admin/download/xlsx", verifyAdminToken, async (req, res) => {
  try {
    const { reports } = req.body;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reports");

    sheet.columns = [
      { header: "Reg No", key: "regNo" },
      { header: "Name", key: "name" },
      { header: "Block", key: "block" },
      { header: "Room", key: "roomNo" },
      { header: "Work Type", key: "workType" },
      { header: "Comments", key: "comments" },
    ];

    reports.forEach(r => sheet.addRow(r));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=reports.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Excel generation failed" });
  }
});
app.post("/admin/download/docx", verifyAdminToken, async (req, res) => {
  try {
    const { reports } = req.body;

    const doc = new Document({
      sections: [{
        children: reports.map(r =>
          new Paragraph({
            children: [
              new TextRun(`${r.name} | ${r.workType} | ${r.block}-${r.roomNo}`)
            ]
          })
        )
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=reports.docx"
    );

    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Docx generation failed" });
  }
});




// ===== Report APIs (existing ones stay same) =====
// ... (keep your /get-reports, /download/pdf, /download/xlsx, /download/docx routes unchanged)


// ===== Start Server =====
app.listen(5000, () => console.log("🚀 Server running on port 5000"))

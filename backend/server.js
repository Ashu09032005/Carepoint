const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const PDFDocument = require("pdfkit");
const ExcelJS=require("exceljs");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const { resolveObjectURL } = require("buffer");
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    port: 3307,
    user: "Raunak",
    password: "Raunak@0110",
    database: "maintenance_db",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("Connected to MySQL database");
});


app.post("/signup", async (req, res) => {
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
                if (err) return res.status(500).json({ error: err });
                res.status(201).json({ message: "User registered successfully" });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only .jpeg, .png, and .pdf files are allowed!"), false);
    }
};
const upload=multer({
    storage : storage,
    fileFilter : fileFilter,
});


app.post("/login", (req, res) => {
    const { regNo, password } = req.body;
    if (!regNo || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    db.query("SELECT * FROM Users WHERE regNo = ?", [regNo], async (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        res.json({ message: "Login successful", user });
    });
});


app.get("/user-requests/:regNo",(req, res) => {
    const { regNo } = req.params;
    db.query("SELECT * FROM maintenance_requests WHERE regNo = ?", [regNo], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) {
            return res.json({ message: "You have not submitted any requests yet.", requests: [] });
        }
        res.json({ requests: results });
    });
});
app.post("/submit-request", upload.single("proof"),(req, res) => {
    console.log("File received:", req.file); 
    console.log("Form Data received:", req.body);

    if (!req.file) {
        return res.status(400).json({ message: "File upload failed!" });
    }
    const { regNo, name, block, roomNo, workType, category, comments } = req.body;
    const proof = req.file ? req.file.path:null;

    const sql = "INSERT INTO maintenance_requests (regNo, name, block, roomNo, workType, category, comments, proof, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    const values= [regNo, name, block, roomNo, workType, category, comments, proof];
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Database Error" });
        }
        res.json({ message: "Request submitted successfully" });
    });
});
app.post("/get-reports", (req, res) => {
    const { type, value } = req.body;
    let query = "SELECT * FROM maintenance_requests";
    let params = [];

    if (type === "student-wise") {
        query += " WHERE name = ?";
        params.push(value);
    } else if (type === "monthly") {
        query += " WHERE MONTH(submitted_at) = ?";
        params.push(value);
    } else if (type === "weekly") {
        query += " WHERE WEEK(submitted_at) = ?";
        params.push(value);
    } else if (type === "work-type") {
        query += " WHERE workType = ?";
        params.push(value);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});


app.post("/download/pdf", (req, res) => {
    const { reports } = req.body;

    if (!reports || reports.length === 0) {
        return res.status(400).json({ error: "No data provided" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Disposition", 'attachment; filename="report.pdf"');
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);
    doc.fontSize(16).text("Maintenance Report", { align: "center" });
    doc.moveDown();

    reports.forEach((row, index) => {
        doc.fontSize(12).text(
            `${index + 1}. Reg No: ${row.regNo} | Name: ${row.name} | Work Type: ${row.workType} | Category: ${row.category} | Comments: ${row.comments} | UploadedProof: ${row.proof}`
        );
        doc.moveDown();
    });

    doc.end();
});





app.post("/download/xlsx", async (req, res) => {
    const { reports } = req.body;

    if (!reports || reports.length === 0) {
        return res.status(400).json({ error: "No data provided" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Filtered Reports");

    worksheet.columns = [
        { header: "Reg No", key: "regNo", width: 15 },
        { header: "Name", key: "name", width: 20 },
        { header: "Block", key: "block", width: 10 },
        { header: "Room No", key: "roomNo", width: 10 },
        { header: "Work Type", key: "workType", width: 15 },
        { header: "Category", key: "category", width: 15 },
        { header: "Comments", key: "comments", width: 30 },
        { header: "UploadedFile", key: "proof", width: 15 },
        { header: "Date", key: "submitted_at", width: 15 },
    ];

    reports.forEach((row) => {
        worksheet.addRow(row);
    });

    res.setHeader("Content-Disposition", 'attachment; filename="filtered_report.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    await workbook.xlsx.write(res);
    res.end();
});






app.post("/download/docx", async (req, res) => {
    const { reports } = req.body;

    if (!reports || reports.length === 0) {
        return res.status(400).json({ error: "No data provided" });
    }

    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        text: "Maintenance Report",
                        heading: "Title",
                        spacing: { after: 300 },
                    }),
                    ...reports.map(
                        (row) =>
                            new Paragraph({
                                children: [
                                    new TextRun(`Reg No: ${row.regNo}, Name: ${row.name}, Block: ${row.block}, Room No: ${row.roomNo}, Work Type: ${row.workType}, Category: ${row.category}, Comments: ${row.comments}, Proof: ${row.proof},Date: ${row.submitted_at}`),
                                ],
                                spacing: { after: 200 },
                            })
                    ),
                ],
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader("Content-Disposition", 'attachment; filename="filtered_report.docx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(Buffer.from(buffer));
});






app.listen(5000, () => {
    console.log("Server running on port 5000");
});
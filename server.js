const express = require("express");
const app = express();
const mysql = require("mysql2");

const bcrypt = require("bcrypt");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const net = require("net");


// ================================
// MIDDLEWARE
// ================================

app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.urlencoded({ extended: true }));


// ================================
// MYSQL DATABASE
// ================================

const db = mysql.createPool({
  host: "srv843.hstgr.io",
  user: "u987008906_abinithi",
  password: "Abilogin@21",
  database: "u987008906_tuition_db",
  port: 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 10000
});


// ================================
// DATABASE CONNECTION TEST
// ================================

db.getConnection((err, connection) => {

  if (err) {

    console.log("❌ DB CONNECTION FAILED:");
    console.log(err);

  } else {

    console.log("✅ DB CONNECTED SUCCESS");

    connection.release();
  }

});


// ================================
// RENDER → MYSQL PORT TEST
// ================================

app.get("/db-test", (req, res) => {

  const socket = new net.Socket();

  socket.setTimeout(10000);

  socket.on("connect", () => {

    socket.destroy();

    console.log("✅ Render can reach MySQL port 3306");

    res.json({
      success: true,
      message: "MySQL port 3306 is reachable from Render"
    });

  });


  socket.on("timeout", () => {

    socket.destroy();

    console.log("❌ MySQL port 3306 connection timed out");

    res.status(500).json({
      success: false,
      message: "MySQL port 3306 connection timed out"
    });

  });


  socket.on("error", (err) => {

    socket.destroy();

    console.log("❌ MySQL PORT TEST FAILED:");
    console.log(err);

    res.status(500).json({
      success: false,
      error: err.code,
      message: err.message
    });

  });


  socket.connect(3306, "82.25.121.156");

});


// ================================
// HOME ROUTE
// ================================

app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});


// ================================
// START SERVER
// ================================

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {

  console.log(`Server running on port ${PORT}`);

});

// ================= LOGIN (FIXED & CLEAN) =================
app.post("/login", (req, res) => {

  const { admission_number, password } = req.body;

  const checkPassword = async (input, dbPassword) => {
    try {
      if (dbPassword && dbPassword.startsWith("$2")) {
        return await bcrypt.compare(input, dbPassword);
      }
      return input === dbPassword;
    } catch {
      return false;
    }
  };

  const handleUser = async (user, type) => {

    const match = await checkPassword(password, user.password);

    if (!match) return res.status(401).send("Invalid user");

    if ((user.status || "").toLowerCase() !== "active") {
      return res.status(401).send("Inactive user");
    }

    return res.json({
      message: "Login successful",
      type: type
    });
  };

  // TUITION
db.query(
  "SELECT * FROM students WHERE admission_number=?",
  [admission_number],
  async (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).send("Server error");
    }

    if (result.length > 0) {
      return handleUser(result[0], "tuition");
    }


      // COMPUTER
      db.query(
        "SELECT * FROM computer_students WHERE admission_number=?",
        [admission_number],
        async (err2, result2) => {

          if (err2) return res.status(500).send("Server error");

          if (result2.length > 0) {
            return handleUser(result2[0], "computer");
          }

          // TUTORIAL
          db.query(
            "SELECT * FROM tutorial_registration WHERE admission_number=?",
            [admission_number],
            async (err3, result3) => {

              if (err3) return res.status(500).send("Server error");

              if (result3.length > 0) {
                return handleUser(result3[0], "tutorial");
              }

              return res.status(401).send("Invalid user");
            }
          );
        }
      );
    }
  );
}); // 🔥 THIS IS THE MISSING CLOSING BRACE



// ================= ADD STUDENT =================
app.post("/add-student", async (req, res) => {

  try {

    const {
      admission_number,
      name,
      password,
      batch,
      class_group,
      medium,
      board,
      father_name,
      father_occupation,
      mother_name,
      mother_occupation,
      contact_details,
      transport,
      school_details,
      address,
      status,
      type
    } = req.body;

    // ================= VALIDATION =================
    if (!admission_number || !name) {
      return res.status(400).json({
        success: false,
        message: "Admission number & name required"
      });
    }

    // ================= CHECK DUPLICATE =================
    db.query(
      "SELECT * FROM students WHERE admission_number=?",
      [admission_number],
      async (checkErr, checkResult) => {

        if (checkErr) {
          console.log("CHECK ERROR:", checkErr);

          return res.status(500).json({
            success: false,
            message: "Database check failed"
          });
        }

        // 🔥 already exists
        if (checkResult.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Admission number already exists"
          });
        }

        // ================= PASSWORD HASH =================
        let hashedPassword = null;

        if (password && password.trim() !== "") {
          hashedPassword = await bcrypt.hash(password, 10);
        }

        // ================= INSERT =================
        const sql = `
          INSERT INTO students
          (
            admission_number,
            name,
            password,
            batch,
            class_group,
            medium,
            board,
            father_name,
            father_occupation,
            mother_name,
            mother_occupation,
            contact_details,
            transport,
            school_details,
            address,
            status,
            type
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
          sql,
          [
            admission_number,
            name,
            hashedPassword,
            batch || null,
            class_group || null,
            medium || null,
            board || null,
            father_name || null,
            father_occupation || null,
            mother_name || null,
            mother_occupation || null,
            contact_details || null,
            transport || null,
            school_details || null,
            address || null,
            status || "active",
            type || "student"
          ],
          (err, result) => {

            if (err) {

              console.log("INSERT ERROR:", err);

              return res.status(500).json({
                success: false,
                message: err.sqlMessage || "Add failed"
              });
            }

            res.json({
              success: true,
              message: "Student added successfully",
              id: result.insertId
            });
          }
        );

      }
    );

  } catch (e) {

    console.log("SERVER ERROR:", e);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// ================= VIEW SINGLE STUDENT =================
app.get("/student/:adm", (req, res) => {

  db.query(
    "SELECT * FROM students WHERE admission_number=?",
    [req.params.adm],
    (err, result) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: "Fetch failed"
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Not found"
        });
      }

      res.json(result[0]);
    }
  );
});



// ================= UPDATE STUDENT =================
app.put("/student/update/:adm", (req, res) => {

  const adm = req.params.adm;

  const {
    name,
    batch,
    class_group,
    medium,
    board,
    father_name,
    father_occupation,
    mother_name,
    mother_occupation,
    contact_details,
    transport,
    school_details,
    address,
    password
  } = req.body;

  let sql;
  let values;

  if (password && password.trim() !== "") {

    sql = `
      UPDATE students SET
      name=?,
      batch=?,
      class_group=?,
      medium=?,
      board=?,
      father_name=?,
      father_occupation=?,
      mother_name=?,
      mother_occupation=?,
      contact_details=?,
      transport=?,
      school_details=?,
      address=?,
      password=?
      WHERE admission_number=?
    `;

    values = [
      name,
      batch,
      class_group,
      medium,
      board,
      father_name,
      father_occupation,
      mother_name,
      mother_occupation,
      contact_details,
      transport,
      school_details,
      address,
      password,
      adm
    ];

  } else {

    sql = `
      UPDATE students SET
      name=?,
      batch=?,
      class_group=?,
      medium=?,
      board=?,
      father_name=?,
      father_occupation=?,
      mother_name=?,
      mother_occupation=?,
      contact_details=?,
      transport=?,
      school_details=?,
      address=?
      WHERE admission_number=?
    `;

    values = [
      name,
      batch,
      class_group,
      medium,
      board,
      father_name,
      father_occupation,
      mother_name,
      mother_occupation,
      contact_details,
      transport,
      school_details,
      address,
      adm
    ];
  }

  db.query(sql, values, (err) => {

    if (err) {
      console.log(err);

      return res.status(500).json({
        success: false,
        message: "Update failed"
      });
    }

    res.json({
      success: true,
      message: "Updated successfully"
    });
  });
});


// ================= STATUS TOGGLE =================
app.put("/student/status/:adm", (req, res) => {

  const { status } = req.body;

  db.query(
    "UPDATE students SET status=? WHERE admission_number=?",
    [status, req.params.adm],
    (err) => {

      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Status update failed"
        });
      }

      res.json({
        success: true,
        message: "Status updated"
      });
    }
  );
});


// ================= DELETE STUDENT =================
app.delete("/student/delete/:adm", (req, res) => {

  db.query(
    "DELETE FROM students WHERE admission_number=?",
    [req.params.adm],
    (err) => {

      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Delete failed"
        });
      }

      res.json({
        success: true,
        message: "Deleted successfully"
      });
    }
  );
});


// ================= TUITION PDF =================
app.get("/pdf/:adm", (req, res) => {

  db.query(
    "SELECT * FROM students WHERE admission_number=?",
    [req.params.adm],
    (err, r) => {

      if (err || r.length === 0)
        return res.status(404).send("Not found");

      const u = r[0];

      const PDFDocument = require("pdfkit");
      const fs = require("fs");
      const path = require("path");

      const doc = new PDFDocument({ size: "A4", margin: 0 });

      // ✅ TAMIL FONT REGISTER
      doc.registerFont("Tamil", "./fonts/Tamil.ttf");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${u.admission_number}.pdf`
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      const createdAt = u.created_at
        ? new Date(u.created_at)
        : new Date();

      // force India timezone format
      const joinDate = createdAt.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata"
      });

      const joinTime = createdAt.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });

      // ================= LOGOS =================
      const tuitionLogo = path.join(__dirname, "assets", "tuition logo.png");
      const associationLogo = path.join(__dirname, "assets", "assos logo.png");

      // ================= WATERMARK =================
      const watermark = path.join(__dirname, "assets", "education logo.png");

      // ================= BACKGROUND =================
      doc.rect(0, 0, pageWidth, pageHeight).fill("#eef3ff");

      // ================= WATERMARK =================
      if (fs.existsSync(watermark)) {

        const wmSize = 300;

        doc.save();
        doc.opacity(0.05);

        doc.image(
          watermark,
          (pageWidth - wmSize) / 2,
          (pageHeight - wmSize) / 2,
          { width: wmSize }
        );

        doc.restore();
      }

      // ================= HEADER =================
      doc.rect(0, 0, pageWidth, 150).fill("#fff");

      // ================= HEADER BOX =================
      doc.roundedRect(15, 8, pageWidth - 30, 145, 12)
        .lineWidth(3)
        .strokeColor("#0b3d91")
        .stroke();

      // ================= LEFT LOGO =================
      if (fs.existsSync(tuitionLogo)) {
        doc.image(tuitionLogo, 25, 30, { width: 80 });
      }

      // ================= RIGHT LOGO =================
      if (fs.existsSync(associationLogo)) {
        doc.image(associationLogo, pageWidth - 105, 30, { width: 80 });
      }

      // ================= HEADER TEXT =================

      // ✅ Tamil Quote
      doc.fillColor("#b8860b")
        .font("Tamil")
        .fontSize(16)
        .text("கல்வியே துணை", 0, 15, {
          align: "center"
        });

      // Main Title
      doc.fillColor("#0b3d91");

      doc.font("Helvetica-Bold")
        .fontSize(28)
        .text("SUCCESS TUITION CENTRE", 0, 38, {
          align: "center"
        });

      // Association
      doc.font("Helvetica")
        .fontSize(11)
        .text(
          "Affiliated with Tamilnadu Tuition Centre Association-24250341",
          0,
          70,
          {
            align: "center"
          }
        );

      // Address
      doc.text(
        "R.Pattanam (P.O), Rasipuram (TK), Namakkal (Dt) - 637408",
        0,
        90,
        {
          align: "center"
        }
      );

      // Contact
      doc.text(
        "Cell : 9842927992, 8525927992",
        0,
        110,
        {
          align: "center"
        }
      );

      // Gmail
      doc.text(
        "gmail : stcrpattanam@gmail.com",
        0,
        130,
        {
          align: "center"
        }
      );

      // ================= TITLE =================
      doc.fillColor("#0b3d91")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("STUDENT'S INFORMATION", 0, 160, {
          align: "center"
        });

      // ================= DATA =================
      doc.fillColor("#000");

      let y = 200;
      const xLeft = 80;
      const gap = 26;

      const add = (label, value) => {

        doc.fontSize(11)
          .font("Helvetica")
          .text(label, xLeft, y);

        doc.font("Helvetica-Bold");

        doc.text(value || "-", xLeft + 170, y, {
          width: 260
        });

        const textHeight = doc.heightOfString(value || "-", {
          width: 260
        });

        y += Math.max(gap, textHeight + 10);
      };

      add("Name", u.name);
      add("Admission No", u.admission_number);
      add("Class and Group", u.class_group);
      add("Academic Year", u.batch);
      add("Medium", u.medium);
      add("Board", u.board);
      add("Father Name", u.father_name);
      add("Father Occupation", u.father_occupation);
      add("Mother Name", u.mother_name);
      add("Mother Occupation", u.mother_occupation);

      add(
        "Contact",
        u.contact_details
          ? u.contact_details.split(",").join(" | ")
          : "-"
      );

      add("Transport", u.transport);
      add("School", u.school_details);
      add("Address", u.address);
      add("Status", u.status);
      add("Joining Date", joinDate);
      add("Joining Time", joinTime);

      // ================= SIGNATURE =================
     const sigY = 740;

      doc.strokeColor("#000");

      doc.moveTo(80, sigY).lineTo(240, sigY).stroke();
      doc.fontSize(10).font("Helvetica")
        .text("Chairman's Signature", 85, sigY + 5);

      doc.moveTo(360, sigY).lineTo(520, sigY).stroke();
      doc.text("Parent's Signature", 370, sigY + 5);



// ================= PAGE 2 =================
doc.addPage();

doc.rect(0, 0, pageWidth, pageHeight).fill("#ffffff");

// Title
doc.fillColor("#000")
   .font("Tamil")
   .fontSize(18)
   .text("விதிமுறைகள்", 0, 40, {
      align: "center"
   });

// Rules
doc.fontSize(11);

doc.text(`
1. மாணவர்களுக்கு ஒழுக்கம் தான் முதல் பின்பு தான் படிப்பு என்பதை புரிந்து நடந்து கொள்ள வேண்டும்.

2. மாணவர்கள் சரியான நேரத்தில் வகுப்பிற்கு வர வேண்டும்.

3. மாணவர்களுக்கு சற்று கண்டிப்புடன் பாடங்கள் கற்று கொடுக்கப்படும்.

4. மாணவர்கள் டியூஷனில் ஆங்கிலத்தில் மட்டும் தான் பேச வேண்டும்.

5. மாதந்தோறும் பயிற்சி கட்டணத்தை 01 முதல் 10 ஆம் தேதிக்குள் கொடுக்க வேண்டும்.

6. திங்கட்கிழமை முதல் சனிக்கிழமை வரை டியூஷன் வகுப்பு மாலை 5:30 மணி முதல் 8:00 மணி வரை நடைபெறும். ஞாயிற்றுக்கிழமை மட்டும் வகுப்பிற்கு விடுமுறை.

7. எனவே மாணவர்கள் வகுப்பிற்கு விடுப்பு எடுக்காமல் வர வேண்டும். விடுப்பு எடுக்கும் பட்சத்தில் காரணத்தை முன்கூட்டியே தெரிவிக்க வேண்டும். தவிர்க்க முடியாத சமயங்களில் தொலைபேசி மூலமாகவும் தெரிவிக்க வேண்டும்.

8. மாணவர்கள் பள்ளியில் கொடுக்கும் வீட்டுப்பாடங்களை முடித்த பின்பு தான் வீட்டிற்கு அனுப்பப்படுவார்கள். முடிக்காத மாணவர்களின் விவரம் அவரவர் பெற்றோருக்கு தெரிவிக்கப்படும்.

9. மாணவர்கள் மற்ற மாணவர்களிடம் மரியாதை உணர்வுடன் நடந்து கொள்ள வேண்டும்.

10. பொதுத்தேர்வு எழுதும் 9, 10, 11 & 12 ஆம் வகுப்பு மாணவர்களுக்கு தேர்வு நாட்களில் காலை வகுப்பும், ஞாயிற்றுக்கிழமை சிறப்பு வகுப்புகளும் நடைபெறும். அதற்கென தனி கட்டணம் கிடையாது. அந்த சமயங்களில் மாணவர்களை கட்டாயம் வகுப்பிற்கு அனுப்ப வேண்டும்.

11. மாணவர்களின் பெற்றோர் மாதம் ஒரு முறையாவது நேரில் வந்து தங்கள் குழந்தை பற்றி அறிந்து கொள்ள வேண்டும்.

12. டியூஷன் தகவல்கள் Whatsapp இல் தெரிவிக்கப்படும், அதை மாணவர்களிடம் தெரிவிக்கவும்.

13. பள்ளியில் தங்கள் மகன் / மகள் பற்றிய கல்வி சார்ந்த முன்னேற்ற தகவல்களை உடனடியாக எங்களுக்கு தெரிவித்தால், அதை கொண்டு மேலும் சிறப்பாக கற்பிக்க முடியும்.

14. மேலே குறிப்பிடப்பட்டுள்ள விதிமுறைகளை தங்கள் மகன் / மகள் மீறும் பட்சத்தில், முதலில் அறிவுரை வழங்கப்பட்டு அதை பெற்றோருக்கு தகவல் தெரிவிக்கப்படும். அது தொடரும் பட்சத்தில் மாணவர் வகுப்பிலிருந்து நீக்கப்படுவார்.
`, 40, 70, {

   width: pageWidth - 80,
   align: "left"
});

// உறுதிமொழி Heading
doc.moveDown(1);

doc.font("Tamil")
   .fontSize(15)
   .text("உறுதிமொழி", {
      align: "center"
   });

// உறுதிமொழி Text
doc.moveDown(0.5);

doc.fontSize(11)
   .text(
      "மேலே குறிப்பிடப்பட்ட அனைத்து விதிமுறைகளையும் படித்து புரிந்து கொண்டேன். என் மகன் / மகள் அனைத்து விதிமுறைகளையும் பின்பற்றுவார் என உறுதி அளிக்கிறேன்.",
      {
         align: "justify"
      }
   );

// Date & Signature
doc.moveDown(2);

const signY = doc.y;

doc.text("நாள் :", 40, signY);

doc.text(
   "இடம் : இரா.பட்டணம்",
   40,
   signY + 30
);

doc.text(
   "பெற்றோர் கையொப்பம்",
   pageWidth - 180,
   signY + 30
);




      doc.end();
    }
  );
});



// ================= DOWNLOAD EXCEL =================
app.get("/students/excel", (req, res) => {

  db.query("SELECT * FROM students ORDER BY id ASC", async (err, rows) => {

    if (err) {
      console.log(err);
      return res.status(500).send("Database Error");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students");

    worksheet.columns = [
      { header: "Admission No", key: "admission_number", width: 20 },
      { header: "Name", key: "name", width: 25 },
      { header: "Class", key: "class_group", width: 20 },
      { header: "Batch", key: "batch", width: 20 },
      { header: "Medium", key: "medium", width: 20 },
      { header: "Board", key: "board", width: 20 },
      { header: "Father Name", key: "father_name", width: 25 },
      { header: "Mother Name", key: "mother_name", width: 25 },
      { header: "Contact", key: "contact_details", width: 25 },
      { header: "School", key: "school_details", width: 30 },
      { header: "Address", key: "address", width: 40 },
      { header: "Status", key: "status", width: 15 }
    ];

    rows.forEach(row => {
      worksheet.addRow({
        admission_number: row.admission_number,
        name: row.name,
        class_group: row.class_group,
        batch: row.batch,
        medium: row.medium,
        board: row.board,
        father_name: row.father_name,
        mother_name: row.mother_name,
        contact_details: row.contact_details,
        school_details: row.school_details,
        address: row.address,
        status: row.status
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=students.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();
  });

});


// ================= 🔥 ADD COMPUTER (FIXED VERSION) =================
app.post("/add-computer", async (req, res) => {

  try {
    const {
      admission_number,
      name,
      password,
      batch,
      class_group,
      medium,
      board,
      father_name,
      father_occupation,
      contact_details,
      transport,
      school_details,
      duration,
      exam_date,
      valid_upto,
      address,
      status
    } = req.body;

    // 🔴 validation
    if (!admission_number || !password) {
      return res.status(400).send("Admission number & password required");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO computer_students
      (admission_number,
      name,
      password,
      batch,
      class_group,
      medium,
      board,
       father_name,
       father_occupation,
       contact_details,
       transport,
       school_details,
       duration,
       exam_date,
       valid_upto,
       address,
       status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,

      [
        admission_number,
        name || "",
        hashedPassword,
        batch || "",
        class_group || "",
        medium || "",
        board || "",
        father_name || "",
        father_occupation || "",
        contact_details || "",
        transport || "",
        school_details || "",
        duration || "",
        exam_date || null,
        valid_upto || null,
        address || "",
        status || "active"
      ],

      (err) => {
        if (err) {
          console.log("DB ERROR:", err.sqlMessage || err);
          return res.status(500).send(err.sqlMessage);
        }
        res.send("Computer Added");
      }
    );

  } catch (e) {
    console.log("SERVER ERROR:", e);
    res.status(500).send("Server error");
  }
});


// ================= 🔥 GET TUITION =================
app.get("/students", (req, res) => {
  db.query("SELECT * FROM students ORDER BY id ASC", (err, r) => {
    if (err) return res.status(500).send("Error");

    const data = r.map(s => {
      const d = new Date(s.created_at);

      return {
        ...s,
        joining_date: d.toLocaleDateString(),
        joining_time: d.toLocaleTimeString()
      };
    });

    res.json(data);
  });
});





// ================= GET ALL COMPUTER =================
app.get("/computer-students", (req, res) => {

  db.query(
    "SELECT * FROM computer_students ORDER BY id ASC",
    (err, r) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Fetch failed"
        });
      }

      const data = r.map(s => {

        const d = new Date(s.created_at);

        return {
          ...s,
          joining_date: d.toLocaleDateString(),
          joining_time: d.toLocaleTimeString()
        };
      });

      res.json(data);
    }
  );
});


// ================= GET SINGLE COMPUTER =================
app.get("/computer/:adm", (req, res) => {

  db.query(
    "SELECT * FROM computer_students WHERE admission_number=?",
    [req.params.adm],
    (err, r) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Fetch failed"
        });
      }

      if (r.length === 0) {

        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      res.json(r[0]);
    }
  );
});


// ================= UPDATE COMPUTER =================
app.put("/computer/update/:adm", (req, res) => {

  const adm = req.params.adm;

  db.query(
    "SELECT * FROM computer_students WHERE admission_number=?",
    [adm],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Fetch failed"
        });
      }

      if (result.length === 0) {

        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      const old = result[0];
      const d = req.body;

      const updated = {
        admission_number: d.admission_number || old.admission_number,
        name: d.name || old.name,
        class_group: d.class_group || old.class_group,
        batch: d.batch || old.batch,
        medium: d.medium || old.medium,
        board: d.board || old.board,
        father_name: d.father_name || old.father_name,
        father_occupation: d.father_occupation || old.father_occupation,
        contact_details: d.contact_details || old.contact_details,
        transport: d.transport || old.transport,
        school_details: d.school_details || old.school_details,
        duration: d.duration || old.duration,
        valid_upto: d.valid_upto || old.valid_upto,
        exam_date: d.exam_date || old.exam_date,
        address: d.address || old.address
      };

      db.query(
        `UPDATE computer_students SET
          admission_number=?,
          name=?,
          class_group=?,
          batch=?,
          medium=?,
          board=?,
          father_name=?,
          father_occupation=?,
          contact_details=?,
          transport=?,
          school_details=?,
          duration=?,
          valid_upto=?,
          exam_date=?,
          address=?
         WHERE admission_number=?`,

        [
          updated.admission_number,
          updated.name,
          updated.class_group,
          updated.batch,
          updated.medium,
          updated.board,
          updated.father_name,
          updated.father_occupation,
          updated.contact_details,
          updated.transport,
          updated.school_details,
          updated.duration,
          updated.valid_upto,
          updated.exam_date,
          updated.address,
          adm
        ],

        (err2) => {

          if (err2) {
            console.log(err2);

            return res.status(500).json({
              success: false,
              message: "Update failed"
            });
          }

          res.json({
            success: true,
            message: "Updated successfully"
          });
        }
      );
    }
  );
});


// ================= STATUS UPDATE =================
app.put("/computer/status/:adm", (req, res) => {

  db.query(
    "UPDATE computer_students SET status=? WHERE admission_number=?",
    [req.body.status, req.params.adm],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Status update failed"
        });
      }

      res.json({
        success: true,
        message: "Status updated successfully"
      });
    }
  );
});


// ================= DELETE COMPUTER =================
app.delete("/computer/delete/:adm", (req, res) => {

  db.query(
    "DELETE FROM computer_students WHERE admission_number=?",
    [req.params.adm],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Delete failed"
        });
      }

      res.json({
        success: true,
        message: "Deleted successfully"
      });
    }
  );
});



// ================= 🔥 COMPUTER PDF (FINAL CLEAN + WATERMARK) =================
app.get("/computer/pdf/:adm", (req, res) => {

  db.query(
    "SELECT * FROM computer_students WHERE admission_number=?",
    [req.params.adm],
    (err, r) => {

      if (err || r.length === 0)
        return res.status(404).send("Not found");

      const u = r[0];

      const doc = new PDFDocument({ size: "A4", margin: 0 });

                // ✅ TAMIL FONT REGISTER
      doc.registerFont("Tamil", "./fonts/Tamil.ttf");


      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${u.admission_number}.pdf`
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // ================= DATE FORMAT =================
      const formatDate = (d) => {
        if (!d) return "-";

        const date = new Date(d);
        if (isNaN(date)) return "-";

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        const weekday = date.toLocaleDateString("en-US", { weekday: "long" });

        return `${day}-${month}-${year} (${weekday})`;
      };

      const createdAt = u.created_at ? new Date(u.created_at) : new Date();

      const joinDate = createdAt.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata"
      });

      const joinTime = createdAt.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });

      // ================= FILES =================
      const educationLogo = path.join(__dirname, "assets", "education logo.png");
      const computerLogo = path.join(__dirname, "assets", "computer logo.png");
      const associationLogo = path.join(__dirname, "assets", "assos logo.png");

      // ================= BACKGROUND =================
      doc.rect(0, 0, pageWidth, pageHeight).fill("#eef3ff");

      // ================= HEADER BOX =================
      const headerHeight = 160;

      doc.save();
      doc.rect(0, 0, pageWidth, headerHeight).fill("#ffffff");

      doc.lineWidth(2)
        .strokeColor("#0b3d91")
        .rect(15, 10, pageWidth - 30, headerHeight - 20)
        .stroke();

      doc.restore();

      // ================= WATERMARK =================
      if (fs.existsSync(educationLogo)) {

        const wmSize = 300;

        doc.save();
        doc.opacity(0.05);

        doc.image(
          educationLogo,
          (pageWidth - wmSize) / 2,
          (pageHeight - wmSize) / 2,
          { width: wmSize }
        );

        doc.restore();
      }

      // ================= LOGOS =================
      if (fs.existsSync(computerLogo)) {
        doc.image(computerLogo, 20, 20, { width: 85 });
      }

      if (fs.existsSync(associationLogo)) {
        doc.image(associationLogo, pageWidth - 105, 20, { width: 85 });
      }

      // ================= HEADER TEXT =================

          // ✅ Tamil Quote
      doc.fillColor("#b8860b")
        .font("Tamil")
        .fontSize(15)
        .text("கல்வியே துணை", 0, 15, {
          align: "center"
        });


      doc.fillColor("#0b3d91")
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("SUCCESS COMPUTER CENTRE", 0, 35, { align: "center" });

      doc.fontSize(13)
        .text("SARVA I.T & EDUCATIONAL DEVELOPMENT (SITED) - 4936", 0, 65, { align: "center" });

      doc.text("R.Pattanam (P.O), Rasipuram (TK), Namakkal (Dt) - 637408", 0, 85, { align: "center" });

      doc.text("gmail : sccrpattanam@gmail.com", 0, 105, { align: "center" });

      doc.text("Cell : 9842927992, 8525927992", 0, 125, { align: "center" });

      doc.fillColor("#0b3d91")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("STUDENT'S INFORMATION", 0, 170, { align: "center" });

      // ================= DATA =================
      doc.fillColor("#000");

      let x = 100;
      let y = 200;
      const gap = 28;

      // ✅ ONLY ONE FUNCTION (FIXED)
const add = (label, value) => {
  const labelWidth = 160;
  const valueWidth = 280;

doc.fontSize(11)
  .font("Helvetica")
  .text(label, x, y, {
    width: labelWidth
  });

doc.font("Helvetica-Bold")
  .text(value || "-", x + 170, y, {
    width: valueWidth
  });

  // actual text height calculate
  const textHeight = doc.heightOfString(value || "-", {
    width: valueWidth
  });

  // dynamic equal spacing
  y += Math.max(gap, textHeight + 10);
};

      add("Name", u.name);
      add("Admission No", u.admission_number);
      add("Academic Year", u.batch);
      add("Course Name", u.class_group);
      add("Preferred Language", u.medium);
      add("Level", u.board);
      add("Father Name", u.father_name);
      add("Father Occupation", u.father_occupation);
      add("Contact", (u.contact_details || "").split(",").join(" | "));
      add("Transport", u.transport);
      add("School/College", u.school_details);
      add("Duration", u.duration);
      add("Valid Upto", formatDate(u.valid_upto));
      add("Exam Date", formatDate(u.exam_date));
      add("Address", u.address);
      add("Status", u.status);
      add("Joining Date", joinDate);
      add("Joining Time", joinTime);

// ================= SIGNATURE =================
     const sigY = 780;

      doc.strokeColor("#000");

      doc.moveTo(80, sigY).lineTo(240, sigY).stroke();
      doc.fontSize(10).font("Helvetica")
        .text("Chairman's Signature", 85, sigY + 5);

      doc.moveTo(360, sigY).lineTo(520, sigY).stroke();
      doc.text("Parent's Signature", 370, sigY + 5);

      doc.end();
    }
  );
});


// ================= COMPUTER EXCEL DOWNLOAD =================
app.get("/computer-students/excel", (req, res) => {

  db.query(
    "SELECT * FROM computer_students ORDER BY id ASC",
    async (err, rows) => {

      if (err) {
        console.log(err);
        return res.status(500).send("Database Error");
      }

      try {

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Computer Students");

        worksheet.columns = [
          { header: "Admission No", key: "admission_number", width: 20 },
          { header: "Name", key: "name", width: 25 },
          { header: "Course", key: "class_group", width: 25 },
          { header: "Academic Year", key: "batch", width: 20 },
          { header: "Preferred Language", key: "medium", width: 20 },
          { header: "Level", key: "board", width: 20 },
          { header: "Father Name", key: "father_name", width: 25 },
          { header: "Father Occupation", key: "father_occupation", width: 25 },
          { header: "Contact", key: "contact_details", width: 25 },
          { header: "Transport", key: "transport", width: 20 },
          { header: "School/College", key: "school_details", width: 30 },
          { header: "Duration", key: "duration", width: 20 },
          { header: "Exam Date", key: "exam_date", width: 20 },
          { header: "Valid Upto", key: "valid_upto", width: 20 },
          { header: "Address", key: "address", width: 40 },
          { header: "Status", key: "status", width: 15 }
        ];

        // Header Style
        worksheet.getRow(1).font = {
          bold: true
        };

        // Add DB rows
        rows.forEach(row => {
          worksheet.addRow(row);
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
          "Content-Disposition",
          "attachment; filename=computer_students.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();

      } catch (error) {
        console.log(error);
        res.status(500).send("Excel Generation Error");
      }

    }
  );

});





// ================= TUTORIAL REGISTRATION =================
app.post("/register", async (req, res) => {

  try {

    const {
      admission_number,
      name,
      password,
      batch,
      class_group,
      medium,
      board,
      subject,
      father_name,
      father_occupation,
      mother_name,
      mother_occupation,
      contact_details,
      transport,
      address
    } = req.body;

    if (!admission_number || !password || !name) {
      return res.json({
        success: false,
        message: "Required fields missing"
      });
    }

    // ✅ STEP 1: CHECK DUPLICATE ADMISSION NUMBER
    db.query(
      "SELECT * FROM tutorial_registration WHERE admission_number=?",
      [admission_number],
      async (checkErr, checkResult) => {

        if (checkErr) {
          console.log(checkErr);
          return res.json({
            success: false,
            message: "Server error ❌"
          });
        }

        if (checkResult.length > 0) {
          return res.json({
            success: false,
            message: "Admission Number already exists ⚠️ Please use another number"
          });
        }

        // ✅ STEP 2: INSERT DATA
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          `INSERT INTO tutorial_registration
          (admission_number,name,password,batch,class_group,medium,board,subject,
          father_name,father_occupation,mother_name,mother_occupation,
          contact_details,transport,address,status)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            admission_number,
            name,
            hashedPassword,
            batch || "",
            class_group || "",
            medium || "",
            board || "",
            subject || "",
            father_name || "",
            father_occupation || "",
            mother_name || "",
            mother_occupation || "",
            contact_details || "",
            transport || "",
            address || "",
            "active"
          ],
          (err) => {

            if (err) {
              console.log("DB ERROR:", err);
              return res.json({
                success: false,
                message: "Registration failed ❌"
              });
            }

            res.json({
              success: true,
              message: "Registered Successfully ✅"
            });

          }
        );

      }
    );

  } catch (e) {
    console.log("SERVER ERROR:", e);
    res.json({
      success: false,
      message: "Server error ❌"
    });
  }

});

// ================= GET ALL =================
app.get("/tutorial-students", (req, res) => {

  db.query("SELECT * FROM tutorial_registration ORDER BY id ASC", (err, r) => {

    if (err) {
      console.log(err);
      return res.json({ success:false });
    }

    res.json(r);
  });

});


// ================= GET SINGLE =================
app.get("/tutorial/:adm", (req, res) => {

  db.query(
    "SELECT * FROM tutorial_registration WHERE admission_number=?",
    [req.params.adm],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Server error"
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "Student not found"
        });
      }

      res.json(result[0]);

    }
  );

});


// ================= UPDATE =================
app.put("/tutorial/update/:adm", async (req, res) => {

  try {

    const {
      name,
      class_group,
      subject,
      batch,
      medium,
      board,
      father_name,
      father_occupation,
      mother_name,
      mother_occupation,
      contact_details,
      transport,
      address,
      password
    } = req.body;

    let query = `
      UPDATE tutorial_registration
      SET name=?, class_group=?, subject=?, batch=?, medium=?, board=?,
          father_name=?, father_occupation=?, mother_name=?, mother_occupation=?, contact_details=?, transport=?, address=?
    `;

    let values = [
      name,
      class_group,
      subject,
      batch,
      medium,
      board,
      father_name,
      father_occupation,
      mother_name,
      mother_occupation,
      contact_details,
      transport,
      address,
    ];

    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      query += ", password=?";
      values.push(hashed);
    }

    query += " WHERE admission_number=?";
    values.push(req.params.adm);

    db.query(query, values, (err, result) => {

      if (err) {
        console.log(err);
        return res.json({ success:false, message:"Update failed ❌" });
      }

      if(result.affectedRows === 0){
        return res.json({ success:false, message:"No record found ❌" });
      }

      res.json({ success:true, message:"Updated successfully ✅" });

    });

  } catch (e) {
    console.log(e);
    res.json({ success:false, message:"Server error ❌" });
  }

});


// ================= DELETE =================
app.delete("/tutorial/delete/:adm", (req, res) => {

  const adm = req.params.adm;

  console.log("DELETE REQUEST:", adm);

  db.query(
    "DELETE FROM tutorial_registration WHERE admission_number=?",
    [adm],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success:false,
          message:"Delete failed",
          error:err
        });
      }

      console.log("DELETE RESULT:", result);

      if(result.affectedRows === 0){
        return res.json({
          success:false,
          message:"No student found"
        });
      }

      res.json({
        success:true,
        message:"Student deleted successfully"
      });
    }
  );
});


// ================= STATUS =================
app.put("/tutorial/status/:adm", (req, res) => {

  const adm = req.params.adm;
  const { status } = req.body;

  console.log("STATUS REQUEST:", adm, status);

  db.query(
    "UPDATE tutorial_registration SET status=? WHERE admission_number=?",
    [status, adm],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success:false,
          message:"Status update failed",
          error:err
        });
      }

      console.log("RESULT:", result);

      if(result.affectedRows === 0){
        return res.json({
          success:false,
          message:"No student found"
        });
      }

      res.json({
        success:true,
        message:"Status updated successfully"
      });
    }
  );
});

// ================= PUT =================
app.get("/tutorial/pdf/:adm", (req, res) => {

  db.query(
    "SELECT * FROM tutorial_registration WHERE admission_number=?",
    [req.params.adm],
    (err, r) => {

      if (err || r.length === 0)
        return res.status(404).send("Not found");

      const u = r[0];

      const PDFDocument = require("pdfkit");
      const fs = require("fs");
      const path = require("path");

      const doc = new PDFDocument({ size: "A4", margin: 0 });

                 // ✅ TAMIL FONT REGISTER
      doc.registerFont("Tamil", "./fonts/Tamil.ttf");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${u.admission_number}.pdf`
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

const createdAt = u.created_at
  ? new Date(u.created_at)
  : new Date();

const joinDate = createdAt.toLocaleDateString("en-IN", {
  timeZone: "Asia/Kolkata"
});

const joinTime = createdAt.toLocaleTimeString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true
});

      const watermark = path.join(__dirname, "assets", "education logo.png");

     // ================= BACKGROUND =================
doc.rect(0, 0, pageWidth, pageHeight).fill("#eef3ff");
doc.rect(0, 0, pageWidth, 120).fill("#0b3d91");

// ================= 🔥 WATERMARK =================
if (fs.existsSync(watermark)) {

  const wmSize = 260;

  const wmX = (pageWidth - wmSize) / 2;
  const wmY = (pageHeight - wmSize) / 2;

  doc.save();
  doc.opacity(0.07);

  doc.image(watermark, wmX, wmY, {
    width: wmSize
  });

  doc.restore();
}

// ================= HEADER (WHITE BG + BLUE BORDER) =================
const headerHeight = 160;

// white header background
doc.rect(0, 0, pageWidth, headerHeight).fill("#ffffff");

// blue border only
doc.lineWidth(2)
  .strokeColor("#0b3d91")
  .rect(15, 10, pageWidth - 30, headerHeight - 20)
  .stroke();

const leftLogo = path.join(__dirname, "assets", "tutorial logo.png");
const rightLogo = path.join(__dirname, "assets", "assos logo.png");

if (fs.existsSync(leftLogo)) {
  doc.image(leftLogo, 25, 25, { width: 70 });
}

if (fs.existsSync(rightLogo)) {
  doc.image(rightLogo, pageWidth - 95, 25, { width: 70 });
}
      // ================= HEADER TEXT =================

             // ✅ Tamil Quote
      doc.fillColor("#b8860b")
        .font("Tamil")
        .fontSize(15)
        .text("கல்வியே துணை", 0, 15, {
          align: "center"
        });


     doc.fillColor("#0b3d91");

      doc.font("Helvetica-Bold")
        .fontSize(20)
        .text("SUCCESS TUTORIAL CENTER", 0, 40, {
          align: "center"
        });

      doc.font("Helvetica")
        .fontSize(13)
        .text(
          "Affiliated with Tamilnadu Tutorial Centre Association-24250341",
          0,
          68,
          { align: "center" }
        );

      doc.text(
        "R.Pattanam (P.O), Rasipuram (TK), Namakkal (Dt) - 637408",
        0,
        84,
        { align: "center" }
      );

         doc.text("gmail :stcrpattanam@gmail.com", 0, 99, {
        align: "center"
        
      });

      doc.text("Cell : 9842927992, 8525927992", 0, 120, {
        align: "center"
      });

      // ================= TITLE =================
      doc.fillColor("#0b3d91");

      doc.font("Helvetica-Bold")
        .fontSize(14)
        .text("STUDENT'S INFORMATION", 0, 168, {
          align: "center"
        });

      // ================= CONTENT =================
      let y = 210;
      const xLeft = 80;
      const gap = 26;

const add = (label, value) => {
  const labelWidth = 160;
  const valueWidth = 280;

  doc.fontSize(11)
    .font("Helvetica")
    .text(label, xLeft, y, {
      width: labelWidth
    });

  doc.font("Helvetica-Bold")
    .text(value || "-", xLeft + 170, y, {
      width: valueWidth
    });

  // actual text height calculate
  const textHeight = doc.heightOfString(value || "-", {
    width: valueWidth
  });

  // dynamic equal spacing
  y += Math.max(gap, textHeight + 10);
};

      add("Name", u.name);
      add("Admission No", u.admission_number);
      add("Class and Group", u.class_group);
      add("Subject", u.subject);
      add("Accademic year", u.batch);
      add("Medium", u.medium);
      add("Board", u.board);
      add("Father Name", u.father_name);
      add("Father Occupation", u.father_occupation);
      add("Mother Name", u.mother_name);
      add("Mother Occupation", u.mother_occupation);
      add("Contact", (u.contact_details || "").split(",").join("  |  "));
      add("Transport", u.transport);
      add("Address", u.address);
      add("Status", u.status);
      add("Joining Date", joinDate);
      add("Joining Time", joinTime);

      // ================= SIGNATURE =================
      const sigY = 720;

      doc.strokeColor("#000");

      doc.moveTo(80, sigY).lineTo(240, sigY).stroke();
      doc.fontSize(10).text("Chairman's Signature", 85, sigY + 5);

      doc.moveTo(350, sigY).lineTo(510, sigY).stroke();
      doc.text("Parent's Signature", 370, sigY + 5);

      doc.end();
    }
  );
});






// ================= TUTORIAL STUDENTS EXCEL DOWNLOAD =================
app.get("/tutorial-students/excel", (req, res) => {

  db.query(
    "SELECT * FROM tutorial_registration ORDER BY id ASC",
    async (err, rows) => {

      if (err) {
        console.log(err);
        return res.status(500).send("Database Error");
      }

      try {

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Tutorial Students");

        worksheet.columns = [
          { header: "Admission No", key: "admission_number", width: 20 },
          { header: "Name", key: "name", width: 25 },
          { header: "Academic Year", key: "batch", width: 20 },
          { header: "Class", key: "class_group", width: 20 },
          { header: "Medium", key: "medium", width: 20 },
          { header: "Board", key: "board", width: 20 },
          { header: "Subject", key: "subject", width: 25 },
          { header: "Father Name", key: "father_name", width: 25 },
          { header: "Father Occupation", key: "father_occupation", width: 25 },
          { header: "Mother Name", key: "mother_name", width: 25 },
          { header: "Mother Occupation", key: "mother_occupation", width: 25 },
          { header: "Contact", key: "contact_details", width: 25 },
          { header: "Transport", key: "transport", width: 20 },
          { header: "Address", key: "address", width: 40 },
          { header: "Status", key: "status", width: 15 }
        ];

        // Header Bold
        worksheet.getRow(1).font = {
          bold: true
        };

        // Add all students
        rows.forEach(row => {
          worksheet.addRow(row);
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
          "Content-Disposition",
          "attachment; filename=tutorial_students.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();

      } catch (error) {
        console.log(error);
        res.status(500).send("Excel Generation Error");
      }

    }
  );

});

// ================= LOGIN =================
app.post("/login", (req, res) => {

  const { admission_number, password } = req.body;

  // 🔐 password check function
  const checkPassword = async (input, dbPassword) => {
    try {
      if (dbPassword && dbPassword.startsWith("$2")) {
        return await bcrypt.compare(input, dbPassword);
      }
      return input === dbPassword;
    } catch {
      return false;
    }
  };

  // 🔄 common handler
  const handleUser = async (user, type) => {

    const match = await checkPassword(password, user.password);

    if (!match) {
      return res.status(401).send("Invalid user");
    }

    if ((user.status || "").toLowerCase() !== "active") {
      return res.status(401).send("Inactive user");
    }

    return res.json({
      message: "Login successful",
      type: type
    });
  };

  // ================= TUITION =================
  db.query(
    "SELECT * FROM tuition_students WHERE admission_number=?",
    [admission_number],
    async (err, result) => {

      if (err) return res.status(500).send("Server error");

      if (result.length > 0) {
        return handleUser(result[0], "tuition");
      }

      // ================= COMPUTER =================
      db.query(
        "SELECT * FROM computer_students WHERE admission_number=?",
        [admission_number],
        async (err2, result2) => {

          if (err2) return res.status(500).send("Server error");

          if (result2.length > 0) {
            return handleUser(result2[0], "computer");
          }

          // ================= TUTORIAL =================
          db.query(
            "SELECT * FROM tutorial_registration WHERE admission_number=?",
            [admission_number],
            async (err3, result3) => {

              if (err3) return res.status(500).send("Server error");

              if (result3.length > 0) {
                return handleUser(result3[0], "tutorial");
              }

              // ❌ NOT FOUND
              return res.status(401).send("Invalid user");
            }
          );
        }
      );
    }
  );

});

// 🔥 IMPORTANT FOR RENDER
const PORT = process.env.PORT || 3000;






app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
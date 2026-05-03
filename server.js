const express = require("express");
const app = express();   // 🔥 MUST BE HERE FIRST
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");


app.use(express.json());
app.use(cors({
  origin: "*",   // allow all (for now)
  methods: ["GET","POST"]
}));

app.use(express.urlencoded({ extended: true }));




const db = mysql.createPool({
  host: "srv843.hstgr.io",
  user: "u987008906_abinithi",
  password: "Abilogin@21",
  database: "u987008906_tuition_db",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


db.getConnection((err, connection) => {
  if (err) {
    console.log("❌ DB CONNECTION FAILED:");
console.log(err);

  } else {
    console.log("✅ DB CONNECTED SUCCESS");
    connection.release();
  }
});


app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});




// ================= LOGIN (FIXED - BOTH TABLES + OLD PASSWORD SUPPORT) =================
// ================= LOGIN (FIXED & CLEAN) =================
app.post("/login", (req, res) => {

  const { admission_number, password } = req.body;

  if (!admission_number || !password) {
    return res.status(400).send("Missing credentials");
  }

  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  const checkPassword = async (input, dbPassword) => {
    try {
      if (dbPassword && dbPassword.startsWith("$2")) {
        return await bcrypt.compare(input, dbPassword);
      }
      return input === dbPassword;
    } catch (err) {
      return false;
    }
  };

  const handleLogin = async (user, type) => {

    const match = await checkPassword(password, user.password);

    if (!match) {
      return res.status(401).send("Invalid credentials");
    }

    if (normalize(user.status) !== "active") {
      return res.status(401).send("Account inactive");
    }

    return res.json({
      message: "Login successful",
      type: type,
      user: {
        admission_number: user.admission_number,
        name: user.name
      }
    });
  };

  // ================= TUITION =================
  db.query(
    "SELECT * FROM students WHERE admission_number=?",
    [admission_number],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.status(500).send("Server error");
      }

      if (result.length > 0) {
        return handleLogin(result[0], "tuition");
      }

      // ================= COMPUTER =================
      db.query(
        "SELECT * FROM computer_students WHERE admission_number=?",
        [admission_number],
        (err2, result2) => {

          if (err2) {
            console.log(err2);
            return res.status(500).send("Server error");
          }

          if (result2.length > 0) {
            return handleLogin(result2[0], "computer");
          }

          // ================= TUTORIAL =================
          db.query(
            "SELECT * FROM tutorial_registration WHERE admission_number=?",
            [admission_number],
            (err3, result3) => {

              if (err3) {
                console.log(err3);
                return res.status(500).send("Server error");
              }

              if (result3.length > 0) {
                return handleLogin(result3[0], "tutorial");
              }

              return res.status(401).send("Invalid credentials");
            }
          );
        }
      );
    }
  );
});



// UPDATE
app.put("/student/update/:adm", (req, res) => {
  const d = req.body;

  db.query(
    `UPDATE students SET
    admission_number=?, name=?, class_group=?, batch=?, medium=?, board=?,
    school_details=?, father_name=?, mother_name=?, contact_details=?, address=?
    WHERE admission_number=?`,
    [
      d.admission_number,
      d.name,
      d.class_group,
      d.batch,
      d.medium,
      d.board,
      d.school_details,
      d.father_name,
      d.mother_name,
      d.contact_details,
      d.address,
      req.params.adm
    ],
    (err) => {
      if (err) return res.status(500).send("Update failed");
      res.send("Updated");
    }
  );
});

// STATUS
app.put("/student/status/:adm", (req, res) => {
  db.query(
    "UPDATE students SET status=? WHERE admission_number=?",
    [req.body.status, req.params.adm],
    (err) => {
      if (err) return res.status(500).send("Error");
      res.send("OK");
    }
  );
});

// DELETE
app.delete("/student/delete/:adm", (req, res) => {
  db.query(
    "DELETE FROM students WHERE admission_number=?",
    [req.params.adm],
    (err) => {
      if (err) return res.status(500).send("Error");
      res.send("Deleted");
    }
  );
});





// ================= ADD STUDENT =================
app.post("/add-student", async (req, res) => {

  console.log(req.body); // DEBUG

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
      mother_name,
      contact_details,
      school_details,
      address,
      status,
      type
    } = req.body;

    // 🔥 validate required fields
    if (!admission_number || !name) {
      return res.status(400).send("Admission number and name required");
    }

    // 🔐 hash password safely
    let hashedPassword = null;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    db.query(
      `INSERT INTO students
      (admission_number, name, password, batch, class_group, medium, board,
       father_name, mother_name, contact_details, school_details, address, status, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        admission_number,
        name,
        hashedPassword,
        batch || null,
        class_group || null,
        medium || null,
        board || null,
        father_name || null,
        mother_name || null,
        contact_details || null,
        school_details || null,
        address || null,
        status || "active",
        type || "student"
      ],
      (err, result) => {
        if (err) {
          console.log("DB ERROR:", err);
          return res.status(500).send("Add failed");
        }

        res.send("Student Added Successfully");
      }
    );

  } catch (e) {
    console.log("CATCH ERROR:", e);
    res.status(500).send("Server error");
  }
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

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${u.admission_number}.pdf`
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      const joinDate = new Date(u.created_at).toLocaleDateString();
      const joinTime = new Date(u.created_at).toLocaleTimeString();

      // ================= LOGOS =================
      const tuitionLogo = path.join(__dirname, "assets", "tuition logo.png");
      const associationLogo = path.join(__dirname, "assets", "assos logo.png");

      // ================= 🔥 WATERMARK (ONLY EDUCATION LOGO) =================
      const watermark = path.join(__dirname, "assets", "education logo.png");

      // ================= BACKGROUND =================
      doc.rect(0, 0, pageWidth, pageHeight).fill("#eef3ff");

      // ================= WATERMARK =================
      if (fs.existsSync(watermark)) {

        const wmSize = 300; // good visible size

        doc.save();
        doc.opacity(0.05); // very light watermark

        doc.image(
          watermark,
          (pageWidth - wmSize) / 2,
          (pageHeight - wmSize) / 2,
          { width: wmSize }
        );

        doc.restore();
      }

      // ================= HEADER =================
      doc.rect(0, 0, pageWidth, 150).fill("#0b3d91");

      // ================= LEFT → TUITION LOGO =================
      if (fs.existsSync(tuitionLogo)) {
        doc.image(tuitionLogo, 25, 30, { width: 80 });
      }

      // ================= RIGHT → ASSOCIATION LOGO =================
      if (fs.existsSync(associationLogo)) {
        doc.image(associationLogo, pageWidth - 105, 30, { width: 80 });
      }

      // ================= HEADER TEXT =================
      doc.fillColor("white");

      doc.font("Helvetica-Bold")
        .fontSize(30)
        .text("Success Tuition Center", 0, 35, {
          align: "center"
        });

      doc.font("Helvetica")
        .fontSize(13)
        .text("Affiliated with Tamilnadu Tuition Center Association-24250341", 0, 65, {
          align: "center"
        });

      doc.text("R.Pattanam (P.O), Rasipuram (TK), Namakkal (Dt) - 637408", 0, 85, {
        align: "center"
      });


          doc.text("gmail :  stcrpattanam@gmail.com", 0, 125, {
        align: "center"
        
      });

      doc.text("Cell : 9842927992, 8525927992", 0, 105, {
        align: "center"
        
      });



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

        doc.font("Helvetica-Bold")
          .text(value || "-", xLeft + 170, y);

        y += gap;
      };

   add("Name", u.name);
    add("Admission No", u.admission_number);
    add("Class and Group", u.class_group);
    add("Academic Year", u.batch);
    add("Medium", u.medium);
    add("Board", u.board);
    add("Father Name", u.father_name);
    add("Mother Name", u.mother_name);

    add(
      "Contact",
      u.contact_details ? u.contact_details.replace(/,/g, "\n") : "-"
    );

    add("School", u.school_details);
    add("Address", u.address);
    add("Status", u.status);
    add("Joining Date", joinDate);
    add("Joining Time", joinTime);

    doc.moveDown(3);


      // ================= SIGNATURE =================
      const sigY = 690;

      doc.strokeColor("#000");

      doc.moveTo(80, sigY).lineTo(240, sigY).stroke();
      doc.fontSize(10).text("Chairman's Signature", 85, sigY + 5);

      doc.moveTo(360, sigY).lineTo(520, sigY).stroke();
      doc.text("Parent's Signature", 370, sigY + 5);

      doc.end();
    }
  );
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
      contact_details,
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
      (admission_number,name,password,batch,class_group,medium,board,
       father_name,contact_details,school_details,
       duration,exam_date,valid_upto,address,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,

      [
        admission_number,
        name || "",
        hashedPassword,
        batch || "",
        class_group || "",
        medium || "",
        board || "",
        father_name || "",
        contact_details || "",
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


// ================= 🔥 GET ALL COMPUTER =================
app.get("/computer-students", (req, res) => {
  db.query("SELECT * FROM computer_students ORDER BY id ASC", (err, r) => {
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


// ================= 🔥 GET SINGLE COMPUTER =================
app.get("/computer/:adm", (req, res) => {
  db.query(
    "SELECT * FROM computer_students WHERE admission_number=?",
    [req.params.adm],
    (err, r) => {
      if (err || r.length === 0)
        return res.status(404).send("Not found");

      res.json(r[0]);
    }
  );
});


// ================= 🔥 UPDATE COMPUTER (REMOVED mother_name) =================
app.put("/computer/update/:adm", (req, res) => {

  const adm = req.params.adm;

  db.query(
    "SELECT * FROM computer_students WHERE admission_number=?",
    [adm],
    (err, result) => {

      if (err || result.length === 0)
        return res.status(500).send("Fetch failed");

      const old = result[0];
      const d = req.body;

      const updated = {
        admission_number: d.admission_number || old.admission_number,
        name: d.name || old.name,
        class_group: d.class_group || old.class_group,
        batch: d.batch || old.batch,
        medium: d.medium || old.medium,
        board: d.board || old.board,
        school_details: d.school_details || old.school_details,
        father_name: d.father_name || old.father_name,
        contact_details: d.contact_details || old.contact_details,

        // NEW FIELDS (added support)
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
          school_details=?,
          father_name=?,
          contact_details=?,
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
          updated.school_details,
          updated.father_name,
          updated.contact_details,
          updated.duration,
          updated.valid_upto,
          updated.exam_date,
          updated.address,
          adm
        ],
        (err2) => {
          if (err2) return res.status(500).send("Update failed");
          res.send("Updated");
        }
      );
    }
  );
});


// ================= 🔥 STATUS =================
app.put("/computer/status/:adm", (req, res) => {
  db.query(
    "UPDATE computer_students SET status=? WHERE admission_number=?",
    [req.body.status, req.params.adm],
    (err) => {
      if (err) return res.status(500).send("Error");
      res.send("OK");
    }
  );
});


// ================= 🔥 DELETE =================
app.delete("/computer/delete/:adm", (req, res) => {
  db.query(
    "DELETE FROM computer_students WHERE admission_number=?",
    [req.params.adm],
    (err) => {
      if (err) return res.status(500).send("Error");
      res.send("Deleted");
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

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${u.admission_number}.pdf`
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // ================= DATE FORMAT FIX =================
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

      const joinDate = new Date(u.created_at).toLocaleDateString();
      const joinTime = new Date(u.created_at).toLocaleTimeString();

      // ================= FILES =================
      const educationLogo = path.join(__dirname, "assets", "education logo.png");
      const computerLogo = path.join(__dirname, "assets", "computer logo.png");
      const associationLogo = path.join(__dirname, "assets", "assos logo.png");

      // ================= BACKGROUND =================
      doc.rect(0, 0, pageWidth, pageHeight).fill("#eef3ff");
      doc.rect(0, 0, pageWidth, 120).fill("#0b3d91");

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

      // ================= HEADER LOGOS =================
      if (fs.existsSync(computerLogo)) {
        doc.image(computerLogo, 20, 20, { width: 85 });
      }

      if (fs.existsSync(associationLogo)) {
        doc.image(associationLogo, pageWidth - 105, 20, { width: 85 });
      }

      // ================= HEADER TEXT =================
      doc.fillColor("white")
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("SUCCESS COMPUTER CENTER", 0, 25, {
          align: "center"
        });

      doc.fontSize(13)
        .text("SARVA I.T & EDUCATIONAL DEVELOPMENT (SITED) - 4936", 0, 55, {
          align: "center"
        });

      doc.text("R.Pattanam (P.O), Rasipuram (TK), Namakkal (Dt) - 637408", 0, 70, {
        align: "center"
      });

      doc.text("gmail : sccrpattanam@gmail.com", 0, 85, {
        align: "center"
      });

      doc.text("Cell : 9842927992, 8525927992", 0, 150, {
        align: "center"
      });

      // ================= TITLE =================
      doc.fillColor("#0b3d91")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("STUDENT'S INFORMATION", 0, 125, {
          align: "center"
        });

      // ================= DATA =================
      doc.fillColor("#000");

      let x = 100;
      let y = 200;
      const gap = 28;

      const add = (label, value) => {
        doc.font("Helvetica")
          .fontSize(12)
          .text(`${label}: ${value || "-"}`, x, y);

        y += gap;
      };

      add("Name", u.name);
      add("Admission No", u.admission_number);
      add("Accademic year", u.batch);
      add("Course", u.class_group);
      
      add("Medium", u.medium);
      add("Board", u.board);
      add("Contact", u.contact_details.replace(/,/g, "\n"));

      add("Duration", u.duration);
      add("Valid Upto Date", formatDate(u.valid_upto));
      add("Exam Date", formatDate(u.exam_date));
      
      add("Address", u.address);

      add("Status", u.status);
      add("Joining Date", joinDate);
      add("Joining Time", joinTime);

      // ================= SIGNATURE =================
      const sigY = 710;

      doc.moveTo(120, sigY).lineTo(260, sigY).stroke();
      doc.fontSize(11).text("Chairman's Signature", 110, sigY + 10);

      doc.moveTo(350, sigY).lineTo(490, sigY).stroke();
      doc.text("Parent's Signature", 360, sigY + 10);

      doc.end();
    }
  );
});



// ================= COMPUTER GET ALL (SAFE AGAIN) =================
app.get("/computer/:adm", (req, res) => {
  db.query(
    "SELECT * FROM computer_students WHERE admission_number=?",
    [req.params.adm],
    (err, r) => {
      if (err || r.length === 0)
        return res.status(404).send("Not found");

      res.json(r[0]);
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
      mother_name,
      contact_details,
      address
    } = req.body;

    if (!admission_number || !password || !name) {
      return res.send("Required fields missing");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO tutorial_registration
      (admission_number,name,password,batch,class_group,medium,board,subject,
       father_name,mother_name,contact_details,address,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        mother_name || "",
        contact_details || "",
        address || "",
        "active"
      ],
      (err) => {

        if (err) {
          console.log("DB ERROR:", err);
          return res.send("Registration failed ❌");
        }

        res.send("Registered Successfully ✅");
      }
    );

  } catch (e) {
    console.log("SERVER ERROR:", e);
    res.send("Server error ❌");
  }

});


// ================= GET ALL =================
app.get("/tutorial-students", (req, res) => {

  db.query("SELECT * FROM tutorial_registration ORDER BY id DESC", (err, r) => {

    if (err) return res.send("Error");

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


// ================= GET SINGLE (VIEW + EDIT) =================
app.get("/tutorial/:adm", (req,res)=>{

  db.query(
    "SELECT * FROM tutorial_registration WHERE admission_number=?",
    [req.params.adm],
    (err,result)=>{

      if(err) return res.send("Error");

      if(result.length === 0)
        return res.send("Not found");

      res.json(result[0]);
    }
  );

});


// ================= DELETE =================
app.delete("/tutorial/delete/:adm", (req, res) => {

  db.query(
    "DELETE FROM tutorial_registration WHERE admission_number=?",
    [req.params.adm],
    (err) => {

      if (err) {
        console.log(err);
        return res.send("Delete failed ❌");
      }

      res.send("Deleted Successfully ✅");
    }
  );
});


// ================= STATUS TOGGLE =================
app.put("/tutorial/status/:adm", (req, res) => {

  const { status } = req.body;

  db.query(
    "UPDATE tutorial_registration SET status=? WHERE admission_number=?",
    [status, req.params.adm],
    (err) => {

      if (err) {
        console.log(err);
        return res.send("Status update failed ❌");
      }

      res.send("Status updated ✅");
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

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${u.admission_number}.pdf`
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      const joinDate = new Date(u.created_at).toLocaleDateString();
      const joinTime = new Date(u.created_at).toLocaleTimeString();

      const watermark = path.join(__dirname, "assets", "education logo.png");

      // ================= BACKGROUND =================
      doc.rect(0, 0, pageWidth, pageHeight).fill("#eef3ff");

      // ================= 🔥 WATERMARK (INCREASED SIZE) =================
      if (fs.existsSync(watermark)) {

        const wmSize = 260; // 🔥 INCREASED FROM 180 → 260

        const wmX = (pageWidth - wmSize) / 2;
        const wmY = (pageHeight - wmSize) / 2;

        doc.save();
        doc.opacity(0.07); // slightly visible than before

        doc.image(watermark, wmX, wmY, {
          width: wmSize
        });

        doc.restore();
      }

      // ================= HEADER =================
      doc.rect(0, 0, pageWidth, 140).fill("#0b3d91");

      const leftLogo = path.join(__dirname, "assets", "tutorial logo.png");
      const rightLogo = path.join(__dirname, "assets", "assos logo.png");

      if (fs.existsSync(leftLogo)) {
        doc.image(leftLogo, 25, 25, { width: 70 });
      }

      if (fs.existsSync(rightLogo)) {
        doc.image(rightLogo, pageWidth - 95, 25, { width: 70 });
      }

      // ================= HEADER TEXT =================

      doc.fillColor("white");

      doc.font("Helvetica-Bold")
        .fontSize(20)
        .text("Success Tutorial Center", 0, 35, {
          align: "center"
        });

      doc.font("Helvetica")
        .fontSize(13)
        .text(
          "Affiliated with Tamilnadu Tutorial Center Association-24250341",
          0,
          60,
          { align: "center" }
        );

      doc.text(
        "R.Pattanam (P.O), Rasipuram (TK), Namakkal (Dt) - 637408",
        0,
        78,
        { align: "center" }
      );

         doc.text("gmail :stcrpattanam@gmail.com", 0, 94, {
        align: "center"
        
      });

      doc.text("Cell : 9842927992, 8525927992", 0, 117, {
        align: "center"
      });

      // ================= TITLE =================
      doc.fillColor("#000");

      doc.font("Helvetica-Bold")
        .fontSize(14)
        .text("STUDENT'S INFORMATION", 0, 160, {
          align: "center"
        });

      // ================= CONTENT =================
      let y = 210;
      const xLeft = 80;
      const gap = 26;

      const add = (label, value) => {
        doc.fontSize(11)
          .font("Helvetica")
          .text(label, xLeft, y);

        doc.font("Helvetica-Bold")
          .text(value || "-", xLeft + 170, y);

        y += gap;
      };

      add("Name", u.name);
      add("Admission No", u.admission_number);
      add("Class and Group", u.class_group);
      add("Subject", u.subject);
      add("Accademic year", u.batch);
      add("Medium", u.medium);
      add("Board", u.board);
      add("Father Name", u.father_name);
      add("Mother Name", u.mother_name);
      add("Contact", u.contact_details.replace(/,/g, "\n"));
      add("Status", u.status);
      add("Joining Date", joinDate);
      add("Joining Time", joinTime);

      // ================= SIGNATURE =================
      const sigY = 690;

      doc.strokeColor("#000");

      doc.moveTo(80, sigY).lineTo(240, sigY).stroke();
      doc.fontSize(10).text("Chairman's Signature", 85, sigY + 5);

      doc.moveTo(350, sigY).lineTo(510, sigY).stroke();
      doc.text("Parent's Signature", 370, sigY + 5);

      doc.end();
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





// UPDATE
app.put("/student/update/:adm", (req, res) => {
  const d = req.body;

  db.query(
    `UPDATE students SET
    admission_number=?, name=?, class_group=?, batch=?, medium=?, board=?,
    school_details=?, father_name=?, mother_name=?, contact_details=?
    WHERE admission_number=?`,
    [
      d.admission_number,
      d.name,
      d.class_group,
      d.batch,
      d.medium,
      d.board,
      d.school_details,
      d.father_name,
      d.mother_name,
      d.contact_details,
      req.params.adm
    ],
    (err) => {
      if (err) return res.status(500).send("Update failed");
      res.send("Updated");
    }
  );
});

// STATUS
app.put("/student/status/:adm", (req, res) => {
  db.query(
    "UPDATE students SET status=? WHERE admission_number=?",
    [req.body.status, req.params.adm],
    (err) => {
      if (err) return res.status(500).send("Error");
      res.send("OK");
    }
  );
});

// DELETE
app.delete("/student/delete/:adm", (req, res) => {
  db.query(
    "DELETE FROM students WHERE admission_number=?",
    [req.params.adm],
    (err) => {
      if (err) return res.status(500).send("Error");
      res.send("Deleted");
    }
  );
});





// ================= ADD TUITION =================
app.post("/add-tuition", async (req, res) => {

  console.log(req.body); // 🔥 DEBUG

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
      mother_name,
      contact_details,
      school_details,
      status,
      type
    } = req.body;

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : "";

    db.query(
      `INSERT INTO students
      (admission_number,name,password,batch,class_group,medium,board,
       father_name,mother_name,contact_details,school_details,status,type)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        admission_number,
        name,
        hashedPassword,
        batch,
        class_group,
        medium,
        board,
        father_name,
        mother_name,
        contact_details,
        school_details,
        status || "active",
        type || "tuition"
      ],
      (err) => {
if (err) {
  console.log("DB ERROR FULL:", err.sqlMessage || err);
  return res.status(500).send(err.sqlMessage || "DB Error");
}

        res.send("Added");
      }
    );
  } catch (e) {
    console.log("CATCH ERROR:", e);
    res.status(500).send("Server error");
  }
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

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${u.admission_number}.pdf`
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      const joinDate = new Date(u.created_at).toLocaleDateString();
      const joinTime = new Date(u.created_at).toLocaleTimeString();

      // ================= LOGOS =================
      const tuitionLogo = path.join(__dirname, "assets", "tuition logo.png");
      const associationLogo = path.join(__dirname, "assets", "assos logo.png");

      // ================= 🔥 WATERMARK (ONLY EDUCATION LOGO) =================
      const watermark = path.join(__dirname, "assets", "education logo.png");

      // ================= BACKGROUND =================
      doc.rect(0, 0, pageWidth, pageHeight).fill("#eef3ff");

      // ================= WATERMARK =================
      if (fs.existsSync(watermark)) {

        const wmSize = 300; // good visible size

        doc.save();
        doc.opacity(0.05); // very light watermark

        doc.image(
          watermark,
          (pageWidth - wmSize) / 2,
          (pageHeight - wmSize) / 2,
          { width: wmSize }
        );

        doc.restore();
      }

      // ================= HEADER =================
      doc.rect(0, 0, pageWidth, 150).fill("#0b3d91");

      // ================= LEFT → TUITION LOGO =================
      if (fs.existsSync(tuitionLogo)) {
        doc.image(tuitionLogo, 25, 30, { width: 80 });
      }

      // ================= RIGHT → ASSOCIATION LOGO =================
      if (fs.existsSync(associationLogo)) {
        doc.image(associationLogo, pageWidth - 105, 30, { width: 80 });
      }

      // ================= HEADER TEXT =================
      doc.fillColor("white");

      doc.font("Helvetica-Bold")
        .fontSize(30)
        .text("Success Tuition Center", 0, 35, {
          align: "center"
        });

      doc.font("Helvetica")
        .fontSize(13)
        .text("Affiliated with Tamilnadu Tuition Center Association-24250341", 0, 65, {
          align: "center"
        });

      doc.text("R.Pattanam (P.O), Rasipuram (TK), Namakkal (Dt) - 637408", 0, 85, {
        align: "center"
      });


          doc.text("gmail :  stcrpattanam@gmail.com", 0, 125, {
        align: "center"
        
      });

      doc.text("Cell : 9842927992, 8525927992", 0, 105, {
        align: "center"
        
      });



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

        doc.font("Helvetica-Bold")
          .text(value || "-", xLeft + 170, y);

        y += gap;
      };

      add("Name", u.name);
      add("Admission No", u.admission_number);
      add("Class and Group", u.class_group);
      add("Accademic Year", u.batch);
      add("Medium", u.medium);
      add("Board", u.board);
      add("Father Name", u.father_name);
      add("Mother Name", u.mother_name);
      add("Contact", u.contact_details.replace(/,/g, "\n"));
      add("School", u.school_details);
      add("Status", u.status);
      add("Joining Date", joinDate);
      add("Joining Time", joinTime);

      // ================= SIGNATURE =================
      const sigY = 690;

      doc.strokeColor("#000");

      doc.moveTo(80, sigY).lineTo(240, sigY).stroke();
      doc.fontSize(10).text("Chairman's Signature", 85, sigY + 5);

      doc.moveTo(360, sigY).lineTo(520, sigY).stroke();
      doc.text("Parent's Signature", 370, sigY + 5);

      doc.end();
    }
  );
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
      contact_details,
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
      (admission_number,name,password,batch,class_group,medium,board,
       father_name,contact_details,school_details,
       duration,exam_date,valid_upto,address,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,

      [
        admission_number,
        name || "",
        hashedPassword,
        batch || "",
        class_group || "",
        medium || "",
        board || "",
        father_name || "",
        contact_details || "",
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


// ================= 🔥 GET ALL COMPUTER =================
app.get("/computer-students", (req, res) => {
  db.query("SELECT * FROM computer_students ORDER BY id ASC", (err, r) => {
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


// ================= 🔥 GET SINGLE COMPUTER =================
app.get("/computer/:adm", (req, res) => {
  db.query(
    "SELECT * FROM computer_students WHERE admission_number=?",
    [req.params.adm],
    (err, r) => {
      if (err || r.length === 0)
        return res.status(404).send("Not found");

      res.json(r[0]);
    }
  );
});


// ================= 🔥 UPDATE COMPUTER (REMOVED mother_name) =================
app.put("/computer/update/:adm", (req, res) => {

  const adm = req.params.adm;

  db.query(
    "SELECT * FROM computer_students WHERE admission_number=?",
    [adm],
    (err, result) => {

      if (err || result.length === 0)
        return res.status(500).send("Fetch failed");

      const old = result[0];
      const d = req.body;

      const updated = {
        admission_number: d.admission_number || old.admission_number,
        name: d.name || old.name,
        class_group: d.class_group || old.class_group,
        batch: d.batch || old.batch,
        medium: d.medium || old.medium,
        board: d.board || old.board,
        school_details: d.school_details || old.school_details,
        father_name: d.father_name || old.father_name,
        contact_details: d.contact_details || old.contact_details,

        // NEW FIELDS (added support)
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
          school_details=?,
          father_name=?,
          contact_details=?,
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
          updated.school_details,
          updated.father_name,
          updated.contact_details,
          updated.duration,
          updated.valid_upto,
          updated.exam_date,
          updated.address,
          adm
        ],
        (err2) => {
          if (err2) return res.status(500).send("Update failed");
          res.send("Updated");
        }
      );
    }
  );
});


// ================= 🔥 STATUS =================
app.put("/computer/status/:adm", (req, res) => {
  db.query(
    "UPDATE computer_students SET status=? WHERE admission_number=?",
    [req.body.status, req.params.adm],
    (err) => {
      if (err) return res.status(500).send("Error");
      res.send("OK");
    }
  );
});


// ================= 🔥 DELETE =================
app.delete("/computer/delete/:adm", (req, res) => {
  db.query(
    "DELETE FROM computer_students WHERE admission_number=?",
    [req.params.adm],
    (err) => {
      if (err) return res.status(500).send("Error");
      res.send("Deleted");
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

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${u.admission_number}.pdf`
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // ================= DATE FORMAT FIX =================
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

      const joinDate = new Date(u.created_at).toLocaleDateString();
      const joinTime = new Date(u.created_at).toLocaleTimeString();

      // ================= FILES =================
      const educationLogo = path.join(__dirname, "assets", "education logo.png");
      const computerLogo = path.join(__dirname, "assets", "computer logo.png");
      const associationLogo = path.join(__dirname, "assets", "assos logo.png");

      // ================= BACKGROUND =================
      doc.rect(0, 0, pageWidth, pageHeight).fill("#eef3ff");
      doc.rect(0, 0, pageWidth, 120).fill("#0b3d91");

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

      // ================= HEADER LOGOS =================
      if (fs.existsSync(computerLogo)) {
        doc.image(computerLogo, 20, 20, { width: 85 });
      }

      if (fs.existsSync(associationLogo)) {
        doc.image(associationLogo, pageWidth - 105, 20, { width: 85 });
      }

      // ================= HEADER TEXT =================
      doc.fillColor("white")
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("SUCCESS COMPUTER CENTER", 0, 25, {
          align: "center"
        });

      doc.fontSize(13)
        .text("SARVA I.T & EDUCATIONAL DEVELOPMENT (SITED) - 4936", 0, 55, {
          align: "center"
        });

      doc.text("R.Pattanam (P.O), Rasipuram (TK), Namakkal (Dt) - 637408", 0, 70, {
        align: "center"
      });

      doc.text("gmail : sccrpattanam@gmail.com", 0, 85, {
        align: "center"
      });

      doc.text("Cell : 9842927992, 8525927992", 0, 150, {
        align: "center"
      });

      // ================= TITLE =================
      doc.fillColor("#0b3d91")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("STUDENT'S INFORMATION", 0, 125, {
          align: "center"
        });

      // ================= DATA =================
      doc.fillColor("#000");

      let x = 100;
      let y = 200;
      const gap = 28;

      const add = (label, value) => {
        doc.font("Helvetica")
          .fontSize(12)
          .text(`${label}: ${value || "-"}`, x, y);

        y += gap;
      };

      add("Name", u.name);
      add("Admission No", u.admission_number);
      add("Accademic year", u.batch);
      add("Course", u.class_group);
      
      add("Medium", u.medium);
      add("Board", u.board);
      add("Contact", u.contact_details.replace(/,/g, "\n"));

      add("Duration", u.duration);
      add("Valid Upto Date", formatDate(u.valid_upto));
      add("Exam Date", formatDate(u.exam_date));
      
      add("Address", u.address);

      add("Status", u.status);
      add("Joining Date", joinDate);
      add("Joining Time", joinTime);

      // ================= SIGNATURE =================
      const sigY = 710;

      doc.moveTo(120, sigY).lineTo(260, sigY).stroke();
      doc.fontSize(11).text("Chairman's Signature", 110, sigY + 10);

      doc.moveTo(350, sigY).lineTo(490, sigY).stroke();
      doc.text("Parent's Signature", 360, sigY + 10);

      doc.end();
    }
  );
});



// ================= COMPUTER GET ALL (SAFE AGAIN) =================
app.get("/computer/:adm", (req, res) => {
  db.query(
    "SELECT * FROM computer_students WHERE admission_number=?",
    [req.params.adm],
    (err, r) => {
      if (err || r.length === 0)
        return res.status(404).send("Not found");

      res.json(r[0]);
    }
  );
});



// ================= TUTORIAL REGISTRATION =================
app.post("/register", (req, res) => {

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
    mother_name,
    contact_details,
    address,
    status,
    type
  } = req.body;

  if (!admission_number || !name || !password) {
    return res.send("Required fields missing ❌");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

const sql = `
  INSERT INTO tutorial_registration
  (admission_number, name, password, batch, class_group, medium, board, subject,
   father_name, mother_name, contact_details, address, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

db.query(sql, [
  admission_number,
  name,
  hashedPassword,
  batch,
  class_group,
  medium,
  board,
  subject,
  father_name,
  mother_name,
  contact_details,
  address,
  status || "active"
], (err, result) => {


  if (err) {
    console.log("DB ERROR:", err);
    return res.send("Registration Failed ❌");
  }

  res.send("Registration Successful ✅");

});


});


// ================= STATUS TOGGLE =================
app.put("/tutorial/status/:adm", (req, res) => {

  const { status } = req.body;

  db.query(
    "UPDATE tutorial_registration SET status=? WHERE admission_number=?",
    [status, req.params.adm],
    (err) => {

      if (err) {
        console.log(err);
        return res.send("Status update failed ❌");
      }

      res.send("Status updated ✅");
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

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${u.admission_number}.pdf`
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      const joinDate = new Date(u.created_at).toLocaleDateString();
      const joinTime = new Date(u.created_at).toLocaleTimeString();

      const watermark = path.join(__dirname, "assets", "education logo.png");

      // ================= BACKGROUND =================
      doc.rect(0, 0, pageWidth, pageHeight).fill("#eef3ff");

      // ================= 🔥 WATERMARK (INCREASED SIZE) =================
      if (fs.existsSync(watermark)) {

        const wmSize = 260; // 🔥 INCREASED FROM 180 → 260

        const wmX = (pageWidth - wmSize) / 2;
        const wmY = (pageHeight - wmSize) / 2;

        doc.save();
        doc.opacity(0.07); // slightly visible than before

        doc.image(watermark, wmX, wmY, {
          width: wmSize
        });

        doc.restore();
      }

      // ================= HEADER =================
      doc.rect(0, 0, pageWidth, 140).fill("#0b3d91");

      const leftLogo = path.join(__dirname, "assets", "tutorial logo.png");
      const rightLogo = path.join(__dirname, "assets", "assos logo.png");

      if (fs.existsSync(leftLogo)) {
        doc.image(leftLogo, 25, 25, { width: 70 });
      }

      if (fs.existsSync(rightLogo)) {
        doc.image(rightLogo, pageWidth - 95, 25, { width: 70 });
      }

      // ================= HEADER TEXT =================

      doc.fillColor("white");

      doc.font("Helvetica-Bold")
        .fontSize(20)
        .text("Success Tutorial Center", 0, 35, {
          align: "center"
        });

      doc.font("Helvetica")
        .fontSize(13)
        .text(
          "Affiliated with Tamilnadu Tutorial Center Association-24250341",
          0,
          60,
          { align: "center" }
        );

      doc.text(
        "R.Pattanam (P.O), Rasipuram (TK), Namakkal (Dt) - 637408",
        0,
        78,
        { align: "center" }
      );

         doc.text("gmail :stcrpattanam@gmail.com", 0, 94, {
        align: "center"
        
      });

      doc.text("Cell : 9842927992, 8525927992", 0, 117, {
        align: "center"
      });

      // ================= TITLE =================
      doc.fillColor("#000");

      doc.font("Helvetica-Bold")
        .fontSize(14)
        .text("STUDENT'S INFORMATION", 0, 160, {
          align: "center"
        });

      // ================= CONTENT =================
      let y = 210;
      const xLeft = 80;
      const gap = 26;

      const add = (label, value) => {
        doc.fontSize(11)
          .font("Helvetica")
          .text(label, xLeft, y);

        doc.font("Helvetica-Bold")
          .text(value || "-", xLeft + 170, y);

        y += gap;
      };

      add("Name", u.name);
      add("Admission No", u.admission_number);
      add("Class and Group", u.class_group);
      add("Subject", u.subject);
      add("Accademic year", u.batch);
      add("Medium", u.medium);
      add("Board", u.board);
      add("Father Name", u.father_name);
      add("Mother Name", u.mother_name);
      add("Contact", u.contact_details.replace(/,/g, "\n"));
      add("Status", u.status);
      add("Joining Date", joinDate);
      add("Joining Time", joinTime);

      // ================= SIGNATURE =================
      const sigY = 690;

      doc.strokeColor("#000");

      doc.moveTo(80, sigY).lineTo(240, sigY).stroke();
      doc.fontSize(10).text("Chairman's Signature", 85, sigY + 5);

      doc.moveTo(350, sigY).lineTo(510, sigY).stroke();
      doc.text("Parent's Signature", 370, sigY + 5);

      doc.end();
    }
  );
});



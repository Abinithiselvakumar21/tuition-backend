<?php
$conn = new mysqli("localhost", "root", "", "tuition_db");

$category = $_GET['category'] ?? '';

$stmt = $conn->prepare("SELECT * FROM computer_material WHERE category=?");
$stmt->bind_param("s", $category);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html>
<head>
<title>Materials</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap" rel="stylesheet"> 
<style>
 *{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  font-family:'Poppins', sans-serif;
}

  /* ===== HEADER ===== */
html, body{
  max-width:100%;
  overflow-x:hidden;
}



/* ================= TOP HEADER ================= */
.top-header{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:35px;
  padding:20px;
  background: linear-gradient(135deg, #F8DDE3, #F3C7D3);
  position:relative;
  flex-wrap:wrap;
  text-align:center;
}

/* SHINE EFFECT */
.top-header::before{
  content:"";
  position:absolute;
  top:0;
  left:-100%;
  width:100%;
  height:100%;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent);
  animation:shine 6s infinite;
}

@keyframes shine{
  0%{ left:-100%; }
  100%{ left:100%; }
}

/* HEADER TEXT */
.header-center{
  text-align:center;
}

/* TITLE (similar to 5th image) */
.top-header h1{
  font-size:clamp(24px, 3vw, 52px);
  font-weight:700;
  color:#7B1E3A;
  letter-spacing:2px;
  font-family:'Cinzel', serif;
}

/* SUB TITLE */
.top-header h2{
  font-size:clamp(18px, 2.5vw, 26px);
  font-weight:600;
  color:#9A2E50;
  margin-top:5px;
font-family:'Cinzel', serif;
}

@media(max-width:768px){
  .top-header h2{
    font-size:26px !important;
  }
}


/* SUB TEXT */
.sub-text{
  font-size:clamp(14px, 2vw, 20px);
  font-weight:500;
  color:#6A2C45;
  margin-top:6px;
font-family:'Cinzel', serif;
}

/* LOGO */
.top-logo{
  width:clamp(90px, 10vw, 150px);
  height:auto;
}

/* ================= MAIN HEADER ================= */
.main-header{
  padding:14px 0;
  background: linear-gradient(135deg, #E9AFC0, #D98CA5);
  border-top:1px solid rgba(255,255,255,0.4);
}

/* NAV CONTAINER */
.container{
  width:95%;
  max-width:1300px;
  margin:auto;
  display:flex;
  justify-content:center;
  align-items:center;
  flex-wrap:wrap;
  gap:20px;
}


/* NAV LINKS */
.navbar a{
  color:#6A1B37;
  text-decoration:none;
  margin:0 12px;
  font-weight:600;
  font-size:16px;
  font-family:'Poppins', sans-serif;
  transition:0.3s;
}

.navbar a:hover{
  color:#ffffff;
}

/* RESPONSIVE */
@media(max-width:768px){
  .top-header{
    flex-direction:column;
    gap:15px;
  }

  .top-header h1{
    font-size:22px;
  }

  .top-header h2{
    font-size:18px;
  }

  .sub-text{
    font-size: 18px;
        font-weight: 500;
  }
}


.card{
    background:rgba(200, 0, 0, 0.1);;
    padding:15px;
    margin:10px;
    border-radius:10px;
    box-shadow:0 5px 10px rgba(0,0,0,0.1);
    color:Green;
    text-align:center;
}

a{
    text-decoration:none;
    color:orange;
    font-weight:bold;
}
</style>
</head>

<body>
<!-- ===== TOP HEADER ===== -->
<div class="top-header">
  <img src="assets/education logo.png" class="top-logo">

  <div class="header-center">
    <h1>SUCCESS EDUCATIONAL GROUP</h1>
    <h2 style="font-size:50px;">R.Pattanam</h2>
    <h2>(The Success Family)</h2>
    <div class="sub-text">கல்வியே துணை | Education is Our Ultimate Companion</div>
  </div>

  <img src="assets/assos logo.png" class="top-logo">
</div>

<h1 style="text-align:center; color:Green;"><?php echo htmlspecialchars($category); ?> Materials</h1>

<?php if($result->num_rows > 0){ ?>
    <?php while($row = $result->fetch_assoc()){ ?>

    <div class="card">
        <h3><?php echo htmlspecialchars($row['title']); ?></h3>

        <!-- FIXED PATH -->
        <a href="../computer_uploads/<?php echo $row['file']; ?>" target="_blank">
            📄 View PDF
        </a>

        <br><br>

        <a href="../computer_uploads/<?php echo $row['file']; ?>" download>
            ⬇ Download PDF
        </a>
    </div>

    <?php } ?>
<?php } else { ?>
    <h3 style="text-align:center; color:Green;">Upload Soon</h3>
<?php } ?>

<!-- FOOTER -->
<div id="footer"></div>

<script>
fetch('http://localhost:8080/success%20tuition/tuition-frontend/html/footer.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;
  });
</script>


</body>
</html>

<?php
$conn = new mysqli("localhost","root","","tuition_db");

$class = $_GET['class'] ?? '';
$board = $_GET['board'] ?? '';
$subject = $_GET['subject'] ?? '';

if($class=='' || $board=='' || $subject==''){
    die("Invalid Request");
}

$stmt = $conn->prepare("SELECT * FROM test_series WHERE class=? AND board=? AND subject=? ORDER BY id DESC");
$stmt->bind_param("sss",$class,$board,$subject);
$stmt->execute();

$result = $stmt->get_result();
?>
<!DOCTYPE html>
<html>
<head>
<title>Test Papers</title>

<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Cinzel:wght@400;600;700&display=swap" rel="stylesheet">

<style>
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  font-family:'Poppins', sans-serif;
  background:#f5f7ff;
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

.header-center{
  text-align:center;
}

.top-header h1{
  font-size:clamp(24px, 3vw, 52px);
  font-weight:700;
  color:#7B1E3A;
  letter-spacing:2px;
  font-family:'Cinzel', serif;
}

.top-header h2{
  font-size:clamp(18px, 2.5vw, 26px);
  font-weight:600;
  color:#9A2E50;
  margin-top:5px;
  font-family:'Cinzel', serif;
}

.sub-text{
  font-size:clamp(14px, 2vw, 20px);
  font-weight:500;
  color:#6A2C45;
  margin-top:6px;
  font-family:'Cinzel', serif;
}

.top-logo{
  width:clamp(90px, 10vw, 150px);
  height:auto;
}


.container{
    max-width:700px;
    margin:auto;
}
.card{
    background:#fff;
    padding:15px;
    margin:12px 0;
    border-radius:8px;
    box-shadow:0 3px 10px rgba(0,0,0,0.08);
}
.btn{
    padding:8px 14px;
    text-decoration:none;
    border-radius:5px;
    color:#fff;
    margin-right:8px;
}
.view{ background:#2563eb; }
.download{ background:#16a34a; }
.back{
    display:inline-block;
    margin-bottom:15px;
    text-decoration:none;
}
</style>

</head>
<body>

<!-- ===== HEADER ===== -->
<div class="top-header">
  <img src="assets/education logo.png" class="top-logo">

  <div class="header-center">
    <h1>SUCCESS EDUCATIONAL GROUP</h1>
    <h2>R.Pattanam</h2>
    <h2>(The Success Family)</h2>
    <div class="sub-text">கல்வியே துணை | Education is Our Ultimate Companion</div>
  </div>

  <img src="assets/assos logo.png" class="top-logo">
</div>

<div class="container">

<a class="back" href="/success tuition/tuition-frontend/html/tuition_test.html">⬅ Back</a>


<h2><?php echo $class; ?> - <?php echo $subject; ?> Tests</h2>

<?php
if($result->num_rows > 0){
while($row = $result->fetch_assoc()){

$fileName = $row['file'];
$filePath = __DIR__ . "/test_uploads/" . $fileName;
$fileURL  = "test_uploads/" . $fileName;
?>

<div class="card">
    <h3><?php echo $row['title']; ?></h3><br>

<?php if(file_exists($filePath)){ ?>

    <a class="btn view" href="<?php echo $fileURL; ?>" target="_blank">View</a>
    <a class="btn download" href="<?php echo $fileURL; ?>" download>Download</a>

<?php } else { ?>

    <p style="color:red;">File not found ❌</p>

<?php } ?>

</div>

<?php } } else { ?>

<p>No Tests Found</p>

<?php } ?>

</div>
<!-- FOOTER -->
<div id="footer"></div>

<script>
    /* FOOTER */
fetch('http://localhost:8080/success%20tuition/tuition-frontend/html/footer.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;
  });
</script>
</body>
</html>

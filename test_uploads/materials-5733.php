<?php
$conn = new mysqli("localhost", "root", "", "tuition_db");

$class = $_GET['class'] ?? '';
$board = $_GET['board'] ?? '';
$medium = $_GET['medium'] ?? '';
$subject = $_GET['subject'] ?? '';

$class = $conn->real_escape_string($class);
$board = $conn->real_escape_string($board);
$medium = $conn->real_escape_string($medium);
$subject = $conn->real_escape_string($subject);

$sql = "SELECT * FROM study_materials 
WHERE LOWER(class)=LOWER('$class') 
AND LOWER(board)=LOWER('$board') 
AND LOWER(medium)=LOWER('$medium')
AND LOWER(subject)=LOWER('$subject')
ORDER BY id DESC";




$result = $conn->query($sql);
?>


<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Success Tuition Center</title>

<link rel="stylesheet" href="../style/material.css">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>


<?php
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
?>
        <div style="border:1px solid #ccc; padding:10px; margin:10px;">
            <h3><?php echo $row['title']; ?></h3>
            
            <p>Class: <?php echo $row['class']; ?></p>
            <p>Board: <?php echo $row['board']; ?></p>
            <p>Subject: <?php echo $row['subject']; ?></p>
            <p>Medium: <?php echo $row['medium']; ?></p>

<div style="margin-top:10px;">
    <a href="uploads/<?php echo $row['file']; ?>" target="_blank" style="margin-right:10px;">
        👁 View
    </a>

    <a href="uploads/<?php echo $row['file']; ?>" download>
        📥 Download
    </a>
</div>

        </div>
<?php
    }
} else {
    echo "<p></p>";
}
?>

</div>



<header class="top-header">
<div class="header-inner">

<div class="left">
<img src="../image/education logo.png" class="logo">
</div>

<div class="header-text">
<h1>Success Educational Group,<br>
<span style="font-size:30px;">R.Pattanam</span>
</h1>
<p class="tamil">கல்வியே துணை</p><br>
<span>(Education is Our Ultimate Companion)</span>
</div>

</div>
</header>

<a href="login.html" class="logout-btn">Logout</a>

<section class="banner"></section>

<h1 class="section-title">Study Materials - 10th</h1>

<div class="materials">
<div class="board-row">

<!-- STATE -->
<div class="board-box">
<h1>State Board</h1>

<h2>Tamil Medium</h2>
<div class="courses-grid">

<a href="materials_list.php?class=10&board=state&medium=tamil&subject=Tamil" class="course-card">
    <img src="../image/tamil.jpg">
    <p>தமிழ்</p>
</a>

<a href="materials_list.php?class=10&board=state&medium=tamil&subject=English" class="course-card">
    <img src="../image/english.jpg">
    <p>English</p>
</a>

<a href="materials_list.php?class=10&board=state&medium=tamil&subject=Maths" class="course-card">
    <img src="../image/maths.jpg">
    <p>Maths</p>
</a>

<a href="materials_list.php?class=10&board=state&medium=tamil&subject=Science" class="course-card">
    <img src="../image/chemistry.png">
    <p>Science</p>
</a>

<a href="materials_list.php?class=10&board=state&medium=tamil&subject=Social" class="course-card">
    <img src="../image/soci_scie.png">
    <p>Social</p>
</a>



</div>

<h2>English Medium</h2>
<div class="courses-grid">

<a href="materials_list.php?class=10&board=state&medium=english&subject=Tamil" class="course-card">
    <img src="../image/tamil.jpg">
    <p>தமிழ்</p>
</a>

<a href="materials_list.php?class=10&board=state&medium=english&subject=English" class="course-card">
    <img src="../image/english.jpg">
    <p>English</p>
</a>

<a href="materials_list.php?class=10&board=state&medium=english&subject=Maths" class="course-card">
    <img src="../image/maths.jpg">
    <p>Maths</p>
</a>

<a href="materials_list.php?class=10&board=state&medium=english&subject=Science" class="course-card">
    <img src="../image/chemistry.png">
    <p>Science</p>
</a>

<a href="materials_list.php?class=10&board=state&medium=english&subject=Social" class="course-card">
    <img src="../image/soci_scie.png">
    <p>Social</p>
</a>

</div>
</div>

<!-- CBSE -->
<div class="board-box">
<h1>CBSE</h1>

<h2>English Medium</h2>
<div class="courses-grid">

<a href="materials_list.php?class=10&board=cbse&medium=english&subject=Tamil" class="course-card">
    <img src="../image/tamil.jpg">
    <p>தமிழ்</p>
</a>

<a href="materials_list.php?class=10&board=cbse&medium=english&subject=English" class="course-card">
    <img src="../image/english.jpg">
    <p>English</p>
</a>

<a href="materials_list.php?class=10&board=cbse&medium=english&subject=Maths" class="course-card">
    <img src="../image/maths.jpg">
    <p>Maths</p>
</a>

<a href="materials_list.php?class=10&board=cbse&medium=english&subject=Physics" class="course-card">
    <img src="../image/physics.png">
    <p>Physics</p>
</a>

<a href="materials_list.php?class=10&board=cbse&medium=english&subject=Social" class="course-card">
    <img src="../image/soci_scie.png">
    <p>Social</p>
</a>



</div>
</div>

</div>
</div>

<!-- ================= 12TH ================= -->

<h1 class="section-title">Study Materials - 12th</h1>

<div class="materials">
<div class="board-row">

<!-- STATE -->
<div class="board-box">
<h1>State Board</h1>

<h2>Tamil Medium</h2>
<div class="courses-grid">

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Tamil" class="course-card">
    <img src="../image/tamil.jpg">
    <p>தமிழ்</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=English" class="course-card">
    <img src="../image/english.jpg">
    <p>English</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Maths" class="course-card">
    <img src="../image/maths.jpg">
    <p>Maths</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Physics" class="course-card">
    <img src="../image/physics.png">
    <p>Physics</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Chemistry" class="course-card">
    <img src="../image/chemistry.png">
    <p>Chemistry</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Botany" class="course-card">
    <img src="../image/botany.png">
    <p>Botany</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Zoology" class="course-card">
    <img src="../image/zoology.png">
    <p>Zoology</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Biology" class="course-card">
    <img src="../image/biology.jpg">
    <p>Biology</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Computer_Science" class="course-card">
    <img src="../image/cs.png">
    <p>Computer Science</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Accountancy" class="course-card">
    <img src="../image/accounts.jpg">
    <p>Accountancy</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Economics" class="course-card">
    <img src="../image/economics.png">
    <p>Economics</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=Commerce" class="course-card">
    <img src="../image/commerce.jpg">
    <p>Commerce</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=tamil&subject=History" class="course-card">
    <img src="../image/history.png">
    <p>History</p>
</a>


</div>

<h2>English Medium</h2>
<div class="courses-grid">

<a href="materials_list.php?class=12&board=state&medium=english&subject=Tamil" class="course-card">
    <img src="../image/tamil.jpg">
    <p>தமிழ்</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=English" class="course-card">
    <img src="../image/english.jpg">
    <p>English</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=Maths" class="course-card">
    <img src="../image/maths.jpg">
    <p>Maths</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=Physics" class="course-card">
    <img src="../image/physics.png">
    <p>Physics</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=Chemistry" class="course-card">
    <img src="../image/chemistry.png">
    <p>Chemistry</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=Botany" class="course-card">
    <img src="../image/botany.png">
    <p>Botany</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=Zoology" class="course-card">
    <img src="../image/zoology.png">
    <p>Zoology</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=Biology" class="course-card">
    <img src="../image/biology.jpg">
    <p>Biology</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=Computer_Science" class="course-card">
    <img src="../image/cs.png">
    <p>Computer Science</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=Accountancy" class="course-card">
    <img src="../image/accounts.jpg">
    <p>Accountancy</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=Economics" class="course-card">
    <img src="../image/economics.png">
    <p>Economics</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=Commerce" class="course-card">
    <img src="../image/commerce.jpg">
    <p>Commerce</p>
</a>

<a href="materials_list.php?class=12&board=state&medium=english&subject=History" class="course-card">
    <img src="../image/history.png">
    <p>History</p>
</a>



</div>
</div>

<!-- CBSE -->
<div class="board-box">
<h1>CBSE</h1>

<h2>English Medium</h2>
<div class="courses-grid">

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Tamil" class="course-card">
    <img src="../image/tamil.jpg">
    <p>தமிழ்</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=English" class="course-card">
    <img src="../image/english.jpg">
    <p>English</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Maths" class="course-card">
    <img src="../image/maths.jpg">
    <p>Maths</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Physics" class="course-card">
    <img src="../image/physics.png">
    <p>Physics</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Chemistry" class="course-card">
    <img src="../image/chemistry.png">
    <p>Chemistry</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Botany" class="course-card">
    <img src="../image/botany.png">
    <p>Botany</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Zoology" class="course-card">
    <img src="../image/zoology.png">
    <p>Zoology</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Biology" class="course-card">
    <img src="../image/biology.jpg">
    <p>Biology</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Computer_Science" class="course-card">
    <img src="../image/cs.png">
    <p>Computer Science</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Accountancy" class="course-card">
    <img src="../image/accounts.jpg">
    <p>Accountancy</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Economics" class="course-card">
    <img src="../image/economics.png">
    <p>Economics</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=Commerce" class="course-card">
    <img src="../image/commerce.jpg">
    <p>Commerce</p>
</a>

<a href="materials_list.php?class=12&board=cbse&medium=english&subject=History" class="course-card">
    <img src="../image/history.png">
    <p>History</p>
</a>


</div>
</div>

</div>
</div>

<!-- FOOTER -->
<div id="footer"></div>

<script>
fetch('./footer.html')
.then(res => res.text())
.then(data => {
document.getElementById("footer").innerHTML = data;
});
</script>

<!-- Code injected by live-server -->
<script>
	// <![CDATA[  <-- For SVG support
	if ('WebSocket' in window) {
		(function () {
			function refreshCSS() {
				var sheets = [].slice.call(document.getElementsByTagName("link"));
				var head = document.getElementsByTagName("head")[0];
				for (var i = 0; i < sheets.length; ++i) {
					var elem = sheets[i];
					var parent = elem.parentElement || head;
					parent.removeChild(elem);
					var rel = elem.rel;
					if (elem.href && typeof rel != "string" || rel.length == 0 || rel.toLowerCase() == "stylesheet") {
						var url = elem.href.replace(/(&|\?)_cacheOverride=\d+/, '');
						elem.href = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_cacheOverride=' + (new Date().valueOf());
					}
					parent.appendChild(elem);
				}
			}
			var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
			var address = protocol + window.location.host + window.location.pathname + '/ws';
			var socket = new WebSocket(address);
			socket.onmessage = function (msg) {
				if (msg.data == 'reload') window.location.reload();
				else if (msg.data == 'refreshcss') refreshCSS();
			};
			if (sessionStorage && !sessionStorage.getItem('IsThisFirstTime_Log_From_LiveServer')) {
				console.log('Live reload enabled.');
				sessionStorage.setItem('IsThisFirstTime_Log_From_LiveServer', true);
			}
		})();
	}
	else {
		console.error('Upgrade your browser. This Browser is NOT supported WebSocket for Live-Reloading.');
	}
	// ]]>
</script>
</body>
</html>

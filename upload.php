<?php

// 🔐 Allow only POST request
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die("❌ Invalid Access");
}

// DB connection
$conn = new mysqli("localhost", "root", "", "tuition_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Form data
$class = $_POST['class'] ?? '';
$board = $_POST['board'] ?? '';
$medium = $_POST['medium'] ?? '';
$subject = $_POST['subject'] ?? '';
$title = $_POST['title'] ?? '';

// File check
if (!isset($_FILES['pdf']) || $_FILES['pdf']['error'] != 0) {
    die("❌ No file uploaded");
}

// File info
$file = $_FILES['pdf']['name'];
$temp = $_FILES['pdf']['tmp_name'];

// Unique filename
$newFileName = time() . "_" . basename($file);

/* ⭐ IMPORTANT FIX (STEP 5)
   Upload folder MUST be inside frontend so browser can access it
*/
$uploadDir = __DIR__ . "/../tuition-frontend/html/uploads/";

// Create folder if not exists
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Full path
$uploadPath = $uploadDir . $newFileName;

// Move file
if (move_uploaded_file($temp, $uploadPath)) {

    // Save ONLY filename in DB
    $sql = "INSERT INTO study_materials 
    (class, board, medium, subject, title, file)
    VALUES 
    ('$class', '$board', '$medium', '$subject', '$title', '$newFileName')";

    if ($conn->query($sql) === TRUE) {
        echo "✅ Upload Success!";
    } else {
        echo "❌ DB Error: " . $conn->error;
    }

} else {
    echo "❌ File Upload Failed!";
}

$conn->close();

?>

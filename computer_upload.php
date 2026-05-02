<?php
$conn = new mysqli("localhost", "root", "", "tuition_db");

if($conn->connect_error){
    die("DB Connection Failed");
}

$course = $_POST['course'];
$category = $_POST['category'];
$title = $_POST['title'];

$file = $_FILES['pdf']['name'];
$tmp = $_FILES['pdf']['tmp_name'];

/* 🧠 CLEAN FILE NAME (NO NUMBER, BUT SAFE) */
$name = pathinfo($file, PATHINFO_FILENAME);
$ext  = pathinfo($file, PATHINFO_EXTENSION);

/* Replace spaces with dash */
$name = str_replace(" ", "-", $name);

/* Add small random number to avoid overwrite */
$newfile = $name . "-" . rand(1000,9999) . "." . $ext;

/* 📁 CORRECT FOLDER PATH */
$folder = __DIR__ . "/computer_uploads/";

if(!is_dir($folder)){
    mkdir($folder, 0777, true);
}

$target = $folder . $newfile;

/* 📤 MOVE FILE */
if(move_uploaded_file($tmp, $target)){

    $stmt = $conn->prepare("
        INSERT INTO computer_material (course, category, title, file)
        VALUES (?, ?, ?, ?)
    ");

    $stmt->bind_param("ssss", $course, $category, $title, $newfile);

    if($stmt->execute()){
        $msg = "success";
    } else {
        $msg = "db_error";
    }

} else {
    $msg = "upload_failed";
}

$conn->close();
?>

<!-- 🔥 REDIRECT BACK TO FORM -->
<script>
    window.location.href = "../tuition-frontend/html/computer_upload_form.php?msg=<?php echo $msg; ?>";
</script>

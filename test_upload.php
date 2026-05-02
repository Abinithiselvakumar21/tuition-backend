<?php
$conn = new mysqli("localhost","root","","tuition_db");

if($conn->connect_error){
    die("DB Connection Failed");
}

$class = $_POST['class'];
$board = $_POST['board'];
$subject = $_POST['subject'];
$title = $_POST['title'];

$file = $_FILES['pdf']['name'];
$tmp = $_FILES['pdf']['tmp_name'];

/* rename file */
$name = pathinfo($file, PATHINFO_FILENAME);
$ext = pathinfo($file, PATHINFO_EXTENSION);
$newfile = $name . "-" . rand(1000,9999) . "." . $ext;

/* folder */
$folder = __DIR__ . "/test_uploads/";

if(!is_dir($folder)){
    mkdir($folder, 0777, true);
}

$target = $folder . $newfile;

if(move_uploaded_file($tmp,$target)){

    // 🔥 FIXED QUERY (removed medium)
    $stmt = $conn->prepare("INSERT INTO test_series(class,board,subject,title,file) VALUES(?,?,?,?,?)");

    if(!$stmt){
        die("Prepare Failed: " . $conn->error);
    }

    $stmt->bind_param("sssss",$class,$board,$subject,$title,$newfile);

    if($stmt->execute()){
        echo "Upload Success";
    } else {
        echo "DB Error";
    }

} else {
    echo "Upload Failed";
}
?>

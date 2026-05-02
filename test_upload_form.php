<!DOCTYPE html>
<html>
<head>
<title>Upload Test</title>

<style>
/* ===== GLOBAL ===== */
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:'Poppins', Arial;
}

body{
    background:linear-gradient(135deg,#f4f4f4,#e9e9ff);
    display:flex;
    justify-content:center;
    align-items:center;
    min-height:100vh;
    padding:15px;
}

/* ===== CARD ===== */
.box{
    background:#fff;
    width:100%;
    max-width:420px;
    padding:25px;
    border-radius:15px;
    box-shadow:0 10px 25px rgba(0,0,0,0.15);
    animation:fadeIn 0.6s ease-in-out;
}

/* TITLE */
h2{
    text-align:center;
    margin-bottom:20px;
    color:#6f42c1;
}

/* INPUTS */
select,input{
    width:100%;
    padding:12px;
    margin-top:12px;
    border:1px solid #ddd;
    border-radius:10px;
    font-size:14px;
    transition:0.3s;
}

select:focus,input:focus{
    border-color:#6f42c1;
    box-shadow:0 0 8px rgba(111,66,193,0.3);
    outline:none;
}

/* BUTTON */
button{
    width:100%;
    padding:12px;
    margin-top:15px;
    border:none;
    border-radius:10px;
    background:linear-gradient(135deg,#ff4ecd,#6f42c1);
    color:#fff;
    font-size:16px;
    font-weight:bold;
    cursor:pointer;
    transition:0.3s;
}

button:hover{
    transform:scale(1.03);
    box-shadow:0 5px 15px rgba(111,66,193,0.3);
}

/* ANIMATION */
@keyframes fadeIn{
    from{opacity:0; transform:translateY(20px);}
    to{opacity:1; transform:translateY(0);}
}

/* ===== MOBILE RESPONSIVE ===== */
@media(max-width:500px){
    .box{
        padding:20px;
        border-radius:12px;
    }

    h2{
        font-size:18px;
    }

    select,input,button{
        font-size:13px;
        padding:10px;
    }
}

</style>

</head>

<body>

<div class="box">

<h2>📚 Upload Test Paper</h2>

<form action="test_upload.php" method="POST" enctype="multipart/form-data">

<!-- CLASS -->
<select name="class" id="class" onchange="loadSubject()" required>
    <option value="">Select Class</option>
    <option value="10">10th</option>
    <option value="12">12th</option>
</select>


<!-- MEDIUM -->
<!--<select name="medium" id="medium" onchange="loadSubject()" required>
    <option value="">Select Medium</option>
      <option value="Tamil ">Tamil Medium</option>
    <option value="English ">English Medium</option>
</select>-->


<!-- BOARD -->
<select name="board" id="board" onchange="loadSubject()" required>
    <option value="">Select Board</option>
    <option value="State">State Board</option>
    <option value="CBSE">CBSE</option>
</select>



<!-- SUBJECT -->
<select name="subject" id="subject" required>
    <option value="">Select Subject</option>
</select>

<!-- TITLE -->
<input type="text" name="title" placeholder="Enter Test Title" required>

<!-- FILE -->
<input type="file" name="pdf" required>

<button type="submit">⬆ Upload Test</button>

</form>

</div>

<script>

const subjectData = {

    "State": {
        "10": [
            "Tamil","English","Maths","Science","Social Science"
        ],
        "12": [
            "Tamil","English","Maths","Physics","Chemistry","Botany","Zoology","Biology",
            "Computer Science","Accountancy","Economics","Commerce",
            "History"
        ]
    },

    "CBSE": {
        "10": [
            "English","Maths","Science","Social Science","Computer Basics"
        ],
        "12": [
             "Tamil","English","Maths","Physics","Chemistry","Botany","Zoology","Biology",
            "Computer Science","Accountancy","Economics","Commerce",
            "History"
        ]
    }
};

function loadSubject(){

    let board = document.getElementById("board").value;
    let cls = document.getElementById("class").value;
    let subject = document.getElementById("subject");

    subject.innerHTML = "<option value=''>Select Subject</option>";

    if(subjectData[board] && subjectData[board][cls]){

        subjectData[board][cls].forEach(s => {
            let opt = document.createElement("option");
            opt.value = s;
            opt.text = s;
            subject.appendChild(opt);
        });

    }
}

</script>





</body>
</html>

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for user data and files (for demonstration purposes)
const users = [];
const files = [];

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({ secret: "your_secret_key", resave: true, saveUninitialized: true }),
);
app.use(express.static("uploads"));

// Set up file storage with multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Check if the username is already taken
  if (users.some((user) => user.username === username)) {
    return res.send("Username already taken.");
  }

  // Hash the password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;

    // Store user data (for demonstration purposes)
    users.push({
      username: username,
      passwordHash: hash,
    });

    res.send('Registration successful. <a href="/">Login</a>');
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Find the user by username
  const user = users.find((user) => user.username === username);

  if (user) {
    // Compare the hashed password
    bcrypt.compare(password, user.passwordHash, (err, result) => {
      if (err) throw err;

      if (result) {
        // Store user information in session
        req.session.username = username;
        res.redirect("/dashboard");
      } else {
        res.send("Incorrect password.");
      }
    });
  } else {
    res.send('User not found. <a href="/">Register</a>');
  }
});

app.get("/dashboard", (req, res) => {
  // Check if the user is authenticated
  if (req.session.username) {
    res.sendFile(path.join(__dirname, "dashboard.html"));
  } else {
    res.redirect("/");
  }
});

app.post("/upload", upload.array("files"), (req, res) => {
  // Check if the user is authenticated
  if (req.session.username) {
    // Store file information (for demonstration purposes)
    const uploadedFiles = req.files.map((file) => file.originalname);
    files.push({
      username: req.session.username,
      files: uploadedFiles,
    });

    res.send("Files uploaded successfully.");
  } else {
    res.redirect("/");
  }
});

app.get("/files", (req, res) => {
  // Check if the user is authenticated
  if (req.session.username) {
    // Retrieve and display user's files
    const userFiles = files.filter(
      (file) => file.username === req.session.username,
    );
    res.json(userFiles);
  } else {
    res.redirect("/");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

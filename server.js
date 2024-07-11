const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const app = express();
const PORT = 3000;
const BASE_DIRECTORY = "../../../"; // Replace with the base directory path you want to serve

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware to handle sessions
app.use(
  session({
    secret: "asjkduqwehdoqiwdoiuqiuwdiqwyduqywdiquwiduhqwuh", // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.static("public"));

// Multer configuration for file upload
const upload = multer({ dest: "uploads/" });

// Function to authenticate users
function authenticateUser(username, password) {
  const users = JSON.parse(
    fs.readFileSync(path.join(__dirname, "private", "users.json"), "utf-8")
  );
  return users.find(
    (user) => user.username === username && user.password === password
  );
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.type === "admin") {
    return next();
  } else {
    res.status(403).send("Forbidden: Admins only");
  }
}

// Serve the login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = authenticateUser(username, password);
  if (user) {
    req.session.user = user;
    res.redirect("/");
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// Handle logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Serve the HTML file
app.get("/", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint to get the list of files and directories
app.get("/files", isAuthenticated, (req, res) => {
  const dirPath = req.query.dir
    ? path.join(BASE_DIRECTORY, req.query.dir)
    : BASE_DIRECTORY;

  fs.readdir(dirPath, { withFileTypes: true }, (err, items) => {
    if (err) {
      return res.status(500).json({ error: "Unable to scan directory" });
    }

    const fileDetails = items.map((item) => {
      const itemPath = path.join(dirPath, item.name);
      const stats = fs.statSync(itemPath);
      return {
        name: item.name,
        type: item.isDirectory() ? "directory" : "file",
        created: stats.birthtime,
      };
    });

    res.json({ path: req.query.dir || "", files: fileDetails });
  });
});

const uploadFolderDir = path.join(__dirname, "/uploads"); // Replace with your actual upload directory path

function emptyUploadDir(dirPath) {
  fs.readdir(dirPath, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      const filePath = path.join(dirPath, file);

      fs.lstat(filePath, (err, stats) => {
        if (err) throw err;

        if (stats.isDirectory()) {
          // Recursively delete files in subdirectories
          emptyUploadDir(filePath);
        } else {
          // Delete file
          fs.unlink(filePath, (err) => {
            if (err) throw err;
          });
        }
      });
    }
  });
}

// Route to handle file uploads
app.post(
  "/upload",
  isAuthenticated,
  isAdmin,
  upload.single("file"),
  (req, res) => {
    emptyUploadDir(uploadFolderDir);
    const file = req.file;
    const uploadDir = BASE_DIRECTORY + req.body.uploadDir; // Directory path to save the file

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    // Move the uploaded file to the specified directory
    const targetDir = path.join(__dirname, uploadDir);
    const targetPath = path.join(targetDir, file.originalname);

    fs.rename(file.path, targetPath, (err) => {
      if (err) {
        console.error("Error moving file:", err);
        return res.status(500).send("Error uploading file.");
      }
      res.send("File uploaded successfully.");
    });
  }
);

// Endpoint to download a file
app.get("/download", isAuthenticated, isAdmin, (req, res) => {
  const filePath = path.join(BASE_DIRECTORY, req.query.path);

  const stat = fs.statSync(filePath);

  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-Length": stat.size,
    "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
  });

  const readStream = fs.createReadStream(filePath);

  readStream.on("error", (err) => {
    console.error("Stream error:", err);
    if (!res.headersSent) {
      res.status(500).send("File not found");
    }
  });

  readStream.pipe(res);

  res.on("close", () => {
    readStream.destroy();
  });
});

// Function to get the local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

app.listen(PORT, () => {
  const ipAddress = getLocalIpAddress();
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Server is also accessible at http://${ipAddress}:${PORT}`);
});

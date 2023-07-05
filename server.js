// server.js
const express = require("express");
const path = require("path");
const app = express();

// Set the static files location that express will serve up
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("Server is running on port", PORT);
});

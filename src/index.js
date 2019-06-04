const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/app.html"));
});

app.listen(port, () => console.log(`Exampl app listening on port ${port}!`));

const express = require("express");
const path = require("path");
const reload = require("reload");

const app = express();
const port = 3000;

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/app.html"));
});

reload(app)
  .then(() => {
    // reloadReturned is documented in the returns API in the README
    app.listen(port, () =>
      console.log(`Example app listening on port ${port}!`)
    );
  })
  .catch(function(err) {
    console.error(
      "Reload could not start, could not start server/sample app",
      err
    );
  });

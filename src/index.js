const DBimport = require("./FireDB.js");
const express = require("express");
const path = require("path");
const reload = require("reload");

const app = express();
const port = 3000;
const db = DBimport.firestore;

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/app.html"));
});

// routes will go here
app.get(
  "/api/time/:timeStamp/level/:levelVal/positionLat/:Lat/positionLon/:Lon",
  function(req, res) {
    const { timeStamp, levelVal, Lat, Lon } = req.params;
    const d = new Date();
    const serverNow = Math.round(d.getTime() / 1000);
    db.collection("audioPos")
      .add({
        clintTime: timeStamp,
        serverTime: serverNow - timeStamp,
        level: levelVal,
        Lat,
        Lon,
      })
      .then(ref => {
        console.log("Added document with ID: ", ref.id);
      });
  }
);

app.get("/api/position", function(req, res) {
  var user_id = req.param("id");
  var token = req.param("token");
  var pos = req.param("pos");

  console.log(user_id, token, pos);
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

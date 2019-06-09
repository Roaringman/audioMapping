const DBimport = require("./FireDB.js");
const express = require("express");
const path = require("path");
const reload = require("reload");

const app = express();
const port = 3000;
const db = DBimport.firestore;

app.use(express.static(__dirname + "/public"));
app.use(express.json({limit: "1mb"}))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/app.html"));
});

app.post('/api', (request, response) => {
  const data = request.body;
  const d = new Date();
  const serverNow = Math.round(d.getTime() / 1000);

  db.collection("audioPos")
      .add({
        clintTime: data.timeStamp,
        serverTime: serverNow - data.timeStamp,
        level: data.level,
        Lat: data.lat,
        Lon: data.lon,
      })
      .then(ref => {
        console.log("Added document with ID: ", ref.id);
      });

    response.json = {status: "Success"};
    response.end();
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

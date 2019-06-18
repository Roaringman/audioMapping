const dotenv = require('dotenv').config()
const pgdb = require('./pg.js')
const DBimport = require("./FireDB.js");
const express = require("express");
const path = require("path");
const reload = require("reload");
const https = require('https')
const fs = require('fs')

if (dotenv.error) {
  throw dotenv.error
}

pgdb.select

const app = express();
const port = 3000;
const db = DBimport.firestore;

app.use(express.static(__dirname + "/public"));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/app.html"));
});

app.post('/api', (request, response) => {
  const data = request.body;
  const d = new Date();
  const serverNow = Math.round(d.getTime() / 1000);

  const { timeStamp, level, lat, lon } = data;

  db.collection("audioPos")
    .add({
      clintTime: timeStamp,
      serverTime: serverNow - timeStamp,
      level: level,
      Lat: lat,
      Lon: lon,
    })
    .then(ref => {
      console.log("Added document with ID: ", ref.id);
    });

  response.json = { status: "Success" };
  response.end();
});

app.get('/api/read', (request, response) => {

  const responseData = [];

  db.collection("audioPos").where("level", ">=", 1)
    .get()
    .then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        responseData.push(doc.data());
      }
      );
      response.json(responseData);
    })
    .catch(function (error) {
      console.log("Error getting documents: ", error);
    });

})

// use reload on local machine and https on production environment

if (process.env.LOCALHOST == "true") {
  reload(app)
    .then(() => {
      // reloadReturned is documented in the returns API in the README
      app.listen(port, () =>
        console.log(`Example app listening on port ${port}!`)
      );
    })
    .catch(function (err) {
      console.error(
        "Reload could not start, could not start server/sample app",
        err
      );
    });
} else {
  https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/lydsans.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/lydsans.com/fullchain.pem')
  }, app)
    .listen(port, function () {
      console.log('app running and listening on port 3000! Go to https://lydsans.com:3000')
    });
}



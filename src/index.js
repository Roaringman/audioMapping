const dotenv = require("dotenv").config();
const pgdb = require("./pg.js");
//const DBimport = require("./FireDB.js");
const express = require("express");
const path = require("path");
const reload = require("reload");
const https = require("https");
const fs = require("fs");

if (dotenv.error) {
  throw dotenv.error;
}

const app = express();
const port = 3000;
//const db = DBimport.firestore;
const cache = { lastDBRead: 0 };
const cacheResetTimer = 60; //seconds

app.use(express.static(__dirname + "/public"));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/app.html"));
});

app.post("/api", (request, response) => {
  const data = request.body;
  const d = new Date();
  const serverNow = Math.round(d.getTime() / 1000); //TODO: add to db + local time zone instead of UTC

  const { timeStamp, level, lat, lon } = data;

  pgdb.insert(level, lat, lon, timeStamp);

  response.json = { status: "Success" };
  response.end();
});

// Express middleware used for caching.
// If the request comes in before the cacheResetTimer, the response will be send from the cache.
// If there is no cache yet or the request comes later than the cacheResetTimer, the response is send from the Database and the cache is reset.

// const midWare = (request, response, next) => {
//   const d = new Date();
//   const timeNow = Math.round(d.getTime() / 1000);
//   const key = timeNow - cache.lastDBRead;
//   if (key < cacheResetTimer && cache.data) {
//     response.send(cache.data);
//   } else {
//     cache["data"] = [];
//     cache["lastDBRead"] = timeNow;
//     db.collection("audioPos")
//       .where("level", ">=", 1)
//       .get()
//       .then(function(querySnapshot) {
//         querySnapshot.forEach(function(doc) {
//           cache.data.push(doc.data());
//         });
//         response.json(cache.data);
//       })
//       .catch(function(error) {
//         console.log("Error getting documents: ", error);
//       });
//   }
//   next();
// };

// app.get("/api/read", midWare, (request, response) => {});

app.get("/api/read", (request, response) => {
  var rows = pgdb.select(response);
});

// use reload on local machine and https on production environment

if (process.env.LOCALHOST == "true") {
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
} else {
  https
    .createServer(
      {
        key: fs.readFileSync("/etc/letsencrypt/live/lydsans.com/privkey.pem"),
        cert: fs.readFileSync(
          "/etc/letsencrypt/live/lydsans.com/fullchain.pem"
        ),
      },
      app
    )
    .listen(port, function() {
      console.log(
        "app running and listening on port 3000! Go to https://lydsans.com:3000"
      );
    });
}

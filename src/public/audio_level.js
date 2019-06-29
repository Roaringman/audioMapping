var audio_average;
var gps_block;
var last_commit = {
  time: null,
  lat: null,
  long: null,
};
var audio_level = document.getElementById("audio_level");
var position = document.getElementById("position");
var accuracy = document.getElementById("accuracy");
var timestamp = document.getElementById("timestamp");
var responsesStatus = document.getElementById("responseStatus");
var reloadTimer = document.getElementById("reloadTimer");
let sliderTime = document.getElementById("timeToReload").value;

//Reference to DOM element containing the map
const mymap = L.map("mapid", {
  attributionControl: false,
});
L.control.attribution({ position: "bottomleft" }).addTo(mymap);

//55.628350, 12.062129
// 55.608651, 12.110839

const bbox = [12.052129, 55.608651, 12.110839, 55.62835]; //[12.45, 55.591973, 12.663809, 55.71];kbh
const areaBbox = turf.bboxPolygon(bbox);

//Create hex grid - Arguments are bounding box array and cell size in kilometers
const hexgrid = createHexGrid(bbox, 0.03);
const center = turf.center(hexgrid);
const initLon = center.geometry.coordinates[0];
const initLat = center.geometry.coordinates[1];

//Initialize map - Arguments are lat, lon and zoom level.
buildMap(initLat, initLon, 11);

const hexGridLayer = new L.LayerGroup();
const circleLayer = new L.LayerGroup();
const festivalArea = new L.LayerGroup();

let scale = d3
  .scaleLinear()
  .domain([1, 100])
  .range([0.1, 0.9]);

async function getData() {
  const audioLocations = [];

  const response = await fetch("/api/read");
  const data = await response.json();
  data.map(audioPoint => {
    audioLocations.push(
      turf.point([audioPoint.lon, audioPoint.lat], {
        level: audioPoint.level_mean,
      })
    );
  });
  let points = await turf.featureCollection(audioLocations);
  //await displayPoints(points);
  const joined = await spatialJoin(points, hexgrid);
  //only show the hexgrid cells containing measurements
  const joinedFiltered = joined.features.filter(
    hex => hex.properties.level.length > 0
  );

  if (!mymap.hasLayer(hexGridLayer)) {
    addHexgridLayer(joinedFiltered);
    hexGridLayer.addTo(mymap);
  } else {
    mymap.removeLayer(hexGridLayer);
    hexGridLayer.addTo(mymap);
  }
  //bins(joined);
}

let time = sliderTime * 60;

function loadData() {
  resetTimer(sliderTime);
  getData();
}

function updateSlider(slideAmount) {
  resetTimer(slideAmount);
}

let timer = setInterval(tick, 1000);

function resetTimer(sliderTime) {
  time = sliderTime * 60;
}

function tick() {
  time--;
  if (time <= 0) {
    clearInterval(timer);
    getData();
    resetTimer(sliderTime);
  }
  reloadTimer.innerHTML = `${Math.floor(time / 60)}:${("0" + (time % 60)).slice(
    -2
  )}`.toString();
}

function collectCalibrationData() {
  let key_input = document.getElementById("key_input");

  let audio_collection = [];
  let x = 10;

  function setTimer(callback) {
    for (var i = 0; i < x; i++) {
      setTimeout(callback, 500 * i);
    }
  }

  setTimer(function() {
    audio_collection.push(audio_average);

    if (audio_collection.length >= x) {
      let average = array => array.reduce((a, b) => a + b) / array.length;

      console.log("collection_avg:", average(audio_collection));

      const data = {
        sessionid: Math.floor(Math.random() * 100000), // TODO change to danymic
        level: average(audio_collection),
        key: key_input.value,
      };

      const options = createOptions(data);

      postCalibration(options);
    }
  });
}

function postCalibration(options) {
  fetch("/api/post/calibration", options)
    .then(response => {
      if (response.status === 200) {
        responsesStatus.innerHTML = "Successfully sent data";
      } else {
        responsesStatus.innerHTML = "Could not send data to server!";
      }
    })
    .catch(error => console.error(error));
}

function postLevelPos(options) {
  fetch("/api/post/levelPos", options).then(response => {
    if (response.status === 200) {
      (responsesStatus.innerHTML = "Successfully sent data"),
        (last_commit.time = options.body.time),
        (last_commit.lat = options.body.lat),
        (last_commit.lon = options.body.lon);
    } else {
      responsesStatus.innerHTML = "Could not send data to server!";
    }
  });
}

function createOptions(data) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  return options;
}

function read_vars() {
  const lat = gps_block.latitude;
  const lon = gps_block.longitude;
  let currentLocation = turf.point([lon, lat]);
  //Check if user is inside the grid and only posts if that is the case
  if (turf.booleanPointInPolygon(currentLocation, areaBbox)) {
    const d = new Date();
    const frontnow = Math.round(d.getTime() / 1000); //UTC
    const timeStamp = frontnow;
    const level = audio_average;
    const data = { level, lat, lon, timeStamp };

    if (
      last_commit.time + 60 < timeStamp ||
      last_commit.lat != lat ||
      last_commit.lon != lon
    ) {
      const options = createOptions(data);

      postLevelPos(options);
      const currentGrid = hexgrid.features.filter(currentGrid =>
        turf.booleanPointInPolygon(currentLocation, currentGrid)
      );
      const userCenter = turf.centerOfMass(currentGrid[0]);
      const userOptions = {
        steps: 10,
        units: "kilometers",
      };

      showUserPosition(userCenter.geometry.coordinates.reverse());
    } else {
      responsesStatus.innerHTML =
        "Did not send data. No position change or timer not exceeded";
    }
  } else {
    responsesStatus.innerHTML =
      "Did not send data. You do not appear to be inside the area";
  }
}

getData(); // fetch data from database

// https://stackoverflow.com/a/52952907
navigator.mediaDevices
  .getUserMedia({ audio: true, video: false })
  .then(function(stream) {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    javascriptNode = audioContext.createScriptProcessor(4096, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);
    javascriptNode.onaudioprocess = function() {
      var array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      var values = 0;

      var length = array.length;
      for (var i = 0; i < length; i++) {
        values += array[i];
      }

      audio_average = values / length;

      audio_level.innerHTML = Math.round(audio_average).toString();
    };
  })
  .catch(function(err) {
    console.log(err.name + ": " + err.message);
  });

// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
var id, options;

function success(pos) {
  var crd = pos.coords;

  position.innerHTML = crd.latitude.toString() + "," + crd.longitude.toString();
  accuracy.innerHTML = crd.accuracy.toString();
  timestamp.innerHTML = pos.timestamp.toString();

  gps_block = crd;
}

function error(err) {
  console.warn("ERROR(" + err.code + "): " + err.message);
}

options = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 0,
};

id = navigator.geolocation.watchPosition(success, error, options);

var uploadTimeMax = 60; //sec
var uploadTimeMin = 5; //sec
setInterval(read_vars, uploadTimeMin * 1000);

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", e => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
});

async function install() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    console.log(deferredPrompt);
    deferredPrompt.userChoice.then(function(choiceResult) {
      if (choiceResult.outcome === "accepted") {
        console.log("Your PWA has been installed");
      } else {
        console.log("User chose to not install your PWA");
      }

      deferredPrompt = null;
    });
  }
}

var audio_average;
var gps_block;
var audio_level = document.getElementById("audio_level");
var position = document.getElementById("position");
var accuracy = document.getElementById("accuracy");
var timestamp = document.getElementById("timestamp");
var responsesStatus = document.getElementById("responseStatus");
var reloadTimer = document.getElementById("reloadTimer");
let sliderTime = document.getElementById("timeToReload").value;

//Reference to DOM element containing the map
const mymap = L.map("mapid");

//Initialize map - Arguments are lat, lon and zoom level.
buildMap(55.69, 12.5, 12);

//Create hex grid - Arguments are bounding box array and cell size in kilometershexgrid
const bbox = [12.45, 55.591973, 12.663809, 55.71];
const areaBbox = turf.bboxPolygon(bbox);
const hexgrid = createHexGrid(bbox, 0.5);
const hexGridLayer = new L.LayerGroup();
const circleLayer = new L.LayerGroup();
const audioLocations = [];

let scale = d3
  .scaleLinear()
  .domain([1, 100])
  .range([0.1, 0.9]);

async function getData() {
  const response = await fetch("/api/read");
  const data = await response.json();
  data.map(audioPoint => {
    audioLocations.push(
      turf.point([audioPoint.Lon, audioPoint.Lat], { level: audioPoint.level })
    );
  });
  let points = await turf.featureCollection(audioLocations);
  //await displayPoints(points);
  const joined = await spatialJoin(points, hexgrid);
  hexGridLayer.addLayer(
    L.geoJSON(joined, {
      style: function(feature) {
        if (feature.properties.soundLevel > 0) {
          return {
            color: colorScale(feature.properties.soundLevel),
            weight: 2,
            opacity: 1,
            fillOpacity: scale(feature.properties["level"].length),
          };
        } else {
          return {
            color: "d3d3d3",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.1,
          };
        }
      },
    }).bindPopup(function(layer) {
      return `The average sound level here is: ${
        layer.feature.properties.soundLevel
      } based on ${layer.feature.properties.level.length} observations`;
    })
  );
  bins(joined);
  hexGridLayer.addTo(mymap);
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

function read_vars() {
  // let average = array => array.reduce((a, b) => a + b) / array.length;
  var d = new Date();
  var frontnow = Math.round(d.getTime() / 1000);

  const level = audio_average;
  const lat = gps_block.latitude;
  const lon = gps_block.longitude;
  const timeStamp = frontnow;

  const data = { level, lat, lon, timeStamp };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  let currentLocation = turf.point([lon, lat]);

  //Check if user is inside the grid and only posts if that is the case
  if (turf.booleanPointInPolygon(currentLocation, areaBbox)) {
    fetch("/api", options).then(response => {
      if (response.status === 200) {
        responsesStatus.innerHTML = "Successfully sent data";
      } else {
        responsesStatus.innerHTML = "Could not send data to server!";
      }
    });
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
    javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

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

setInterval(read_vars, 5000);

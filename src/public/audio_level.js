var audio_average;
var gps_block;
var audio_level = document.getElementById("audio_level");
var position = document.getElementById("position");
var accuracy = document.getElementById("accuracy");
var timestamp = document.getElementById("timestamp");
var responsesStatus = document.getElementById("responseStatus");
var reloadTimer = document.getElementById("reloadTimer");
let sliderTime = document.getElementById("timeToReload").value;

var mymap = L.map('mapid').setView([55.69, 12.50], 11);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 15,
  id: 'mapbox.streets',
  accessToken: 'pk.eyJ1IjoicmdlbmdlbGwiLCJhIjoiY2p3b3c1M21rMGtjMzQzcTk3ZnU0MGxlMyJ9.1ZMDlrrQn98G5QgQVObfRg'
}).addTo(mymap);

async function getData() {
  const response = await fetch('/api/read')
  const data = await response.json();

  console.log(data)
  data.map(point => {
    L.circle([point.Lat, point.Lon], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: point.level * 5
    }).addTo(mymap);
  }
  )
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
};

function tick() {
  time--;
  if (time <= 0) {
    clearInterval(timer);
    getData();
    resetTimer(sliderTime);
  }
  reloadTimer.innerHTML = `${Math.floor(time / 60)}:${('0' + time % 60).slice(-2)}`.toString();
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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
  fetch('/api', options).then(response => {
    if (response.status === 200) {
      responsesStatus.innerHTML = "Successfully sent data"
    } else {
      responsesStatus.innerHTML = "Could not send data to server!"
    }
  });
};

getData(); // fetch data from database

// https://stackoverflow.com/a/52952907
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(function (stream) {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);
    javascriptNode.onaudioprocess = function () {
      var array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      var values = 0;

      var length = array.length;
      for (var i = 0; i < length; i++) {
        values += (array[i]);
      }

      audio_average = values / length;

      audio_level.innerHTML = Math.round(audio_average).toString();
    }
  })
  .catch(function (err) {
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
};

function error(err) {
  console.warn("ERROR(" + err.code + "): " + err.message);
};

options = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 0,
};

id = navigator.geolocation.watchPosition(success, error, options);

setInterval(read_vars, 5000);

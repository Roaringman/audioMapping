var rsm_block = [];
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

async function getData(){
  const response = await fetch(environment.env.NODE_HOST +'/api/read')
  const data = await response.json(); 
  
  console.log(data)
  data.map(point => {
    L.circle([point.Lat, point.Lon], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: point.level * 50
  }).addTo(mymap);
  }
  )
}


let time = sliderTime * 60;

getData();

function loadData(){
  resetTimer(document.getElementById("timeToReload").value);
  getData();
}

function updateSlider(slideAmount){
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
        resetTimer(document.getElementById("timeToReload").value);
    }
    reloadTimer.innerHTML = `${Math.floor(time / 60)}:${('0' + time % 60).slice(-2)}`.toString();
}

function read_vars() {
  let average = array => array.reduce((a, b) => a + b) / array.length;
  var d = new Date();
  var frontnow = Math.round(d.getTime() / 1000);

    const level = average(rsm_block);
    const lat = gps_block.latitude;
    const lon = gps_block.longitude;
    const timeStamp = frontnow;


    const data = { level, lat, lon, timeStamp};
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
    fetch('https://lydsans.com:3000/api', options).then(response => {
      if(response.status === 200){
        responsesStatus.innerHTML = "Successfully sent data"
      } else {
        responsesStatus.innerHTML = "Could not send data to server!"
      }
    });
};

// start recording
// https://gist.github.com/yying/754313510c62ca07230c

var constraints = { audio: true, video: false };

navigator.mediaDevices
  .getUserMedia(constraints)
  .then(function (mediaStream) {
    var audioContext = new AudioContext();
    var mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
    var processor = audioContext.createScriptProcessor(2048, 1, 1);
    mediaStreamSource.connect(audioContext.destination);
    mediaStreamSource.connect(processor);
    processor.connect(audioContext.destination);
    processor.onaudioprocess = function (e) {
      var inputData = e.inputBuffer.getChannelData(0);
      var inputDataLength = inputData.length;
      var total = 0;
      for (var i = 0; i < inputDataLength; i++) {
        total += Math.abs(inputData[i++]);
      }

      var rms = Math.sqrt(total / inputDataLength) * 100;
      audio_level.innerHTML = rms.toString();
      rsm_block.push(rms);
    };

  })
  .catch(function (err) {
    console.log(err.name + ": " + err.message);
  }); // always check for errors at the end.

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

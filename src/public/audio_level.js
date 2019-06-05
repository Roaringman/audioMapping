var rsm_block = [];
var gps_block;

function read_vars() {
  let average = array => array.reduce((a, b) => a + b) / array.length;
  var d = new Date();
  var frontnow = Math.round(d.getTime() / 1000);
  console.log(gps_block);
  window.location = `http://localhost:3000/api/time/${frontnow}/level/${average(
    rsm_block
  )}/positionLat/${gps_block.latitude}/positionLon/${gps_block.latitude}`;
  rsm_block = [];
}

async function timer() {
  console.log("started to read variables");

  setInterval(() => {
    read_vars();
  }, 5000);
}

// start recording
// https://gist.github.com/yying/754313510c62ca07230c

var constraints = { audio: true, video: false };

navigator.mediaDevices
  .getUserMedia(constraints)
  .then(function(mediaStream) {
    var audioContext = new AudioContext();
    var mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
    var processor = audioContext.createScriptProcessor(2048, 1, 1);
    mediaStreamSource.connect(audioContext.destination);
    mediaStreamSource.connect(processor);
    processor.connect(audioContext.destination);
    processor.onaudioprocess = function(e) {
      var inputData = e.inputBuffer.getChannelData(0);
      var inputDataLength = inputData.length;
      var total = 0;
      for (var i = 0; i < inputDataLength; i++) {
        total += Math.abs(inputData[i++]);
      }

      var rms = Math.sqrt(total / inputDataLength) * 100;
      document.getElementById("audio_level").innerHTML = rms.toString();
      // console.log(rms);
      rsm_block.push(rms);
    };

    //   audio.onloadedmetadata = function(e) {
    //     audio.play();
    //   };
  })
  .catch(function(err) {
    console.log(err.name + ": " + err.message);
  }); // always check for errors at the end.

// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
var id, options;

function success(pos) {
  var crd = pos.coords;

  document.getElementById("position").innerHTML =
    crd.latitude.toString() + "," + crd.longitude.toString();
  document.getElementById("accuracy").innerHTML = crd.accuracy.toString();
  document.getElementById("timestamp").innerHTML = pos.timestamp.toString();

  gps_block = crd;
}

function error(err) {
  console.warn("ERROR(" + err.code + "): " + err.message);
}

options = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 0,
};

id = navigator.geolocation.watchPosition(success, error, options);
timer();

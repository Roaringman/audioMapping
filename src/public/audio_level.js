var rsm_block = [];
var gps_block;
var audio_level = document.getElementById("audio_level");
var position = document.getElementById("position");
var accuracy = document.getElementById("accuracy");
var timestamp = document.getElementById("timestamp");
var responsesStatus = document.getElementById("responseStatus");


function read_vars() {
  let average = array => array.reduce((a, b) => a + b) / array.length;
  var d = new Date();
  var frontnow = Math.round(d.getTime() / 1000);
  /*console.log(average(rsm_block));
  window.location = `http://localhost:3000/api/time/${frontnow}/level/${average(
    rsm_block
  )}/positionLat/${gps_block.latitude}/positionLon/${gps_block.longitude}`;
  rsm_block = [];*/

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
    fetch('/api', options).then(response => {
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
      // document.getElementById("audio_level").innerHTML = rms.toString();
      // console.log(rms);
      rsm_block.push(rms);
    };

    //   audio.onloadedmetadata = function(e) {
    //     audio.play();
    //   };
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

var rsm_block = [];
var gps_block = [];

function read_vars() {
  // Do stuff like calculate mean values or so..
  console.log(rsm_block, gps_block);
};


async function timer() {

  console.log('started to read variables');

  setTimeout(() => { read_vars(); }, 5000);

  console.log(result);
  // expected output: 'resolved'
};

// get list af media devices

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
  console.log("enumerateDevices() not supported.");
  // return;
}

// List cameras and microphones.

navigator.mediaDevices
  .enumerateDevices()
  .then(function (devices) {
    devices.forEach(function (device) {
      console.log(
        device.kind + ": " + device.label + " id = " + device.deviceId
      );
    });
  })
  .catch(function (err) {
    console.log(err.name + ": " + err.message);
  });

// start recording

var constraints = { audio: true, video: false };

// https://gist.github.com/yying/754313510c62ca07230c

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
      document.getElementById("audio_level").innerHTML = rms.toString();
      console.log(rms);
      rsm_block.push(rsm)
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

  document.getElementById("position").innerHTML =
    crd.latitude.toString() + " ," + crd.longitude.toString();
  document.getElementById("accuracy").innerHTML = crd.accuracy.toString();
  document.getElementById("timestamp").innerHTML = pos.timestamp.toString();

  gps_block.push(crd)
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

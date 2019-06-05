var firebase = require("firebase/app");

// Add the Firebase products that you want to use
require("firebase/firestore");

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcgFYZThnkWoMqyCmhiK1I044XY86JUDg",
  authDomain: "audiolocator.firebaseapp.com",
  databaseURL: "https://audiolocator.firebaseio.com",
  projectId: "audiolocator",
  storageBucket: "audiolocator.appspot.com",
  messagingSenderId: "792223965106",
  appId: "1:792223965106:web:965f67525993afaf",
};

firebase.initializeApp(firebaseConfig);

// Initialize Firebase

const db = firebase.firestore();

module.exports.firestore = db;

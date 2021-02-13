"use strict";
let express = require("express");
let request = require("request");
let firebase = require("firebase/app");
require("firebase/firestore");
require("firebase/auth");
let my_token = "";
let path = require("path");
let app = express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
let fetch = require('node-fetch');
let port = 3000;
app.use(express.urlencoded({extended: true}));
app.use(express.json());


let options = {
  'method': 'POST',
  'url': 'https://access.bosch-iot-suite.com/token HTTP/1.1',
  'headers': {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  form: {
    'grant_type': 'client_credentials',
    'client_id': '1eca6585-a7a2-4171-8e47-11df9ef02be0',
    'client_secret': 'me42me42',
    'scope': 'service:iot-manager:0081db5c-9765-4ffa-8a54-a3a71021dc67_iot-manager/full-access service:iot-hub-prod:t0081db5c97654ffa8a54a3a71021dc67_hub/full-access service:iot-things-eu-1:0081db5c-9765-4ffa-8a54-a3a71021dc67_things/full-access'
  }
};
let firebaseConfig = {
  apiKey: "AIzaSyAlB2GVoYR_aCneXN69zabcUbp5vdgXSR8",
  authDomain: "led-controll-iot.firebaseapp.com",
  projectId: "led-controll-iot",
  storageBucket: "led-controll-iot.appspot.com",
  messagingSenderId: "349527250122",
  appId: "1:349527250122:web:b3225a896e9bd54060d033",
  measurementId: "G-9CJ4SE3GTY"
};
// Initialize Firebase
firebase["default"].initializeApp(firebaseConfig);
function getToken() {
  return new Promise(function (resolve, reject){
    request(options, function (error, response) {
      if (error) throw new Error(error);
      resolve(response.body)
    });
  });
};
app.listen(port, function () {
  console.log("Example app listening at http://localhost:" + port);
});

app.get('/', async function (req, res) {

  let r = await getToken();
  my_token = JSON.parse(r).access_token;
  const response = await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry%3AmyRspbLed', {
      headers: {
          'Authorization': "Bearer " + my_token}
  });
  const response_body = await response.json();
  res.render("index", {thing_id: response_body.thingId, led_color: response_body.features.ledLights.properties.color});
  // res.render("index");
});
app.post('/register', function(req, res){
  const email = req.body["email"];
  const password = req.body["password"];
  const confirmPassword = req.body["confirmPassword"];
  console.log(confirmPassword);
  let errorFlag = false;
  let passError = null;
  let emailError = null;
  let matchError = null;
  if(password.length < 9){
    errorFlag = true;
    passError = "Password should be at least 9 characters long!";
  }
  if(email.length<1){
    errorFlag = true;
    emailError = "An email is needed!";
  }
  if(password != confirmPassword){
    errorFlag = true;
    matchError = "Password should match!";
  }
  if(errorFlag){
    res.render("index", {er_password_weak: passError, email: email, er_mail: emailError,er_not_match: matchError});
  }
  else{
    // [START auth_signup_password]
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          // ...
        })
        .catch((error) => {
          const errorMessage = error.message;
          res.render("index", {er_mail: errorMessage, email: email});


        });
  }


});



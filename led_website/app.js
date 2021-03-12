"use strict";
let httpProxy = require('http-proxy');
let express = require("express");
let firebase = require("firebase/app");
require("firebase/firestore");
require("firebase/auth");
require("firebase/database");
let path = require("path");
const multer = require('multer');
const getColors = require('get-image-colors')
let user = null;
let timerLocked = new Array();
let app = express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
let fetch = require('node-fetch');
const render = require("pug");
let image = false;
let colors = false;
let port = 3000;
let postUrls = ["/things/:tid/color","/things/:tid/state",""]
let serverProxy = httpProxy.createProxyServer();
let l = "http://localhost:3001/"
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.get("/things/:tid", sendToProxy());
app.post("/things/:tid/color", sendToProxy());
serverProxy.on('proxyReq', (proxyReq, req) => {
  if (req.body) {
    const bodyData = JSON.stringify(req.body);
    // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
    proxyReq.setHeader('Content-Type','application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    // stream the content
    proxyReq.write(bodyData);
  }
});
function sendToProxy() {
  return async (req, res) => {
    console.log(req.url)
    console.log(req.body);
    console.log(req.method);
    serverProxy.web(req, res, {target: l});
  }
}
//multer options
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)){
      cb(new Error('Please upload an image.'))
    }
    cb(undefined, true)
  }
})
image: {
  type: Buffer
}

// POST /things/:tid/photo
app.post('/upload/:tid', upload.single('upload'), async (req, res) => {
  try {
    image = req.file.buffer
    colors =  await getColors(image, 'image/png');
    colors = colors.map(color => color.hex())
    console.log(colors);
    const thing_id = req.params.tid;
    console.log(thing_id);
    const link = 'http://localhost:3001/colorTransition/' + thing_id;
    let r = await fetch(link, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(colors)
    });
    res.redirect('back');
  } catch (e){
    res.status(400).send(e)
  }
}, (error, req, res, next) => {
  res.status(400).send({error: error.message})
})
let firebaseConfig = {
  apiKey: "AIzaSyAlB2GVoYR_aCneXN69zabcUbp5vdgXSR8",
  authDomain: "led-controll-iot.firebaseapp.com",
  projectId: "led-controll-iot",
  storageBucket: "led-controll-iot.appspot.com",
  messagingSenderId: "349527250122",
  appId: "1:349527250122:web:b3225a896e9bd54060d033",
  measurementId: "G-9CJ4SE3GTY",
  databaseURL: "https://led-controll-iot-default-rtdb.firebaseio.com/",
};
// Initialize Firebase
firebase["default"].initializeApp(firebaseConfig);
const database = firebase.database();
app.listen(port, function () {
  console.log("Example app listening at http://localhost:" + port);
});

// PUT /things/:tid/color
// Body: JSON with color {"color": "#ffaaff"}
app.get('/colorChange/:tid',checkSignIn, async function (req,res){
  const color = req.query.color;
  const thing_id = req.params.tid
  const link = 'http://localhost:3001/setColor/'+ thing_id+'/' + color;
  await fetch(link);
  res.redirect('back');

})

// POST /things/:tid/timers
// Body: JSON with time field {"time": 123456}
// Response: JSON with timer id {"id": 123123}
app.get('/setTimer/:tid/:time',checkSignIn, async function (req,res){
  const time = req.params.time;
  const thing_id = req.params.tid;
  const link = 'http://localhost:3001/setTimer/'+ thing_id+'/' + time*60000;
  await fetch(link);
  timerLocked.push(thing_id);
  res.redirect('back');

})
// DELETE /things/:tid/timers/:timerid
app.get('/stopTimer/:tid', checkSignIn, async function (req, res){
  const thing_id = req.params.tid;
  const link = 'http://localhost:3001/stopTimer/'+ thing_id;
  await fetch(link);
  timerLocked.splice(timerLocked.indexOf(thing_id));
  res.redirect('back');
})

// GET /things/:tid
app.get('/user/things/:tid',checkSignIn, async function (req, res) {
  const thing_id = req.params.tid;
  const response = await fetch(new URL("/things/" + thing_id, "http://localhost:3000"));
  console.log(response);
  const response_body = await response.json();
  if (timerLocked.includes(thing_id)){
    res.render("index", {thing_id: thing_id, led_color: response_body.features.ledLights.properties.color, timer_locked: true, image:image.toString('base64'), colors:colors});

  }
  else{
    res.render("index", {thing_id: thing_id, led_color: response_body.features.ledLights.properties.color, image:image.toString('base64'), colors:colors});

  }
});
function checkSignIn(req, res, next){
  if(user){
    next();     //If a user is logged in, proceed to page
  } else {
    res.redirect('/')
  }
}
// GET /things
app.get('/', async function (req, res){

  if(user){
    await database.ref().child("users").child(user.uid).child("devices").get().then(function (snapshot){
      if(snapshot.exists()){
        const things =  snapshot.val();
        let names = new Array();
        for(let key in things){
          names.push({
            key: key,
            value:things[key]["name"]
          });

        }
        res.render("homepage", {user: user, things:names});

      }
      else{
        res.render("homepage", {user:user});
      }
    })

  }
  else
    res.render("homepage");
});
app.get('/register', function (req, res){
  res.render("registration");
});
app.get('/login', function (req, res){
  res.render("login");
});
app.get('/registerDevice',checkSignIn, function (req, res){
  res.render("deviceRegistration");
});

app.post('/unlockTimerFor/:tid', function (req, res){
  timerLocked.splice(timerLocked.indexOf(req.params.tid));
})
app.post('/login', function (req, res){
  const email = req.body["email"];
  const password = req.body["password"];

  firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signed in
        user = userCredential.user;
        res.status(200);
        res.redirect("/")
        
      })
      .catch((error) => {
        const errorMessage = error.message;
        res.render("login", {er_email_or_pass: errorMessage, email: email});
      });
});
app.post('/register', function(req, res){
  const email = req.body["email"];
  const password = req.body["password"];
  const confirmPassword = req.body["confirmPassword"];

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
    res.render("registration", {er_password_weak: passError, email: email, er_mail: emailError,er_not_match: matchError});
  }
  else{

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          user = userCredential.user;

          res.status(200);
          res.redirect("/")

        })
        .catch((error) => {
          const errorMessage = error.message;
          res.render("registration", {er_mail: errorMessage, email: email});


        });


  }


});
// PUT /things/:tid/state
// Body: JSON with state {"state": true}
app.get("/turnOff/:tid", async function (req, res){
  const thingId = req.params.tid;
  let link = 'http://localhost:3001/turnOff/' + thingId;
  await fetch(link);
  res.redirect("/retrieveInfo/" + thingId);
});
// PUT /things/:tid/state
// MERGE WITH ABOVE
// Body: JSON with state {"state": false}
app.get("/turnOn/:tid", async function (req, res){
  const thingId = req.params.tid;
  let link = 'http://localhost:3001/retrieve/' + thingId;
  const response = await fetch(link);
  const response_body = await response.json();
  let color = (response_body.features.ledLights.properties.color).split("#");
  color = color[1];
  link = 'http://localhost:3001/turnOn/'+ thingId+'/' + color;
  await fetch(link);
  res.redirect("/retrieveInfo/" + thingId);
})
// POST /things
app.post("/registerDevice", async function (req, res){
  const deviceName = req.body["deviceName"];
  const thingId = req.body["deviceId"];
  const link = 'http://localhost:3001/thing/' + thingId;
  const response = await fetch(link);
  // fetch "/thing/" + thingId
  const response_body = await response.json();
  if(!response_body.features.Ownership.properties.isClaimed){
    await firebase.database().ref('users/' + user.uid + '/devices/' + deviceId + "/name").once("value", async snapshot => {
      if (snapshot.exists()) {
        const name = snapshot.val();
        res.status(403);
        res.render("deviceRegistration", {er_device_id: "You've already registered a device with this name!"});


      } else {
        const url = "http://localhost:3001/claimThing/" + thingId + '/' + user.email
        await (fetch(url));
        let userNameRef = firebase.database().ref('users/' + user.uid + '/devices/' + deviceId);
        await userNameRef.child('name').set(deviceName);
        res.redirect('/');

      }
    })


  }
  else{
    res.render("deviceRegistration", {er_device_id: "already claimed!"});
  }



});



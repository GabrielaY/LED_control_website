"use strict";
let httpProxy = require('http-proxy');
const url = require('url');
let express = require("express");
let firebase = require("firebase/app");
require("firebase/firestore");
require("firebase/auth");
require("firebase/database");
let methodOverride = require('method-override')
let path = require("path");
const multer = require('multer');
const getColors = require('get-image-colors')
let user = null;
let app = express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
let fetch = require('node-fetch');
const render = require("pug");
let image = false;
let colors = false;
let port = 3000;
let postUrls = ["/things/:tid/color", "/things/:tid/state", ""]
let serverProxy = httpProxy.createProxyServer();
let l = "http://localhost:3001/"
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'))
app.get("/things/:tid", sendToProxy());
app.put("/things/:tid/color", sendToProxy());
app.put("/things/:tid/state", sendToProxy());
app.post("/things/:tid/timer", sendToProxy());
app.delete("/things/:tid/timer", sendToProxy());
app.post("/things", checkIfDeviceNameExists(), sendToProxy(), registerDeviceInDatabase());

serverProxy.on('proxyReq', (proxyReq, req) => {
    if (req.body) {
        const bodyData = JSON.stringify(req.body);
        // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
        proxyReq.setHeader('Content-Type', 'application/json');
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

function checkIfDeviceNameExists() {
    return async (req, res, next) => {
        await firebase.database().ref('users/' + user.uid + '/devices/' + req.body.deviceId + "/name").once("value", async snapshot => {
            if (snapshot.exists()) {
                res.status(403);
                console.log("tuk");
                res.redirect(url.format({
                    pathname: "/registerDevice",
                    query: {
                        "error": "A device with this name or ID has already been registered!"
                    }
                }))
            } else
                next();
        })
    }
}

function registerDeviceInDatabase() {
    return async (res, req) => {
        let userNameRef = firebase.database().ref('users/' + user.uid + '/devices/' + deviceId);
        await userNameRef.child('name').set(req.body.deviceName);
        res.redirect('/');
    }
}


//multer options
const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            cb(new Error('Please upload an image.'))
        }
        cb(undefined, true)
    }
})
{
    Buffer
}

// POST /things/:tid/photo
app.post('/upload/:tid', upload.single('upload'), async (req, res) => {
    try {
        image = req.file.buffer
        colors = await getColors(image, 'image/png');
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
    } catch (e) {
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

function checkSignIn(req, res, next) {
    if (user) {
        next();     //If a user is logged in, proceed to page
    } else {
        res.redirect('/')
    }
}

app.get('/things', async function (req, res) {
    await database.ref().child("users").child(user.uid).child("devices").get().then(function (snapshot) {
        if (snapshot.exists()) {
            const things = snapshot.val();
            let names = [];
            for (let key in things) {
                names.push({
                    key: key,
                    value: things[key]["name"]
                });

            }
            res.render("thingView", {things: names});
        }
    })
})
app.get('/', async function (req, res) {

    if (user)
        res.render("homepage", {user: user});
    else
        res.render("homepage");
});
app.get('/register', function (req, res) {
    res.render("registration");
});
app.get('/login', function (req, res) {
    res.render("login");
});
app.get('/registerDevice', checkSignIn, function (req, res) {
    let registration_error;
    if (req.query.error) {
        registration_error = req.query.error
    }
    res.render("deviceRegistration", {er_device_id: registration_error});

});


app.post('/login', function (req, res) {
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
app.post('/register', function (req, res) {
    const email = req.body["email"];
    const password = req.body["password"];
    const confirmPassword = req.body["confirmPassword"];

    let errorFlag = false;
    let passError = null;
    let emailError = null;
    let matchError = null;
    if (password.length < 9) {
        errorFlag = true;
        passError = "Password should be at least 9 characters long!";
    }
    if (email.length < 1) {
        errorFlag = true;
        emailError = "An email is needed!";
    }
    if (password != confirmPassword) {
        errorFlag = true;
        matchError = "Password should match!";
    }
    if (errorFlag) {
        res.render("registration", {
            er_password_weak: passError,
            email: email,
            er_mail: emailError,
            er_not_match: matchError
        });
    } else {

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



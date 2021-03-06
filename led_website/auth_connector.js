"use strict";
let express = require("express");
let request = require("request");
const url = require('url');
let my_token = "";
let path = require("path");
let my_token_expire_time = Date.now();
let app = express();
let image;
let fetch = require('node-fetch');
let port = 3001;
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set("view engine", "pug");
const multer = require('multer');
app.set("views", path.join(__dirname, "views"));
const render = require("pug");
let timers = new Map();
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

function ensureToken(){
    return async(req, res, next)=> {
        if(my_token_expire_time < Date.now()){
            let r = await getToken();
            let token_response_data = JSON.parse(r);
            my_token = token_response_data.access_token;
            my_token_expire_time = (token_response_data.expires_in*1000) + Date.now();
        }
        next();
    }
};
function getThingInfo(){
    return async(req, res, next) => {
        res.body = await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid , {
            headers: {
                'Authorization': "Bearer " + my_token}
        });

        if(res.body.status == 404){
            res.status(404);
            res.redirect(url.format({
                pathname:"/registerDevice",
                query: {
                    "error": "No device with this ID!"
                }
            }));
        }
        else {
            next();
        }
    }
}


app.get('/things/:tid', ensureToken(), getThingInfo(), async function (req, res) {
    const response_body = await res.body.json()
    res.status(202);
    const thing_id = (response_body.thingId.split(':'))[1]
    if (timers.has(thing_id)){
        res.render("index", {thing_id: thing_id, led_color: response_body.features.ledLights.properties.color, timer_locked: true});
    }
    else {
        res.render("index", {thing_id: thing_id, led_color: response_body.features.ledLights.properties.color});
    }
});

app.put('/things/:tid/color', ensureToken(), async function (req, res) {
    const color = req.body.color;
    await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid +'/features/ledLights/inbox/messages/ledColor?timeout=0', {
        method: 'POST',
        headers: {
            'Authorization': "Bearer " + my_token},
        body: "#" +color
    });
    res.status(202);
    res.redirect('back');
});
app.post('/things/:tid/colors', ensureToken(), async function (req, res) {
    const response = await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid +'/features/ledLights/inbox/messages/colorTransition?timeout=0', {
        method: 'POST',
        headers: {
            'Authorization': "Bearer " + my_token},
        body: req.body.colors
    });

    res.redirect("/things/" + req.params.tid);
});
function checkDesiredState(){
    return async (req,res, next) =>{
        console.log(req.body.state);
        if (req.body.state == "off"){
            next('route');
        }
        else {
            next();
        }
    }
}
app.put('/things/:tid/state', ensureToken(), checkDesiredState(), getThingInfo(), async function (req, res) {
    const thing_info = await res.body.json();
    const last_color = thing_info.features.ledLights.properties.color;
    await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid +'/features/ledLights/inbox/messages/on?timeout=0', {
        method: 'POST',
        headers: {
            'Authorization': "Bearer " + my_token},
        body: last_color
    });
    res.status(202);
    res.redirect("/things/" + req.params.tid);
});
app.put('/things/:tid/state', async function (req, res) {
    await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid +'/features/ledLights/inbox/messages/off?timeout=0', {
        method: 'POST',
        headers: {
            'Authorization': "Bearer " + my_token}
    });

    res.status(202);
    res.redirect("/things/" + req.params.tid);
});

app.put('/things/:tid/state', async function (req, res) {
    await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid +'/features/ledLights/inbox/messages/off?timeout=0', {
        method: 'POST',
        headers: {
            'Authorization': "Bearer " + my_token}
    });

    res.status(202);
    res.redirect("/things/" + req.params.tid);
});

app.post('/things/:tid/event', ensureToken(), async function (req, res) {
    await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid +'/features/ledLights/inbox/messages/event?timeout=0', {
        method: 'POST',
        headers: {
            'Authorization': "Bearer " + my_token},
        body: JSON.stringify(req.body)
    });
    res.status(202);
    res.redirect("/things/" + req.params.tid);
});

app.post('/things/:tid/timer', ensureToken(), async function (req, res) {
    const thing_id = req.params.tid;
    const timer_id = setTimeout(async function() {
        timers.delete(thing_id);
        await fetch('http://localhost:3000/things/'+ thing_id + '/state', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({"state": "off"})
        });
    }, req.body.time)

    timers.set(thing_id, timer_id);
    res.status(202);
    res.redirect("/things/" + thing_id);
});

app.delete('/things/:tid/timer', async function (req, res) {
    const thing_id = req.params.tid;
    clearTimeout(timers.get(thing_id));
    timers.delete(thing_id);
    res.status(202);
    res.redirect("/things/" + thing_id);
});

app.post('/things', ensureToken(), getThingInfo(), async function (req,res, next){
    const deviceId = req.body.deviceId;
    const thing_info = await res.body.json();
    if(!thing_info.features.Ownership.properties.isClaimed){
        await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + deviceId +'/features/Ownership?timeout=0', {
            method: 'PUT',
            headers: {
                'Authorization': "Bearer " + my_token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"properties":{"isClaimed": true, "ownership":req.params.email}})
        });
        next();
    }
    else{
        res.status(403);
        res.redirect(url.format({
            pathname:"/registerDevice",
            query: {
                "error": "A device with this ID has already been registered!"
            }}))

    }

})





"use strict";
let express = require("express");
let request = require("request");
let my_token = "";
let offTimer;
let my_token_expire_time = Date.now();
let app = express();
let fetch = require('node-fetch');
let port = 3001;
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
async function ensureToken(){
    if(my_token_expire_time < Date.now()){
        let r = await getToken();
        let token_response_data = JSON.parse(r);
        my_token = token_response_data.access_token;
        my_token_expire_time = (token_response_data.expires_in*1000) + Date.now();
    }
};

app.get('/retrieve/:tid', async function (req, res) {

    await ensureToken();
    const response = await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid , {
        headers: {
            'Authorization': "Bearer " + my_token}
    });

    const thing_info = await response.json()
    res.status(202);
    res.send(thing_info);
});

app.get('/setColor/:tid/:color', async function (req, res) {

    await ensureToken();
    const response = await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid +'/features/ledLights/inbox/messages/ledColor?timeout=0', {
        method: 'POST',
        headers: {
            'Authorization': "Bearer " + my_token},
        body: "#" +req.params.color
    });

    res.send("Success");
});
app.get('/turnOn/:tid/:color', async function (req, res) {

    await ensureToken();
    const response = await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid +'/features/ledLights/inbox/messages/on?timeout=0', {
        method: 'POST',
        headers: {
            'Authorization': "Bearer " + my_token},
        body: "#" +req.params.color
    });
    console.log(response);

    res.send("Success");
});
app.get('/setTimer/:tid/:time', async function (req, res) {

    await ensureToken();
    offTimer = setTimeout(async function() {
        const response = await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:' + req.params.tid +'/features/ledLights/inbox/messages/ledColor?timeout=0', {
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + my_token},
            body: "#000000"
        });
        await fetch("http://localhost:3000/unlockTimerFor/" + req.params.tid,{
            method: 'POST',
        });
    }, req.params.time)


    res.send("Success");
});

app.get('/stopTimer/:tid', async function (req, res) {

    clearTimeout(offTimer);
    res.send("Success");
});

app.get('/claimThing/:tid/:email', async function (req, res) {
    console.log(req.params)
    await ensureToken();
    const response =await fetch('https://things.eu-1.bosch-iot-suite.com/api/2/things/led_raspberry:myRspbLed/features/Ownership?timeout=0', {
        method: 'PUT',
        headers: {
            'Authorization': "Bearer " + my_token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"properties":{"isClaimed": true, "ownership":req.params.email}})
    });
    res.send("Success");
});




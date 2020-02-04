var express = require("express");
var serverless = require("serverless-http");
var simpleSession = express();
var router = express.Router();
var bodyParser = require('body-parser');
var axios = require("axios");

simpleSession.use(bodyParser.json());
simpleSession.use(bodyParser.urlencoded({ extended: true }));
simpleSession.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.header('Access-Control-Allow-Credentials', true);
    next();
});

var {google} = require("googleapis");
var serviceAccount = require("./appkey.json");
var scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/firebase.database"
];

var jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    scopes
);

urlDatabase = "https://simplesession-43caf.firebaseio.com"

//get main route
router.get("/",(request,response)=>{
    jwtClient.authorize(function(error, tokens) {
        response.write("Service running");
        response.end();
        return null;
    });
});

//main function
router.post("/",function(request,response){
    var cookieClient = request.body.cookie.split(";");
    console.log(cookieClient);
    sessionIDclient = cookieClient[0].replace("sessionID=","");
    jwtClient.authorize(function(error, tokens) {
        var urlaccounts=urlDatabase+"/accounts.json?access_token="+tokens.access_token;
        console.log(urlaccounts);
        axios.get(urlaccounts)
        .then(body=>{
            var nItems = Object.keys(body.data).length;
            for(i=0;i<nItems;i++){
                try{
                    var client=Object.keys(body.data)[i].toString();
                    sessionIDserver=body.data[client].sessionID.value;
                    console.log(sessionIDclient);
                    console.log(sessionIDserver);
                    if(sessionIDserver===sessionIDclient){
                        params = body.data[client];
                        if("provider" in params){
                            params.isProvider = true;
                        }
                        else{
                            params.isProvider = false;
                        }
                        delete params.password;
                        console.log(params);
                        response.header("Content-Type", "application/json");
                        response.write(JSON.stringify(params));
                        response.end();
                        return null;
                    }
                }
                catch{
                }
            }
            response.status(404).send('null');
            response.end();
            return null;
        });
    });
});

simpleSession.use("/.netlify/functions/main",router);

module.exports.handler = serverless(simpleSession);

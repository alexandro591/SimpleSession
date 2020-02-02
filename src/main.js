var express = require("express");
var serverless = require("serverless-http");
var simpleSession = express();
var router = express.Router();
var bodyParser = require('body-parser');
var axios = require("axios");

simpleSession.use(bodyParser.json());
simpleSession.use(bodyParser.urlencoded({ extended: true }));
simpleSession.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Content-Type", "text/plain");
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Credentials', true);
    next();
});

var accessToken;

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

jwtClient.authorize(function(error, tokens) {
    accessToken = tokens.access_token;
});

urlDatabase = "https://simplesession-43caf.firebaseio.com"

//get main route
router.get("/",(request,response)=>{
    response.write("Service running");
    response.end();
    return null;

});

//main function
router.post("/",function(request,response){
    var cookieClient = request.body.cookie.split(";");
    console.log(cookieClient);
    cookieClient = cookieClient[0].replace("sessionID=","");

    var urlaccounts=urlDatabase+"/accounts.json?access_token="+accessToken;
    console.log(urlaccounts);
    axios.get(urlaccounts)
    .then(body=>{
        var nItems = Object.keys(body.data).length;
        for(i=0;i<nItems;i++){
            try{
                var client=Object.keys(body.data)[i].toString();
                cookieServer=body.data[client].cookie.value;
                console.log(cookieServer);
                console.log(cookieClient);
                if(cookieServer===cookieClient){
                    params = body.data[client];
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
        response.write("null");
        response.end();
        return null;
    });
});

simpleSession.use("/.netlify/functions/main",router);

module.exports.handler = serverless(simpleSession);

var express = require("express");
var serverless = require("serverless-http");
var simpleSession = express();
var router = express.Router();
var bodyParser = require('body-parser');
var axios = require("axios");
var randomId = require('random-id');

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

//login function
router.post("/",function(request,response){

    var errors={};

    //email handle
    try {
        var email = request.body.email.toLowerCase().split("@");
        var user = email[0];
        var emailProvider = email[1].toUpperCase().replace(/\./g,"*");
        email=user+emailProvider
    } catch {
        var email = request.body.email
    }

    var password = request.body.password;

    jwtClient.authorize(function(error, tokens) {
        var urlaccounts=urlDatabase+"/accounts/"+email+".json?access_token="+tokens.access_token;
        axios.get(urlaccounts)
        .then(body=>{
            if(body.data!==null){
                if(body.data.password===password){
                    var sessionID = randomId();
                    
                    var urlaccounts=urlDatabase+"/accounts/"+user+emailProvider+"/sessionID.json?access_token="+tokens.access_token;
    
                    axios.put(urlaccounts,{value:sessionID})
                    .then(()=>{
                        response.write(sessionID);
                        response.end();
                        return null;
                    })
                }
                else{
                    errors.password="Password incorrecto";
                    response.status(404).json(errors);
                    response.end();
                    return null;   
                }
            }
            else{
                errors.email="No existe ese usuario";
                response.status(404).json(errors);
                response.end();
                return null;   
            }
        })
    });
});

simpleSession.use("/.netlify/functions/login",router);

module.exports.handler = serverless(simpleSession);

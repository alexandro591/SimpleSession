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
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Content-Type", "text/plain");
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

    simpleSession.use(bodyParser.json());
    simpleSession.use(bodyParser.urlencoded({ extended: true }));
    simpleSession.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Content-Type", "text/plain");
    next();
});

});

urlDatabase = "https://simplesession-43caf.firebaseio.com"

//get main route
router.get("/",(request,response)=>{
    response.write("Service running");
    response.end();

    jwtClient.authorize(function(error, tokens) {
        accessToken = tokens.access_token;
    });

    return null;
});

//signin function
router.post("/signin",function(request,response){
      
    //email handle
    try {
        var email = request.body.email.toLowerCase().split("@");
        var user = email[0];
        var emailProvider = email[1].toUpperCase().replace(/\./g,"*");
    } catch {
        response.write("Ingresa un email válido");
        response.end();
        return null;
    }

    name=request.body.name;
    sname=request.body.sname;
    ci=request.body.ci;
    phone=request.body.phone;
    email=request.body.email;
    password1=request.body.password1;
    password2=request.body.password2;

    if(name==="" || sname==="" || ci==="" || phone==="" || email==="" || password1==="" || password2==="" ){
        response.write("Ingrese todos los parámetros");
        response.end();
        return null;
    }
    else if(password1!==password2){
        response.write("Las contraseñas no son idénticas");
        response.end();
        return null;
    }
    data={
        name:name,
        sname:sname,
        ci:ci,
        phone:phone,
        email:email,
        password:password1,
    }

    var urlaccounts=urlDatabase+"/accounts/"+user+emailProvider+".json?access_token="+accessToken;

    axios.get(urlaccounts)
    .then(body=>{
        if(body.data===null){
            axios.put(urlaccounts,data)
            .then(()=>{
                response.write("success");
                response.end();
                return null;
            })
        }
        else{
            response.write("that email is being used by another account");
            response.end();
            return null;
        }
    });

});

//login function
router.post("/login",function(request,response){
    var email = request.body.email.toLowerCase().split("@");
    var user = email[0];
    var emailProvider = email[1].toUpperCase().replace(/\./g,"*");
    var password = request.body.password;

    var urlaccounts=urlDatabase+"/accounts/"+user+emailProvider+".json?access_token="+accessToken;

    axios.get(urlaccounts)
    .then(body=>{
        if(body.data!==null){
            if(body.data.password===password){
                var cookie = randomId();
                
                var urlaccounts=urlDatabase+"/accounts/"+user+emailProvider+"/cookie.json?access_token="+accessToken;

                axios.put(urlaccounts,{value:cookie})
                .then(()=>{
                    response.write("sessionID="+cookie+";");
                    response.end();
                    return null;
                })
            }
            else{
                response.write("wrong password");
                response.end();
                return null;
            }
        }
        else{
            response.write("that user does not exist");
            response.end();
            return null;
        }
    })
});

//main function
router.post("/main",function(request,response){
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

//deleteCookie
router.post("/deleteCookie",function(request,response){
    var email = request.body.email.toLowerCase().split("@");
    var user = email[0];
    var emailProvider = email[1].toUpperCase().replace(/\./g,"*");

    var urlaccounts=urlDatabase+"/accounts/"+user+emailProvider+"/cookie.json?access_token="+accessToken;

    axios.delete(urlaccounts);
    response.write("ok");
    response.end();
    return null;
});

simpleSession.use("/.netlify/functions/index",router);

module.exports.handler = serverless(simpleSession);

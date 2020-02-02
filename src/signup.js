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
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
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
    response.write("Service running "+accessToken);
    response.end();
    return null;
});

//signin function
router.post("/",function(request,response){
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

simpleSession.use("/.netlify/functions/signup",router);

module.exports.handler = serverless(simpleSession);

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

//signin function
router.post("/",function(request,response){

    var errors={};

    //email handle
    try {
        var email = request.body.email.toLowerCase().split("@");
        var user = email[0];
        var emailProvider = email[1].toUpperCase().replace(/\./g,"*");
    } catch {
        errors.email="Ingrese un email válido";
    }

    name=request.body.name;
    sname=request.body.sname;
    ci=request.body.ci;
    phone=request.body.phone;
    email=request.body.email;
    password1=request.body.password1;
    password2=request.body.password2;

    if(name===""){
        errors.name="Ingrese este campo"
    }
    if(sname===""){
        errors.sname="Ingrese este campo";
    }
    if(ci.length!==10){
        errors.ci="Ingrese una cédula correcta";
    }
    if(phone.length!==10 && phone.substr(0,2)!=="09" ){
        errors.phone="Ingrese un teléfono válido";
    }
    if(password1!==password2 || password1.length<6){
        errors.password1="Las contraseñas deben ser idénticas y deben incluir al menos 6 caracteres";
        errors.password2="Las contraseñas deben ser idénticas y deben incluir al menos 6 caracteres";
    }

    if(!(Object.entries(errors).length === 0 && errors.constructor === Object)){
        response.status(404).json(errors);
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

    jwtClient.authorize(function(error, tokens) {
        var urlaccounts=urlDatabase+"/accounts/"+user+emailProvider+".json?access_token="+tokens.access_token;

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
                errors.email="Ese email está siendo usado por otro usuario"
                response.status(404).json(errors);;
                response.end();
                return null;
            }
        });
    });
    
});

simpleSession.use("/.netlify/functions/signup",router);

module.exports.handler = serverless(simpleSession);

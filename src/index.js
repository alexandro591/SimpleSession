const express = require("express");
const serverless = require("serverless-http");
const simpleSession = express();
const router = express.Router();
const bodyParser = require('body-parser');
const axios = require("axios");
const randomId = require('random-id');

simpleSession.use(bodyParser.json());
simpleSession.use(bodyParser.urlencoded({ extended: true }));
simpleSession.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Content-Type", "text/plain")
    next();
});

urlDatabase = "https://simplesession-43caf.firebaseio.com"

//get main route
router.get("/",(request,response)=>{
});

//signin function
router.post("/signin",function(request,response){
    var email = request.body.email.toLowerCase().split("@");
    var user = email[0];
    var emailProvider = email[1].toUpperCase().replace(/\./g,"*");

    data = request.body

    var urlaccounts=urlDatabase+"/accounts/"+user+emailProvider+".json";

    axios.get(urlaccounts)
    .then(body=>{
        if(body.data===null){
            axios.put(urlaccounts,data)
            .then(()=>{
                response.write("success");
                response.end();
            })
        }
        else{
            response.write("that email is being used by another account");
            response.end();
        }
    });
});

//login function
router.post("/login",function(request,response){
    var email = request.body.email.toLowerCase().split("@");
    var user = email[0];
    var emailProvider = email[1].toUpperCase().replace(/\./g,"*");
    var pass = request.body.pass;

    var urlaccounts=urlDatabase+"/accounts/"+user+emailProvider+".json";

    axios.get(urlaccounts)
    .then(body=>{
        if(body.data!==null){
            if(body.data.pass===pass){
                var cookie = randomId()
                axios.put(urlaccounts.substring(0,urlaccounts.length-5)+"/cookie.json",{value:cookie})
                .then(()=>{
                    response.write("sessionID="+cookie+";");
                    response.end();
                })
            }
            else{
                response.write("wrong password");
                response.end();
            }
        }
        else{
            response.write("that user does not exist");
            response.end();
        }
    })
});

//main function
router.post("/main",function(request,response){
    var cookieClient = request.body.cookie.split(";");
    console.log(cookieClient);
    cookieClient = cookieClient[0].replace("sessionID=","");

    var urlaccounts=urlDatabase+"/accounts.json";

    axios.get(urlaccounts)
    .then(body=>{
        var nItems = Object.keys(body.data).length;
        for(i=0;i<nItems;i++){
            try{
                var client=Object.keys(body.data)[i].toString();
                cookieServer=body.data[client].cookie.value;
                console.log(cookieServer)
                console.log(cookieClient)
                if(cookieServer===cookieClient){
                    params = body.data[client]
                    console.log(params);
                    response.header("Content-Type", "application/json");
                    response.write(JSON.stringify(params));
                    response.end();
                    return null
                }
            }
            catch{
            }
        }
        response.write("null")
        response.end()
        return null
    });
});

//deleteCookie
router.post("/deleteCookie",function(request,response){
    axios.delete(urlDatabase+"/accounts/"+request.body.name+"/cookie.json")
    response.write("ok")
    response.end()
});

simpleSession.use("/.netlify/functions/index",router);

module.exports.handler = serverless(simpleSession);

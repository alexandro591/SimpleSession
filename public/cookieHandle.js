function deleteAllCookies() {
    try{
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf("=");
            var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        console.log("Session ended")
    }
    catch{
        console.log("No session found")
    }
}

async function getParams(){
    var params=""
    await $.post("http://localhost:9000/.netlify/functions/index/main",{
        cookie:document.cookie
    },
    function(data){
        params=data
    });
    return params
}
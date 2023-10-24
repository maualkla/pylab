/// stage variables
let errors = 0;
let userIp = "0.0.0.0";

/// Triggers
if(document.getElementById('_get_ip_details')) document.getElementById('_get_ip_details').addEventListener('click', function (){ getIpDetails(); });


// Function to get the client navigator version.
navigator.sayswho= (function(){
    var ua= navigator.userAgent;
    var tem; 
    var M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return M.join(' ');
})();

// function to get ip
function getIp(){
    let xhr = new XMLHttpRequest();
    let url = "https://api.ipify.org/?format=json";
    xhr.open("GET", url);
    xhr.onreadystatechange = function () {
        try
        {
            if (xhr.readyState === 4 && xhr.status === 200) {
                //console.log(" response ok ");
                userIp = JSON.parse(xhr.responseText)["ip"];
                console.log(JSON.parse(xhr.responseText)["ip"]);
            }else{
                //console.log("loading...");
            }
        }
        catch(e)
        {
            errors++;
        }
    };
    xhr.send();
}

// Get Ip details: 
function getIpDetails(){
    let xhr = new XMLHttpRequest();
    let url = "/info";
    let payload = {'_ip': userIp}
    xhr.open("POST", url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        try
        {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log(" response ok ");
                console.log(JSON.parse(xhr.responseText));
            }else{
                console.log("loading...");
            }
        }
        catch(e)
        {
            errors++;
        }
    };
    xhr.send(JSON.stringify(payload));
}

// Actions
console.log(navigator.sayswho); // outputs: `Chrome 62`
getIp(); // outputs: XXX.XXX.XXX.XXX clients IP

/// stage variables
let errors = 0;
let userIp = "0.0.0.0";
let clientVersion = '';

/// Triggers
if(document.getElementById('_get_ip_details')) document.getElementById('_get_ip_details').addEventListener('click', function (){ getIpDetails(); });
if(document.getElementById('_color_text')) document.getElementById('_color_text').addEventListener('change', function (){ changeColorPickerValue(document.getElementById('_color_text').value); });
if(document.getElementById('_color_input')) document.getElementById('_color_input').addEventListener('change', function (){ changeColorTextValue(document.getElementById('_color_input').value); });

// Function to get the client navigator version.
navigator.sayswho= (function(){
    var ua= navigator.userAgent;
    var tem; 
    var M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        clientVersion = 'IE '+(tem[1] || '');
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null) {
            clientVersion = tem.slice(1).join(' ').replace('OPR', 'Opera');
            return tem.slice(1).join(' ').replace('OPR', 'Opera');
        }
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    clientVersion = M.join(' ');
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
                //console.log(JSON.parse(xhr.responseText)["ip"]);
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
                //console.log(" response ok ");
                console.log(JSON.parse(xhr.responseText));
                let _console = document.getElementsByClassName('_console')[0];
                _console.innerHTML = "<p>"+"Browser Version: " + clientVersion + "</p>";
                _console.innerHTML += "<p>"+"IP: " + JSON.parse(xhr.responseText)['ip'] + "</p>";
                _console.innerHTML += "<p>"+"Coordinates: " + JSON.parse(xhr.responseText)['loc'] + "</p>";
                _console.innerHTML += "<p>"+"Country Code: " + JSON.parse(xhr.responseText)['country'] + "</p>";
                _console.innerHTML += "<p>"+"City: " + JSON.parse(xhr.responseText)['city'] + "</p>";
                _console.innerHTML += "<p>"+"Postal Code: " + JSON.parse(xhr.responseText)['postal'] + "</p>";
                _console.innerHTML += "<p>"+"Time Zone: " + JSON.parse(xhr.responseText)['timezone'] + "</p>";
            }else{
                //console.log("loading...");
            }
        }
        catch(e)
        {
            errors++;
        }
    };
    xhr.send(JSON.stringify(payload));
}

// function validate value hex
function validateHex(_value){
    console.log("entramos a validar-");
    console.log(_value)
    let regex = new RegExp(/^#([A-Fa-f0-9]{6})$/);
    if (_value == null) {
        return "false";
    }
    return (regex.test(_value) == true) ? true : false;
}

// function change color picker value.
function changeColorPickerValue(_value){
    if (validateHex(_value)){   
        document.getElementById('_color_input').value = _value;
        document.getElementById('_color_text').style.borderColor = _value;
    }else{
        document.getElementById('_color_text').value = "#ffffff";
        document.getElementById('_color_text').style.borderColor = "#ffffff";
    }
}

// function change color text value
function changeColorTextValue(_value){
    document.getElementById('_color_text').value = _value;
    document.getElementById('_color_text').style.borderColor = _value;
}

// Actions
console.log(navigator.sayswho); // outputs: `Chrome 62`
getIp(); // outputs: XXX.XXX.XXX.XXX clients IP

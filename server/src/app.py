from flask import Flask, jsonify, render_template, request, make_response, redirect
import os
import requests
from config import Config
from io import StringIO
import csv

app = Flask(__name__)

## Setup env vars
app.config.from_object(Config)
_services = app.config['CONF_SERVICES_SWITCH']

@app.route('/')
def index():
    local_ip = request.remote_addr
    context = {
        "local_ip" : local_ip
    }
    return render_template('index.html', **context)

@app.route('/switch')
def switch():
    try:
        return render_template('switch.html')
    except Exception as e:
        return {"status": "An error Occurred", "error": str(e)}

@app.route('/drone_tycoon')
def drone_tycoon():
    try:
        return render_template('drone_tycoon.html')
    except Exception as e:
        return {"status": "An error Occurred", "error": str(e)}



@app.route('/lab')
def lab():
    try:
        from datetime import datetime
        _farben = ['#00C300', '#FFFFFF', '#000000']
        _now = datetime.now()
        if _services:
            ## get countries list.
            _url = str(app.config['COUNTRIES_URL']) + '/countries'
            _header = { str(app.config['COUNTRIES_NAME']) : str(app.config['COUNTRIES_VAL'])}
            _response = requests.get(_url, headers=_header)
            _countries = _response.json()
        else:
            _countries = {}
        context = {
            '_current_date_time' : _now,
            '_countries': _countries, 
            '_farbens': _farben
        }
        return render_template('lab.html', **context)
    except Exception as e:
        return {"status": "An error Occurred", "error": str(e)}
    
@app.route('/info', methods=['POST', 'PUT', 'DELETE'])
def ip_info():
    try:
        if request.method == 'POST' and request.json['_ip']:
            if _services:
                print(" (!) -> Entro a ip_info POST - Services Activated.")
                _url = str(app.config['CONF_API_LOCATION_URL'])+'/'+str(request.json['_ip'])+'?token='+str(app.config['CONF_API_LOCATION'])
                _response = requests.get(_url)
                if str(_response.status_code) == str(200):
                    _response_json = _response.json()
                    return jsonify(_response_json), 200
                else:
                    return  jsonify({'alert': 'service unavailable. Try later again.'}), 300
            else:
                _obj = {'ip': '77.4.67.60', 'hostname': 'dynamic-077-004-067-060.77.4.pool.telefonica.de', 'city': 'Munich', 'region': 'Bavaria', 'country': 'DE', 'loc': '48.1374,11.5755', 'postal': '80331', 'timezone': 'Europe/Berlin', 'asn': {'asn': 'AS6805', 'name': 'Telefonica Germany GmbH & Co.OHG', 'domain': 'telefonica.de', 'route': '77.0.0.0/12', 'type': 'isp'}, 'company': {'name': 'Telefonica O2 Germany GmbH & Co. OHG', 'domain': 'telefonica.com', 'type': 'isp'}, 'privacy': {'vpn': False, 'proxy': False, 'tor': False, 'relay': False, 'hosting': False, 'service': ''}, 'abuse': {'address': 'Telefonica Germany GmbH & Co. OHG, Georg-Brauchle-Ring 50, 80992 Muenchen, DE', 'country': 'DE', 'email': 'abuse.de@telefonica.com', 'name': 'mediaWays Hostmaster', 'network': '77.4.0.0/16', 'phone': '+498924420'}, 'domains': {'page': 0, 'total': 0, 'domains': []}}
                #return  jsonify({'alert': 'service unavailable. Try later again.'}), 300
                return jsonify(_obj), 200
        else:
            return  jsonify({'alert': 'unouthorized'}), 400
    except Exception as e:
        return {"status": "An error Occurred", "error": str(e)}
    
@app.route('/csv', methods=['GET'])
def csv_return():
    data = [
        ['Header1', 'Header2', 'Header3'],
        ['Value1', 'Value2', 'Value3']
        # ... more rows if needed
    ] 

    si = StringIO()
    cw = csv.writer(si)

    for row in data:
        cw.writerow(row)
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=my_file.csv"
    output.headers["Content-type"] = "text/csv"

    return output


@app.route('/iris', methods=['GET'])
def iris():
    try:
        ## 1 import required libraries
        import pandas as pd 
        from sklearn.linear_model import LogisticRegression

        ## loading the dataset and displaying the first few rows
        iris_data = pd.read_csv('iris.csv')
        iris_data.head()

        ## split the data into features (x) and labels (y)
        x = iris_data.drop(columns=['variety'])
        y = iris_data['variety']

        ## create model 
        model = LogisticRegression()

        ## train model 
        model.fit(x.values, y)

        params = True if 'slength' in request.args and 'swidth' in request.args and 'plength' in request.args and 'pwidth' in request.args else False

        # Extract parameters from the request, converting to integers
        slength = float(request.args.get('slength')) if request.args.get('slength') else 4.6
        swidth = float(request.args.get('swidth')) if request.args.get('swidth') else 3.5
        plength = float(request.args.get('plength')) if request.args.get('plength') else 1.5
        pwidth = float(request.args.get('pwidth')) if request.args.get('pwidth') else 0.2

        # Use the extracted parameters in your prediction
        predictions = model.predict([[slength, swidth, plength, pwidth]])

        ## print and return the predictions
        predictions_text = "Prediction: "+str(predictions[0])
        print(predictions_text)
        return {'prediction': predictions[0], "default": not params} 
        
    except Exception as e:
        print("(!) Exception in /auth")
        print(e)
        return jsonify({"status": "An error Occurred", "error": str(e)}), 500



@app.route('/auth', methods=['GET'])
def auth(time_step=30, digits=6):
    try:
        if 'secret_key' in request.args: 
            import time
            import hashlib
            import hmac
            import base64
            """
            Generates a TOTP code given a secret key.

            Args:
                secret_key: The shared secret key (base32 encoded)
                time_step: The time step in seconds (default 30)
                digits: The number of digits in the TOTP code (default 6)

            Returns:
                The generated TOTP code as a string.
            """

            # Get the current time in Unix seconds
            current_time = int(time.time())

            # Calculate the time counter (number of time steps since epoch)
            time_counter = current_time // time_step

            # Convert the time counter to a byte string (big-endian)
            time_counter_bytes = time_counter.to_bytes(8, 'big')

            # Decode the secret key from base32 to bytes
            secret_key_bytes = base64.b32decode(request.args.get('secret_key'))

            # Calculate the HMAC-SHA1 hash
            hmac_hash = hmac.new(secret_key_bytes, time_counter_bytes, hashlib.sha1).digest()

            # Dynamic truncation (extract 4 bytes from the hash based on the last 4 bits)
            offset = hmac_hash[-1] & 0xf
            truncated_hash = hmac_hash[offset:offset + 4]

            # Convert the truncated hash to an integer
            code_int = int.from_bytes(truncated_hash, 'big')

            # Extract the desired number of digits
            code = str(code_int % 10**digits)

            # Pad with leading zeros if necessary
            code = code.zfill(digits)

            return jsonify({"code": code}), 200
        else:
            return jsonify({"status": "Missing required parameter"}), 403

    except Exception as e:
        print("(!) Exception in /auth")
        print(e)
        return jsonify({"status": "An error Occurred", "error": str(e)}), 500

@app.route('/ollama')
def ollama():
    try:
        return render_template('ollama.html')
    except Exception as e:
        return {"status": "An error Occurred", "error": str(e)}

@app.route('/ollama_message', methods=['GET', 'POST'])
def ollama_message():
    if request.method == 'POST':
        try:
            data = request.get_json()
            conversation_history = data.get('message')

            if not conversation_history:
                return jsonify({'error': 'Invalid request: "message" is required.'}), 400

            if _services:
                from google import genai
                from google.genai import types
                
                client = genai.Client(
                    vertexai=True,
                    project="adminde-tc",
                    location="us-central1",
                )
                  
                text1 = types.Part.from_text(text=conversation_history)

                model = "gemini-2.0-flash-001"
                contents = [
                    types.Content(
                    role="user",
                    parts=[
                            text1
                        ]
                    )
                ]

                generate_content_config = types.GenerateContentConfig(
                    temperature = 1.3,
                    top_p = 0.95,
                    max_output_tokens = 857,
                    response_modalities = ["TEXT"],
                    safety_settings = [types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="OFF"
                    ),types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="OFF"
                    ),types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="OFF"
                    ),types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="OFF"
                    )],
                )

                for chunk in client.models.generate_content_stream(
                    model = model,
                    contents = contents,
                    config = generate_content_config,
                    ):
                    print(chunk.text, end="")
                    full_response = chunk.text

                print("Google AI")

            else:
                # Check if the request is for summarization
                if conversation_history.startswith("**Summarize"):
                    # Construct the request payload for summarization
                    ollama_payload = {
                        "model": "llama3.2",
                        "prompt": conversation_history,
                        "stream": False
                    }
                else:
                    # Construct the request payload for normal chat
                    ollama_payload = {
                        "model": "llama3.2",
                        "prompt": conversation_history,
                        "stream": False
                    }

                # Call the Ollama API
                ollama_url = app.config['CONF_SERVICES_OLLAMA']+'/api/generate'
                print(" URL: "+ollama_url)
                response = requests.post(ollama_url, json=ollama_payload)
                response.raise_for_status()

                # Accumulate the response
                full_response = ""
                response_data = response.json()
                full_response = response_data.get("response")
                print("local Ollama")

            print("(!) Sending payload to ollama")
            print(full_response)
            
            return jsonify({'response': full_response}), 200

        except Exception as e:
            return jsonify({'error': f'An unexpected error occurred: {e}'}), 500

@app.route('/hello', methods=['GET'])
def hello():
    try:
        if request.method =='GET':
            return jsonify({'message':'hello world!'}), 200
        else: 
            return 'false'
    except Exception as e:
            print("(!) Exception in /hello)")
            print(e)
            return jsonify({'error': f'An unexpected error occurred: {e}'}), 500

@app.route("/countries", methods=['GET'])
def countries():
    try:
        countries = [ "Afghanistan","Åland Islands", "Albania","Algeria","American Samoa","Andorra","Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas (the)","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia (Plurinational State of)","Bonaire, Sint Eustatius and Saba","Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory (the)","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Cayman Islands (the)","Central African Republic (the)","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands (the)","Colombia","Comoros (the)","Congo (the Democratic Republic of the)","Congo (the)","Cook Islands (the)","Costa Rica","Croatia","Cuba","Curaçao","Cyprus","Czechia","Côte d'Ivoire","Denmark","Djibouti","Dominica","Dominican Republic (the)","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Falkland Islands (the) [Malvinas]","Faroe Islands (the)","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories (the)","Gabon","Gambia (the)","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island and McDonald Islands","Holy See (the)","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran (Islamic Republic of)","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Korea (the Democratic People's Republic of)","Korea (the Republic of)","Kuwait","Kyrgyzstan","Lao People's Democratic Republic (the)","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macao","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands (the)","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Micronesia (Federated States of)","Moldova (the Republic of)","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands (the)","New Caledonia","New Zealand","Nicaragua","Niger (the)","Nigeria","Niue","Norfolk Island","Northern Mariana Islands (the)","Norway","Oman","Pakistan","Palau","Palestine, State of","Panama","Papua New Guinea","Paraguay","Peru","Philippines (the)","Pitcairn","Poland","Portugal","Puerto Rico","Qatar","Republic of North Macedonia","Romania","Russian Federation (the)","Rwanda","Réunion","Saint Barthélemy","Saint Helena, Ascension and Tristan da Cunha","Saint Kitts and Nevis","Saint Lucia","Saint Martin (French part)","Saint Pierre and Miquelon","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten (Dutch part)","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Sudan","Spain","Sri Lanka","Sudan (the)","Suriname","Svalbard and Jan Mayen","Sweden","Switzerland","Syrian Arab Republic","Taiwan (Province of China)","Tajikistan","Tanzania, United Republic of","Thailand","Timor-Leste","Togo","Tokelau","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Turks and Caicos Islands (the)","Tuvalu","Uganda","Ukraine","United Arab Emirates (the)","United Kingdom of Great Britain and Northern Ireland (the)","United States Minor Outlying Islands (the)","United States of America (the)","Uruguay","Uzbekistan","Vanuatu","Venezuela (Bolivarian Republic of)","Viet Nam","Virgin Islands (British)","Virgin Islands (U.S.)","Wallis and Futuna","Western Sahara","Yemen","Zambia","Zimbabwe"]
        return jsonify({'countries': countries}), 200
    except Exception as e:
            print("(!) Exception in /countries)")
            print(e)
            return jsonify({'error': f'An unexpected error occurred: {e}'}), 500                   


@app.route('/wedding')
def wedding():
    local_ip = request.remote_addr
    context = {
        "local_ip" : local_ip
    }
    return render_template('wedding.html', **context)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
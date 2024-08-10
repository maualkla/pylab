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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
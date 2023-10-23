from flask import Flask, render_template, request, make_response, redirect
import os, requests
from config import Config

app = Flask(__name__)

## Setup env vars
app.config.from_object(Config)

@app.route('/')
def index():
    local_ip = request.remote_addr
    context = {
        "local_ip" : local_ip
    }
    return render_template('index.html', **context)

@app.route('/lab')
def lab():
    try:
        from datetime import datetime
        _now = datetime.now()
        ## get countries list.
        _url = str(app.config['COUNTRIES_URL']) + '/countries'
        _header = { str(app.config['COUNTRIES_NAME']) : str(app.config['COUNTRIES_VAL'])}
        _response = requests.get(_url, headers=_header)
        print(_response)
        print(_response.json())
        _countries = _response.json()
        context = {
            '_current_date_time' : _now,
            '_countries': _countries
        }
        return render_template('lab.html', **context)
    except Exception as e:
        return {"status": "An error Occurred", "error": str(e)}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
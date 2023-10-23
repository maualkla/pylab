from flask import Flask, render_template, request, make_response, redirect

app = Flask(__name__)

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
        _now = _now.strftime("%d%m%YH%M%S")
        context = {
            'current_date_time' : _now
        }
        return render_template('lab.html')
    except Exception as e:
        return {"status": "An error Occurred", "error": str(e)}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
from flask import Flask, render_template, url_for, make_response, send_from_directory, request
from flask_socketio import SocketIO
from flask_cors import CORS
import os

DEVICES = []

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route("/")
def index():
    return render_template("index.html", devices=DEVICES)

@app.route("/alert", methods=["POST"])
def alert():
    data = request.get_json()
    print(data)
    DEVICES.append(data)
    print(DEVICES)
    socketio.emit("alert", DEVICES, broadcast=True)
    return ""


@app.route('/service.js')
def service():
    response=make_response(send_from_directory('static',filename='service.js'))
    response.headers['Content-Type'] = 'application/javascript'
    return response

@app.context_processor
def override_url_for():
    return dict(url_for=dated_url_for)

def dated_url_for(endpoint, **values):
    if endpoint == "static":
        filename = values.get('filename', None)
        if filename:
            file_path = os.path.join(app.root_path, endpoint, filename)
            values['q'] = int(os.stat(file_path).st_mtime)
    return url_for(endpoint, **values)

if __name__ == "__main__":
    socketio.run(app, threaded=True)

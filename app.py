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
    for i in range(len(DEVICES)):
        if DEVICES[i][0] == data[0]:
            DEVICES[i] = data + [True]
            socketio.emit("alert", DEVICES, broadcast=True)
            return ""
    DEVICES.append(data + [True])
    socketio.emit("alert", DEVICES, broadcast=True)
    return ""

@socketio.on("initialize")
def start():
    socketio.emit("start", DEVICES)
    return ""

@socketio.on("reset")
def reset():
    global DEVICES
    DEVICES = []
    return ""

@socketio.on("delete")
def delete(data):
    global DEVICES
    i = data["i"]
    DEVICES[i][2] = False
    return ""

@app.route("/service.js")
def service():
    response = make_response(send_from_directory("static",filename="service.js"))
    response.headers["Content-Type"] = "application/javascript"
    return response

@app.route("/sound.mp3")
def sound():
    response=make_response(send_from_directory("static",filename="sound.mp3"))
    response.headers["Content-Type"] = "audio/mpeg"
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
    socketio.run(app, debug=True)

from flask import Flask
from flask_cors import CORS
import os
import shutil
import time

# create the Flask application that exposes the collector API
app = Flask(__name__)

# store the process start time so the API can calculate its uptime
START_TIME = time.time()

# allow the local dashboard development server to read the API response
CORS(
    app,
    resources={
        r"/status": {
            "origins": [
                "http://127.0.0.1:3001",
                "http://localhost:3001",
            ]
        }
    },
)

# define the /status API endpoint
@app.route("/status")
def status():
    """return the collector health status and current system metrics"""
    uptime_seconds = int(time.time() - START_TIME)
    disk = shutil.disk_usage("/")

    return {
        "status": "OK!",
        "uptime_seconds": uptime_seconds,
        # calculate memory usage from total and currently available pages
        "memory_percent": round(
            100 * (1 - os.sysconf("SC_AVPHYS_PAGES") / os.sysconf("SC_PHYS_PAGES")),
            2,
        ),
        # report usage for the root filesystem used by the application
        "disk_percent": round(100 * disk.used / disk.total, 2),
    }


# start Flask on all interfaces so the container can receive connections
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6000)
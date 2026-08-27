# import Flask so we can create a web API
from flask import Flask

# create the Flask app
app = Flask(__name__)

# define the /status API endpoint
@app.route('/status')
def status():
    # return a simple json
    return {"status": 'OK!'}

# start the server
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=6000)


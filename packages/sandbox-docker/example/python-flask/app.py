from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def hello():
    input_value = os.environ.get('INPUT_VALUE', 'Default Value')
    return f"Hello docker file from Flask! Input: {input_value}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081)
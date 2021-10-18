from controller.main import Start
from model.mongodb import Mongo
from multiprocessing import Pool
from flask import Flask, flash, request, redirect, url_for, render_template, jsonify

Mongo().start()

with Pool() as p:
       p.map(Mongo().creator,['regulatory validated','genomic'])

app = Flask(__name__)


@app.route('/')
def render_upload_file():
    return render_template('index.html')

@app.route('/home')
def home():
    return render_template('index.html')

@app.route('/network')
def network():
    return render_template('network.html')

@app.route('/network_creator', methods=['GET', 'POST'])
def network_creator():
    data = Start().start()
    return jsonify(data)





if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
    
from flask import Flask, request
from model.network import Network



class Start():
    def __init__(self):
        pass
    def start(self):
        class_opt = request.form.get('class_opt')
        input_opt = request.form.get('inp_opt')
        output_opt = request.form.getlist('out_opt')
        file = request.files['file']
        file_name = file.filename
        file.save('controller/uploads/'+file_name)
        input = {}
        node_list = []
        f = open('controller/uploads/'+file_name)
        for data in f:
            data = data.replace('\n','')
            node_list.append(data)
        input['classe'] = class_opt.lower()
        input['input'] = input_opt
        input['output'] = output_opt
        input['nodes'] = node_list
        network = Network(input).network_creator()
        metrics_basic = Network(input).metrics_basic()
        metrics_advanced = Network(input).metrics_advanced()
        table = Network(input).table()
        return {'network': network, 'metrics basic': metrics_basic,
            'metrics advanced': metrics_advanced, 'table': table}
    
    

    


import os 
import json
import time 
from pymongo import MongoClient


class Mongo():
    def __init__(self):
        pass

    def start(self):
        
        #client = MongoClient(os.environ['DB_PORT_27017_TCP_ADDR'], 27017)
        client = MongoClient()
        self.db = client['DB_ncRNA']
        client.drop_database('DB_ncRNA')
        
    def creator(self,x):
        files = os.listdir('model/database/'+x)
        for file in files:
            collection =  MongoClient()['DB_ncRNA'][file.split('.')[0]]
            for data in open('model/database/'+x+'/'+file):
                data = json.loads(data)
                collection.insert(data)
    def find (self,class_opt,input,node):
        collection = MongoClient()['DB_ncRNA'][class_opt+'_'+input]
        data = collection.find_one({input:node},{"_id":0})
        
        return data

    """
    def start(self):
        t0 = time.time()
        print('inicio')
        #client = MongoClient(os.environ['DB_PORT_27017_TCP_ADDR'], 27017)
        client = MongoClient()
        db = client['DB_ncRNA']
        client.drop_database('DB_ncRNA')
        for x in ['genomic','regulatory','regulatory validated','gwas']:
            files = os.listdir('model/database/'+x)
            for file in files:
                collection = db[x+'/'+file]
                for data in open('model/database/'+x+'/'+file):
                    data = json.loads(data)
                    collection.insert(data)
        t1 = time.time()
        print(t1 - t0)
    """
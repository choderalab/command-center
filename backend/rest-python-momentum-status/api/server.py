#!flask/bin/python

'''
Created on 02.06.2014

@author: Jan-Hendrik Prinz

@author: Miguel Grinberg (Flask / REST Tutorial)
found @ http://blog.miguelgrinberg.com/post/designing-a-restful-api-using-flask-restful
'''


from flask_restful import Api
from modules.momentum import Momentum
from flask import Flask

# Turn off extensive logging and show only errors
import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

if __name__ == '__main__':

    ##############################################################################
    #| Flask Server Stuff
    ##############################################################################

    app = Flask(__name__, static_url_path = "")
    api = Api(app)

    momentum = Momentum()
    
    api.add_resource(momentum.getStatusAPI(), '/status', endpoint = 'status')
    api.add_resource(momentum.getMessageAPI(), '/messages', endpoint = 'messages')

    momentum.start()
    
    ##############################################################################
    #| RUN SERVER THREAD
    ##############################################################################


    local = False
    if (local):
        app.run(debug = False, port=8000, host='localhost')
    else:
        app.run(debug = False, port=8000, host='0.0.0.0')


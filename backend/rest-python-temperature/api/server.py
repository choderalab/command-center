#!flask/bin/python

'''
Created on 02.06.2014

@author: Miguel Grinberg (Flask / REST Tutorial)
found @ http://blog.miguelgrinberg.com/post/designing-a-restful-api-using-flask-restful
@author: Jan-Hendrik Prinz
'''

from flask import Flask, jsonify, abort, request, make_response, url_for
from flask.views import MethodView
from flask_restful import Api, Resource, reqparse, fields, marshal
from flask_httpauth import HTTPBasicAuth 

from functools import wraps
from flask import current_app

import urllib2
import string

import os
from threading import Thread, Event

from lxml import etree, objectify

from dateutil.parser import parse
import datetime

from io import StringIO, BytesIO

import HTMLParser

h = HTMLParser.HTMLParser()

def jsonp(func):
    """Wraps JSONified output for JSONP requests."""
    @wraps(func)
    def decorated_function(*args, **kwargs):
        callback = request.args.get('callback', False)
        if callback:
            data = str(jsonify(func(*args, **kwargs)).data)
            content = str(callback) + '(' + data + ')'
            mimetype = 'application/javascript'
            return current_app.response_class(content, mimetype=mimetype)
        else:
            return func(*args, **kwargs)
    return decorated_function

last_timestamp = datetime.datetime.fromtimestamp(0)

temperature = 0.0
unit = 'C'
parse_running = False
    
def readTemperatures():
    global temperature, parse_running, unit
    if (not parse_running):
        parse_running = True
        
        url="http://zrbnetbotz5-1745.mskcc.org/pages/status.html?encid=nbAvocetEnc_3"
        req = urllib2.Request(url)

        try:
            last_timestamp = datetime.datetime.fromtimestamp(0)
            response = urllib2.urlopen(req)
            parser = etree.HTMLParser() 
            text = response.read()
            tree   = etree.fromstring(text, parser)            
            t = (tree.xpath("//table[@class='sensortable']/tr[3]/td[2]/a/text()"))[0]
            unit = t[-1]
            val = float(string.split(t,' ')[0])
            if unit =='F':
                # Fahrenheit
                unit = 'C'
                val = (val - 32.0) / 9.0 * 5.0
            temperature = val 

        except urllib2.HTTPError, error:
            print "error: ", error.read()
            a = error.read()

        parse_running = False

class AuditThread(Thread):
    def __init__(self, event):
        Thread.__init__(self)
        self.stopped = event

    def run(self):
        while not self.stopped.wait(5):
            # call a function
#            print device_state
            readTemperatures()

lines_parsed = 0
parse_running = False;

stopFlag = Event()
thread = AuditThread(stopFlag)
thread.start()                                

app = Flask(__name__, static_url_path = "")
api = Api(app)
auth = HTTPBasicAuth()
 
@auth.get_password
def get_password(username):
    if username == 'miguel':
        return 'python'
    return None
 
@auth.error_handler
def unauthorized():
    return make_response(jsonify( { 'message': 'Unauthorized access' } ), 403)
    # return 403 instead of 401 to prevent browsers from displaying the default auth dialog

class StatusAPI(Resource):
#    decorators = [auth.login_required]
    decorators = [jsonp]

    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        super(StatusAPI, self).__init__()
        
    def get(self):
        return { 
                'status' : { 
                             'state' : 'online', 
                             'time' : last_timestamp.isoformat(),
                            },
                'temperature' : { 'keshari' : { 
                                   'temperature' : temperature, 
                                   'unit' : unit
                                   } 
                                },
                'updated' : last_timestamp.isoformat()
                }


api.add_resource(StatusAPI, '/status', endpoint = 'status')

if __name__ == '__main__':
    stopFlag = Event()
    thread = AuditThread(stopFlag)
    thread.start()     
    app.run(debug = False, port=8001, host='0.0.0.0')


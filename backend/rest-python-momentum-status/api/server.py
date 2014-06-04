#!flask/bin/python

'''
Created on 02.06.2014

@author: Miguel Grinberg (Flask / REST Tutorial)
found @ http://blog.miguelgrinberg.com/post/designing-a-restful-api-using-flask-restful
@author: Jan-Hendrik Prinz
'''

from flask import Flask, jsonify, request, make_response, current_app
from flask_restful import Api, Resource, reqparse
from flask_httpauth import HTTPBasicAuth 
from functools import wraps

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

import os
from threading import Thread, Event

from lxml import etree, objectify

from dateutil.parser import parse
import datetime

if os.name == 'posix':
    path_to_folder = 'data/audit/'
elif os.name == 'nt':
    path_to_folder = 'c:/Users/Public/Documents/Thermo Scientific/Momentum/Audit/'

file_list = ['AuditLog.9.xml', 'AuditLog.8.xml', 'AuditLog.7.xml', 'AuditLog.6.xml', 'AuditLog.5.xml', 'AuditLog.4.xml', 'AuditLog.3.xml', 'AuditLog.2.xml', 'AuditLog.1.xml', 'AuditLog.xml']

event_list = []
worklist_event_list={}
device_state = {}
system_state = [ { 'state' : 'offline', 'time' : datetime.datetime.fromtimestamp(0) } ]
system_state_changed = 0
device_variable = {}
device_variable_changed = {}

last_timestamp = datetime.datetime.fromtimestamp(0)

messages = []

def _get_timestamp(elem):
    ts = elem.get('timestamp')
    tt = parse(ts)
    tt = tt.replace(tzinfo=None)
    return tt
#    return (tt - parse("Jan 1st, 2014")).total_seconds()

def _parse_System(elem):
    system_state.append({ 'time' :  _get_timestamp(elem) ,'state' :  elem.attrib['state'] })

    
def _parse_Device(elem):
    
    if elem.attrib['Device'] not in device_state:
        device_state[elem.attrib['Device']] = [{ 'time' :  _get_timestamp(elem) ,'state' :  elem.attrib['State'] }]
    else:
        device_state[elem.attrib['Device']].append({ 'time' :  _get_timestamp(elem) ,'state' :  elem.attrib['State'] })

def _parse_AutomationMessage(elem):
    messages.append({
                     'time' : _get_timestamp(elem),
                     'title' : elem.attrib['Title'],
                     'description' : elem.attrib['Description']
                     })
    
def _parse_DeviceVariable(elem):
    if elem.attrib['Name'] not in device_state:
        device_variable[elem.attrib['Name']] = [{ 'time' :  _get_timestamp(elem) ,'state' :  elem.attrib['Value'] }]
    else:
        device_variable[elem.attrib['Name']].append({ 'time' :  _get_timestamp(elem) ,'state' :  elem.attrib['Value'] })


def get_events_from_xml(file):
    root = etree.parse( path_to_folder + file )
        
    for elem in root.getiterator():
        i = elem.tag.find('}')
        if i >= 0:
            elem.tag = elem.tag[i+1:]
            
    objectify.deannotate(root, pytype=True, xsi=True, xsi_nil=True, cleanup_namespaces=True)    
    
    for elem in root.getiterator():
        if 'Type' in elem.attrib:
            elem.attrib['Type'] = elem.attrib['Type'][:-5]
            for attr, val in elem.attrib.iteritems():
                i = attr.find('-')
                if i >= 0:
                    elem.attrib[(attr[i+1:])] = val
                    del elem.attrib[attr]
    
    return root
                    
def parse_events(root):        
    global last_timestamp, lines_parsed                          
    ti = 0      
    for elem in root.xpath("//Datum"):
        ti = _get_timestamp(elem)
        if ti >= last_timestamp:
            fnc = '_parse_' + elem.attrib['Type']
            if fnc in globals():
                globals()[fnc](elem)
            last_timestamp = ti


    
def readAudit():
    global lines_parsed, path_to_folder, file_list, parse_running
    if (not parse_running):
        parse_running = True
        files_to_parse = [ file for file in file_list if file in os.listdir(path_to_folder) ]
            
        for file in files_to_parse:
            parse_events( get_events_from_xml(file) )
            
        parse_running = False

class AuditThread(Thread):
    def __init__(self, event):
        Thread.__init__(self)
        self.stopped = event

    def run(self):
        while not self.stopped.wait(5):
            # call a function
#            print device_state
            readAudit()


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
#    decorators = [jsonp, auth.login_required]
    decorators = [jsonp]

    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        super(StatusAPI, self).__init__()
        
    def get(self):
        return { 
                'status' : { 
                             'state' : system_state[-1]['state'], 
                             'time' : system_state[-1]['time'].isoformat()
                            },
                'devices' : { d : { 
                                   'state' : device_state[d][-1]['state'], 
                                   'time' : device_state[d][-1]['time'].isoformat() 
                                   } 
                                   for d in device_state 
                                },
                'variables': { d : { 
                                   'value' : device_variable[d][-1]['state'], 
                                   'time' : device_variable[d][-1]['time'].isoformat() 
                                   } 
                                   for d in device_variable 
                                },
                'updated' : last_timestamp.isoformat()
                }


api.add_resource(StatusAPI, '/status', endpoint = 'status')

if __name__ == '__main__':
    stopFlag = Event()
    parse_running = False
    thread = AuditThread(stopFlag)
    thread.start()     
    app.run(debug = False, port=9000)


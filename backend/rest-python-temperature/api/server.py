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

import HTMLParser
import string

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

import os
from threading import Thread, Event

from lxml import etree, objectify

import copy

from dateutil.parser import parse
import datetime

if os.name == 'posix':
    path_to_folder = 'data/audit/'
    path_to_workunit_folder = 'data/Work Units/'
elif os.name == 'nt':
    path_to_folder = os.path.join('c:\\','Users','Public','Documents','Thermo Scientific','Momentum', 'Audit')
    path_to_workunit_folder = os.path.join('c:\\','Users','Public','Documents','Thermo Scientific','Momentum','Work Units')
    
print path_to_workunit_folder

file_list = ['AuditLog.9.xml', 'AuditLog.8.xml', 'AuditLog.7.xml', 'AuditLog.6.xml', 'AuditLog.5.xml', 'AuditLog.4.xml', 'AuditLog.3.xml', 'AuditLog.2.xml', 'AuditLog.1.xml', 'AuditLog.xml']
# Speed Up
#file_list = ['AuditLog.4.xml', 'AuditLog.3.xml', 'AuditLog.2.xml', 'AuditLog.1.xml', 'AuditLog.xml']

event_list = []
worklist_event_list={}
device_state = {}
system_state = [ { 'state' : 'offline', 'time' : datetime.datetime.fromtimestamp(0) } ]
system_state_changed = 0
device_variable = {}
device_variable_changed = {}
error_occurrances = {}

last_timestamp = datetime.datetime.fromtimestamp(0)

workunits = set()
messages = []

out_messages = copy.deepcopy(messages)
out_system_state = copy.deepcopy(system_state)
out_device_state = copy.deepcopy(device_state)
out_device_variable = copy.deepcopy(device_variable)
out_last_timestamp = last_timestamp

def _get_timestamp(elem):
    ts = elem.get('timestamp')
    tt = parse(ts)
    tt = tt.replace(tzinfo=None)
    return tt
#    return (tt - parse("Jan 1st, 2014")).total_seconds()

# _parse_[name] functions that parse the xml nodes of type name

def _from_quotes(s):
    s = s.split('"')
    if len(s) > 1:
        return s[1]
    else:
        return ''

def _from_brackets(s):
    s = s.split('(')
    if len(s) > 1:
        p = s[1].split(')')
        if len(p)>0:
            return p[0]
    else:
        return ''
        
def _remove_xsi(s):
    replacement =   'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"'
    s = string.replace(s, replacement, '')
    s = string.replace(s, 'xsi:', '')
    s = string.replace(s, 'xsd:', '')
    return s

def _parse_System(elem):
    system_state.append({ 'time' :  _get_timestamp(elem) ,'state' :  elem.attrib['state'] })

def _parse_Device(elem):
    time = _get_timestamp(elem)
    
    if elem.attrib['Device'] not in device_state:
        device_state[elem.attrib['Device']] = [{ 'time' :  time ,'state' :  elem.attrib['State'] }]
    else:
        if time > device_state[elem.attrib['Device']][0]['time']:
            device_state[elem.attrib['Device']] = [{ 'time' :  time ,'state' :  elem.attrib['State'] }]

def _parse_Operation(elem):
    global messages
    device = elem.attrib['device']
    description = elem.attrib['Description']
    role = elem.attrib['Role']
    process = elem.attrib['process']
    title = description.split('(')[0]
    description = _from_brackets(description)
    batch = elem.attrib['batch']
    workunit = elem.attrib['workUnit']
    duration = elem.attrib['Duration']
    success = elem.attrib['Successful']
    time = _get_timestamp(elem)
    start = elem.attrib['Start']
    end = elem.attrib['End']
        
    message = {
             'mode' : False,
             'time' : time,
             'iso' : time.isoformat(),
             'title' : title,
             'description' : description,
             'workunit' : workunit,
             'batch' : batch,
             'process' : process,
             'device' : device,
             'success' : success,
             'duration' : duration,
             'selected' : '',
             'start' : start,
             'end' : end,
             'role' : role
             }
    
    messages.append(message)        
    
    return
        
def _parse_AutomationMessage(elem):
    global workunits, messages
    title = elem.attrib['Title']
    time = _get_timestamp(elem)
    
    description = h.unescape(elem.attrib['Description'])
    message_xml = h.unescape(_remove_xsi(elem.attrib['Message']))
    
    mode = 'Result' in elem.attrib
    
    if mode:
#        result_xml = h.unescape(_remove_xsi(elem.attrib['Result']))
        result_xml = ''
        selected = elem.attrib['SelectedItems']
    else:
        result_xml = ''
        selected = ''

    message = {}
    
    batch = ''
    workunit = ''
    device = ''
    
    single = False
    ignore = False
    
    error = False
    idx = 0
        
    if title == 'Device State' or title == 'Device Mode':
        # The state of a device has changed. Can be ignored since covered by other audit.
        device = _from_quotes(description)
        single = True
        ignore = True
    elif title == 'No System Battery':
        single = True
        ignore = True
    elif title == 'Stopping':
        single = True
        ignore = True
    elif title == 'Starting':
        single = True
        ignore = True
    elif title == 'Batch Unloaded':
        batch = _from_quotes(description)     
        sp = batch.split("\\")
        batch = sp[1]
        workunit = sp[0]
        single = True
    elif title == 'Batch Waiting to Unload':
        batch = _from_quotes(description)     
        sp = batch.split("\\")
        batch = sp[1]
        workunit = sp[0]
        single = True
    elif title == 'Work Unit Complete':        
        workunit = _from_quotes(description)       
        single = True    
    elif title == 'Work Unit Waiting to Load':
        workunit = _from_quotes(description)       
        single = True
    elif title == 'Work Unit Waiting to Unload':
        workunit = _from_quotes(description)       
        single = True        
    elif title == 'Work Unit Unloaded':        
        workunit = _from_quotes(description)       
        single = True        
    elif title == 'Work Unit Added':
        workunit = _from_quotes(description)       
        single = True        
    elif title == 'Work Unit Removed':
        workunit = _from_quotes(description)
        single = True      
        # Remove workunit from tracker
        # Might use a flag to indicate to read complete file once and then treat as closed
        
    elif title == 'Work Unit Loaded':
        workunit = _from_quotes(description)
        single = True       
        # Add workunit to tracker
        folder_path = os.path.join(path_to_workunit_folder)
        folders = os.walk(folder_path).next()[1]
        # print folders
        folder = [f for f in folders if f.startswith(workunit)]
        if len(folder) > 0:
            file = os.path.join(path_to_workunit_folder, folder[0], 'Audit', 'AuditLog.xml')
            if os.path.isfile(file):
                workunits |= set([workunit])
        
    elif title == 'Batch Loaded':
        workunit = _from_quotes(description)
        single = True         
    else:
        root = etree.fromstring(message_xml)
        idx = root.xpath("//Id")[0].text
        items = root.xpath("//Items")
        device = _from_quotes(title)
        error = True
        
        
#    print workunit
        
    if not ignore:
        if not single or mode:
            message = dict(message, **{
                     'mode' : mode,
#                     'time' : time,
                     'iso' : time.isoformat(),
                     'title' : title,
                     'description' : description,
                     'selected' : selected,
#                     'message' : message_xml,
#                     'result' : result_xml,
                     'duration' : 0,
                     'workunit' : workunit,
                     'batch' : batch,
                     'device' : device,
                     'error' : error,
                     'id' : idx,
                     'start' : time,
                     'end' : time
                     })
            
            messages.append(message)
    
    return
        
    
def _parse_DeviceVariable(elem):
    name = elem.attrib['Name']
    value = elem.attrib['Value']
    
    if name == 'OnlineState':
        # IMPORTANT! This informs about occurred errors!
        if value == 'Error':
            # An error has occurred
            error_occurrances[ _get_timestamp(elem) ] = { 'Type' : 'Error' }
    
    if name not in device_state:
        device_variable[name] = [{ 'time' :  _get_timestamp(elem) ,'state' :  value }]
    else:
        device_variable[name].append({ 'time' :  _get_timestamp(elem) ,'state' :  value })


def get_events_from_xml(file):
    root = etree.parse( file )
        
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
        lines_parsed = lines_parsed + 1
        ti = _get_timestamp(elem)
#        if elem.attrib['Type'].startswith('O'):
#            print elem.attrib['Type']
            
#        if ti >= last_timestamp:
        fnc = '_parse_' + elem.attrib['Type']
        if fnc in globals():
            globals()[fnc](elem)
#        else:
#            print fnc
        last_timestamp = ti

    
def readAudit():
    global lines_parsed, path_to_folder, file_list, parse_running, workunits, messages, device_variable, device_state, system_state, last_timestamp, out_messages, out_device_state, out_device_variable, out_last_timestamp, out_system_state
#    print parse_running
    if (not parse_running):
        parse_running = True
        
        # workunits = set()
#        print file_list

        # Parse main audit first
        files_to_parse = [ file for file in file_list if file in os.listdir(path_to_folder) ]
        lines_parsed = 0
        
#        print len(files_to_parse)

        last_timestamp = datetime.datetime.fromtimestamp(0)

            
        for file in files_to_parse:
            file_path = os.path.join( path_to_folder, file)
            parse_events( get_events_from_xml(file_path ) )
            
        # Parse open workunits
        
        
        lines_parsed = 0
        
        workunits_cp = copy.deepcopy(workunits)
        
        for wl in workunits_cp:
            last_timestamp = datetime.datetime.fromtimestamp(0)
            folder_path = os.path.join(path_to_workunit_folder)
            folders = os.walk(folder_path).next()[1]
            # print folders
            folder = [f for f in folders if f.startswith(wl)]
            if len(folder) > 0:
                file = os.path.join(path_to_workunit_folder, folder[0], 'Audit', 'AuditLog.xml')
#                print file
                if os.path.isfile(file):
                    parse_events( get_events_from_xml(file) )
                    
#        print 'Lines parsed : ' , lines_parsed
#        print last_timestamp.ctime()

        out_messages = copy.deepcopy(messages)
        out_system_state = copy.deepcopy(system_state)
        out_device_state = copy.deepcopy(device_state)
        out_device_variable = copy.deepcopy(device_variable)
        out_last_timestamp = last_timestamp
        
        messages = []
        device_state = {}
        system_state = [ { 'state' : 'offline', 'time' : datetime.datetime.fromtimestamp(0) } ]
        device_variable = {}

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

lines_parsed = 0
parse_running = False;

stopFlag = Event()
thread = AuditThread(stopFlag)
thread.start()                                

# print len(messages)
# readAudit()
# print len(messages)
# print [ s[0].ctime() + ' changed to ' + s[1] for s in system_state ]
# print system_state[-1]
# print [ m['time'].ctime() + ' : ' + m['description'] for m in reversed(messages) ]
# print [ d + " : " + device_state[d][-1]['state'] + " since " + device_state[d][-1]['time'].ctime() for d in device_state]

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
                             'state' : out_system_state[-1]['state'], 
                             'time' : out_system_state[-1]['time'].isoformat()
                            },
                'devices' : { d : { 
                                   'state' : out_device_state[d][-1]['state'], 
                                   'time' : out_device_state[d][-1]['time'].isoformat() 
                                   } 
                                   for d in out_device_state 
                                },
                'variables': { d : { 
                                   'value' : out_device_variable[d][-1]['state'], 
                                   'time' : out_device_variable[d][-1]['time'].isoformat() 
                                   } 
                                   for d in out_device_variable 
                                },
                'updated' : out_last_timestamp.isoformat()
                }

class MessageAPI(Resource):
#    decorators = [auth.login_required]
    decorators = [jsonp]

    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        super(MessageAPI, self).__init__()
        
    def get(self):
        global out_messages
        max_messages = 40
                
        out_messages = sorted(out_messages, key=lambda k: k['iso'], reverse=True)
          
        if len(out_messages) > max_messages:
            m = out_messages[0:max_messages]
        else:
            m = out_messages
            
        if len(m) > 0:
            return { 
                'messages' : m,
                'updated' : m[-1]['iso']
                }
        else:
            return { 
                'messages' : [],
                'updated' : ''
                }
            

class ErrorAPI(Resource):
#    decorators = [auth.login_required]
    decorators = [jsonp]

    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        super(ErrorAPI, self).__init__()
        
    def get(self):
        
        max_messages = 1000

        errors = [ m for m in messages if m['error'] == True]
        
        if len(errors) > max_messages:
            m = errors[-max_messages:]
        else:
            m = errors
                                
        if len(m) > 0:
            return { 
                'messages' : m,
                'updated' : m[-1]['iso']
                }
        else:
            return { 
                'messages' : [],
                'updated' : ''
                }


api.add_resource(StatusAPI, '/status', endpoint = 'status')
api.add_resource(MessageAPI, '/messages', endpoint = 'messages')
api.add_resource(ErrorAPI, '/errors', endpoint = 'errors')

if __name__ == '__main__':
    stopFlag = Event()
    thread = AuditThread(stopFlag)
    thread.start()     
    local = False
    if (local):
        app.run(debug = False, port=8000, host='localhost')
    else:
        app.run(debug = False, port=8000, host='0.0.0.0')

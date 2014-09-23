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
from flask_restful.utils import cors

from flask_cors import cross_origin

from functools import wraps
from flask import current_app

import json
import os

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



if os.name == 'posix':
    path_to_folder = 'data/'
elif os.name == 'nt':
    path_to_folder = 'c:/Users/Public/Documents/'



app = Flask(__name__, static_url_path = "")
app.config['CORS_ORIGINS'] = ['*']
app.config['CORS_HEADERS'] = ['Content-Type', 'accept', 'origin', 'authorization', 'content-type']
#app.config['CORS_EXPOSE_HEADERS'] = ['Content-Type', 'accept', 'origin', 'authorization', 'content-type']


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

plates = [
]
class Container():
            
    def __init__(self, *initial_data, **kwargs):
        self.general_id = ''
        self.general_name = ''
        self.general_name_short = ''
        self.general_description = ''
        self.manufacturer_name = ''
        self.manufacturer_url = ''
        self.manufacturer_product_url = ''
        self.manufacturer_number = ''
        self.manufacturer_pdf_url = ''
        self.id_momentum = ''
        self.id_evo = ''
        self.id_infinite = ''
        self.id_barcode = ''
        self.plate_bottom_read = True
        self.plate_color = ''
        self.plate_type = ''
        self.plate_material = ''
        self.plate_height = 14.7
        self.plate_length = 127.4
        self.plate_width = 85.5
        self.flange_type = ''
        self.flange_height = 0.0
        self.flange_height_short = 0.0
        self.flange_width = 0.0
        self.stacking_above = True
        self.stacking_below = True
        self.stacking_plate_height = 0.0
        self.well_bottom_type = ''
        self.well_coating = 'none'
        self.well_type = 'full'
        self.well_position_first_x = 0.0
        self.well_position_first_y = 0.0
        self.well_position_last_x = 0.0
        self.well_position_last_y = 0.0
        self.well_depth = 10.0
        self.well_volume_max = 0.0
        self.well_volume_working_min = 0.0
        self.well_volume_working_max = 0.0
        self.well_size_x = 0.0
        self.well_size_y = 0.0
        self.well_shape = 'round'
        self.well_bottom_shape = 'flat'
        self.well_rows = 0
        self.well_columns = 0
        self.well_nubmering = ''
        self.lid_allowed = True
        self.lid_offset = 0.0
        self.momentum_grip_force = 0
        self.momentum_offsets_low_lidded_plate = 0.0
        self.momentum_offsets_low_lidded_lid = 0.0
        self.momentum_offsets_low_grip_transform = ''
        self.evo_plate_grip_force = 75
        self.evo_lid_grip_force = 60
        self.evo_lid_grip_narrow = 92.0
        self.evo_lid_grip_wide = 0.0        
        
        for dictionary in initial_data:
            for key in dictionary:
                setattr(self, key, dictionary[key])
        for key in kwargs:
            setattr(self, key, kwargs[key])   
            
    def asdict(self):
        members = {attr : getattr(self, attr) for attr in dir(self) if not callable(attr) and not attr.startswith("__") and attr[0] == attr[0].lower() and hasattr(self, attr) and attr != 'asdict'}
        return members
                
c = Container()

plates.append(c.asdict())

print
 
plate_fields = {attr : fields.String for attr in c.asdict()}

#@cors.crossdomain(origin = '*', methods=['GET' ,'PUT'], headers = '*')
class PlateListAPI(Resource):
#    decorators = [auth.login_required]
#    decorators = [jsonp]
    decorators = [cors.crossdomain(origin = '*', methods=['GET' ,'PUT'], headers = '*')]

    def __init__(self):
        self.reqparse = reqparse.RequestParser()
#        self.reqparse.add_argument('title', type = str, required = True, help = 'No plate title provided', location = 'json')
#        self.reqparse.add_argument('description', type = str, default = "", location = 'json')
        super(PlateListAPI, self).__init__()
        
    def get(self):
        args = self.reqparse.parse_args()
        print self.reqparse.args        
        return { 'plates': map(lambda t: marshal(t, plate_fields), plates) }
    
    def put(self):
        args = self.reqparse.parse_args()
        print args

    def post(self):
        args = self.reqparse.parse_args()
        plate = {
            'id': plates[-1]['id'] + 1, 
            'title': args['title'],
            'description': args['description'],
            'done': False
        }
        plates.append(plate)
        return { 'plate': marshal(plate, plate_fields) }, 201

class PlateAPI(Resource):
#    decorators = [auth.login_required]
#    decorators = []
    decorators = [cors.crossdomain(origin = '*', methods=['GET' ,'PUT'], headers = '*')]    
    
    
    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('title', type = str, location = 'json')
        self.reqparse.add_argument('description', type = str, location = 'json')
        self.reqparse.add_argument('done', type = bool, location = 'json')
        super(PlateAPI, self).__init__()

    def get(self, id):
        plate = filter(lambda t: t['id'] == id, plates)
        if len(plate) == 0:
            abort(404)
        return { 'plate': marshal(plate[0], plate_fields) }
        
    def put(self, id):
        print id
        plate = filter(lambda t: t['id'] == id, plates)
        if len(plate) == 0:
            abort(404)
        plate = plate[0]
        args = self.reqparse.parse_args()
        for k, v in args.iteritems():
            if v != None:
                plate[k] = v
        return { 'plate': marshal(plate, plate_fields) }

    def delete(self, id):
        plate = filter(lambda t: t['id'] == id, plates)
        if len(plate) == 0:
            abort(404)
        plates.remove(plate[0])
        return { 'result': True }
    

api.add_resource(PlateListAPI, '/plates', endpoint = 'plates', methods=['GET', 'PUT', 'OPTIONS'])
api.add_resource(PlateAPI, '/plate/<int:id>', endpoint = 'plate', methods=['GET', 'OPTIONS'])
    
if __name__ == '__main__':
    local = True
    if (local):
        app.run(debug = True, port=9000, host='localhost')
    else:
        app.run(debug = True, port=9000, host='0.0.0.0')

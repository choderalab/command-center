__author__ = 'jan-hendrikprinz'

from functools import wraps
from flask import current_app
from flask import jsonify, request, make_response
from flask_httpauth import HTTPBasicAuth
from flask_restful import Resource, reqparse


##############################################################################
#| Password Protection (in case we might need this)
##############################################################################

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

##############################################################################
#| JSONP Wrapper
##############################################################################

# This seemed the easiest solution to get cross-site access

def jsonp(func):
    """Wraps JSONified output for JSONP requests in Flask."""
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


class Module(object):
    def __init__(self):
        pass
    def start(self):
        pass
    def stop(self):
        pass

    def resource(self, name):
        return getattr(self, 'get' + name)()

class RPResource(Resource):
    decorators = [jsonp]

    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        super(Resource, self).__init__()

    def get(self):
        return ''
__author__ = 'jan-hendrikprinz'

import HTMLParser
import string
import os

from lxml import etree, objectify
from dateutil.parser import parse
import datetime
import re

from threading import Thread, Event
import module

# TODO: Make sure that workunit folders are uniquely found

class Momentum(module.Module):

    h = HTMLParser.HTMLParser()

    def __init__(self):
        """

        """
        super(Momentum, self).__init__()

        ## Add some variables depending on location. If on the windowsmachine (nt) choose the correct locations

        if os.name == 'posix':
            self.path_to_folder = 'data/audit/'
            self.path_to_workunit_folder = 'data/'
        elif os.name == 'nt':
            self.path_to_folder = os.path.join('c:\\','Users','Public','Documents','Thermo Scientific','Momentum', 'Audit')
            self.path_to_workunit_folder = os.path.join('c:\\','Users','Public','Documents','Thermo Scientific','Momentum','Work Units')

        self.file_list = ['AuditLog.9.xml', 'AuditLog.8.xml', 'AuditLog.7.xml', 'AuditLog.6.xml', 'AuditLog.5.xml', 'AuditLog.4.xml', 'AuditLog.3.xml', 'AuditLog.2.xml', 'AuditLog.1.xml', 'AuditLog.xml']

        self.event_list = []
        self.device_state = {}
        self.system_state = [ { 'state' : 'offline', 'time' : datetime.datetime.fromtimestamp(0) } ]
        self.system_state_changed = 0
        self.device_variable = {}
        self.device_variable_changed = {}
        self.error_occurrances = {}

        self.lines_parsed = 0
        self.last_timestamp = datetime.datetime.fromtimestamp(0)
        self.workunits = set()
        self.workunit_finished = set()
        self.messages = []

        # this keeps the character position of a parsed file indexed
        # by the string of the first entry. This way we can keep track of
        # all parsed files independent of the filename
        self.parse_position = dict()

        # this tracks the size of each file to skip non-changed files
        self.file_size = dict()

        self.thread = None
        self.stop_flag = False

##############################################################################
#| XML Helper Functions
##############################################################################

    @staticmethod
    def _get_timestamp(elem):
        """
        Returns the timestamp in an XML node in side the timestamp attribute and removes timezone information
        :param elem:
        :return:
        """
        ts = elem.get('timestamp')
        tt = parse(ts)
        tt = tt.replace(tzinfo=None)
        return tt

    @staticmethod
    def _from_quotes(s):
        """
        Returns the first text appearing in double quotes

        Parameters
        ---------
        s : string
            the string to be parsed

        Returns
        -------
        string
            the quoted string
        """
        s = s.split('"')
        if len(s) > 1:
            return s[1]
        else:
            return ''

    @staticmethod
    def _remove_xsi(s):
        """
        Hack to remove XSI from the parsed XML file!

        :param s:
        :return:
        """
        replacement =   'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"'
        s = string.replace(s, replacement, '')
        s = string.replace(s, 'xsi:', '')
        s = string.replace(s, 'xsd:', '')
        return s

########################################################
#| XML Parse Functions
########################################################

# _parse_[name] functions that parse the xml nodes of type name

    def _parse_System(self, elem):
        """
        Parse System nodes
        :param elem:
        :return:
        """
        self.system_state.append({ 'time' :  self._get_timestamp(elem) ,'state' :  elem.attrib['state'] })

    def _parse_Device(self, elem):
        """
        Parse Device nodes

        :param elem:
        :return:
        """
        if elem.attrib['Device'] not in self.device_state:
            self.device_state[elem.attrib['Device']] = [{ 'time' :  self._get_timestamp(elem) ,'state' :  elem.attrib['State'] }]
        else:
            self.device_state[elem.attrib['Device']].append({ 'time' :  self._get_timestamp(elem) ,'state' :  elem.attrib['State'] })

    def _parse_AutomationMessage(self, elem):
        """
        Parse AutomationMessage nodes

        :param elem:
        :return:
        """
        title = elem.attrib['Title']
        time = self._get_timestamp(elem)

        description = Momentum.h.unescape(elem.attrib['Description'])
        message_xml = Momentum.h.unescape(self._remove_xsi(elem.attrib['Message']))

        mode = 'Result' in elem.attrib

        if mode:
            selected = elem.attrib['SelectedItems']
        else:
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
            device = self._from_quotes(description)
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
            batch = self._from_quotes(description)
            sp = batch.split("\\")
            batch = sp[1]
            workunit = sp[0]
            single = True
        elif title == 'Batch Waiting to Unload':
            batch = self._from_quotes(description)
            sp = batch.split("\\")
            batch = sp[1]
            workunit = sp[0]
            single = True
        elif title == 'Work Unit Complete':
            workunit = self._from_quotes(description)
            single = True
        elif title == 'Work Unit Waiting to Load':
            workunit = self._from_quotes(description)
            single = True
        elif title == 'Work Unit Waiting to Unload':
            workunit = self._from_quotes(description)
            single = True
        elif title == 'Work Unit Unloaded':
            workunit = self._from_quotes(description)
            single = True
        elif title == 'Work Unit Added':
            workunit = self._from_quotes(description)
            single = True
        elif title == 'Work Unit Removed':
            workunit = self._from_quotes(description)
            single = True

            print 'Work unit to be removed', workunit
            # mark Workunit to be only read one more time
            # it is finished and will not change anymore!
            print self.workunits
            self.workunit_finished |= set([self.workunit])

            # Remove workunit from tracker
            # Might use a flag to indicate to read complete file once and then treat as closed

        elif title == 'Work Unit Loaded':
            workunit = self._from_quotes(description)
            print 'Work unit added', workunit
            single = True
            # Add workunit to tracker
            folder_path = os.path.join(self.path_to_workunit_folder)
            folders = os.walk(folder_path).next()[1]
            # print folders
            folder = [f for f in folders if f.startswith(workunit + ' ')]
            if len(folder) > 0:
                file = os.path.join(self.path_to_workunit_folder, folder[0], 'Audit', 'AuditLog.xml')
                if os.path.isfile(file):
                    self.workunits |= set([self.workunit])

        elif title == 'Batch Loaded':
            self.workunit = self._from_quotes(description)
            single = True
        else:
            root = etree.fromstring(message_xml)
            idx = root.xpath("//Id")[0].text
            items = root.xpath("//Items")
            device = self._from_quotes(title)
            error = True


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
                         'workunit' : workunit,
                         'batch' : batch,
                         'device' : device,
                         'error' : error,
                         'id' : idx
                         })

                self.messages.append(message)
        pass


    def _parse_DeviceVariable(self, elem):
        """
        Parse DeviceVariable node

        :param elem:
        :return:
        """
        name = elem.attrib['Name']
        value = elem.attrib['Value']

        if name == 'OnlineState':
            # IMPORTANT! This informs about occurred errors!
            if value == 'Error':
                # An error has occurred
                self.error_occurrances[ self._get_timestamp(elem) ] = { 'Type' : 'Error' }

        if name not in self.device_state:
            self.device_variable[name] = [{ 'time' :  self._get_timestamp(elem) ,'state' :  value }]
        else:
            self.device_variable[name].append({ 'time' :  self._get_timestamp(elem) ,'state' :  value })


    def get_events_from_xml(self, file):
        """
        Reads a Momentum audit.xml file removes the namespace and

        :param file:
        :return:
        """
        root = etree.parse( file )

        for elem in root.getiterator():
            i = elem.tag.find('}')
            if i >= 0:
                elem.tag = elem.tag[i+1:]

        objectify.deannotate(root, pytype=True, xsi=True, xsi_nil=True, cleanup_namespaces=True)

        # This strips off the part before the dash `-` from all attribute names. Makes it much easier to parse
        # and keeps the code cleaner

        for elem in root.getiterator():
            if 'Type' in elem.attrib:
                elem.attrib['Type'] = elem.attrib['Type'][:-5]
                for attr, val in elem.attrib.iteritems():
                    i = attr.find('-')
                    if i >= 0:
                        elem.attrib[(attr[i+1:])] = val
                        del elem.attrib[attr]

        return root

    def parse_events(self, root):
        """
        Parses all Datum nodes in an Momentum audit.xml file

        :param root:
        :return:
        """
        ti = 0
        for elem in root.xpath("//Datum"):
            self.lines_parsed += 1
            ti = self._get_timestamp(elem)
            if ti >= self.last_timestamp:
                fnc = '_parse_' + elem.attrib['Type']
                if hasattr(self, fnc):
                    getattr(self, fnc)(elem)
                self.last_timestamp = ti

    def parse_events_new(self, xml_string):
        """
        Parses all Datum nodes in an Momentum audit.xml file

        :param root:
        :return:
        """
        root = etree.fromstring(xml_string)

        for elem in root.getiterator():
            if 'Type' in elem.attrib:
                elem.attrib['Type'] = elem.attrib['Type'][:-5]
                for attr, val in elem.attrib.iteritems():
                    i = attr.find('-')
                    if i >= 0:
                        elem.attrib[(attr[i+1:])] = val
                        del elem.attrib[attr]


        last_elem = None

        for elem in root.xpath("//Datum"):
            fnc = '_parse_' + elem.attrib['Type']
            if hasattr(self, fnc):
                getattr(self, fnc)(elem)

            last_elem = elem

        if last_elem is not None:
            ti = self._get_timestamp(last_elem)
            self.last_timestamp = ti


    def parseFile(self, file_path):
        if os.path.isfile(file_path):
            print 'parsing file', file_path
            with open (file_path, "r") as myfile:
                data=myfile.read()

                it = re.finditer('-timestamp="([\s\S]*?)"', data)

                # get first timestamp and check, if we have read the file before

                first_timestamp = it.next().group(1)

                print 'using timestamp', first_timestamp

            if first_timestamp not in self.file_size or len(data) != self.file_size[first_timestamp]:
                # Either not been visited or changed filesize

                if first_timestamp in self.parse_position:
                    parse_start = self.parse_position[first_timestamp]
                else:
                    # start at first Datum Tag
                    it = re.finditer('<Datum [\s\S]*?>', data)
                    parse_start = it.next().start()

                self.parse_position[first_timestamp] = len(data)

                # cut off parsed part and last closing tag '</MomentumData>'

                # strip off last MomentumData
                end_parse = data.rfind('<')

                data = data[parse_start:end_parse]

                print 'parsing',len(data), 'new bytes'

                data = '<MomentumData>' + data + '</MomentumData>'


                self.parse_events_new(data)


    def readAudit(self):
        """
        Read all audit and worklistaudit files and run the parsing

        :return:
        """
        if (not self.parse_running):
            self.parse_running = True

            # Parse main audit first
            files_to_parse = [ file for file in self.file_list if file in os.listdir(self.path_to_folder) ]
            self.lines_parsed = 0
            self.last_timestamp = datetime.datetime.fromtimestamp(0)

            for file in files_to_parse:
                file_path = os.path.join( self.path_to_folder, file)
                self.parseFile(file_path)

            # Parse open workunits
            for wl in self.workunits:
                self.last_timestamp = datetime.datetime.fromtimestamp(0)
                folder_path = os.path.join(self.path_to_workunit_folder)
                folders = os.walk(folder_path).next()[1]
                # print folders
                folder = [f for f in folders if f.startswith(wl + ' ')]
                if len(folder) > 0:
                    file_path = os.path.join(self.path_to_workunit_folder, folder[0], 'Audit', 'AuditLog.xml')
                    self.parseFile(file_path)

            # check which workunits are not active and remove from parsing queue
            for wl in self.workunits:
                if wl in self.workunit_finished:
                    print 'finished reading workunit', wl
                    self.workunit_finished.remove(wl)
                    self.workunits.remove(wl)

            self.workunit_finished = set()

            parse_running = False

    class AuditThread(Thread):
        def __init__(self, scope):
            Thread.__init__(self)
            self.scope = scope
            self.stopped = self.scope.stop_flag

        def run(self):
            while not self.stopped.wait(5):
                self.scope.readAudit()

    parse_running = False;


    def getStatusAPI(self):

        scope = self

        class StatusAPI(module.RPResource):
            def __init__(self):
                super(StatusAPI, self).__init__()
                self.scope = scope

            def get(self):

                return {
                        'status' : {
                                     'state' : scope.system_state[-1]['state'],
                                     'time' : scope.system_state[-1]['time'].isoformat()
                                    },
                        'devices' : { d : {
                                           'state' : scope.device_state[d][-1]['state'],
                                           'time' : scope.device_state[d][-1]['time'].isoformat()
                                           }
                                           for d in scope.device_state
                                        },
                        'variables': { d : {
                                           'value' : scope.device_variable[d][-1]['state'],
                                           'time' : scope.device_variable[d][-1]['time'].isoformat()
                                           }
                                           for d in scope.device_variable
                                        },
                        'updated' : scope.last_timestamp.isoformat()
                        }

        return StatusAPI

    def getMessageAPI(self):
        scope = self

        class MessageAPI(module.RPResource):
            def get(self):
                max_messages = 1000

                if len(scope.messages) > max_messages:
                    m = scope.messages[-max_messages:]
                else:
                    m = scope.messages

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

        return MessageAPI


    def start(self):
        super(Momentum, self).__init__()
        self.stop_flag = Event()
        self.thread = self.AuditThread(self)
        self.thread.start()

    def stop(self):
        self.thread.stop()
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var express = require('express');
var app = express();
var github = require('octonode');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

// Then we instanciate a client with or without a token (as show in a later section)

var client = github.client();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

// io.set('transports', ['websocket', 'xhr-polling', 'jsonp-polling', 'htmlfile', 'flashsocket']);
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

var moment = require("moment");

server.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
io.sockets.on('connection', function(socket) {
//    client.get('/users/choderalab/events', {}, function(err, status, body, headers) {
//        io.sockets.emit('update', body);
//    });
});
io.sockets.on('sendupdate', function(socket) {
    console.log(socket);
    client.get('/users/choderalab/events', {}, function(err, status, body, headers) {
        io.sockets.emit('update', body);
    });
});
app.get('/hello.txt', function(req, res) {
    client.get('/users/choderalab/events', {}, function(err, status, body, headers) {
        console.log(body); //json object
        res.send(body);
    });
});
count = 0;

var fs = require("fs");
var nodes = null;

fs.readFile("data/AuditLog.xml", "utf8", function(error, data) {
    console.log(error);
    xml = data;
    doc = new dom().parseFromString(xml);
    nodes = xpath.select("//Datum[@Type='OperationAudit']", doc);

    setInterval(function() {
        console.log(nodes[count].getAttribute('OperationsDimension-device'));
        
        end_time = moment(nodes[count].getAttribute('OperationAudit-End'));
        begin_time = moment(nodes[count].getAttribute('OperationAudit-Start'));
        
        io.sockets.emit('add', {
            'source': 'Momentum',
            'device': nodes[count].getAttribute('OperationsDimension-device'),
            'description': nodes[count].getAttribute('OperationAudit-Description'),
            'duration': nodes[count].getAttribute('OperationAudit-Duration'),
            'end': end_time.unix(),
            'begin': begin_time.unix(),
            'end_time': end_time.toDate().toString(),
            'begin_time': begin_time.toDate().toString()
        });
        count++;
    }, 200);
});





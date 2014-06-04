/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function EventViewModel() {
    var self = this;
    self.eventsURI = '../directory-rest-php/events';
    self.events = ko.observableArray();
    self.eventname = "Jan";
    self.password = "password";

    self.ajax = function(uri, method, data) {
        var request = {
            url: uri,
            type: method,
            contentType: "application/json",
            accepts: "application/json",
            cache: false,
            dataType: 'json',
            data: JSON.stringify(data),
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization",
                        "Basic " + btoa(self.eventname + ":" + self.password));
            },
            error: function(jqXHR) {
                console.log("ajax error " + jqXHR.status);
            }
        };
        return $.ajax(request);
    }
    self.updateEvent = function(event, newEvent) {
        var i = self.events.indexOf(event);
        self.events()[i].uri(newEvent.uri);
        self.events()[i].title(newEvent.title);
        self.events()[i].description(newEvent.description);
        self.events()[i].done(newEvent.done);
    }

    self.beginAdd = function() {
        $('#add').modal('show');
    }
    self.add = function(event) {
        self.ajax(self.eventsURI, 'POST', event).done(function(data) {
            self.events.push({
                uri: ko.observable(data.event.uri),
                title: ko.observable(data.event.title),
                description: ko.observable(data.event.description),
                done: ko.observable(data.event.done)
            });
        });
    }
    self.beginEdit = function(event) {
        editEventViewModel.setEvent(event);
        $('#edit').modal('show');
    }
    self.edit = function(event, data) {
        self.ajax(event.uri(), 'PUT', data).done(function(res) {
            self.updateEvent(event, res.event);
        });
    }
    self.remove = function(event) {
        self.ajax(event.uri(), 'DELETE').done(function() {
            self.events.remove(event);
        });
    }
    self.markInProgress = function(event) {
        self.ajax(event.uri(), 'PUT', {done: false}).done(function(res) {
            self.updateEvent(event, res.event);
        });
    }
    self.markDone = function(event) {
        self.ajax(event.uri(), 'PUT', {done: true}).done(function(res) {
            self.updateEvent(event, res.event);
        });
    }
    self.beginLogin = function() {
        console.log(self.events());
        self.login();
    }

    self.login = function(eventname, password) {
        self.ajax(self.eventsURI, 'GET').done(function(data) {
            for (var i = 0; i < data.events.length; i++) {
                self.events.push(
                    data.events[i]
                );
            }
        }).fail(function(jqXHR) {
            if (jqXHR.status == 403)
                setTimeout(self.beginLogin, 500);
        });
    }

    self.beginLogin();
}
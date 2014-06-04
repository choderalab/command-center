/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function ItemViewModel() {
    var self = this;
    self.itemsURI = 'http://localhost:5000/todo/api/v1.0/items';
    self.items = ko.observableArray();
    self.active = ko.observable();

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
                        "Basic " + btoa(self.username + ":" + self.password));
            },
            error: function(jqXHR) {
                console.log("ajax error " + jqXHR.status);
            }
        };
        return $.ajax(request);
    }
    self.updateItem = function(item, newItem) {
        var i = self.items.indexOf(item);
        self.items()[i].uri(newItem.uri);
        self.items()[i].title(newItem.title);
        self.items()[i].description(newItem.description);
        self.items()[i].done(newItem.done);
    }

    self.beginAdd = function() {
        $('#add').modal('show');
    }
    self.add = function(item) {
        self.ajax(self.itemsURI, 'POST', item).done(function(data) {
            self.items.push({
                uri: ko.observable(data.item.uri),
                title: ko.observable(data.item.title),
                description: ko.observable(data.item.description),
                done: ko.observable(data.item.done)
            });
        });
    }
    self.beginEdit = function(item) {
        editItemViewModel.setItem(item);
        $('#edit').modal('show');
    }
    self.edit = function(item, data) {
        self.ajax(item.uri(), 'PUT', data).done(function(res) {
            self.updateItem(item, res.item);
        });
    }
    self.remove = function(item) {
        self.ajax(item.uri(), 'DELETE').done(function() {
            self.items.remove(item);
        });
    }
    self.markInProgress = function(item) {
        self.ajax(item.uri(), 'PUT', {done: false}).done(function(res) {
            self.updateItem(item, res.item);
        });
    }
    self.markDone = function(item) {
        self.ajax(item.uri(), 'PUT', {done: true}).done(function(res) {
            self.updateItem(item, res.item);
        });
    }
    self.beginLogin = function() {
        self.items.push({
            uri: '#',
            title: 'Chodera Lab',
            barcode: '',
            description: 'Status Monitor'
        });
        
        self.active = ko.observable(self.items()[0]);
    }
    self.login = function(username, password) {
        self.username = username;
        self.password = password;
        self.ajax(self.itemsURI, 'GET').done(function(data) {
            for (var i = 0; i < data.items.length; i++) {
                self.items.push({
                    uri: ko.observable(data.items[i].uri),
                    title: ko.observable(data.items[i].title),
                    description: ko.observable(data.items[i].description),
                    done: ko.observable(data.items[i].done)
                });
            }
        }).fail(function(jqXHR) {
            if (jqXHR.status == 403)
                setTimeout(self.beginLogin, 500);
        });
    }

    self.beginLogin();
}

function AddItemViewModel() {
    var self = this;
    self.title = ko.observable();
    self.description = ko.observable();

    self.addItem = function() {
        $('#add').modal('hide');
        itemsViewModel.add({
            title: self.title(),
            description: self.description()
        });
        self.title("");
        self.description("");
    }
}
function EditItemViewModel() {
    var self = this;
    self.title = ko.observable();
    self.description = ko.observable();
    self.done = ko.observable();

    self.setItem = function(item) {
        self.item = item;
        self.title(item.title());
        self.description(item.description());
        self.done(item.done());
        $('edit').modal('show');
    }

    self.editItem = function() {
        $('#edit').modal('hide');
        itemsViewModel.edit(self.item, {
            title: self.title(),
            description: self.description(),
            done: self.done()
        });
    }
}
function LoginViewModel() {
    var self = this;
    self.username = ko.observable();
    self.password = ko.observable();

    self.login = function() {
        $('#login').modal('hide');
        itemsViewModel.login(self.username(), self.password());
    }
}
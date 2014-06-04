/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function UserViewModel() {
    var self = this;
    self.usersURI = '../directory-rest-php/users';
    self.users = ko.observableArray();
    self.username = "Jan";
    self.password = "password";
    self.active = ko.observableArray();

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
    self.updateUser = function(user, newUser) {
        var i = self.users.indexOf(user);
        self.users()[i].uri(newUser.uri);
        self.users()[i].title(newUser.title);
        self.users()[i].description(newUser.description);
        self.users()[i].done(newUser.done);
    }

    self.beginAdd = function() {
        $('#add').modal('show');
    }
    self.add = function(user) {
        self.ajax(self.usersURI, 'POST', user).done(function(data) {
            self.users.push({
                uri: ko.observable(data.user.uri),
                title: ko.observable(data.user.title),
                description: ko.observable(data.user.description),
                done: ko.observable(data.user.done)
            });
        });
    }
    self.beginEdit = function(user) {
        editUserViewModel.setUser(user);
        $('#edit').modal('show');
    }
    self.edit = function(user, data) {
        self.ajax(user.uri(), 'PUT', data).done(function(res) {
            self.updateUser(user, res.user);
        });
    }
    self.remove = function(user) {
        self.ajax(user.uri(), 'DELETE').done(function() {
            self.users.remove(user);
        });
    }
    self.markInProgress = function(user) {
        self.ajax(user.uri(), 'PUT', {done: false}).done(function(res) {
            self.updateUser(user, res.user);
        });
    }
    self.markDone = function(user) {
        self.ajax(user.uri(), 'PUT', {done: true}).done(function(res) {
            self.updateUser(user, res.user);
        });
    }
    self.beginLogin = function() {
        console.log(self.users());
        self.login();
        self.active = ko.observable({
            uri: ko.observable('#'),
            id: ko.observable('--'),
            title: ko.observable('None'),
            mskcc: ko.observable('00000')
        });
    }

    self.login = function(username, password) {
        self.ajax(self.usersURI, 'GET').done(function(data) {
            console.log(data);
            console.log(self.users);
            for (var i = 0; i < data.users.length; i++) {
                self.users.push({
                    uri: ko.observable(data.users[i].uri),
                    title: ko.observable(data.users[i].first_name + " " + data.users[i].last_name),
                    id: ko.observable(data.users[i].abbr),
                    mskcc: ko.observable(data.users[i].mskcc)
                });
            }
        }).fail(function(jqXHR) {
            if (jqXHR.status == 403)
                setTimeout(self.beginLogin, 500);
        });
    }

    self.beginLogin();
}
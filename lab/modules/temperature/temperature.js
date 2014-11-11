/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function TemperatureData(viewModel) {
    var self = this;

    self.viewModel = viewModel;
    self.uri = 'http://localhost:8001/status?callback=?';
    self.username = "Jan";
    self.password = "password";
    self.pollingInterval = 10000;

    self.ajax = function(method, data) {
        var request = {
            url: self.uri,
            type: method,
            contentType: "application/json",
            accepts: "application/json",
            cache: false,
            dataType: 'json',
            data: JSON.stringify(data),
            beforeSend: function(xhr) {
                if (self.username) {
                    xhr.setRequestHeader("Authorization",
                            "Basic " + btoa(self.username + ":" + self.password));
                }
            },
            error: function(jqXHR) {
//                console.log("ajax error " + jqXHR.status);
            }
        };
        return $.ajax(request);
    }

    self.init = function() {

    }

    self.update = function() {
        self.ajax('GET').done(function(data) {

            temp = Math.round(data.temperature.keshari.temperature * 10.0) / 10.0 + ' °C';
            self.viewModel.temperature(temp);
//            self.unit(self.data.temperature.keshari.temperature);

            if (self.pollingInterval > 0) {
                setTimeout(self.update, self.pollingInterval);
            }
        }).fail(function(jqXHR) {
            console.log('Error : ' + jqXHR.status);
            // Retry
            setTimeout(self.update, 5000);
//            if (jqXHR.status == 403)
//                setTimeout(self.update, 5000);
        });
    }

    self.update();
}
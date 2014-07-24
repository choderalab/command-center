function MomentumData() {
    var self = this;
    self.uri = 'http://172.30.60.25:8000/status?callback=?';
    self.data = {};
    self.username = "Jan";
    self.password = "password";
    self.pollingInterval = 1000;

    self.info = ko.observableArray();
    self.list = "10";

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

            self.data = data;                            
            self.list = [];
            
            
            
            for (var key in self.data.devices) {
                val = 0.0;
                if (self.data.devices[key].state == 'Offline') {
                    val = -1.0;
                }
                if (self.data.devices[key].state == 'Online') {
                    val = 1.0;
                }
                self.list.push(val);
            }
            
            settings = $('#robot_spark').data();
            settings.chartRangeMin = '-1.0';
            settings.chartRangeMax = '1.0';
            $('#robot_spark').sparkline(self.list, settings );            

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
function MomentumData(viewModel) {
    var self = this;

    self.viewModel = viewModel;
    self.uri = momentum_ip_address + '/status?callback=?';
    self.data = {};
    self.username = "Jan";
    self.password = "password";
    self.pollingInterval = 1000;

    self.momentum = self.viewModel.momentum;

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

                state = self.data.devices[key].state;

                exists = -1;
                for (var i = 0; i < self.viewModel.momentum().length; i++) {
                    if (self.momentum()[i].label() == key) {
                        exists = i;
                    }
                }

                badge = 'warning';
                if (state == 'Online') {
                    badge = 'success';
                }
                if (state == 'Offline') {
                    badge = 'danger';
                }
                
                ago = Math.round((Date.now() - Date.parse(self.data.devices[key].time))/1000.0);
                
                // Bad fix for different timezone -4:00
                ago -= 60*60*4;
                
                s = '---';
                
                if (ago < 60) {
                    s = ago + " secs";
//                    s = "< 1 min"
                } else if (ago < 60*60) {
                    s = Math.round(ago / 60) + " mins";
                } else {
                    s = Math.round(ago / 60 / 60 ) + " hours";
                }
                
                s = s + ' ago';
//                console.log(ago);
 //               console.log(self.data.devices[key].time);

                
                
                if (exists >= 0) {
                    self.momentum()[exists].status(self.data.devices[key].state);
                    self.momentum()[exists].time(s);                    
                    self.momentum()[exists].badge(badge);       
//                    console.log(Date.now() - self.momentum()[exists].action_time);
                    time_ago = (Date.now() - self.momentum()[exists].action_time)/1000.0;
                    if ((self.momentum()[exists].action() != '[ --- ]') &&(time_ago > 10)) {                        
                        console.log('Cleared ' + self.momentum()[exists].label() + ' time ago : ' + time_ago + ' from ' + self.momentum()[exists].action() );
                          self.momentum()[exists].action('[ --- ]');
//                        console.log((Date.now() - self.momentum()[exists].action_time) / 1000.0 - 4*60*60);
                    }                    
                } else {
                    self.momentum.push({
                        'label': ko.observable(key),
                        'status': ko.observable(self.data.devices[key].state),
                        'time' : ko.observable(s),
                        'badge' : ko.observable(badge),
                        'action' : ko.observable('[ --- ]'),
                        'action_time' : ko.observable(0.0)
                    });
                }
            }

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
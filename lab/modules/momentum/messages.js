function MomentumMessages(viewModel) {
    var self = this;

    self.viewModel = viewModel;
    self.uri = momentum_ip_address + 'messages?callback=?';

    self.data = {};
    self.username = "Jan";
    self.password = "password";
    self.pollingInterval = 2000;

    self.messages = self.viewModel.messages;

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

            self.messages = self.viewModel.messages;
            self.momentum = self.viewModel.momentum;
            
            for (var key in self.data.messages) {
                m = self.data.messages[key];

                exists = -1;
                for (var i = 0; i < self.viewModel.messages().length; i++) {
                    if (self.messages()[i].iso == m.iso) {
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

                time = Date.parse(m.iso)

                // Bad fix for different timezone -4:00                
                time += 60 * 60 * 4 * 1000;

                ago = Math.round((Date.now() - time) / 1000.0) ;

                s = '---';

                dd = new Date(time);
                td = new Date(Date.now());


                if (ago < 60) {
                    s = ago + ' secs ago';
                } else if (ago < 30 * 60) {
                    s = Math.round(ago / 60) + " mins ago";
                } else if (td.getDate() == dd.getDate()) {
                    s = "today at " + dd.getHours() + ":" + dd.getMinutes()
                } else
                    s = dd.getMonth() + '/' + dd.getDate() + " at " + dd.getHours() + ":" + dd.getMinutes()

                if (exists >= 0) {
                    m = self.messages()[exists];
                    m.ago(s);
                } else {
                    if (true) {
                        existsM = -1;
                        for (var i = 0; i < self.viewModel.momentum().length; i++) {
                            if (self.momentum()[i].label() == m.device) {
                                existsM = i;
                            }
                        }
                        if ((existsM >= 0)&&(ago<25)) {
                            console.log(m.device + ' (' + ago + 's)');
                            self.momentum()[existsM].action('[ --- ]');
                            self.momentum()[existsM].action(m.title + ' (' + Math.round(m.duration) + 's)');
                            self.momentum()[existsM].action_time = time;
                        }

                        m.ago = ko.observable(s);
                        m.time = time;
                        self.messages.splice(0, 0, m);
                        if (self.messages().length >= 100) {
                            self.messages.splice(100);
                        }
                    }
                }
            }
            self.momentum.valueHasMutated();


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
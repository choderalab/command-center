/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$ClusterData = ko.observableArray();
$ClusterLoad = ko.observable(0.0);

function ClusterData() {
    var self = this;
    self.uri = '../backend/rest-php-example/cluster';
    self.data = $ClusterData;
    self.username = "Jan";
    self.password = "password";
    self.pollingInterval = 5000;

    self.info = ko.observableArray();
    self.list = "10";

    self.ajax = function(method, data) {
        var request = {
            url: self.uri,
            type: method,
            contentType: "application/xml",
            accepts: "application/xml",
            cache: false,
            dataType: 'xml',
            data: JSON.stringify(data),
            beforeSend: function(xhr) {
                if (self.username) {
                    xhr.setRequestHeader("Authorization",
                            "Basic " + btoa(self.username + ":" + self.password));
                }
            },
            error: function(jqXHR) {
                console.log("ajax error " + jqXHR.status);
            }
        };
        return $.ajax(request);
    }

    self.init = function() {
//        self.login();
    }

    self.update = function() {
        self.ajax('GET').done(function(data) {
            self.data = data;

            nodes = data.childNodes[1].childNodes[1].getElementsByTagName('HOST');
            $(nodes).each(
                    function dummy(index, node) {
                        name = node.getAttribute('NAME');
                        load = parseFloat($(node).find("METRIC[NAME=load_one]")[0].getAttribute('VAL'));
                        list = $.grep(self.info(), function(e) {
                            return e.name == name;
                        });
                        if (list.length == 0) {
                            // new node found, should mostly only occur in the first run
                            self.info.push({
                                name: name,
                                load: ko.observable(load),
                            });
                        } else {
                            // replace value
                            list[0].load(load);
                        }
                    });
                    
                    
            self.list = [];
            
            $(self.info()).each( function (index, node) {
                self.list.push(node.load());
            });            
            settings = $('#cluster_spark').data();
            settings.chartRangeMin = '0.0';
            settings.chartRangeMax = '100.0';
            $('#cluster_spark').sparkline(self.list, settings );            

            if (self.pollingInterval > 0) {
                setTimeout(self.update, self.pollingInterval);
            }
        }).fail(function(jqXHR) {
            if (jqXHR.status == 403)
                setTimeout(self.update, 5000);
        });
    }

    self.update();
}
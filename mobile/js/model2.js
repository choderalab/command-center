/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

ko.extenders.localStore = function(target, key) {
    var value = amplify.store(key) || target();

    var result = ko.computed({
        read: target,
        write: function(newValue) {
            amplify.store(key, newValue);
            target(newValue);
        }
    });

    result(value);

    return result;
};

ko.bindingHandlers.ko_autocomplete = {
    init: function(element, params) {
        $(element).autocomplete(params());
    },
    update: function(element, params) {
        $(element).autocomplete("option", "source", params().source);
    }
};

ko.bindingHandlers.chosen = {
    init: function(element, valueAccessor, allBindings) {

        // First get the latest data that we're bound to
        var value = valueAccessor();

        // Next, whether or not the supplied model property is observable, get its current value
        var valueUnwrapped = ko.unwrap(value);

//        ko.bindingHandlers.options.init(element, valueAccessor, allBindings);
//        $(element).empty(); // remove old options
        $(element).append($("<option></option>").attr("value", '').text(' '));
        $.each(valueUnwrapped, function(key, val) {
            $(element).append($("<option></option>")
                    .attr("value", key).text(val));
        });
        $(element).chosen({'width': '100%', 'white-space': 'nowrap'});

    }
    ,
    update: function(element, valueAccessor, allBindings) {
//        ko.bindingHandlers.options.update(element, valueAccessor, allBindings);
// First get the latest data that we're bound to
        var value = valueAccessor();

        // Next, whether or not the supplied model property is observable, get its current value
        var valueUnwrapped = ko.unwrap(value);

        $(element).trigger('chosen:updated');
    }
};

ko.bindingHandlers.toggle = {
    init: function(element, valueAccessor, allBindings) {

        // First get the latest data that we're bound to
        var value = valueAccessor();

        // Next, whether or not the supplied model property is observable, get its current value
        var valueUnwrapped = ko.unwrap(value);

        jQuery(element).toggles({on: valueUnwrapped, text: {on: 'YES', off: 'NO'}});
        jQuery(element).on('toggle', function(e, active) {
            valueAccessor(active);
        });
    }
    ,
    update: function(element, valueAccessor, allBindings) {
        // First get the latest data that we're bound to
        var value = valueAccessor();

        // Next, whether or not the supplied model property is observable, get its current value
        var valueUnwrapped = ko.unwrap(value);

        jQuery(element).toggles({on: valueUnwrapped, text: {on: 'YES', off: 'NO'}});
        jQuery(element).on('toggle', function(e, active) {
            value(active);
        });
    }
};

function PlatesViewModel() {
    var self = this;

    self.general_id = ko.observable('');
    self.general_checked = ko.observable('0');
    self.general_name = ko.observable('');
    self.general_name_short = ko.observable('');
    self.general_description = ko.observable('');
    self.general_comment = ko.observable('');
    self.general_image = ko.observable('');
    self.manufacturer_name = ko.observable('');
    self.manufacturer_url = ko.observable('');
    self.manufacturer_product_url = ko.observable('');
    self.manufacturer_number = ko.observable('');
    self.manufacturer_pdf_url = ko.observable('');
    self.id_momentum = ko.observable('');
    self.id_evo = ko.observable('');
    self.id_infinite = ko.observable('');
    self.id_barcode = ko.observable('');
    self.plate_bottom_read = ko.observable(1);
    self.plate_color = ko.observable('black');
    self.plate_type = ko.observable('');
    self.plate_material = ko.observable('');
    self.plate_rows = ko.observable('8');
    self.plate_columns = ko.observable('12');
    self.plate_numbering = ko.observable('row');
    self.plate_height = ko.observable('14.4');
    self.plate_length = ko.observable('127.76');
    self.plate_width = ko.observable('85.48');
    self.plate_sterile = ko.observable(0);
    self.flange_type = ko.observable('');
    self.flange_height_short = ko.observable('0.0');
    self.flange_height_long = ko.observable('0.0');
    self.flange_width = ko.observable('0.0');
    self.stacking_above = ko.observable(1);
    self.stacking_below = ko.observable(1);
    self.stacking_plate_height = ko.observable('0.0');
    self.stacking_plate_shift = ko.observable('0.0');
    self.well_size = ko.observable('full');
    self.well_coating = ko.observable('none) (free');
    self.well_shape = ko.observable('round');
    self.well_bottom = ko.observable('');
    self.well_profile = ko.observable('flat');
    self.well_profile_anlge = ko.observable('30.0');
    self.well_diameter_bottom_x = ko.observable('0.0');
    self.well_diameter_bottom_y = ko.observable('0.0');
    self.well_diameter_top_x = ko.observable('0.0');
    self.well_diameter_top_y = ko.observable('0.0');
    self.well_position_first_x = ko.observable('0.0');
    self.well_position_first_y = ko.observable('0.0');
    self.well_distance_x = ko.observable('0.0');
    self.well_distance_y = ko.observable('0.0');
    self.well_position_last_x = ko.observable('0.0');
    self.well_position_last_y = ko.observable('0.0');
    self.well_volume_total = ko.observable('0.0');
    self.well_area = ko.observable('0.0');
    self.well_depth = ko.observable('0.0');
    self.well_volume_max = ko.observable('0.0');
    self.well_volume_working_min = ko.observable('0.0');
    self.well_volume_working_max = ko.observable('0.0');
    self.lid_allowed = ko.observable(1);
    self.lid_offset = ko.observable('0.0');
    self.lid_plate_height = ko.observable('0.0');
    self.momentum_grip_force = ko.observable('0');
    self.momentum_offsets_low_lidded_plate = ko.observable('0.0');
    self.momentum_offsets_high_lidded_plate = ko.observable('0.0');
    self.momentum_offsets_custom_lidded_plate = ko.observable('0.0');
    self.momentum_offsets_low_lidded_lid = ko.observable('0.0');
    self.momentum_offsets_high_lidded_lid = ko.observable('0.0');
    self.momentum_offsets_custom_lidded_lid = ko.observable('0.0');
    self.momentum_offsets_low_grip_transform = ko.observable('Identity');
    self.momentum_offsets_high_grip_transform = ko.observable('Identity');
    self.momentum_offsets_custom_grip_transform = ko.observable('Identity');
    self.evo_plate_grip_force = ko.observable('75');
    self.evo_lid_grip_force = ko.observable('60');
    self.evo_lid_grip_narrow = ko.observable('92.0');
    self.evo_lid_grip_wide = ko.observable('135.0');

    self.platesURI = 'http://localhost:8888/cc/backend/rest-php-plates/plates';
    self.username = "";
    self.password = "";
    self.plates = ko.observableArray([]);
    self.platelist = ko.observableArray([]);

    self.active = ko.observable(-1);

    self.fix = ko.computed(function() {
        s = self.plate_bottom_read;
    });
    
    self.wells = function(data) {
        return data.plate_rows * data.plate_columns + " Well";
    }
   
    self.activePlateList = ko.computed(function() {
            return ko.utils.arrayFilter(self.plates(), function(prod) {
                return prod.general_checked == 1;
            });
        });

    self.activePlateListSort = ko.computed(function() {        
        return self.activePlateList().sort(function(l, r) {
            return l.general_id == r.general_id ? 0 : (l.general_id < r.general_id ? -1 : 1);
        });
    });

    self.ajax = function(uri, method, data) {
        if (method == 'PUT') {
            dummy = data.ID;
        }
        ;
        var request = {
            url: uri,
            type: method,
            contentType: "application/json",
            accepts: "application/json",
            cache: true,
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

    self.updatePlate = function(plate, newPlate) {
        var i = self.plates.indexOf(plate);
        self.plates()[i].uri(newPlate.uri);
        self.plates()[i].title(newPlate.title);
        self.plates()[i].description(newPlate.description);
        self.plates()[i].done(newPlate.done);
    }

    self.storeActive = function() {
        self.store(self.active());
    }

    self.store = function(n) {
        if (n >= 0) {
            plate = self.plates()[n];
            console.log(plate);
            saveplate = {};
            for (val in plate) {
                if (val != 'ID' && val != 'id') {
                    plate[val] = self[val]();
                }
                if (val != 'ID') {
                    saveplate[val] = plate[val];
                }
            }

            // and send to DB            
//            console.log(self.platesURI + '/' + plate.id);
//            console.log(saveplate);
            self.ajax(self.platesURI + '/' + saveplate.id, 'PUT', ko.toJSON(saveplate)).done(function(res) {
//            self.updatePlate(plate, res.plate);
//                console.log('update');
//                console.log(res);
            })
        }
    }

    self.add = function(plate) {
        saveplate = {};
        for (val in plate) {
            if (val != 'ID') {
                saveplate[val] = plate[val];
            }
        }

        console.log('NEW');
        self.ajax(self.platesURI + '/' + saveplate.id, 'POST', ko.toJSON(saveplate)).done(function(res) {
        })
    }


    self.setIndex = function(i) {
        if (i != self.active()) {
            self.storeActive();
            self.active(i); 

            plate = self.plates()[i];

            for (val in plate) {
                if (val != 'ID' && val != 'id') {
                    self[val](plate[val]);
                }
            }

        }
        self.plates.valueHasMutated();        
        $('.chosen-select').trigger('chosen:updated');
    }
    
    self.doUpdate = function() {
        self.storeActive();
        self.plates.valueHasMutated(); 
    }

    self.copyPlate = function(plate) {
        self.storeActive();
        new_plate = {};
        plate = self.plates()[self.active()];
        for (att in plate) {
            if (att != 'ID') {
                new_plate[att] = plate[att];
            }
        }
        new_plate['id'] = (self.plates().length + 1);
        new_plate['ID'] = ko.observable(plate['general_id']);
        console.log('NEW');
        console.log(new_plate);
        self.plates.push(new_plate);
        self.add(new_plate);
        //        self.setIndex(self.plates().length - 1);
    }

    self.undoPlate = function() {
        i = self.active();
        plate = self.plates()[i];

        for (val in plate) {
            if (val != 'ID' && val != 'id') {
                self[val](plate[val]);
            }
        }
    }


    self.changePlate = function(plate) {
        self.plates.valueHasMutated();        
        i = self.plates().indexOf(plate);
        self.setIndex(i);
    }

    self.matchPlate = function(plate) {
        i = self.plates().indexOf(plate);
        self.storeActive();

        plate = self.plates()[i];
        for (att in plate) {
            if (att != 'ID' && att != 'id') {
                if (self[att]() == '') {
                    self[att](plate[att]);
                }
            }
        }

        self.setIndex(i);
    }


    self.edit = function(plate, data) {
        self.ajax(plate.uri(), 'PUT', data).done(function(res) {
            self.updatePlate(plate, res.plate);
        });
    }

    self.remove = function(plate) {
        self.ajax(plate.uri(), 'DELETE').done(function() {
            self.plates.remove(plate);
        });
    }
    self.markInProgress = function(plate) {
        self.ajax(plate.uri(), 'PUT', {done: false}).done(function(res) {
            self.updatePlate(plate, res.plate);
        });
    }
    self.markDone = function(plate) {
        self.ajax(plate.uri(), 'PUT', {done: true}).done(function(res) {
            self.updatePlate(plate, res.plate);
        });
    }
    self.login = function(username, password) {
        self.username = username;
        self.password = password;
        self.ajax(self.platesURI, 'GET').done(function(data) {
            for (plate in data) {
                console.log(data[plate]);
//                new_plate = [];
                new_plate = data[plate];
//                for (att in data[plate]) {
//                    new_plate[att] = ko.observable(data.plates[plate][att])
//                }
                new_plate['ID'] = ko.observable(new_plate['general_id']);
                self.plates.push(new_plate);
            }
            self.setIndex(0);
        }).fail(function(jqXHR) {
            if (jqXHR.status == 403)
                setTimeout(self.beginLogin, 500);
        });
    }

    self.helptext = ko.computed(function() {
        return 'There should be help';
    })

    self.login();

    self.id = ko.computed(function() {
        if (self.active() >= 0) {
            acPlate = self.plates()[self.active()];
            console.log(acPlate);
            bef = acPlate['ID']();
            acPlate['ID'](self['general_id']());
//            console.log(self.active() + " : " + bef + ' -> ' + acPlate['id']());
        }
        return self.general_id();
    })

    // internal computed observable that fires whenever anything changes in our todos
    ko.computed(function() {
        // store a clean copy to local storage, which also creates a dependency on the observableArray and all observables in each item
//        localStorage.setItem('todos-knockoutjs', ko.toJSON(this.plates));
//        self.ajax(self.platesURI, 'PUT', {plates: ko.toJSON(self.plates)}).done(function(res) {
//            self.updatePlate(plate, res.plate);
//        });

    }.bind(this)).extend({
        rateLimit: {timeout: 500, method: 'notifyWhenChangesStop'}
    }); // save at most twice per second

}

appViewModel = new PlatesViewModel();
ko.applyBindings(appViewModel);
// Simply adds a variable to be also shown as the route in the URL. Nice gimmick to get back to the site
//Router({'/plate/:filter': appViewModel.plate_id}).init();

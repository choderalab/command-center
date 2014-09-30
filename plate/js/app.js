/*global ko, Router */
(function() {
    'use strict';


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

    ko.bindingHandlers.chosen = {
        init: function(element, valueAccessor, allBindings) {

            // First get the latest data that we're bound to
            var value = valueAccessor();

            // Next, whether or not the supplied model property is observable, get its current value
            var valueUnwrapped = ko.unwrap(value);

//        ko.bindingHandlers.options.init($el, valueAccessor, allBindings);
//        $el.empty(); // remove old options
            $.each(valueUnwrapped, function(key, val) {
                $(element).append($("<option></option>")
                        .attr("value", val.key).text(val.val));

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

            jQuery(element).toggles({on: valueUnwrapped, text: {on: 'EZ', off: 'DZ'}});
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

            jQuery(element).toggles({on: valueUnwrapped, text: {on: 'EZ', off: 'DZ'}});
            jQuery(element).on('toggle', function(e, active) {
                value(active);
            });
        }
    };

// Activates knockout.js

    appViewModel = new AppViewModel();
    ko.applyBindings(appViewModel);
// Simply adds a variable to be also shown as the route in the URL. Nice gimmick to get back to the site
    Router({'/:filter': appViewModel.showMode}).init();
    momentumData = new MomentumData(appViewModel);
    momentumMessages = new MomentumMessages(appViewModel);
    freezerTemperature = new TemperatureData(appViewModel);

}());

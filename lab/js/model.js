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


// This is a simple *viewmodel* - JavaScript that defines the data and behavior of your UI
function AppViewModel() {
    self = this;
//    self.firstName = ko.observable().extend({
//        localStore: 'firstName'
//    });

    self.temperature = ko.observable(0.0);

    self.momentum = ko.observableArray([]);
    self.messages = ko.observableArray([]);
    self.course = ko.observable();
    self.new_messages = ko.computed(function() {
        if (self.messages().length == 0) {
            return '';
        } else
            return self.messages().length;
        return 0;
    });
    self.sortedMessages = ko.computed(function() {
        return self.messages().sort(
                function(left, right) {
                    return left.time == right.time ? 0 : (left.time > right.time ? -1 : 1);
                });
    });
    self.momentum_reduced = ko.computed({read: function () {
        return ko.utils.arrayFilter(self.momentum(), function(prod) {
                removeArr = ['ContainerDataDriver', 'DataMiner', 'FileManager', 'PlateLoc', 'Waste', 'MomentumOperator', 'FreeNest'];
                return !(removeArr.indexOf(prod.label()) > -1);
            });
    }
    });
    self.partMessages = ko.computed(function () {
        var start = 0;
        var end = 16;
//        end = Math.min(end, );
        return self.messages().sort(
                function(left, right) {
                    return left.time == right.time ? 0 : (left.time > right.time ? -1 : 1);
                }).slice(start, end);
    });
    self.dozent_total = ko.computed(function() {
        return 0;
    });
    // internal computed observable that fires whenever anything changes in our todos
//    ko.computed(function() {
    // store a clean copy to local storage, which also creates a dependency on the observableArray and all observables in each item
//        localStorage.setItem('todos-knockoutjs', ko.toJSON(this.todos));
//    }.bind(this)).extend({
//        rateLimit: {timeout: 500, method: 'notifyWhenChangesStop'}
//    }); // save at most twice per second



}

// Activates knockout.js

appViewModel = new AppViewModel();
ko.applyBindings(appViewModel);
// Simply adds a variable to be also shown as the route in the URL. Nice gimmick to get back to the site
Router({'/:filter': appViewModel.showMode}).init();
momentumData = new MomentumData(appViewModel);
momentumMessages = new MomentumMessages(appViewModel);
freezerTemperature = new TemperatureData(appViewModel);
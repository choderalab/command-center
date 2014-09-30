/*global ko*/
(function() {
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

            $.each(valueUnwrapped, function(key, val) {
                $(element).append($("<option></option>")
                        .attr("value", val.key).text(val.val));

            });
            $(element).chosen({'width': '100%', 'white-space': 'nowrap'});
        }
        ,
        update: function(element, valueAccessor, allBindings) {
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

    // Create MainAppViewModel

    function AppViewModel() {
        self = this;

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
        self.momentum_reduced = ko.computed({read: function() {
                return ko.utils.arrayFilter(self.momentum(), function(prod) {
                    removeArr = ['ContainerDataDriver', 'DataMiner', 'FileManager', 'PlateLoc', 'Waste', 'MomentumOperator', 'FreeNest'];
                    return !(removeArr.indexOf(prod.label()) > -1);
                });
            }
        });
        self.partMessages = ko.computed(function() {
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

    };

    appViewModel = new AppViewModel();
    ko.applyBindings(appViewModel);

    // Create and Bind modules to viewmodel

    momentumData = new MomentumData(appViewModel);
    momentumMessages = new MomentumMessages(appViewModel);
    freezerTemperature = new TemperatureData(appViewModel);

}());

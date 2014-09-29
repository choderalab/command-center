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

}
labmanagement.ShellView = Backbone.View.extend({

    initialize: function () {
        this.searchResults = new labmanagement.EmployeeCollection();
        this.searchresultsView = new labmanagement.EmployeeListView({model: this.searchResults, className: 'group-list open'});
    },
    
    el: '#barcodeform',

    render: function () {
        $('#searchresults').html(this.searchresultsView.render().el);  
        return this;        
    },

    events: {
        "keyup .barcode-query": "search",
        "keypress .barcode-query": "onkeypress"
    },

    search: function (event) {
        var key = $('#barcode').val();
        this.searchResults.fetch({reset: true, data: {barcode: key}});
        var self = this;
        this.render();
        setTimeout(function () {
            $('#barcodeform').addClass('open');
        });
    },

    onkeypress: function (event) {
        if (event.keyCode === 13) { // enter key pressed
            event.preventDefault();
        }
    },

    selectMenuItem: function(menuItem) {
        $('.navbar .nav li').removeClass('active');
        if (menuItem) {
            $('.' + menuItem).addClass('active');
        }
    }

});
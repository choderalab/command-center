labmanagement.BarCodeView = Backbone.View.extend({
    events: {
//        "click #showMeBtn":"showMeBtnClick"
        'keyup #barcode': 'showKey',
        'keypress #barcode': 'showKey'
    },
    render: function() {
        this.$el.html(this.template());
        return this;
    },
    blurBarcode: function() {
        console.log('unblur');
        $('#barcode').blur();
    },
    showKey: function(e) {
        console.log(e.type, e.keyCode);
        if(e.KeyCode == 13) {
            // RETURN
            
        }
    }

//    showMeBtnClick:function () {
//        console.log("showme");
//        directory.shellView.search();
//    }

});
$(function() {
    postsModel = {
        posts: ko.observableArray()
    };

    // ko.applyBindings(postsModel, $('#posts')[0]);

    clusterData = new ClusterData();
    ko.applyBindings(clusterData, $('cluster_table')[0]);
    
    momentumData = new MomentumData();
    
    var socket = io.connect("http://localhost:3000");

    socket.on('server:online', function() {
        console.log('server online');
    });

    socket.on('error', function() {
        console.log('connection error - try reconnect in 2s');
        setTimeout(function() {
            socket.socket.reconnect();
        }, 2000);
    });

    socket.on("connection", function(data) {
        console.log("WebSocket connected");
//        console.log(data);
    });

    socket.on("update", function(data) {
        //       console.log("WebSocket UPDATE RECEIVED");
        for (var i = 0; i < data.length; i++) {
            console.log(i);
            postsModel.posts.push(data[i]);
        }
        console.log(postsModel.posts);
    });

    socket.on("add", function(data) {
//        console.log("WebSocket ADD RECEIVED");
        postsModel.posts.unshift(data);
//        console.log(postsModel.posts().length);
        if (postsModel.posts().length > 20) {
            postsModel.posts.pop();
        }

//        console.log(taskStatus);

        var lastEndDate = getEndDate();
        var taskStatusKeys = Object.keys(taskStatus);
        var taskStatusName = taskStatusKeys[Math.floor(Math.random() * taskStatusKeys.length)];
        var taskName = taskNames[Math.floor(Math.random() * taskNames.length)];

        tasks.push({
//            "startDate": d3.time.hour.offset(lastEndDate, Math.ceil(1 * Math.random())),
            "startDate": data.begin * 1000,
            "endDate": data.end * 1000,
            "taskName": data.device,
            "status": 'SUCCEEDED'
        });

        while (tasks[0].startDate < d3.time.minute.offset(getEndDate(), -5)) {
//            console.log("unshift");
            tasks.shift();
        }

        changeTimeDomain(timeDomainString);
        gantt.redraw(tasks);

//        console.log(d3.time.hour.offset(lastEndDate, (Math.ceil(Math.random() * 3)) + 1));
//        console.log(data.begin);
//        console.log(data.end);

    });
});
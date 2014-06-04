/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$MomentumData = ko.observableArray();

function MomentumData() {
    var socket = io.connect("http://localhost:3000");

    socket.on("connection", function(data) {
        socket.emit('sendupdate', {date: 'all'});

        console.log("WebSocket connected");
    });

    socket.on("add", function(data) {
//        console.log("WebSocket ADD RECEIVED");
        postsModel.posts.unshift(data);
//        console.log(postsModel.posts().length);
        if (postsModel.posts().length > 20) {
            postsModel.posts.pop();
        }

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
        
        while(tasks[0].startDate < d3.time.minute.offset(getEndDate(), -5) ) {
//            console.log("unshift");
            tasks.shift();
        }

        changeTimeDomain(timeDomainString);
        gantt.redraw(tasks);
        
    });
}
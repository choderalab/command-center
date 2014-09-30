command-center
==============

Home of the ChoderaLab status monitor

# Chodera Lab Status Monitor (CLSM)

The main file of the status monitor is the index.html file in the monitor folder. This does not need a server running. It tries to connect to all the serves and there is an example for different types of servers. 

One for a python server that uses rest and serves a jsonp file which is actually a json array (looks like a python array) disguised inside a javascript function call, so that it can be loaded as a javascript file. This way the restrictions on loading resources from other ports than the one the website is loaded from can be used. I think there is a simpler way using enabling the server to accept cross-site requests, but I could not get it to work.

The second uses websocket and runs a javascript nodejs server, which is not recommended due to the same problem mentioned above and I could not solve this. It works but has some restrictions on the place the server can run. I leave it there as an example but will not use it

The third is a rest server using php running on port 80. It needs a server able to run the php scripts and this works if the same server is also delivering the website itself, hence both come from the same address and port and everything is fine. Right now I used it to access the cluster (before the move) and haven't tried it since.

The main python server that need to be run is in backend/rest-python-momentum-status and just run the server.py file on the windows/momentum machine. This opens a rest server at port 8000 and allows the two get commands 'status' and 'messages' so far

To try this you can run the python server by running

```
python [path-to]/backend/rest-python-momentum-status/api/server.py
```

which starts the server. 

To check the server working correctly open

```
http://localhost:8000/status?callback=fnc
```

where the callback is necessary for the jsonp.

Then open the website at

```
[path-to]/lab/index.html
```

The main files you need to look at are
```
lab/index.html                                       - main html code of the website
lab/js/app.js                                        - main javascript code to run
lab/modules/momentum/status.js                       - momentum javascript code
lab/modules/momentum/status.js                       - momentum javascript code
backend/rest-python-momentum-status/api/server.py    - python script to run the rest/jsonp server
```

The code is still very messy since I needed to try a lot of things to make this work. Still the ```server.py``` works on the momentum
machine. Keeps reding the audit files and always serves the actual status of the robot with a few seconds delay.

In case the server.py does not run yet. You might need to install 

```
pip install flask-restful
pip install flask-httpauth
```

to install two missing packages. The second one is not needed yet, but might come in handy if we want to protect our server from direct
access and install simple user/password policy.

======================================================

to install new javascript packages edit the bower.json file and run bower install
Note that bower can be installed using

```
sudo npm install -g bower
```

while npm and node.js needs to be installed before.

To run the monitor the php-rest-example needs to be run using a server that can run php. I use MAMP on my Mac for this.
I also use it to serv all the other files although this is not necessary. 

For the nodejs example node needs to be installed and the server must then be started in the console using

```
node monitor.js
``` 

If the website is then reloaded the server sends messages to the monitor and displays an old run of the momentum software
with a fixed poll rate.

For socket.io connection with python use maybe

socketIO-client 0.5.3

require.js might be a useful idea, but might be too much to be used in this rather small project
although require-text could be used to load the html dynamically and keep modules separate.
I have skipped this part so far and only put code for each module into seperate files in the module.

There is a problem with socket.io if we want to use it with a local server. It seems that the server needs to 
provide the necessary javascript file otherwise the browser throws a CORS error and refuses to create a poll.
I propose to run a little server on the momentum machine that allows a REST access to the informationation about
the current status of the robot.

So we have the following project structure

```
lab/
├── css/
│   ├── bootstrap.css
│   ├── bootstrap.min.css
│   ├── bootstrap-theme.css
│   └── bootstrap-theme.min.css
├── js/
│   ├── app.js
│   ├── model.js
│   └── data.js
├── components/
│   ├── [ all bower components ]
│   └── ...
├── img/
│   ├── [ all images ]
│   └── ...
├── modules/
│   ├── [ private modules ]
│   ├── cluster/
│   │   └── cluster.js
│   ├── momentum/
│   │   ├── ip.js
│   │   ├── status.js
│   │   └── momentum.js
│   ├── temperature/
│   │   └── temperature.js
│   └── ...
├── bower.json
├── README.md
└── index.html
```

## Modules

We have the following modules installed:

- cluster
- dropcam ( so far running, but without an external module )
- momentum
- temperature
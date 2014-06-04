command-center
==============

Home of the ChoderaLab status monitor

# Chodera Lab Status Monitor (CLSM)

The main file of the status monitor is the index.html file in the monitor folder. This does not need a server running.
It tries to connect to all the serves and there is an example for different types of servers. 

One for a python server that uses rest and serves a jsonp file which is actually a json array (looks like a python array) disguised inside a javascript 
function call, so that it can be loaded as a javascript file. This way the restrictions on loading resources from other
ports than the one the website is loaded from can be used. 

The second uses websocket and runs a javascript nodejs server, which is not recommended due to the same problem mentioned above and I could not
solve this. It works but has some restrictions on the place the server can run.

The third is a rest server using php running on port 80. It needs a server able to run the php scripts and this works if the same server is also
delivering the website itself, hence both come from the same address and port and everything is fine. 

So far it seems to me that only jsonp is what we want since this way we can have a server running on a different machine in the network on an
arbitrary port. And data can in python easily be transferre to json format. The example should explain this.

To try this you can run the python server by running

```
python [path-to]/backend/rest-python-example/api/server.py
```

which starts the server. Then open the website at

```
open [path-to]/monitor/index.html
```

The main files you need to look at are
```
monitor/index.html                           - main html code of the website
monitor/js/app.js                            - main javascript code to run the website. Uses code from the modules
monitor/modules/momentum/status.js           - momentum javascript code. It accesses the server.py on port 9000 and stores the data

backend/rest-python-example/api/server.py    - python script to run the rest/jsonp server
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
monitor/
├── css/
│   ├── bootstrap.css
│   ├── bootstrap.min.css
│   ├── bootstrap-theme.css
│   └── bootstrap-theme.min.css
├── js/
│   ├── app.js
│   ├── app.plugins.js
│   └── app.components.js
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
│   │   ├── status.js
│   │   └── momentum.js
│   ├── calendar/
│   │   └── calendar.htm
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
- calendar

What is exactly in the module html file? Can we design different views in a single html or do we need multiple ones?

Is this maybe too complicated and too modular to setup? It is nice but not necessary. Since we will have several data sources
and mixed views it might be better to keep this separate. That means we have (1) views that display the shared data and (2) sources can change the data

Together with knockout.js this would be to have html code that is bound to knockout observables and we have independent code that can alter this.
How to define this global datastructures?

E.g. We have several sources that can add to the timeline. The timeline has a view, maybe there exist several ones. I seems that a view needs only a single
data object, while a source can contribute to several data objects. In our case we are not going to save data only to display. In the case where we would
edit the data this data must be linked uniquely to a place where it is stored. 
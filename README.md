# Heimcontrol.js

Fancy homeautomation with node.js and mongodb on a Raspberry PI.

## Features

- Authentication
- Websockets
- Plugins

## Plugins

- Sending Wake-On-LAN packets
- The GPIO ports on the Raspberry PI
- Controlling an attached Arduino

## Installation

I recommend that you use [screen](http://linux.die.net/man/1/screen) to install the software on your Raspberry PI, because some commands will take more than four hours to complete and broken pipes suck.

### Git and Essentials

````bash
sudo apt-get update
sudo apt-get install git-core git scons build-essential scons libpcre++-dev xulrunner-dev libboost-dev libboost-program-options-dev libboost-thread-dev libboost-filesystem-dev
````

### node.js

Install [node.js](http://nodejs.org/) on the Raspberry PI

#### Build and install

````bash
wget http://nodejs.org/dist/v0.8.20/node-v0.8.20.tar.gz
tar -zxf node-v0.8.20.tar.gz
cd node-v0.8.20
./configure
make
sudo make install
```` 

### mongodb

Install [mongodb](http://www.mongodb.org/) on the Raspberry PI

#### Increase swap size

On the Raspberry PI with 256MB RAM you have to increase the size of the swapfile. Open the file `/etc/dphys-swapfile`:

````bash
sudo nano /etc/dphys-swapfile
````

Change the value of `CONF_SWAPSIZE` to 200:

````bash
CONF_SWAPSIZE=200
````

And reboot your Raspberry PI.

````bash
sudo reboot
````

#### Build and install

````bash
git clone git://github.com/RickP/mongopi.git
cd mongopi
scons
sudo scons --prefix=/opt/mongo install
```` 

Add the PATH to the mongodb binaries. Open the file `/etc/environment`:

````bash
sudo nano /etc/environment
````

and add the following:

````bash
PATH=$PATH:/opt/mongo/bin/
export PATH
````

#### Register mongodb as a service

Create user `mongodb`:

````bash
sudo useradd mongodb
````

Create the database directory:

````bash
sudo mkdir /var/lib/mongodb
sudo chown mongodb:mongodb /var/lib/mongodb
```` 

Download and register upstart init script:

````bash
cd /etc/init.d
sudo wget https://raw.github.com/heimcontroljs/heimcontrol.js/master/contrib/mongodb
sudo chmod +x mongodb
sudo update-rc.d mongodb defaults
````

### heimcontrol.js

#### Install

````bash
git clone git://github.com/heimcontroljs/heimcontrol.js.git
cd heimcontrol.js
npm install
````

#### Prerouting

The node.js server will listen on port 8080. You can use iptables to route port 80 to 8080:

````bash
iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080
````

#### Run heimcontrol.js

After the app has started up (this will take a while), you can access the webinterface by opening the IP of your Raspberry PI in the browser.

````bash
node heimcontrol.js
````

Use `forever` to run heimcontrol.js in the background:

````bash
sudo npm install forever
forever start heimcontrol.js
````

And to stop heimcontrol.js:

````bash
forever stop heimcontrol.js
````

### Plugins

To make the plugins work properly, you have to configure some stuff on your Raspberry PI. Take a look at the `README.md` files of the plugins.

 - [gpio-plugin](https://github.com/heimcontroljs/plugin-gpio/blob/master/README.md#heimcontrol-gpio)


## Used open-source projects:

- [node.js](https://github.com/joyent/node)
- [mongodb](https://github.com/mongodb/mongo) (Especially the Raspberry PI fork: [mongopi](https://github.com/RickP/mongopi))
- [express](https://github.com/visionmedia/express)
- [requirejs](https://github.com/jrburke/requirejs)
- [jade](https://github.com/visionmedia/jade)
- [socket.io](https://github.com/LearnBoost/socket.io)
- [bootstrap](https://github.com/twitter/bootstrap)
- [font-awesome](https://github.com/FortAwesome/Font-Awesome)
- and a hell of a lot small projects.

## MIT License

Copyright (c) 2013 Willi Thiel (ni-c@ni-c.de)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

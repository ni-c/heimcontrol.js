# Heimcontrol.js

Homeautomation with the Raspberry PI in node.js using websockets.

## Installation

### Git and Essentials

````bash
sudo apt-get update
sudo apt-get install git-core build-essential scons libpcre++-dev xulrunner-dev libboost-dev libboost-program-options-dev libboost-thread-dev libboost-filesystem-dev
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
vi /etc/dphys-swapfile
````

and change the value of `CONF_SWAPSIZE` to 200:

````bash
CONF_SWAPSIZE=200
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
sudo vi /etc/environment
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

Register upstart init script:

````bash
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

#### Login credentials

There is currently no usermanagement in heimcontrol.js. To create an user account you have to create an entry in the MongoDB.

Replace `YOURPASSWORD` with your desired password and run the following command to create a password hash:

````bash
PASSWORD='YOURPASSWORD' node -e "console.log(require('crypto').createHash('sha256').update(process.env.PASSWORD).digest('hex'));"
````

Create an entry in the User collection of the MongoDB with your email and the generated passowrd hash:

````hash
mongo heimcontroljs
MongoDB shell version: 2.1.1
connecting to: heimcontroljs
> db.User.save({email:"YOUREMAIL@EXAMPLE.COM",password:"e3c652f0ba0b4801205814f8b6bc49672c4c74e25b497770bb89b22cdeb4e951"});
````

#### Run heimcontrol.js

After the app has started up (this will take a while), you can access the webinterface by opening the IP of your Raspberry PI in the browser.

````bash
node heimcontrol.js
````

## Used open-source projects:

- [node.js](https://github.com/joyent/node)
- [mongodb](https://github.com/mongodb/mongo) (Especially the Raspberry PI fork: [mongopi](https://github.com/RickP/mongopi))
- [express](https://github.com/visionmedia/express)
- [requirejs](https://github.com/jrburke/requirejs)
- [jade](https://github.com/visionmedia/jade)
- [socket.io](https://github.com/LearnBoost/socket.io)
- [bootstrap](https://github.com/twitter/bootstrap)
- [font-awesome](https://github.com/FortAwesome/Font-Awesome)

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

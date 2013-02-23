# heimcontrol-gpio

*gpio* is a plugin for the node.js app [heimcontrol.js](https://github.com/heimcontroljs/heimcontrol.js) to control the GPIO ports on an Raspberry PI.

It uses the great [pi-gpio](https://github.com/rakeshpai/pi-gpio) tool to access the GPIO pins of the Raspberry Pi.

## Installation

To install gpio, navigate to your heimcontrol.js folder and run npm:

````
npm install https://github.com/heimcontroljs/plugin-gpio/tarball/master
````

### gpio-admin

To get around being root to access the Raspberry Pi's GPIO pins, you should use [quick2wire-gpio-admin](https://github.com/quick2wire/quick2wire-gpio-admin):

````bash
git clone git://github.com/quick2wire/quick2wire-gpio-admin.git
cd quick2wire-gpio-admin
make
sudo make install
sudo adduser $USER gpio
````

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

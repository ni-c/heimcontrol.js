# heimcontrol.js

Documentation can be found here: http://ni-c.github.com/heimcontrol.js/

### Additions
Added a method to control Active low relays such as this one [here](http://www.amazon.com/Active-Channel-Relay-Module-Arduino/dp/B00E7PRHVO). Since these are active low, they need to be switched off inorder to turn them on. I simply made another method, (**Active low**) that reverses the switches used in the led method. In order for this to work, i also use another duino lib name Active low which can be downloaded [here](https://gist.github.com/schneiderr/71ea2fc8abebac03ebfa).

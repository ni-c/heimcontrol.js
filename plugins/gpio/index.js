if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'pi-gpio' ], function(gpio) {

  /**
   * Gpio Plugin. Can access the GPIO on the Raspberry PI
   *
   * @class Gpio
   * @param {Object} app The express application
   * @constructor 
   */
  var Gpio = function(app) {

    this.name = 'GPIO';
    this.collection = 'Gpio';
    this.icon = 'icon-lightbulb';

    this.app = app;
    this.id = this.name.toLowerCase();
    this.pluginHelper = app.get('pluginHelper');

    var that = this;

    // Ping interval
    setInterval(function() {
      that.parse();
    }, 100);

    app.get('sockets').on('connection', function(socket) {

      // GPIO toggle
      socket.on('gpio-toggle', function(data) {
        that.toggle(data);
      });

    });
  };

  /**
   * Toggle a GPIO port
   * 
   * @method toggle
   * @param {Object} data The websocket data
   * @param {String} data.id The ID of the database entry
   * @param {String} data.value The value to set
   */
  Gpio.prototype.toggle = function(data) {

    var that = this;
    this.pluginHelper.findItem(this.collection, data.id, function(err, item, collection) {

      item.value = data.value + '';

      // Save status to db
      collection.save(item);

      gpio.open(parseInt(item.pin), "output", function(err) {
        gpio.write(parseInt(item.pin), parseInt(item.value), function() {
          gpio.close(parseInt(item.pin));
          that.app.get('sockets').emit('gpio-output', {
            id: item._id,
            value: item.value
          });
        });
      });
    });
  };

  /**
   * Parse GPIO the ports that are used as input and send the result to the client websocket
   * 
   * @method parse
   */
  Gpio.prototype.parse = function() {
    var that = this;
    this.app.get('db').collection(this.collection, function(err, collection) {
      collection.find({
        direction: 'input'
      }).toArray(function(err, result) {
        result.forEach(function(item) {
          gpio.setDirection(parseInt(item.pin), "input", function(err) {
            gpio.read(parseInt(item.pin), function(err, status) {
              if (!err) {
                that.app.get('sockets').emit('gpio-input', {
                  id: item._id,
                  value: status + ''
                });
              }
            });
          });
        });
      });
    });
  };

  return Gpio;

});

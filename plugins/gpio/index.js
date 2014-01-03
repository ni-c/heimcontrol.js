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
    this.pluginHelper = app.get('plugin helper');

    this.values = {};

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
      gpio.open(parseInt(item.pin), "output", function(err) {
        gpio.write(parseInt(item.pin), parseInt(item.value), function() {
          gpio.close(parseInt(item.pin));
          that.values[item._id] = item.value;
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
    if (that.app.get('clients').length > 0) {
      that.app.get('db').collection(this.collection, function(err, collection) {
        collection.find({
          direction: 'input'
        }).toArray(function(err, result) {
          result.forEach(function(item) {
            gpio.setDirection(parseInt(item.pin), "input", function(err) {
              gpio.read(parseInt(item.pin), function(err, value) {
                if (!err) {
                  that.values[item._id] = value;
                  that.app.get('sockets').emit('gpio-input', {
                    id: item._id,
                    value: value
                  });
                }
              });
            });
          });
        });
      });
    }
  };

  /**
   * Manipulate the items array before render
   *
   * @method beforeRender
   * @param {Array} items An array containing the items to be rendered
   * @param {Function} callback The callback method to execute after manipulation
   * @param {String} callback.err null if no error occured, otherwise the error
   * @param {Object} callback.result The manipulated items
   */
  Gpio.prototype.beforeRender = function(items, callback) {
    var that = this;
    items.forEach(function(item) {
      item.value = that.values[item._id] ? that.values[item._id] : 0;
    });
    return callback(null, items);
  };

  /**
   * API functions of the GPIO Plugin
   * 
   * @method api
   * @param {Object} req The request
   * @param {Object} res The response
   */

  Gpio.prototype.api = function(req, res, next) {
    /*
     * GET
     */
    if (req.method == 'GET') {
      var that = this;
      this.app.get('db').collection(this.collection, function(err, collection) {
        collection.find({}).toArray(function(err, items) {
          if (!err) {
            that.beforeRender(items, function() {
              res.send(200, items);
            });
          } else {
            res.send(500, '[]');
          }
        });
      });
    } else {
      next();
    }
  };

  var exports = Gpio;

  return exports;

});

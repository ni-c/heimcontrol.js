if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/**
 * Arduino Plugin. This plugin is able to control an Arduino that is attached to the USB port of the Raspberry PI
 *
 * @class Arduino
 * @constructor 
 */

define([ 'duino' ], function(duino) {

  var Arduino = function(app) {

    this.name = 'Arduino';
    this.collection = 'Arduino';
    this.icon = 'icon-external-link';

    this.app = app;
    this.id = this.name.toLowerCase();
    this.board = new duino.Board();

    this.pins = {};
    this.pluginHelper = app.get('pluginHelper');

    this.sensorList = [];
    this.sensors = {};

    this.init();

    var that = this;

    app.get('sockets').on('connection', function(socket) {

      // Arduino toggle
      socket.on('arduino-toggle', function(data) {
        that.toggle(data);
      });

    });
  };

  /**
   * Refreshes the plugin. Is called by the application when the settings have been changed
   * 
   * @method refresh
   */
  Arduino.prototype.refresh = function() {
    this.init();
  };

  /**
   * Toggle an Arduino port
   * 
   * @method toggle
   * @param {Object} data The websocket data
   * @param {String} data.id The ID of the database entry
   * @param {String} data.value The value to set
   */
  Arduino.prototype.toggle = function(data) {

    var that = this;
    this.pluginHelper.findItem(that.collection, data.id, function(err, item, collection) {
      if ((!err) && (item)) {
        item.status = (parseInt(data.value));

        // Inform clients over websockets
        that.app.get('sockets').emit('arduino-toggle', data);

        // Create RC object
        if (!that.pins[item.pin]) {
          that.pins[item.pin] = new duino.RC({
            board: that.board,
            pin: parseInt(item.pin)
          });
        }

        // Send RC code
        if (item.status) {
          that.pins[item.pin].triState(item.code + "FF0F");
        } else {
          that.pins[item.pin].triState(item.code + "FF00");
        }
      } else {
        console.log(err);
      }
    });
  };

  /**
   * Initialize the sensors attached to the Arduino
   * 
   * @method init
   */
  Arduino.prototype.init = function() {

    var that = this;
    this.sensorList.forEach(function(sensor) {
      sensor.removeAllListeners();
    });
    this.sensorList = [];

    this.sensors = {};
    this.app.get('db').collection(that.collection, function(err, collection) {
      collection.find({
        method: 'sensor'
      }).toArray(function(err, result) {
        if ((!err) && (result.length > 0)) {
          result.forEach(function(item) {
            that.sensors[item._id] = item;
            var sensor = new duino.Sensor({
              board: that.board,
              pin: item.pin,
              throttle: 500
            });
            sensor._id = item._id;
            sensor.on('read', function(err, value) {
              item = that.sensors[this._id + ''];
              if (isNaN(item.value)) {
                item.value = 0;
              }
              var val = parseFloat(eval(item.formula.replace('x', +value)));
              item.value = parseFloat(((item.value + val) / 2).toFixed(2));
              that.app.get('sockets').emit('arduino-sensor', {
                id: item._id,
                value: item.value
              });
            });
            that.sensorList.push(sensor);
          });
        }
      });
    });
  };

  return Arduino;

});

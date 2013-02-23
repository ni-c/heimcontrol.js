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
    this.initSensors();

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
    this.initSensors();
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
    this.pluginHelper.findItem(this.collection, data.id, function(err, item, collection) {

      item.status = (parseInt(data.value));

      console.log(item);

      // Save status to db
      collection.save(item);

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
    });
  };

  /**
   * Initialize the sensors attached to the Arduino
   * 
   * @method initSensors
   */
  Arduino.prototype.initSensors = function() {

    var that = this;
    this.sensorList.forEach(function(sensor) {
      sensor.removeAllListeners();
    });
    this.sensorList = [];

    this.app.get('db').collection(this.collection, function(err, collection) {
      collection.find({
        method: 'sensor'
      }).toArray(function(err, result) {
        if ((!err) && (result.length > 0)) {
          result.forEach(function(item) {
            var sensor = new duino.Sensor({
              board: that.board,
              pin: item.pin,
              throttle: 1000
            });
            sensor._id = item._id;
            sensor.on('read', function(err, value) {
              value = +value;
              var id = this._id + '';
              that.pluginHelper.findItem(that.collection, id, function(err, item, collection) {
                that.app.get('sockets').emit('arduino-sensor', {
                  id: id,
                  value: parseFloat(eval(item.formula.replace('x', value))).toFixed(2)
                });
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

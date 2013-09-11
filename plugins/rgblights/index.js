if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'duino' ], function(duino) {

  /**
   * RGB Lights Plugin. This plugin is able to control a strip of RGB LEDs connected to an Arduino or GPIO Pins
   *
   * @class RGBLights
   * @param {Object} app The express application
   * @constructor 
   */
  var RGBLights = function(app) {

    this.name = 'RGBLights';
    this.collection = 'rgblights';
    this.icon = 'icon-eye-open';

    this.app = app;
    this.id = this.name.toLowerCase();
    this.board = new duino.Board();

    this.pins = {};
    this.pluginHelper = app.get('plugin helper');

    this.values = {};

    this.sensorList = [];
    this.sensors = {};

    this.init();

    var that = this;

    app.get('events').on('settings-saved', function() {
      that.init();
    });

    app.get('sockets').on('connection', function(socket) {
      socket.on('rgblights', function(data) {
        that.picker(data);
      });
    });
    
  };

  RGBLights.prototype.picker = function(data) {

    var that = this;
    this.pluginHelper.findItem(that.collection, data.id, function(err, item, collection) {
      if ((!err) && (item)) {
        
        // Inform clients over websockets
        that.app.get('sockets').emit('rgblights', data)

        that.board.analogWrite(item.pins.R, data.R); // Red Pin
        that.board.analogWrite(item.pins.G, data.G); // Green Pin
        that.board.analogWrite(item.pins.B, data.B); // Blue Pin

      } else {
        console.log(err);
      }
    });
  };

  RGBLights.prototype.init = function() {

    var that = this;

    this.sensorList = [];

    this.sensors = {};
    return this.app.get('db').collection(that.collection, function(err, collection) {
      collection.find({
        method: 'sensor'
      }).toArray(function(err, result) {
        if ((!err) && (result.length > 0)) {

          result.forEach(function(item) {
            that.sensors[item._id] = item;
            
            console.log(item);

            sensor._id = item._id;
            
            that.sensorList.push(sensor);
          });
        }
      });
    });
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
  RGBLights.prototype.beforeRender = function(items, callback) {
    var that = this;
    items.forEach(function(item) {
      item.value = that.values[item._id] ? that.values[item._id] : 0;
    });
    return callback(null, items);
  }

  var exports = RGBLights;

  return exports;

});

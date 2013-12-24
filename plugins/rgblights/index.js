if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'duino' ], function(duino) {

  /**
   * RGB Lights Plugin. This plugin is able to control a strip of RGB LEDs connected to an Arduino or GPIO Pins
   *
   * @author https://github.com/ConnorRoberts
   * @class RGBLights
   * @param {Object} app The express application
   * @constructor 
   */
  var RGBLights = function(app) {

    this.name = 'RGBLights';
    this.collection = 'RGBLight';
    this.icon = 'icon-eye-open';

    this.app = app;
    this.id = this.name.toLowerCase();
    this.board = new duino.Board();

    this.pins = {};
    this.pluginHelper = app.get('plugin helper');

    this.values = {};

    var that = this;

    app.get('sockets').on('connection', function(socket) {
      socket.on('rgblights', function(data) {
        that.picker(data);
      });
    });
    
  };

  /**
   * Is called if the user has picked a color from the colourwheel
   * 
   * @method picker 
   * @param {Object} data The data of the colourwheel
   * @param {String} data.id The id of the element
   * @oaram {String} data.hex The hex value of the color
   * @oaram {Object} data.pins Splitted integer values for RGB 
   * @oaram {String} data.pins.R The value for RED
   * @oaram {String} data.pins.G The value for GREEN
   * @oaram {String} data.pins.B The value for BLUE
   */
  RGBLights.prototype.picker = function(data) {

    var that = this;
    this.pluginHelper.findItem(that.collection, data.id, function(err, item, collection) {
      if ((!err) && (item)) {
        
        // Inform clients over websockets
        that.app.get('sockets').emit('rgblights-changed', data);

        // Write the RGB values to the Arduino
        that.board.analogWrite(item.pins.R, data.R); // Red Pin
        that.board.analogWrite(item.pins.G, data.G); // Green Pin
        that.board.analogWrite(item.pins.B, data.B); // Blue Pin
      } else {
        console.log(err);
      }
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
  };

  var exports = RGBLights;

  return exports;

});

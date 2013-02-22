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
    this.icon = 'icon-external-link';

    this.app = app;
    this.id = this.name.toLowerCase();
    this.board = new duino.Board();
    this.pins = {};

    var that = this;
    app.get('sockets').on('connection', function(socket) {
      socket.on('arduino-toggle', function(data) {
        that.toggle(data);
      });
    });
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

    var ObjectID = this.app.get('mongo').ObjectID;
    var id = new ObjectID(data.id);

    var that = this;
    this.app.get('db').collection('Arduino', function(err, collection) {
      collection.find({
        _id: id
      }).toArray(function(err, result) {
        if ((!err) && (result.length == 1)) {
          var item = result[0];
          // Create RC object
          if (!that.pins[item.pin]) {
            that.pins[item.pin] = new duino.RC({
              board: that.board,
              pin: parseInt(item.pin)
            });
          }

          // Send RC code
          if (parseInt(data.value)) {
            that.pins[item.pin].triState(item.val + "FF0F");
          } else {
            that.pins[item.pin].triState(item.val + "FF00");
          }

          that.app.get('sockets').emit('arduino-toggle', data);
        }
      });
    });

  };

  return Arduino;

});

if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'duino' ], function(duino) {

  /**
   * Arduino Plugin. This plugin is able to control an Arduino that is attached to the USB port of the Raspberry PI
   *
   * @class Arduino
   * @param {Object} app The express application
   * @constructor 
   */
  var Arduino = function(app) {

    this.name = 'Arduino';
    this.collection = 'Arduino';
    this.icon = 'icon-external-link';

    this.app = app;
    this.id = this.name.toLowerCase();

    this.board = new duino.Board();
    // this.board.debug = true;
    function warnNoDuino(e) {
        console.warn("[WARNING] error while trying to connect to Arduino:")
        console.warn(" >>> " + e);
        console.info("[INFO] continuing and hoping for the best...");
        // FIXME: we should disable this plugin in some way, though
    }
    this.board.on('error', warnNoDuino);
    this.board.setup();

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
      // Arduino toggle
      socket.on('arduino-rcswitch', function(data) {
        that.rcswitch(data);
      });
      // Arduino toggle
      socket.on('arduino-irremote', function(data) {
        that.irremote(data);
      });
      // Arduino toggle
      socket.on('arduino-led', function(data) {
        that.led(data);
      });
    });
    
  };

  /**
   * Toggle an Arduino port
   * 
   * @method rcswitch
   * @param {Object} data The websocket data from the client
   * @param {String} data.id The ID of the database entry from the RC switch to use
   * @param {String} data.value The value to set (0 or 1)
   */
  Arduino.prototype.rcswitch = function(data) {
    var that = this;
    this.pluginHelper.findItem(that.collection, data.id, function(err, item, collection) {
      if ((!err) && (item)) {
        // Inform clients over websockets
        that.app.get('sockets').emit('arduino-rcswitch', data);

        item.value = (parseInt(data.value));
        that.values[item._id] = item.value;

        // Create RC object
        if (!that.pins[item.pin]) {
          that.pins[item.pin] = new duino.RC({
            board: that.board,
            pin: parseInt(item.pin)
          });
        }

        // Send RC code
        if (item.rctype == 'binary') {
          if (item.value) {
            return that.pins[item.pin].decimal(parseInt(item.binaryOn, 2));
          } else {
            return that.pins[item.pin].decimal(parseInt(item.binaryOff, 2));
          }
        } else { // assume tristate
          var fullcode = item.code + (item.value ? item.onsuffix : item.offsuffix)
          return that.pins[item.pin].triState(fullcode);
        }
      } else {
        console.log(err);
      }
    });
  };

  /**
   * Send an IR remote code
   * 
   * @method irremote
   * @param {Object} data The websocket data from the client
   * @param {String} data.id The ID of the database entry from the IR to use
   * @param {String} data.value The value to set (0 or 1)
   */
  Arduino.prototype.irremote = function(data) {

    var that = this;
    this.pluginHelper.findItem(that.collection, data.id, function(err, item, collection) {
      if ((!err) && (item)) {
        var ir = new duino.IR({
          board: that.board
        });
        ir.send(item.irtype, item.ircode, item.irlength);
      } else {
        console.log(err);
      }
    });
  };

  /**
   * Turn an LED light on
   * 
   * @method led
   * @param {Object} data The websocket data from the client
   * @param {String} data.id The ID of the database entry from the LED to use
   * @param {String} data.value The value to set (0 (off) or 1 (on))
   */
  Arduino.prototype.led = function(data) {

    var that = this;
    this.pluginHelper.findItem(that.collection, data.id, function(err, item, collection) {
      if ((!err) && (item)) {
        // Inform clients over websockets
        that.app.get('sockets').emit('arduino-led', data);

        item.value = (parseInt(data.value));
        that.values[item._id] = item.value;

        // Create LED object
        if (!that.pins[item.pin]) {
          that.pins[item.pin] = new duino.Led({
            board: that.board,
            pin: parseInt(item.pin)
          });
        }

        // Change LED status
        if(item.value == "1"){
          that.pins[item.pin].on();
        }else {
          that.pins[item.pin].off();
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
    return this.app.get('db').collection(that.collection, function(err, collection) {
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
              that.values[item._id] = item.value;
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

  /**
   * Manipulate the items array before render
   *
   * @method beforeRender
   * @param {Array} items An array containing the items to be rendered
   * @param {Function} callback The callback method to execute after manipulation
   * @param {String} callback.err null if no error occured, otherwise the error
   * @param {Object} callback.result The manipulated items
   */
  Arduino.prototype.beforeRender = function(items, callback) {
    var that = this;
    items.forEach(function(item) {
      item.value = that.values[item._id] ? that.values[item._id] : 0;
    });
    return callback(null, items);
  }

  /**
   * API functions of the Arduino Plugin
   * 
   * @method api
   * @param {Object} req The request
   * @param {Object} res The response
   */

  Arduino.prototype.api = function(req, res, next) {
    /*
     * GET
     */
    if (req.method == 'POST') {
      var that = this;
      var method = req.body.method;
      if(method === "rcswitch") {
        this.app.get('db').collection("Arduino", function(err, collection) {
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
    }
  };


  var exports = Arduino;

  return exports;

});

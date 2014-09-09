if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'piswitch' ], function(rc) {

  /**
   * RCSwitch for Raspberry Pi. Control 433 MHz RC sockets using the Raspberry's GPIO
   *
   * @class PiSwitch
   * @param {Object} app The express application
   * @constructor 
   */
  var PiSwitch = function(app) {

    this.name = 'PiSwitch';
    this.collection = 'PiSwitch';
    this.icon = 'icon-adjust';

    this.app = app;
    this.id = this.name.toLowerCase();

    this.pluginHelper = app.get('plugin helper');

    this.values = {};
    var that = this;

    rc.setup({ mode: 'sys' });

    app.get('sockets').on('connection', function(socket) {
      socket.on('piswitch', function(data) {
        that.rcswitch(data);
      });
    });
    
  };

  /**
   * Send an RCSwitch code
   * 
   * @method rcswitch
   * @param {Object} data The websocket data from the client
   * @param {String} data.id The ID of the database entry from the RC switch to use
   * @param {String} data.value The value to set (0 or 1)
   */
  PiSwitch.prototype.rcswitch = function(data) {
    var that = this;
    this.pluginHelper.findItem(that.collection, data.id, function(err, item, collection) {
      if ((!err) && (item)) {
        // Inform clients over websockets
        that.app.get('sockets').emit('piswitch', data);

        item.value = (parseInt(data.value));
        that.values[item._id] = item.value;

        // Send RC code
        if (item.rctype === 'binary') {
          rc.send(item.value ? item.binaryOn : item.binaryOff);
          return;
        } else { // assume tristate
          var fullcode = item.code + (item.value ? item.onsuffix : item.offsuffix)
          rc.send(fullcode, 'tristate');
          return;
        }
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
  PiSwitch.prototype.beforeRender = function(items, callback) {
    var that = this;
    items.forEach(function(item) {
      item.value = that.values[item._id] ? that.values[item._id] : 0;
    });
    return callback(null, items);
  }

  /**
   * API functions of the PiSwitch Plugin
   * 
   * @method api
   * @param {Object} req The request
   * @param {Object} res The response
   */

  PiSwitch.prototype.api = function(req, res, next) {
    /*
     * GET
     */
    if (req.method == 'POST') {
      var that = this;
      var method = req.body.method;
      if(method === "piswitch") {
        this.app.get('db').collection("PiSwitch", function(err, collection) {
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


  var exports = PiSwitch;

  return exports;

});

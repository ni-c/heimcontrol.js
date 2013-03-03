if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/**
 * Wake-on-LAN Plugin. This plugin is able to wake devices via WOL packets
 *
 * @class Wakeonlan
 * @constructor 
 */

define([ 'ping', 'wake_on_lan' ], function(ping, wol) {

  var Wakeonlan = function(app) {

    this.name = 'Wake-on-LAN';
    this.id = 'wakeonlan';
    this.collection = 'Wakeonlan';
    this.icon = 'icon-off';

    this.app = app;
    this.pluginHelper = app.get('plugin helper');

    this.values = {};

    var that = this;

    // Ping interval
    setInterval(function() {
      that.ping();
    }, 1000);

    app.get('sockets').on('connection', function(socket) {
      // Wake on LAN socket
      socket.on('wakeonlan-wake', function(data) {
        that.wake(data);
      });
    });
  };

  /**
   * Ping all hosts and send changes to sockets
   * 
   * @method ping
   */
  Wakeonlan.prototype.ping = function() {
    var that = this;
    if (that.app.get('clients').length > 0) {
      that.app.get('db').collection(this.collection, function(err, collection) {
        collection.find({}).toArray(function(err, result) {
          result.forEach(function(item) {
            ping.sys.probe(item.host, function(value) {
              that.values[item._id] = value;
              that.app.get('sockets').emit('wakeonlan-ping', {
                id: item._id,
                alive: value
              });
            });
          });
        });
      });
    }
  };

  /**
   * Wake on LAN
   * 
   * @method wake
   * @param {Object} data The websocket data
   * @param {String} data.id The ID of the database entry
   */
  Wakeonlan.prototype.wake = function(data) {
    this.pluginHelper.findItem(this.collection, data.id, function(err, item, collection) {
      wol.wake(item.mac);
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
  Wakeonlan.prototype.beforeRender = function(items, callback) {
    var that = this;
    items.forEach(function(item) {
      item.value = that.values[item._id] ? that.values[item._id] : 0;
    });
    return callback(null, items);
  }

  var exports = Wakeonlan;

  return Wakeonlan;

});

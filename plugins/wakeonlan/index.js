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
    this.pluginHelper = app.get('pluginHelper');

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
    this.app.get('db').collection(this.collection, function(err, collection) {
      collection.find({}).toArray(function(err, result) {
        result.forEach(function(item) {
          ping.sys.probe(item.host, function(alive) {
            that.app.get('sockets').emit('wakeonlan-ping', {
              id: item._id,
              alive: alive
            });
          });
        });
      });
    });
  };

  /**
   * Wake on LAN
   * 
   * @method wake
   * @param {data} data The websocket data
   */
  Wakeonlan.prototype.wake = function(data) {
    this.pluginHelper.findItem(this.collection, data.id, function(err, item, collection) {
      // Wake on LAN
      wol.wake(item.mac);
    });
  };

  return Wakeonlan;

});

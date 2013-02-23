if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/**
 * Wake-on-LAN Plugin. This plugin is able to wake devices via WOL packets
 *
 * @class Wakeonlan
 * @constructor 
 */

define([ 'duino' ], function(duino) {

  var Wakeonlan = function(app) {

    this.name = 'Wake-on-LAN';
    this.id = 'wakeonlan';
    this.collection = 'Wakeonlan';
    this.icon = 'icon-off';

    this.app = app;

    var that = this;
    app.get('sockets').on('connection', function(socket) {
      socket.on('wakeonlan-wake', function(data) {
        that.wake(data);
      });
    });
  };

  Wakeonlan.prototype.wake = function(data) {
    
  };
  
  return Wakeonlan;

});

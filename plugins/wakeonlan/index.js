/**
 * heimcontrol.js (https://github.com/ni-c/heimcontroljs)
 *
 * @file routes/index.js
 * @brief heimcontrol.js
 * @author Willi Thiel (ni-c@ni-c.de)
 *
 */

if( typeof define !== 'function') {
	var define = require('amdefine')(module);
}

define(['ping'], function(ping) {
	
  var exports = {};

  /**
   * /
   */
  exports.init = function(app) {
  	
	  // Ping check
	  setInterval(function() {
	  	ping.sys.probe("curiosity", function(alive) {
		  	app.get('sockets').emit('ping', {alive: alive, host: "curiosity"});
	  	});
  	}, 10000, app);
  	
    app.get('sockets').on('connection', function(socket) {
		  socket.on('wol', function(data) {
		  	console.log('wol');
		  });
  	});  	
  };

  return exports;
});

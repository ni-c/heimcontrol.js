
require([ "jquery", "/socket.io/socket.io.js" ], function() {

  var socket = io.connect();

  /**
   * Arduino RC button has been switched
   */
  socket.on('piswitch', function(data) {
    $('*[data-id="' + data.id + '"]').removeClass('active');
    $('*[data-id="' + data.id + '"][data-value="' + data.value + '"]').addClass('active');
  });
});

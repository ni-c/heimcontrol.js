require([ "jquery", "/socket.io/socket.io.js" ], function() {
  var socket = io.connect();

  /**
   * DS18x20 sensor data received
   */
  socket.on('ds18x20-sensor', function(data) {
    $('.value[data-id="' + data.id + '"]').text(data.value);
  });
});

require(["jquery", "/js/bootstrap.min.js", "/socket.io/socket.io.js"], function() {

  var socket = io.connect();

  /**
   * Arduino button has been toggled
   */
  socket.on('arduino-toggle', function(data) {
    $('*[data-id="' + data.id + '"]').removeClass('active');
    $('*[data-id="' + data.id + '"][data-value="' + data.value + '"]').addClass('active');
  });

});

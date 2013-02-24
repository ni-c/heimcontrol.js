function registerSelectSwitch() {
  $('.switch').children('select').change(function() {
    var e = $(this).parent('.switch');
    e.children('.switch-container').children('div').addClass('hidden');
    e.children('.switch-container').children('div').children('input').val(' ');
    e.children('.switch-container').children('.' + $(this).val()).removeClass('hidden');
  });
};

require([ "jquery", "/js/bootstrap.min.js", "/socket.io/socket.io.js" ], function() {

  registerSelectSwitch();
  
  var socket = io.connect();

  /**
   * Arduino button has been toggled
   */
  socket.on('arduino-toggle', function(data) {
    $('*[data-id="' + data.id + '"]').removeClass('active');
    $('*[data-id="' + data.id + '"][data-value="' + data.value + '"]').addClass('active');
  });

  /**
   * Arduino sensor data received
   */
  socket.on('arduino-sensor', function(data) {
    $('.value[data-id="' + data.id + '"]').text(data.value);
  });

});

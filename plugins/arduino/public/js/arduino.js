function registerSelectSwitch() {
  $('.switch').children('select').change(function() {
    var e = $(this).parent('.switch');
    e.find('.switch-container').find('div').addClass('hidden');
    e.find('.switch-container').find('input').val('');
    e.find('.switch-container').find('input').removeAttr('required', '0');
    e.find('.switch-container').find('.' + $(this).val()).each(function() {
      var e = $(this);
      e.removeClass('hidden');
      if (e.attr('data-required')=='1') {
        e.attr('required', 'required');
      }
    });
  });
};
  
require([ "jquery", "/socket.io/socket.io.js" ], function() {

  var socket = io.connect();

  registerSelectSwitch();

  /**
   * Arduino RC button has been switched
   */
  socket.on('arduino-rcswitch', function(data) {
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

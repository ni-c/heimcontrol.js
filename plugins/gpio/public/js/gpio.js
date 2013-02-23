function registerGpioToggles() {
  $('button.gpio.toggle').unbind('click.toggle');
  $('button.gpio.toggle').bind('click.toggle', function()  {
    var button = $(this);
    console.log(this);
    console.log(button.attr('data-value'));
    button.parent().children('input').attr('value', button.attr('data-value'));
  }); 
}

require(["jquery", "/js/bootstrap.min.js", "/socket.io/socket.io.js"], function() {

  registerGpioToggles();

  var socket = io.connect();

  /**
   * GPIO input change
   */
  socket.on('gpio-input', function(data) {
    $('.gpiostatus[data-id="' + data.id + '"]').addClass('hide');
    $('.gpiostatus[data-id="' + data.id + '"][data-value="' + data.value + '"]').removeClass('hide');
  });

  /**
   * GPIO output change
   */
  socket.on('gpio-output', function(data) {
    console.log(data);
    $('button[data-id="' + data.id + '"]').removeClass('active');
    $('button[data-id="' + data.id + '"][data-value="' + data.value + '"]').addClass('active');
  });
});

require([ "jquery", "/socket.io/socket.io.js", "delivery" ], function() {

  var socket = io.connect();


  var delivery = new Delivery(socket);

  delivery.on('receive.success',function(file) {
    console.log(file);
    if (file.isImage()) {
      $('img[data-id="' + file.name + '"]').attr('src', file.dataURL());
    };
  });

});

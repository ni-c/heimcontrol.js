require([ "jquery", "/socket.io/socket.io.js", "/js/colourwheel.js" ], function() {

  var socket = io.connect();

  $('.colourwheel').each(function( index ) {

    var id = $('.colourwheel:eq(' + index + ')').attr('data-id');

    var colourWheel = Raphael.colorwheel($("#wheel-" + id), 200);
    colourWheel.color("#F00");

    colourWheel.onchange(function(color){

        var colors = [parseInt(color.r), parseInt(color.g), parseInt(color.b)];
        $('.colourwheel').attr('data-value', color.hex);

        var data = new Object();

        data.id = id;
        data.hex = color.hex;
        data.R = parseInt(color.r);
        data.G = parseInt(color.g);
        data.B = parseInt(color.b);

        socket.emit('rgblights', data);
        
    })

  });

});

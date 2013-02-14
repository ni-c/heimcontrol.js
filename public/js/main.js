require(["jquery", "/js/bootstrap.min.js", "/js/socket.io.min.js"], function() {

	var socket = io.connect();
	
	socket.on('ping', function(data) {
		if (data.alive) {
	 		$('*[data-host="' + data.host + '"].online').removeClass('hide');
	  	$('*[data-host="' + data.host + '"].offline').addClass('hide');
		} else {
	 		$('*[data-host="' + data.host + '"].online').addClass('hide');
	  	$('*[data-host="' + data.host + '"].offline').removeClass('hide');
		}
	});

	$('.wol').click(function() {
		socket.emit('wol', {
			host: $(this).attr('data-host'),
			mac: $(this).attr('data-mac')
		});
	});
});

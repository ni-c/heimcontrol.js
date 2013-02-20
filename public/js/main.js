// Delete buttons
function register_delete() {
	$('.delete').unbind('click');
	$('.delete').click(function() {
		var e = $('#' + $(this).attr('data-delete'));
		e.slideToggle(500, function() {
			e.remove()
		});
	});
}

require(["jquery", "/js/bootstrap.min.js", "/socket.io/socket.io.js"], function() {
	register_delete();

	var socket = io.connect();

  socket.on('disconnect', function () {
  	setTimeout(function() {
	    $('.navigation').remove();
	    $('#content').empty();
	    $('#content').append('<h1>503</h1><h2>I\'m sorry Dave, i\'m afraid i have lost the connection to the server.</h2><p><a href="/login"><h3>Back to Login</h3></a></p>');
  	}, 1000);
  });

	require(["/js/jquery.cookie.js"], function() {
		if($('.btn-login').length > 0) {
			$('.btn-login').click(function() {
				if($('#rememberme').is(':checked')) {
					$.cookie("email", $('#email').val());
					$.cookie("password", $('#password').val());
				} else {
					$.cookie("email", null);
					$.cookie("password", null);
				}
			})
			$('#email').focus();
		}
		if($('.login-error').length > 0) {
			$.cookie("email", null);
			$.cookie("password", null);
		}
		if($('.btn-logout').length > 0) {
			$('.btn-logout').click(function() {
				$.cookie("email", null);
				$.cookie("password", null);
			});
		}
	});
});

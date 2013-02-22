// Delete buttons
function registerDeleteButtons() {
	$('.delete').unbind('click');
	$('.delete').click(function() {
		var e = $('#' + $(this).attr('data-delete'));
		e.slideToggle(500, function() {
			e.remove();
		});
	});
}

// Socket buttons
function registerSocketButtons(socket) {
  $('.socket').unbind('click');
  $('.socket').click(function() {
    var e = $(this);
    var data = {
        id: e.data('id'),
        value: e.data('value')
    };
    socket.emit(e.data('socket'), data);
  });
}

require(["jquery", "/js/bootstrap.min.js", "/socket.io/socket.io.js"], function() {

	var socket = io.connect();

  registerDeleteButtons();

  registerSocketButtons(socket);

  if ($('#template').length) {
    var i = 0;
    $('.add').click(function() {
      var element = $('#template').clone();
      $('#' + $(this).data('target')).append(element);
      element.attr('id', i);
      element.children('.delete').attr('data-delete', i++);
      element.slideToggle();
      $('html, body').animate({
        scrollTop : $('html, body').height()
      }, 800);
      registerDeleteButtons();
    });
  }
  
	// Socket disconnect
  socket.on('disconnect', function () {
  	setTimeout(function() {
	    $('.navigation').remove();
	    $('#content').empty();
	    $('#content').append('<h1>503</h1><h2>I\'m sorry Dave, i\'m afraid i have lost the connection to the server.</h2><p><a href="/login"><h3>Back to Login</h3></a></p>');
  	}, 1000);
  });

  // Set login cookie
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
			});
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

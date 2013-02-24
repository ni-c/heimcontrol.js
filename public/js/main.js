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

// Mac address to uppercase
function registerMacInput() {
  $('.mac').unbind('mac');
  $('.mac').keyup(function() {
    var e = $(this);
    var value = e.val();
    value = value.toUpperCase();
    value = value.replace('-', ':').replace('.', ':');
    e.val(value);
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

  registerMacInput();
  
  if ($('#template').length) {
    $('.add').click(function() {

      // Get current iterator
      var i = $('#iterator').val();
      
      // Clone element
      var element = $('#template').clone();
      $('#' + $(this).data('target')).append(element);
      
      // Set ids
      element.attr('id', i);
      
      element.find('input, select').each(function() {
        $(this).attr('name', $(this).attr('name').replace('%i%', i));
      });
      
      element.find('.delete').attr('data-delete', i);
      
      // Fade in
      element.slideToggle();
      $('html, body').animate({
        scrollTop : $('html, body').height()
      }, 800);
      
      // Call callback
      if ($(this).attr('data-callback')) {
        eval($(this).attr('data-callback'));
      }
      
      // Register Events
      registerDeleteButtons();
      registerMacInput();

      // Set new iterator
      $('#iterator').val(++i);
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

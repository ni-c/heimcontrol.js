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

require(["jquery", "/js/bootstrap.min.js"], function() {
	register_delete();

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

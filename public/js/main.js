
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
});

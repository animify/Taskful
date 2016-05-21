$(function() {

	$('body').on('click', '.toggle', function(){
		$(this).toggleClass('selected');
	});

	$(document).keyup(function (e) {
		if (e.keyCode == 27) {
			closeModalOverlay();
		}
	});

	$('.comment-editable').bind("click", function(e){
		e.stopPropagation();
		$(this).addClass('expanded');
		$('.tasks-preview-inner').css({ 'height': 'calc(100% - 186px)' });
		$(this).animate({
			height: '165px'
		}, 100);
		$(this).find('.comment-editable_footer').fadeIn();
	});

	$('.close-modal').bind("click", function(){
		closeModalOverlay();
	});

	$('.open-modal').bind("click", function(){
		$('.modal-overlay').fadeIn('fast');
		$('.modal-overlay-inner').addClass('open');
		$('#' + $(this).data('modal')).fadeIn('fast');
	});

	$('html, .dropdown li').bind("click", function(){
		$('.dropdown').hide();
		$('.comment-editable').removeClass('expanded');
		$('.tasks-preview-inner').css({ 'height': 'calc(100% - 55px)' });
		$('.comment-editable').animate({
			height: '35px'
		}, 100);
		$('.comment-editable').find('.comment-editable_footer').hide();
	});

	$('.dropdown, .dropdown-toggle').bind("click", function(e){
		e.stopPropagation();
	});

	$('.dropdown-toggle').bind("click", function(e){
		$(this).siblings('.dropdown').toggle();
	});

	$('.tasks-list').on("click", ".task-item", function(e){
		_this = $(this);
		$('.tasks-list .task-item').removeClass('selected');
		$.get('/tasks/' + _this.data('task'), function(data) {
			$('.tasks-preview-inner_title h1').text(data.task.name);
			$('.tasks-preview-inner').data('selectedid', data.task._id);
			data.task.content !== null ? editor.setValue(data.task.content) : editor.setValue("");
			_this.addClass('selected');
			console.log(data);
		}).error(function(err) {
			console.log(err);
		});
	});

});

function closeModalOverlay() {
	if ($('.modal-overlay').length) {
		$('.modal-overlay').fadeOut('fast');
		$('.modal-overlay-inner').removeClass('open');
		$('#' + $(this).data('modal')).fadeOut('fast');
	}
}

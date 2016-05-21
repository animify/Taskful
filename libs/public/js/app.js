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
		animateCommentOpen($(this));
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
		animateCommentClose();
	});

	$('.dropdown, .dropdown-toggle').bind("click", function(e){
		e.stopPropagation();
	});

	$('.dropdown-toggle').bind("click", function(e){
		if ($('.dropdown').length) {
			$('.dropdown').hide();
		}
		$(this).siblings('.dropdown').toggle();

	});

	$('.tasks-list').on("click", ".task-item:not(.selected)", function(e){
		_this = $(this);
		$('.tasks-list .task-item').removeClass('selected');
		$.get('/tasks/' + _this.data('task'), function(data) {
			_stories = data.stories[0].stories;
			$('.stories').empty();
			$('.tasks-preview-inner_title h1').text(data.task.name);
			$('.tasks-preview-inner').data('selectedid', data.task._id);
			data.task.content !== null ? editor.setValue(data.task.content) : editor.setValue("");
			editor.refresh();
			_this.addClass('selected');
			if (_stories) {
				$.each(_stories, function(i, story) {
					readStory(story);
				});
			}

		}).error(function(err) {
			console.log(err);
		});
	});

	var _first = $('.task-item:first');
	_first.click();

});

function readStory(story) {
	switch(story.type) {
		case 'init':
		$('.stories').append('<div class="story story_created story_new"><div class="story-inner"><p>' + story.creator.username + ' ' + story.text + '</p></div></div>');
		break;
		case 'comment':
			$('.stories').append('<div class="story story_comment story_new"><div class="story_comment-avatar"><div class="user-i user-i_sm"><a>' + story.creator.username.substr(0,2) + '</a></div></div><div class="story-inner"><h6>' + story.creator.fullname + '</h6><p>' + story.text + '</p></div></div>');
		break;
	}

	$('.story_new').slideDown('fast');
}

function animateCommentOpen(_this) {
	_this.addClass('expanded');
	$('.tasks-preview-inner').css({ 'height': 'calc(100% - 186px)' });
	_this.animate({
		height: '165px'
	}, 100);
	_this.find('.comment-editable_footer').fadeIn();
}


function animateCommentClose() {
	$('.comment-editable').removeClass('expanded');
	$('.tasks-preview-inner').css({ 'height': 'calc(100% - 55px)' });
	$('.comment-editable').animate({
		height: '35px'
	}, 100);
	$('.comment-editable').find('.comment-editable_footer').hide();
}

function closeModalOverlay() {
	if ($('.modal-overlay').length) {
		$('.modal-overlay').fadeOut('fast');
		$('.modal-overlay-inner').removeClass('open');
		$('#' + $(this).data('modal')).fadeOut('fast');
	}
}

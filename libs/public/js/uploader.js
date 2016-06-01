if ($('.dropzone').length) {
		var dropTarget = $('.dropzone'),
				droparea = $('.dropzone'),
				showDrag = false,
				timeout = -1;

		dropTarget.on('drop', function(e) {
				var _getid = $('.tasks-preview-inner').data('selectedid')
				if (e.originalEvent.dataTransfer) {
						if (e.originalEvent.dataTransfer.files.length) {
								e.preventDefault();
								e.stopPropagation();
								var files = e.originalEvent.dataTransfer.files;

								var fd = new FormData();
								var file_data = files;
								for (var i = 0; i < file_data.length; i++) {
										fd.append(null, file_data[i]);
								}
								$.ajax({
										url: '/files/upload/' + _getid,
										data: fd,
										contentType: false,
										processData: false,
										type: 'POST',
										success: function(data) {
												console.log(data);
										}
								});

								console.log(files[0]);
								dropTarget.removeClass('hover');
						}
				}
		});
		droparea.bind('dragenter', function(e) {
				e.preventDefault();
				e.stopPropagation();
				dropTarget.addClass('hover');
				showDrag = true;
		});
		droparea.bind('dragover', function(e) {
				e.preventDefault();
				e.stopPropagation();
				showDrag = true;
		});
		droparea.bind('dragleave', function(e) {
				showDrag = false;
				clearTimeout(timeout);
				timeout = setTimeout(function() {
						if (!showDrag) {
								dropTarget.removeClass('hover');
						}
				}, 200);
		});

		var timeOutId = 0;
}

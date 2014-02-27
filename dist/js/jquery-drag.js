"use strict";
(function($){
	$.fn.drag = function(options, callback) {
		var defaults = {
			parent: null,
			handler: null,
			range: null,
			bar: null,
			X: false,
			Y: false,
			maxLeft: 0,
			maxRight: 0,
			maxBottom: 0,
			maxUp: 0,
			callback: null
		};

		var dx = $(this).offset().left,
			dy = $(this).offset().top,
			target = null;

		// 覆盖默认值
		var opts = $.extend(defaults, options);

		$(this).on('mousedown', opts.handler, function(e) {
			target = $(e.target);
		});


		$(opts.parent).on('mousemove', function(e) {
			event.preventDefault();
			if(target) {
				if(opts.X) {
					if(e.pageX >= opts.maxLeft && e.pageX <= opts.maxRight) {
						target.parent().css({
							left: e.pageX - dx
						});
						$(opts.range).css('width', ((e.pageX - dx) / $(opts.bar).width() * 100) + "%");
					}
				}
				if(opts.Y) {
					if(e.pageY >= opts.maxBottom && e.pageY <= opts.maxUp) {
						target.parent().css({
							top: e.pageY - dy
						});
					}
				}
			}
		});

		$(opts.parent).on('mouseup', function(e) {
			event.preventDefault();
			target = null;
			if(typeof opts.callback === 'function') {
				opts.callback.call(this);
			}
		});

	};
	// debug
	function C(str) {
		console.log(str);
	}
})(jQuery);
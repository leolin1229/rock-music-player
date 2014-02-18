$(document).ready(function() {
	// app初始化
	var init = function() {
		$("#local").addClass('menu-active');
		$(".vol-slider-range").css({
			width: '50%'
		});
		console.log($(".vol-slider-range").width());
		$(".vol-slider-handle").css({
			left: $(".vol-slider-range").width() + 'px'
		});
		$("#onlineBody").css({
			display: 'none'
		});
		$("#leftCol2-songList").css({
			display: 'block'
		});
		$("#leftCol2-singerList").css({
			display: 'none'
		});
	}();

	// 本地音乐和在线音乐标签切换
	$("#local").click(function(event) {
		/* Act on the event */
		$("#localBody").css({
			display: 'block'
		});
		$("#onlineBody").css({
			display: 'none'
		});
	});

	// 本地音乐和在线音乐标签切换
	$("#online").click(function(event) {
		/* Act on the event */
		$("#onlineBody").css({
			display: 'block'
		});
		$("#localBody").css({
			display: 'none'
		});
	});

	// 本地音乐细分标签切换
	$("#songList").click(function(event) {
		/* Act on the event */
		$("#leftCol2-songList").css({
			display: 'block'
		});
		$("#leftCol2-singerList").css({
			display: 'none'
		});
	});

	$("#singerList").click(function(event) {
		/* Act on the event */
		$("#leftCol2-songList").css({
			display: 'none'
		});
		$("#leftCol2-singerList").css({
			display: 'block'
		});
	});
});
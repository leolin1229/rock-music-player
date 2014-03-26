"use strict";

var audio = {
	audioEle: null,
	lrcContent: $(".lrcContent"),
	lrcStep: 0,
	lrcData: null,
	lrcStatus: false,
	lrcLink: '',

	formatTime: function(time) {
		if (!isFinite(time) || time < 0) {
			return "";
		} else {
			var minutes = Math.floor(time / 60),
				seconds = Math.floor(time) % 60;
			return (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
		}
	},
	createPlayer: function(data) {
		this.audioEle = new Audio();
		var _audio = this.audioEle;
		_audio.addEventListener('loadedmetadata', this.onLoadedMetaData, false);
		_audio.addEventListener('canplay', this.onCanPlay, false);
		_audio.addEventListener('play', this.onPlay, false);
		_audio.addEventListener('pause', this.onPause, false);
		// _audio.addEventListener('ended', this.onEnded, false);// 为什么无法Ended事件？
		_audio.addEventListener('error', this.onError, false);
		_audio.addEventListener('timeupdate', this.onTimeUpdate, false);
		_audio.volume = 0.5;
		_audio.duration = 0;
		$(".vol-slider-range").css('width', '50%');
		$(".vol-slider-handle").css('left', parseInt($(".vol-slider-range").width()) + 'px');
		$(".slider-range").css('width', '0%');
		$(".slider-handle").css('left', '0');
		$(".title.songname").text('');
		$(".title.artist").text('');
		return this;
	},
	onCanplaythrough:function() {
		C("onCanplaythrough");
	},
	setCurrentTime: function(percent) {
		if(this.audioEle.duration) {
			var width = parseInt($(".slider-bar").width());
			this.audioEle.currentTime = audio.audioEle.duration * percent;
			$(".slider-range").css('width', percent * 100 + '%');
			$(".slider-handle").css('left', percent * width + 'px');
		}
	},
	setSrc: function(src) {
		this.audioEle.pause();
		$(".slider-range").css('width', '0%');
		$(".slider-handle").css('width', '0%');
		$(".icon-play").removeClass('icon-play').addClass('icon-pause');
		audio.audioEle.src = null;
		audio.audioEle.src = src;
		audio.audioEle.autoplay = true;
	},
	setVolume: function(vol) {
		if(this.audioEle.duration) {
			var width = parseInt($("#volSlider").width());
			if(vol > 1.0) vol = 1.0;
			if(vol < 0.0) vol = 0.0;
			this.audioEle.volume = vol;
			$(".vol-slider-range").css('width', vol * 100 + '%');
			$(".vol-slider-handle").css('left', vol * width + 'px');
			var icon_class = $("#volumeWrapper a i").attr('class');
			if(vol < 0.01) {
				$("#volumeWrapper a i").removeClass(icon_class).addClass('icon-mute');
			}else if(vol < 0.51) {
				$("#volumeWrapper a i").removeClass(icon_class).addClass('icon-volume-down');
			}else {
				$("#volumeWrapper a i").removeClass(icon_class).addClass('icon-volume-up');
			}
		}
	},
	getSrc: function() {
		if(this.audioEle.src)
		return this.audioEle.src;
		else return null;
	},
	play: function() {
		this.audioEle.pause();
		this.audioEle.play();
	},
	pause: function() {
		this.audioEle.pause();
	},
	setLoop: function() {
		this.audioEle.loop = true;
	},
	unsetLoop: function() {
		this.audioEle.loop = false;
	},
	onLoadedMetaData: function() {
		var duration = audio.formatTime(this.duration);
		this.loop = false;
		$(".total-time").text(duration);
	},
	onCanPlay: function() {},
	onPlay: function() {},
	onPause: function() {},
	onEnded: function() {
		this.audioEle.currentTime = 0;
		this.lrcLink = '';
		if (typeof audio.onEndedHandle === "function") {
			audio.onEndedHandle();
		}
	},
	onEndedHandle: function() {},
	onTimeUpdate: function() {
		if(typeof audio.onTimeUpdateHandle === 'function') {
			audio.onTimeUpdateHandle();
		}
		// var cur = this.currentTime,
		// 	dur = this.duration;
		// $(".slider-range").css('width', cur / dur * 100 + "%");
		// $(".slider-handle").css('left', cur / dur * parseInt($("#progressSlider").width()) + "px");
		// $(".current-time").text(audio.formatTime(cur));
		// try {
		// 	var buf = this.buffered.end(0);
		// 	$(".slider-buffer").css('width', buf / dur * 100 + '%');
		// } catch (error) {console.log("音频缓冲错误：" + error);}
		// if(cur == dur) {
		// 	audio.onEnded();
		// }
		// if (audio.lrcData && audio.lrcStatus && audio.lrcLink != '') {
		// 	var words = audio.lrcData.words,
		// 	times = audio.lrcData.times,
		// 	length = times.length,
		// 	i = audio.lrcStep,
		// 	lrcContent = audio.lrcContent,
		// 	curTime = cur * 1000 | 0;
		// 	for (; i < length; i++) {
		// 		var step = times[i];
		// 		if (curTime > step && curTime < times[i + 1]) {
		// 			var lrcTime = lrcContent.find('[data-lrctime="' + step + '"]');
		// 			var lrctop = lrcTime.attr("data-lrctop");
		// 			lrcContent.animate({
		// 				"margin-top": lrctop + "px"
		// 			}, 400).find("p.cur").removeClass("cur");
		// 			lrcTime.addClass("cur");
		// 			break;
		// 		}
		// 	}
		// }
	},
	onTimeUpdateHandle: function() {}
};
function C(str) {
	console.log(str);
}
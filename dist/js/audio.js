"use strict";
var audio = {
	audioEle: null,
	audioData: null,
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
		_audio.addEventListener('progress', this.onProgress, false);
		_audio.addEventListener('timeupdate', this.onTimeUpdate, false);
		_audio.volume = 0.5;
		
		$(".vol-slider-range").css('width', '50%');
		$(".vol-slider-handle").css('left', parseInt($(".vol-slider-range").width()) + 'px');
		$(".slider-range").css('width', '0%');
		$(".slider-handle").css('left', '0');
		$(".title.songname").text('');
		$(".title.artist").text('');
		return this;
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
		this.audioEle.src = null;
		this.audioEle.src = src;
		$(".slider-range").css('width', '0%');
		$(".slider-handle").css('width', '0%');
		$(".icon-play").removeClass('icon-play').addClass('icon-pause');
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
		var _audio = audio.audioEle;
		_audio.loop = false;
		var duration = audio.formatTime(_audio.duration);
		$(".total-time").text(duration);
	},
	onCanPlay: function() {},
	onPlay: function() {},
	onPause: function() {},
	onEnded: function() {
		if (typeof audio.onEndedHandle == "function") {
			audio.onEndedHandle();
		}
	},
	onEndedHandle: function() {},
	onProgress: function() {},
	onTimeUpdate: function() {
		var _audio = audio.audioEle;
		var cur = _audio.currentTime,
			dur = _audio.duration;
		$(".slider-range").css('width', cur / dur * 100 + "%");
		$(".slider-handle").css('left', cur / dur * parseInt($("#progressSlider").width()) + "px");
		$(".current-time").text(audio.formatTime(cur));
		try {
			var buf = _audio.buffered.end(0);
			$(".slider-buffer").css('width', buf / dur * 100 + '%');
		} catch (error) {console.log("音频缓冲错误：" + error);}
		if(cur == dur) {
			audio.onEnded();
		}
	}
};
function C(str) {
	console.log(str);
}
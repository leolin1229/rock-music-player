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
		// console.log(this.audioEle);
		var _audio = this.audioEle;
		// _audio.addEventListener('loadstart', this.onLoadStart, false);
		// _audio.addEventListener('durationchange', this.onDurationChange, false);
		_audio.addEventListener('loadedmetadata', this.onLoadedMetaData, false);
		// _audio.addEventListener('loadeddata', this.onLoadedData, false);
		// _audio.addEventListener('progress', this.onProgress, false);
		_audio.addEventListener('canplay', this.onCanPlay, false);
		_audio.addEventListener('play', this.onPlay, false);
		_audio.addEventListener('pause', this.onPause, false);
		_audio.addEventListener('ended', this.onEnded, false);
		_audio.addEventListener('error', this.onError, false);
		_audio.addEventListener('progress', this.onProgress, false);
		_audio.addEventListener('timeupdate', this.onTimeUpdate, false);
		// _audio.addEventListener('canplaythrough', this.onCanplaythrough, false);
		$(".vol-slider-range").css('width', '50%');
		$(".vol-slider-handle").css('left', $(".vol-slider-range").width() + 'px');
		$(".slider-range").css('width', '0%');
		$(".slider-handle").css('width', '0%');
		$(".title.songname").text('');
		$(".title.artist").text('');
		return this;
	},
	setSrc: function(src) {
		this.audioEle.pause();
		this.audioEle.src = null;
		this.audioEle.src = src;
		$(".slider-range").css('width', '0%');
		$(".slider-handle").css('width', '0%');
		$(".icon-play").removeClass('icon-play').addClass('icon-pause');
	},
	play: function() {
		this.audioEle.pause();
		this.audioEle.play();
	},
	pause: function() {
		this.audioEle.pause();
	},
	setVolume: function(val) {
		this.audioEle.volume = val;
	},
	onLoadedMetaData: function() {
		var _audio = audio.audioEle;
		var duration = audio.formatTime(_audio.duration);
		$(".total-time").text(duration);
	},
	onCanPlay: function() {},
	onPlay: function() {},
	onPause: function() {},
	onEndedHandle: function() {},
	onEnded: function() {
		if (typeof audio.onEndedHandle == "function") {
			audio.onEndedHandle();
		}
	},
	onProgress: function() {},
	onTimeUpdate: function() {
		var _audio = audio.audioEle;
		var cur = _audio.currentTime,
			dur = _audio.duration;
		$(".slider-range").css('width', cur / dur * 100 + "%");
		$(".slider-handle").css('left', cur / dur * $("#progressSlider").width() + "px");
		$(".current-time").text(audio.formatTime(cur));
	}
}
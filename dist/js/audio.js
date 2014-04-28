"use strict";
// 初始化音频上下文
var context = new (window.AudioContext || window.webkitAudioContext)();

if (!context.createGain)
  context.createGain = context.createGainNode;
if (!context.createDelay)
  context.createDelay = context.createDelayNode;
if (!context.createScriptProcessor)
  context.createScriptProcessor = context.createJavaScriptNode;

var QUAL_MUL = 30;

function Filter(element) {
	this.media = context.createMediaElementSource(element);
	this.filter = context.createBiquadFilter();
	this.compressor = context.createDynamicsCompressor();
	/**/
	this.filter.type = this.filter.LOWPASS;
	this.filter.frequency.value = context.sampleRate;
}

Filter.prototype.play = function(flag) {
	if(!flag) {
		this.media.connect(context.destination);
	}else {
		this.media.connect(this.filter);
		this.filter.connect(this.compressor);
		this.compressor.connect(context.destination);
	}
}

// range从0到1，通过指数形式映射到100Hz-22050Hz频率范围
// 基于公式maxValue*((maxValue/minValue)^(val-1))
Filter.prototype.changeFrequency = function(value) {
  	var minValue = 100;//最低频率为100Hz
  	var maxValue = context.sampleRate / 2;//最高频率为22050Hz

  	// Logarithm (base 2) to compute how many octaves fall in the range.
  	// 求以2为低的对数中八度下降的范围
  	var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
  	// Compute a multiplier from 0 to 1 based on an exponential scale.
  	// 计算乘数从0到1的基础上的指数规模
  	var multiplier = Math.pow(2, numberOfOctaves * (value - 1.0));
  	// Get back to the frequency value between min and max.
  	this.filter.frequency.value = maxValue * multiplier;
};

Filter.prototype.changeQuality = function(value) {
  this.filter.Q.value = value * QUAL_MUL;
};

Filter.prototype.toggleFilter = function(checked) {
  this.media.disconnect(0);
  this.filter.disconnect(0);
};

var audio = {
	audioEle: null,
	lrcContent: $("#lrcContent"),
	lrcStep: 0,
	lrcData: null,
	lrcStatus: false,
	lrcLink: '',
	filter: null,

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
		// _audio.addEventListener('ended', this.onEnded, false);
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
		this.filter = new Filter(this.audioEle);
		this.filter.play(false);
		return this;
	},
	// 改变低通滤波阀值
	changeFrequency: function(value) {
		this.filter.changeFrequency(value);
	},
	changeQuality: function(value) {
		this.filter.changeQuality(value);
	},
	toggleFilter: function(checked) {
		this.filter.toggleFilter(checked);
		if (checked) {
			this.filter.play(true);
		}else {
			this.filter.play(false);
		}
	},
	onCanplaythrough:function() {
		// C("onCanplaythrough");
	},
	setCurrentTime: function(percent) {},
	setSrc: function(src) {},
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
	},
	onTimeUpdateHandle: function() {},
	onError: function() {
		if(typeof audio.onErrorHandle === 'function') {
			audio.onErrorHandle();
		}
	}
};
function C(str) {
	console.log(str);
}
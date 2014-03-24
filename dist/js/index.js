$(document).ready(function() {
	"use strict";//

	// 全局变量
	var mGalleryIndex = 0;
	var mGalleryReader = null;
	var mGalleryDirectories = [];
	var mGalleryArray = [];
	var audFormats = ['wav', 'mp3'];

	var myAudio = audio.createPlayer();

	var recycleMusic = [],// 回收站歌曲
		localMusicIndex = 0;// 本地音乐计数



	var localMusic = {
		array: [],
		artist: [],
		currentID: -1,
		len: 0
	};

	var onlineMusic = {
		array: [],
		currentID: -1,
		len: 0
	};

	// 远程
	var socket = null,
		playerID = null,
		webID = null,
		showLrc = false;

	// FM
	var FM = {
		songList: [],
		curFm: '',
		currentID: -1
	}

	var remote = {
		playing: function(musicInfo) {
			if(socket && playerID && webID) {
				var data = {
					type: 'playing',
					playerID: playerID,
					webID: webID,
					musicInfo: musicInfo
				}
				socket.emit('control', data);
			}
		},
		handle: function() {
			if(!socket) {
				// socket = io.connect('http://localhost:3000');
				socket = io.connect('http://leolin.cc');
				socket.on('connected', function(data) {
					playerID = data.id;
					$("#qrcodeLayer div.layer-body-title").empty();
					$("#qrcodeLayer div.layer-body-title").html("<h3>请用手机扫二维码</h3>");

					$("#qrcodeLayer div.layer-body-content").empty();
					$("#qrcodeLayer div.layer-body-content").qrcode({width: 128,height: 128,text: "http://leolin.cc?playerID=" + playerID});
					C("初始化：http://leolin.cc?playerID=" + playerID);

					// $("#qrcodeLayer div.layer-body-content").qrcode({width: 128,height: 128,text: "http://localhost:3000?playerID=" + playerID});
					// C("初始化：http://localhost:3000?playerID=" + playerID);
				});
				socket.on('doit', function(data) {
					var type = data.type;
					switch(type) {
						case 'prev':
							player.playPre();
						break;

						case 'next':
							player.playNext();
						break;

						case 'playPause':
							player.playPause();
						break;

						case 'conn_ok': 
							webID = data.webID;
							$("#qrcodeLayer div.layer-body-title").empty();
							$("#qrcodeLayer div.layer-body-title").html("<h3>远程遥控配对成功！</h3>");
							socket.emit("control", {
								webID: webID,
								playerID: playerID,
								type: "volume",
								volume: remote.volume.value
							});
							if(!myAudio.audioEle.paused) {
								if(localMusic.currentID >= 0 && onlineMusic.currentID <= -1) {
									var musicInfo = localMusic.array[localMusic.currentID];
									remote.playing(musicInfo);
								}else if(localMusic.currentID <= -1 && onlineMusic.currentID >= 0) {
									var musicInfo = onlineMusic.array[onlineMusic.currentID];
									remote.playing(musicInfo);
								}
							}
							$("#qrcodeLayer").hide();
							$(".shade").hide();
						break;

						case 'conn_error':
							$("#qrcodeLayer div.layer-body-title").empty();
							$("#qrcodeLayer div.layer-body-title").html("<h3>远程遥控配对失败！</h3>");
						break;

						case 'volume':
							var vol = data.volume;
							remote.volume.value = vol;
							myAudio.setVolume(vol);
							if (vol == 0) {
								myAudio.audioEle.muted = true;
								remote.volume.muted = true;
							} else {
								myAudio.audioEle.muted = false;
								remote.volume.muted = false;
							}
						break;

						case 'showLrc':
						if(data.isOpen == '1') {
							showLrc = true;
							var width = '302px';
							getLrcByAjax();
							$("#lrcWrapper").css('display', 'block').animate({'right': '+='+width}, 'slow');
							myAudio.lrcStatus = true;
						}else {
							showLrc = true;
							var width = '302px';
							$("#lrcWrapper").animate({'right': '-='+width}, 'slow', 'swing', function() {
								$("#lrcWrapper .lrcContent").css('margin-top', '0').empty();
							});
							myAudio.lrcStatus = false;
						}
						break;
					};
				});
				socket.on('disconnect',function() {
					$(".scanTipsLayer").empty();
					$(".scanTipsLayer").html("<h2 style='color: red;text-align: center;'>远程连接已断开</h2>").show(3000, function() {
						$(this).hide(500);
					});
				});
			}else if(playerID) {
				// 已生成二维码
				$("#qrcodeLayer div.layer-body-title").empty();
				$("#qrcodeLayer div.layer-body-title").html("<h3>请用手机扫二维码</h3>");

				$("#qrcodeLayer div.layer-body-content").empty();
				$("#qrcodeLayer div.layer-body-content").qrcode({width: 128,height: 128,text: "http://leolin.cc?playerID=" + remote.playerID});
				C("非初始化：http://leolin.cc?playerID=" + playerID);

				// $("#qrcodeLayer div.layer-body-content").qrcode({width: 128,height: 128,text: "http://localhost:3000?playerID=" + playerID});
				// C("非初始化：http://localhost:3000?playerID=" + playerID);
			}
		},
		volume: {
			value: 1,
			muted: myAudio.audioEle.muted,
			change: function() {
				myAudio.setVolume(this.value);
				if(!this.value) {
					myAudio.audioEle.muted = true;
					this.muted = true;
				}else {
					myAudio.audioEle.muted = false;
					this.muted = false;
				}
				clearTimeout(window.volumeTimer);
				window.volumeTimer = setTimeout(function() {
					if (socket) {
						socket.emit('control', {
							webID: webID,
							payerID: playerID,
							type: 'volume',
							volume: remote.volume.value
						});
					}
				}, 300);
			}
		}
	}

	myAudio.onTimeUpdateHandle = function() {
		var cur = myAudio.audioEle.currentTime,
			dur = myAudio.audioEle.duration;
		$(".slider-range").css('width', cur / dur * 100 + "%");
		$(".slider-handle").css('left', cur / dur * parseInt($("#progressSlider").width()) + "px");
		$(".current-time").text(myAudio.formatTime(cur));
		try {
			var buf = myAudio.audioEle.buffered.end(0);
			$(".slider-buffer").css('width', buf / dur * 100 + '%');
		} catch (error) {console.log("音频缓冲错误：" + error);}

		if(socket && webID && playerID) {
			if(showLrc!=false && myAudio.lrcData && myAudio.lrcStatus && myAudio.lrcLink != '') {
				var lrcWord = $("#lrcWrapper p.cur").html();
				if(lrcWord && lrcWord != '') {
					socket.emit('control', {type: 'lrc', lrcWord: lrcWord, webID: webID});
				}
			}else {
				socket.emit('control', {type: 'lrc', lrcWord: "没有歌词哦～", webID: webID});
			}
		}

		if(cur == dur) {
			myAudio.onEnded();
		}
		if (myAudio.lrcData && myAudio.lrcStatus && myAudio.lrcLink != '') {
			var words = myAudio.lrcData.words,
			times = myAudio.lrcData.times,
			length = times.length,
			i = myAudio.lrcStep,
			lrcContent = myAudio.lrcContent,
			curTime = cur * 1000 | 0;
			for (; i < length; i++) {
				var step = times[i];
				if (curTime > step && curTime < times[i + 1]) {
					var lrcTime = lrcContent.find('[data-lrctime="' + step + '"]');
					var lrctop = lrcTime.attr("data-lrctop");
					lrcContent.animate({
						"margin-top": lrctop + "px"
					}, 400).find("p.cur").removeClass("cur");
					lrcTime.addClass("cur");
					break;
				}
			}
		}
	}

	myAudio.onEndedHandle = function() {
		var mode = parseInt($(".play-mode li a.selected").attr('data-mode'));
		switch(mode) {
			case 0: 
			// local
			if(localMusic.currentID >= 0 && onlineMusic.currentID <= -1) {
				var oldIndex = localMusic.currentID;
				while((localMusic.currentID = parseInt(Math.random()*(localMusic.len-1)+0.5))==oldIndex);

				if(localMusic.array[localMusic.currentID].lrcLink == '') {
					getLrcLinkByAjax(localMusic.array[localMusic.currentID].songName, localMusic.array[localMusic.currentID].artistName);
				}

				myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
				readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
				
				// 远程
				remote.playing(localMusic.array[localMusic.currentID]);
			}else if(localMusic.currentID <= -1 && onlineMusic.currentID >= 0) {
				// online
				if(onlineMusic.currentID < onlineMusic.len) {
					if(onlineMusic.len > 1) {
						onlineMusic.currentID = parseInt(Math.random()*(onlineMusic.len-1)+0.5);
					}else if(onlineMusic.len == 1) {
						onlineMusic.currentID = 0;
					}
					myAudio.setSrc(onlineMusic.array[onlineMusic.currentID].songLink);
					myAudio.lrcLink = onlineMusic.array[onlineMusic.currentID].lrcLink;

					$(".title .artist").text(onlineMusic.array[onlineMusic.currentID].artistName);
					$(".title .songname").text(onlineMusic.array[onlineMusic.currentID].songName);

					// 远程
					remote.playing(onlineMusic.array[onlineMusic.currentID]);
				}else {
					C("不存在歌曲！");
				}
			}else if(FM.currentID >= 0) {
				FM.currentID++;
				if(FM.currentID > 9) {
					getFmByAjax(FM.curFm);
				}else {
					player.playOnlineMusic(FM.songList[FM.currentID], 'fm');
				}
			}
			break;

			case 1: 
			myAudio.setLoop();
			myAudio.play();
			break;

			case 2: 
			// local
			if(localMusic.currentID >= 0 && onlineMusic.currentID <= -1) {
				localMusic.currentID = ((localMusic.currentID+1) >= localMusic.len) ? 0 : (localMusic.currentID+1);

				if(localMusic.array[localMusic.currentID].lrcLink == '') {
					getLrcLinkByAjax(localMusic.array[localMusic.currentID].songName, localMusic.array[localMusic.currentID].artistName);
				}

				myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
				readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
				
				// 远程
				remote.playing(localMusic.array[localMusic.currentID]);
			}else if(localMusic.currentID <= -1 && onlineMusic.currentID >= 0) {
				// online
				onlineMusic.currentID = ((onlineMusic.currentID + 1) >= onlineMusic.len) ? 0 : (onlineMusic.currentID + 1);
				
				myAudio.setSrc(onlineMusic.array[onlineMusic.currentID].songLink);
				myAudio.lrcLink = onlineMusic.array[onlineMusic.currentID].lrcLink;

				$(".title .artist").text(onlineMusic.array[onlineMusic.currentID].artistName);
				$(".title .songname").text(onlineMusic.array[onlineMusic.currentID].songName);

				// 远程
				remote.playing(onlineMusic.array[onlineMusic.currentID]);
			}else if(FM.currentID >= 0) {
				FM.currentID++;
				if(FM.currentID > 9) {
					getFmByAjax(FM.curFm);
				}else {
					player.playOnlineMusic(FM.songList[FM.currentID], 'fm');
				}
			}
			break;
			default: break;
		}
		if(myAudio.lrcStatus) {
			getLrcByAjax();
		}
	};

	var player = {

		mode: parseInt($(".play-mode li a.selected").attr('data-mode')),

		playPre: function() {
			switch(this.mode) {
				case 0: 
				// local
				if(localMusic.currentID >= 0 && onlineMusic.currentID <= -1) {
					var oldIndex = localMusic.currentID;
					while((localMusic.currentID = parseInt(Math.random()*(localMusic.len-1)+0.5))==oldIndex);

					if(localMusic.array[localMusic.currentID].lrcLink == '') {
						getLrcLinkByAjax(localMusic.array[localMusic.currentID].songName, localMusic.array[localMusic.currentID].artistName);
					}

					myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
					readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
					
					// 远程
					remote.playing(localMusic.array[localMusic.currentID]);
				}else if(localMusic.currentID <= -1 && onlineMusic.currentID >= 0) {
					// online
					if(onlineMusic.currentID < onlineMusic.len) {
						if(onlineMusic.len > 1) {
							onlineMusic.currentID = parseInt(Math.random()*(onlineMusic.len-1)+0.5);
						}else if(onlineMusic.len == 1) {
							onlineMusic.currentID = 0;
						}
						myAudio.setSrc(onlineMusic.array[onlineMusic.currentID].songLink);
						myAudio.lrcLink = onlineMusic.array[onlineMusic.currentID].lrcLink;
						$(".title .artist").text(onlineMusic.array[onlineMusic.currentID].artistName);
						$(".title .songname").text(onlineMusic.array[onlineMusic.currentID].songName);
						
						// 远程
						remote.playing(onlineMusic.array[onlineMusic.currentID]);
					}else {
						C("不存在歌曲！");
					}
				}else if(FM.currentID >= 0) {
					FM.currentID++;
					if(FM.currentID > 9) {
						getFmByAjax(FM.curFm);
					}else {
						player.playOnlineMusic(FM.songList[FM.currentID], 'fm');
					}
				}
				break;
				
				case 1: 
				var src = myAudio.getSrc();
				if(src) {
					myAudio.setSrc(src);
					myAudio.play();
				}
				break;
				
				case 2: 
				// local
				if(localMusic.currentID >= 0 && onlineMusic.currentID <= -1) {
					localMusic.currentID = ((localMusic.currentID - 1) < 0) ? (localMusic.len - 1) : (localMusic.currentID - 1);
					
					if(localMusic.array[localMusic.currentID].lrcLink == '') {
						getLrcLinkByAjax(localMusic.array[localMusic.currentID].songName, localMusic.array[localMusic.currentID].artistName);
					}

					myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
					readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);

					// 远程
					remote.playing(localMusic.array[localMusic.currentID]);
				}else if(localMusic.currentID <= -1 && onlineMusic.currentID >= 0) {
					// online
					onlineMusic.currentID = ((onlineMusic.currentID - 1) < 0) ? (onlineMusic.len - 1) : (onlineMusic.currentID - 1);
					
					myAudio.setSrc(onlineMusic.array[onlineMusic.currentID].songLink);
					myAudio.lrcLink = onlineMusic.array[onlineMusic.currentID].lrcLink;
					$(".title .artist").text(onlineMusic.array[onlineMusic.currentID].artistName);
					$(".title .songname").text(onlineMusic.array[onlineMusic.currentID].songName);

					// 远程
					remote.playing(onlineMusic.array[onlineMusic.currentID]);
				}else if(FM.currentID >= 0) {
					FM.currentID++;
					if(FM.currentID > 9) {
						getFmByAjax(FM.curFm);
					}else {
						player.playOnlineMusic(FM.songList[FM.currentID], 'fm');
					}
				}
				break;
				default: break;
			}
			if(myAudio.lrcStatus) {
				getLrcByAjax();
			}
		},
		playNext: function() {
			// 随机，单曲，列表循环
			switch(this.mode) {
				case 0: 
				// local
				if(localMusic.currentID >= 0 && onlineMusic.currentID <= -1) {
					var oldIndex = localMusic.currentID;
					while((localMusic.currentID = parseInt(Math.random()*(localMusic.len-1)+0.5))==oldIndex);
					
					if(localMusic.array[localMusic.currentID].lrcLink == '') {
						getLrcLinkByAjax(localMusic.array[localMusic.currentID].songName, localMusic.array[localMusic.currentID].artistName);
					}

					myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
					readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);

					// 远程
					remote.playing(localMusic.array[localMusic.currentID]);
				}else if(localMusic.currentID <= -1 && onlineMusic.currentID >= 0) {
					// online
					if(onlineMusic.currentID < onlineMusic.len) {
						if(onlineMusic.len > 1) {
							onlineMusic.currentID = parseInt(Math.random()*(onlineMusic.len-1)+0.5);
						}else if(onlineMusic.len == 1) {
							onlineMusic.currentID = 0;
						}
						myAudio.setSrc(onlineMusic.array[onlineMusic.currentID].songLink);
						myAudio.lrcLink = onlineMusic.array[onlineMusic.currentID].lrcLink;
						$(".title .artist").text(onlineMusic.array[onlineMusic.currentID].artistName);
						$(".title .songname").text(onlineMusic.array[onlineMusic.currentID].songName);

						// 远程
						remote.playing(onlineMusic.array[onlineMusic.currentID]);
					}else {
						C("不存在歌曲！");
					}
				}else if(FM.currentID >= 0) {
					FM.currentID++;
					if(FM.currentID > 9) {
						getFmByAjax(FM.curFm);
					}else {
						player.playOnlineMusic(FM.songList[FM.currentID], 'fm');
					}
				}
				break;

				case 1: 
				var src = myAudio.getSrc();
				if(src) {
					myAudio.setSrc(src);
					myAudio.play();
				}
				break;

				case 2: 
				// local
				if(localMusic.currentID >= 0 && onlineMusic.currentID <= -1) {
					localMusic.currentID = ((localMusic.currentID+1) >= localMusic.len) ? 0 : (localMusic.currentID+1);
					
					if(localMusic.array[localMusic.currentID].lrcLink == '') {
						getLrcLinkByAjax(localMusic.array[localMusic.currentID].songName, localMusic.array[localMusic.currentID].artistname);
					}

					myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
					readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);

					// 远程
					remote.playing(localMusic.array[localMusic.currentID]);
				}else if(localMusic.currentID <= -1 && onlineMusic.currentID >= 0) {
					// online
					onlineMusic.currentID = ((onlineMusic.currentID + 1) >= onlineMusic.len) ? 0 : (onlineMusic.currentID + 1);
					myAudio.setSrc(onlineMusic.array[onlineMusic.currentID].songLink);
					myAudio.lrcLink = onlineMusic.array[onlineMusic.currentID].lrcLink;
					$(".title .artist").text(onlineMusic.array[onlineMusic.currentID].artistName);
					$(".title .songname").text(onlineMusic.array[onlineMusic.currentID].songName);

					// 远程
					remote.playing(onlineMusic.array[onlineMusic.currentID]);
				}else if(FM.currentID >= 0) {
					FM.currentID++;
					if(FM.currentID > 9) {
						FM.currentID = 0;
						getFmByAjax(FM.curFm);
					}else {
						player.playOnlineMusic(FM.songList[FM.currentID], 'fm');
					}
					remote.playing(FM.songList[FM.currentID]);
				}
				break;
				default: break;
			}
			if(myAudio.lrcStatus) {
				getLrcByAjax();
			}
		},
		playPause: function() {
			if(localMusic.currentID <= -1 && onlineMusic.currentID <= -1 && FM.currentID <= -1) {
				if(localMusic.len > 0) {
					localMusic.currentID = 0;

					if(localMusic.array[localMusic.currentID].lrcLink == '') {
						getLrcLinkByAjax(localMusic.array[localMusic.currentID].songName, localMusic.array[localMusic.currentID].artistname);
					}

					myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
					readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);

					remote.playing(localMusic.array[localMusic.currentID]);
				}else if(onlineMusic.len > 0) {
					onlineMusic.currentID = 0;
					myAudio.setSrc(onlineMusic.array[onlineMusic.currentID].songLink);
					myAudio.lrcLink = onlineMusic.array[onlineMusic.currentID].lrcLink;
					$(".title .artist").text(onlineMusic.array[onlineMusic.currentID].artistName);
					$(".title .songname").text(onlineMusic.array[onlineMusic.currentID].songName);

					remote.playing(onlineMusic.array[onlineMusic.currentID]);
				}
			}else {
				if(myAudio.audioEle.paused) {
					myAudio.play();	
				}else {
					myAudio.pause();
				}
			}
		},
		playOnlineMusic: function(obj) {
			var tt = "#leftPanel .play-btn .play-pause a";
			$(tt).children().removeClass('icon-play').addClass('icon-pause');
			$(tt).attr('title', '暂停');
			$(tt).parent().removeClass('play').addClass('pause');

			myAudio.setSrc(obj.songLink);
			myAudio.lrcLink = obj.lrcLink;

			$("#playTitle .title .songname").text(obj.songName);
			$("#playTitle .title .artist").text(obj.artistName);
			localMusic.currentID = -1
			onlineMusic.currentID = -1;
		}
	}

	// ajax返回歌词
	function getLrcByAjax() {
		$("#lrcWrapper.lrcContent").empty();
		
		if(myAudio.lrcLink == '') {
			$(".lrcContent").css('margin-top', '');
			$(".lrcContent").html("<p>没有结果哦！！</p>");
			return false;
		}
		// ajax
		$.ajax({
			url: myAudio.lrcLink,
			type: 'GET',
			dataType: 'text',
			success: function(res) {
				renderLrc(parseLrc(res));
				myAudio.lrcStatus = true;
			},
			statusCode: {
				404: function() {
					$(".lrcContent").html("<p>没有结果哦！！</p>");
				}
			},
			error: function(error) {
				$(".lrcContent").html("<p>没有结果哦！！</p>");
			}
		});
	}

	// ajax获取lrc地址
	function getLrcLinkByAjax(musicInfo) {
		if(musicInfo.lrcLink != '') return ;
		var target = arguments[1] ? arguments[1] : null;

		$.ajax({
			url: 'http://geci.me/api/lyric/' + musicInfo.songName + '/' + musicInfo.artistName,
			type: 'GET',
			dataType: 'json',
			success: function(res) {
				if(res.count > 0) {
					localMusic.array[localMusic.currentID].lrcLink = res.result[0].lrc.toString();
					var key = -1;
					$.indexedDB("localMusicDB").objectStore("musicList").each(function(item) {
						if(item.value.galleryId == musicInfo.galleryId && item.value.fullPath == musicInfo.fullPath) {
							key = item.key;
							return false;
						}
					}).done(function() {
						if(key != -1) {
							$.indexedDB("localMusicDB").objectStore("musicList").put(localMusic.array[localMusic.currentID], key).done(function() {
								if(target) {
									target.attr('data-lrc', localMusic.array[localMusic.currentID].lrcLink);
								}
								myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
							});
						}
					});
				}else {
					if(target) {
						target.attr('data-lrc', "");
					}
				}
			},
			error: function(error) {}
		});
	}
	// 打印错误信息
	function errorHandler(custom) {
		return function(e) {
			var msg = "";

			switch(e.code) {
				case FileError.QUOTA_EXCEEDED_ERR:
					msg = "QUOTA_EXCEEDED_ERR";
					break;
				case FileError.NOT_FOUND_ERR:
            		msg = 'NOT_FOUND_ERR';
            		break;
         		case FileError.SECURITY_ERR:
            		msg = 'SECURITY_ERR';
            		break;
         		case FileError.INVALID_MODIFICATION_ERR:
            		msg = 'INVALID_MODIFICATION_ERR';
            		break;
         		case FileError.INVALID_STATE_ERR:
            		msg = 'INVALID_STATE_ERR';
            		break;
         		default:
           	 		msg = 'Unknown Error';
            		break; 
			};
			console.log(custom + ": " + msg);
		};
	}

	function getFileType(filename) {
		var ext = filename.substr(filename.lastIndexOf('.') + 1).toLowerCase();
		if(audFormats.indexOf(ext) >= 0) {
			return 'audio';
		}else {
			return null;
		}
	}
	function addSong(name, id) {
   		var optGrp = document.createElement("optgroup");
   		optGrp.setAttribute("label",name);
   		optGrp.setAttribute("id", id);
   		document.getElementById("GalleryList").appendChild(optGrp);
   		return optGrp;
	}

	function addItem(index, item, parentNode) {
		if(!item)return ;

		var parentDiv = $("<div></div>");
		parentDiv.addClass('list-row');
		if(parseInt(index) % 2) {
			parentDiv.addClass('odd');
		}else {
			parentDiv.addClass('even');
		}

		// lrc
		parentDiv.attr('data-lrc', item.lrcLink);

		if(parentNode == "#SearchList" || parentNode == "#MyLikeList") {
			parentDiv.attr('data-src', item.songLink);
		}else {
			// local,recycle
			parentDiv.attr('data-fullpath', item.fullPath);
			parentDiv.attr('data-galleryid', item.galleryId);
		}
   		// col1
   		var childDiv0 = $("<div></div>");
   		childDiv0.addClass('list-cell c0');
   		childDiv0.append('<span class="list-songname">' + item.songName + '</span>');
   		parentDiv.append(childDiv0);
   		// col2
   		var childDiv1 = $("<div></div>");
   		childDiv1.addClass('list-cell c1');
   		childDiv1.append('<span class="list-songname">' + item.artistName + '</span>');
   		parentDiv.append(childDiv1);
   		// col3
   		var childDiv2 = $("<div></div>");
   		childDiv2.addClass('list-cell c2');
   		childDiv2.append('<span class="list-songname">' + item.albumName + '</span>');
   		parentDiv.append(childDiv2);
   		// like
		if(parentNode=="#SearchList") {
			var childLike = $("<div></div>");
			childLike.addClass('song-like');
			childLike.append('<span class="like"><i class="icon-heart"></i></span>')
   			parentDiv.append(childLike);
		}else if(parentNode != '#catMusicList'){
			var childDelete = $("<div></div>");
			childDelete.addClass('song-delete');
			childDelete.append('<span class="delete"><i class="icon-remove-2"></i></span>')
   			parentDiv.append(childDelete);	
		}
   		// 
   		if(parentNode=="#SearchList" || parentNode=="#MyLikeList") {
   			var childPlay = $("<div></div>");
			childPlay.addClass('song-add');
			childPlay.append('<span class="play"><i class="icon-play"></i></span>')
   			parentDiv.append(childPlay);
   		}else if(parentNode == "#GalleryList") {
   			var childPlay = $("<div></div>");
			childPlay.addClass('song-cat');
			childPlay.append('<span class="play"><i class="icon-hospital"></i></span>')
   			parentDiv.append(childPlay);
   		}
   		if(parentNode == "#RecycleList") {
   			var childRestore = $("<div></div>");
			childRestore.addClass('song-restore');
			childRestore.append('<span class="play"><i class="icon-restart"></i></span>')
   			parentDiv.append(childRestore);
   		}
   		$(parentNode).append(parentDiv);
	}

	function scanSongs(DOMFileSystem) {
		var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(DOMFileSystem);// Object

		console.log('正在扫描媒体库: ' + mData.name);

		mGalleryReader = DOMFileSystem.root.createReader();
		mGalleryReader.readEntries(scanSong, errorHandler('readEntries'));
	}

	// 递归扫描
	var count = 0;
	function scanSong(entries) {// FileEntry
		if(entries.length == 0) {
			if(mGalleryDirectories.length > 0) {
				var dir_entry = mGalleryDirectories.shift();
				console.log('扫描子目录: ' + dir_entry.fullPath);
				mGalleryReader = dir_entry.createReader();
				// 当前目录下还有目录则递归扫描
				mGalleryReader.readEntries(scanSong, errorHandler('readEntries'));
			}else {
				mGalleryIndex++;
				if(mGalleryIndex < mGalleryArray.length) {
					console.log('扫描下一首歌: ' + mGalleryArray[mGalleryIndex].name);
					scanSongs(mGalleryArray[mGalleryIndex]);
				}
			}
			return ;
		}
		for(var i = 0; i < entries.length; i++) {

			if(entries[i].isFile) {
				mGalleryArray[mGalleryIndex].root.getFile(entries[i].fullPath, {create: false}, function(fileEntry) {
					
					fileEntry.file(function(file) {
						var galleryId = chrome.mediaGalleries.getMediaFileSystemMetadata(fileEntry.filesystem).galleryId;
						var fullPath = fileEntry.fullPath;
						var blob = file.slice(0, file.size, 'MIME');

						var reader = new FileReader();
						reader.readAsBinaryString(blob);
						reader.onloadstart = function(e) {
							$(".scanTipsLayer").show();
							$(".scanTips").append("<span class='songname-tips'>" + file.name + "</span>");
						};
						reader.onprogress = function(e) {
							if(e.lengthComputable) {
								var percentLoaded = Math.round((e.loaded / e.total) * 100);
								var progress = $(".percent");
								if(percentLoaded <= 100) {
									progress.css('width', percentLoaded + '%');
								}
							}
						};
						reader.onloadend = function(e) {
							$(".scanTipsLayer").hide();
							var result =  e.target.result;
							// 获取mp3信息
							localMusicIndex++;
							localMusic.len = localMusicIndex;
							var musicInfo = Mp3.getMp3Info(galleryId, result, fullPath);
							$.indexedDB("localMusicDB").objectStore("musicList").add(musicInfo).done(function(res, event) {
								localMusic.array.push(musicInfo);
								addItem(localMusicIndex, musicInfo, "#GalleryList");
								recycleMusic.push({
									tag: musicInfo.galleryId.toString()+","+musicInfo.fullPath.toString(),
									id: parseInt(localMusicIndex)
								});
								if(localMusic.artist.indexOf(musicInfo.artistName) == -1) {
									localMusic.artist.push(musicInfo.artistName.toString());
									$(".singer-list").append('<div class="singer-list-row"><div class="singername"><span>'+musicInfo.artistName.toString()+'</span></div></div>');
								}
							});
						};
					});
				});
				////////////////////////////////////////////////////////////

			}else if(entries[i].isDirectory) {
				mGalleryDirectories.push(entries[i]);
			}else {
				console.log("Got something other than a file or directory.");
			}
		}

		mGalleryReader.readEntries(scanSong, errorHandler('readMoreEntries'));
	}

	// 从指定媒体库中读取某个文件并【播放】
	function readFileAsPath(galleryId, fullPath) {
		if(galleryId && fullPath) {
			if(localMusic.currentID < 0) return ;
			$(".title .artist").text(localMusic.array[localMusic.currentID].artistName);
			$(".title .songname").text(localMusic.array[localMusic.currentID].songName);
			var gallery = mGalleryArray[galleryId - 1];
			gallery.root.getFile(fullPath, {create: false}, function(fileEntry) {
				fileEntry.file(function(file) {
					var src = window.webkitURL.createObjectURL(file);
					myAudio.setSrc(src);
					myAudio.play();
				});
			});
		}else {
			console.error("readFileAsPath Error");
		}
	}

///////////////////////////////////////////////////////////////////////////////////////change

	function addItemList(obj, category) {
		if(category != "recycleMusic") {
			if(category == "localMusic") {
				obj.artist = [];
			}
			obj.array = [];
		}else {
			recycleMusic = [];
		}
		var cnt = 0;// 计数
		// 遍历数据库已存在歌曲（包括回收站）
		if(category == "localMusic") {
			$.indexedDB("localMusicDB").objectStore("musicList").each(function(item) {
				obj.array.push(item.value);
				addItem(cnt, item.value, "#GalleryList");
				cnt++;
			}).done(function() {
				// 遍历完成后回调函数
				// if(obj.artist.length) {
				// 	// 遍历歌手
				// 	obj.artist.forEach(function(item, index, arr) {
				// 		$(".singer-list").append('<div class="singer-list-row"><div class="singername"><span>'+item+'</span></div></div>');
				// 	});
				// }
				obj.len = cnt;
			});
		}else if(category == "onlineMusic") {
			$.indexedDB("onlineMusicDB").objectStore("musicList").each(function(item) {
				obj.array.push(item.value);
				addItem(cnt, item.value, "#MyLikeList");
				cnt++;
			}).done(function() {
				obj.len = cnt;
			});
		}else if(category == "recycleMusic") {
			$.indexedDB("onlineMusicDB").objectStore("musicList").each(function(item) {
				obj.push(item.value);
				addItem(cnt, item.value, "#RecycleList");
				cnt++;
			}).done(function() {});
		}
	}

	function addItem2Recycle() {
		var cnt = 0;
		$.indexedDB("recycleMusicDB").objectStore("musicList").each(function(item) {
			addItem(cnt, item.value, "#RecycleList");
			cnt++;
		}).done(function(res, event) {});
	}

	function getMusicInfo(results) {
		if(results.length) {
			var str = "<span>";
			results.forEach(function(item, index, arr) {
				var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(item);
				if(mData) {
					str += mData.name;
					str += "<br>";
				}
				str += "</span>";
			});	
			mGalleryArray = results;
			mGalleryIndex = 0;

			$("#openFileLayer .layer-body-content").html(str);
			$(".scan-btn").click(function(event) {
			 	return false;
			});
		}else {
			var str = "<span>没有任何音频文件夹哦～</span>";
			$("#openFileLayer .layer-body-content").html(str);
		}
	}

	// 
	function deleteMusicInLocalDB(galleryId, fullPath) {
		var musicInfo = null,
			idx = -1;
		// 删数据库
		$.indexedDB("localMusicDB").objectStore("musicList").each(function(item) {
			if(item.value.galleryId == galleryId && item.value.fullPath == fullPath) {
				musicInfo = item.value;
				idx = item.key;
				return false;
			}
		}).done(function(res, event) {
			if(idx!=-1) {
				$.indexedDB("localMusicDB").objectStore("musicList").delete(idx).done(function(res, event) {
					// 加进recycle数据库
					$.indexedDB("recycleMusicDB").objectStore("musicList").add(musicInfo).done(function(res, event) {
						addItem(0, musicInfo, "#RecycleList");
						// 加进recycle数组
						recycleMusic.push(musicInfo);
						// 删localMusic数组
						var id = -1;
						localMusic.array.forEach(function(item, index, arr) {
							if(item.galleryId == galleryId && item.fullPath == fullPath) {
								id = index;
								return false;
							}
						});
						if(id!=-1) {
							localMusic.len--;
							localMusic.array.splice(id, 1);
						}
					});
				});
			}
		});
	}

	// 返回recycleMusic的下标！
	function getIdFromTag(galleryId, fullPath) {
		var idx = -1;
		recycleMusic.forEach(function(item, index, arr) {
			if(item.tag == (galleryId+","+fullPath)) {
				idx = index;
				return false;
			}
		});
		return idx;
	}

	function addMusicFromRecycle(galleryId, fullPath) {
		var	idx = -1;

		// 删recycle数据库
		$.indexedDB("recycleMusicDB").objectStore("musicList").each(function(item) {
			if(item.value.galleryId == galleryId && item.value.fullPath == fullPath) {
				idx = item.key;
				return false;
			}
		}).done(function(res, event) {
			if(idx!=-1) {
				$.indexedDB("recycleMusicDB").objectStore("musicList").delete(idx).done(function(res, event) {
					// 删recycle数组
					recycleMusic.forEach(function(item, index, arr) {
						if(item.galleryId == galleryId && item.fullPath == fullPath) {
							// 添加进localDB
							$.indexedDB("localMusicDB").objectStore("musicList").add(item).done(function(res, event) {
								idx = index;
								localMusic.array.push(item);
								localMusic.len++;
								addItem(0, item, "#GalleryList");
							});
						}
					});
					// 删recycle数组
					if(idx!=-1) {
						recycleMusic.splice(idx, 1);
					}
				});
				idx = -1;
			}
		});
	}

	// 本地音乐数据库初始化
	function localDbInit() {
		$.indexedDB("localMusicDB", {
			version: 1,
			schema: {
				"1": function(tran) {
					var objStore = tran.createObjectStore("musicList", {
						autoIncrement: true
					});
					objStore.createIndex("artistName");
					objStore.createIndex("albumName");
					objStore.createIndex("songName");
					objStore.createIndex("galleryId");
				}
			}
		}).done(function() {});
	}

	// 在线音乐数据库初始化
	function onlineDbInit() {
		$.indexedDB("onlineMusicDB", {
			version: 1,
			schema: {
				"1": function(tran) {
					var objStore = tran.createObjectStore("musicList", {
						autoIncrement: true
					});
					objStore.createIndex("artistName");
					objStore.createIndex("albumName");
					objStore.createIndex("songName");
				}
			}
		}).done(function() {});
	}

	// 回收站音乐数据库初始化
	function recycleDbInit() {
		$.indexedDB("recycleMusicDB", {
			version: 1,
			schema: {
				"1": function(tran) {
					var objStore = tran.createObjectStore("musicList", {
						autoIncrement: true
					});
				}
			}
		}).done(function() {});
	}

	// 本地歌曲类别数据库初始化
	function categoryDbInit() {
		$.indexedDB("categoryDB", {
			version: 1,
			schema: {
				"1": function(tran) {
					var objStore = tran.createObjectStore("categoryList", {
						autoIncrement: true
					});
					objStore.createIndex("id");
				}
			}
		});
	}

	function getLocalMusicID(obj) {
		var id = -1;
		localMusic.array.forEach(function(item, index, arr) {
			if(cmpLocalMusicObj(obj, item)) {
				id = index;
				return false;
			}
		});
		return id;
	}

	function getOnlineMusicID(obj) {
		var id = -1;
		onlineMusic.array.forEach(function(item, index, arr) {
			if(cmpOnlineMusicObj(obj, item)) {
				id = index;
				return false;
			}
		});
		return id;
	}

	function deleteInRecycle(galleryId, fullPath) {
		var idx = -1;
		$.indexedDB("recycleMusicDB").objectStore("musicList").each(function(item) {
			if(item.value.galleryId == galleryId && item.value.fullPath == fullPath) {
				idx = item.key;
				return false;
			}
		}).done(function(res, event) {
			if(idx!=-1) {
				// 删recycle数据库
				$.indexedDB("recycleMusicDB").objectStore("musicList").delete(idx).done(function(res, event) {
					var id
					recycleMusic.forEach(function(item, index, arr) {
						if(item.galleryId == galleryId && item.fullPath == item.fullPath) {
							id = index;
							return false;
						}
					});
					if(id != -1) {
						// 删recycle数组
						recycleMusic.splice(id ,1);
					}
				});
			}
		});
	}

	///////////////////////////// app初始化开始 /////////////////////////////
	var init = function() {
		$("#local").addClass('menu-active');
		$("#onlineBody").hide();
		$("#leftCol2-songList").show();
		$("#leftCol2-singerList").hide();
		$("#leftCol2-recycleList").hide();
		$(".shade").hide();
		$(".layer").hide();
		$(".scanTipsLayer").hide();
		chrome.mediaGalleries.getMediaFileSystems({
			interactive: "no"
		}, getMusicInfo);
		// $.indexedDB("localMusicDB").deleteDatabase();
		// $.indexedDB("onlineMusicDB").deleteDatabase();
		// $.indexedDB("recycleMusicDB").deleteDatabase();
		// $.indexedDB("categoryDB").deleteDatabase();
		// 本地歌曲数据库
		localDbInit();
		$.indexedDB("localMusicDB").objectStore("musicList").count().done(function(res, event) {
			if(res == 0) {
				C("Add songs please!");
			}else {
				addItemList(localMusic, "localMusic");
			}
		});
		// 在线歌曲数据库
		onlineDbInit();
		$.indexedDB("onlineMusicDB").objectStore("musicList").count().done(function(res, event) {
			if(res == 0) {
				C("没有在线歌曲!");
			}else {
				addItemList(onlineMusic, "onlineMusic");
			}
		});
		// 回收站数据库
		recycleDbInit();
		$.indexedDB("recycleMusicDB").objectStore("musicList").count().done(function(res, event) {
			if(res == 0) {
				C("没有回收站歌曲～");
			}else {
				addItemList(recycleMusic, "recycleMusic");
			}
		});
		// 歌曲类别数据库
		categoryDbInit();
		$.indexedDB("categoryDB").objectStore("categoryList").each(function(item) {
			$("#toggle ul").append(
				"<li data-catid="+item.value.id+"><p class='cat-list-name'>"+item.value.name+"</p><input type='text' class='edit-name' id='editName_"+item.value.id+"' value='"+item.value.name+"' style='display: none;'><div class='edit-icons' style='display: none;'><a hidefocus='true' class='edit-change'><i class='icon-edit'></i></a><a hidefocus='true' class='edit-delete'><i class='icon-remove-2'></i></a></div></li>"
			);
		}).done();
	}();

	// 本地音乐和在线音乐标签切换
	$("#local,#online").click(function(event) {
		$(this).addClass('menu-active').siblings().removeClass('menu-active');
		var menuID = $(this).attr('id');
		$("#"+menuID+"Body").show().siblings().hide();
		if(menuID=="online") {
			$("#popular").addClass('list-active').siblings().removeClass('list-active');
			$("#leftCol2-popular").show().siblings().hide();
		}
	});

	// 本地音乐细分标签切换
	$(".leftbar-outer > div").click(function(event) {
		var tabID = $(this).attr('id');
		if(tabID == 'toggle') return false;
		$(this).addClass('list-active').siblings().removeClass('list-active');
		if(tabID == 'allSong') {
			$("#toggle").slideToggle(400);
		}else {
			$("#leftCol2-"+tabID).show().siblings().hide();
			if(tabID == "recycleList") {
				$("#RecycleList").empty();
				addItem2Recycle();
			}
		}
	});

	$("#toggle").on('click', 'li', function(event) {
		event.preventDefault();
		var listID = $(this).attr('id');
		$(".leftbar-outer > div#allSong").addClass('list-active').siblings().removeClass('list-active');
		$("#leftCol2-"+listID).show().siblings().hide();
	});

	$("#toggle").on('mouseenter', 'li', function(event) {
		event.preventDefault();
		$(this).children('.edit-icons').show();
	});

	$("#toggle").on('mouseleave', 'li', function(event) {
		event.preventDefault();
		$(this).children('.edit-icons').hide();
	});

	$("#addCat").on('click', 'p', function(event) {
		event.preventDefault();
		$(this).hide();
		$("#addCat input").show().focus();
	});

	// “新建歌单”失去焦点
	$("#addCat input").blur(function(event) {
		$(this).hide();
		$("#addCat p").show();
	});

	$("#addCat input").on('keydown', function(event) {
		var keyCode = event.keyCode;
		switch(keyCode) {
			case 27: // Esc
				$("#addCat input").hide();
				$("#addCat p").show();
				$("#addCat input").val('我的歌单');
			break;

			case 13: // Enter
				var val = $.trim($("#addCat input").val());
				if(val && val != '') {
					var catID = getRandomString(6);
					$.indexedDB("categoryDB").objectStore("categoryList").add({id: catID, name: val}).done(function() {
						$("#toggle ul").append(
							"<li data-catid="+catID+"><p class='cat-list-name'>"+val+"</p><input type='text' class='edit-name' id='editName_"+catID+"' value='"+val+"' style='display: none;'><div class='edit-icons' style='display: none;'><a hidefocus='true' class='edit-change'><i class='icon-edit'></i></a><a hidefocus='true' class='edit-delete'><i class='icon-remove-2'></i></a></div></li>"
						);
						$("#addCat input").hide();
						$("#addCat p").show();
						$("#addCat input").val('我的歌单');
					});
				}
			break;
		};
	});

	// 点击修改
	$("#toggle").on('click', '.edit-change', function(event) {
		event.preventDefault();
		var _this = $(this);
		_this.parent().siblings('.cat-list-name').css('display', 'none');
		_this.parent().siblings('.edit-name').css('display', 'block');
	});

	// 当前焦点input修改
	$("#toggleList").on('focus', 'li input', function(event) {
		event.preventDefault();
		var id = $(this).attr('id');
		$("#toggleList").on('keydown', "#"+id, function(e) {
			var keyCode = e.keyCode,
				catID = id.slice(9);// 获取类别id
			var _this = $(this);
			switch(keyCode){
				case 27:// Esc
					_this.hide();
					_this.siblings('p').show();
				break;

				case 13:// Enter
					var val = $.trim($(this).val());
					if(val && val != '') {
						var key = null;
						$.indexedDB("categoryDB").objectStore("categoryList").each(function(item) {
							if(item.value.id == catID) {
								key = item.key;
								return false;
							}
						}).done(function() {
							if(key) {
								$.indexedDB("categoryDB").objectStore("categoryList").put({id: catID, name: val}, key).done(function() {
									_this.attr('value', val).hide();
									_this.siblings('p').text(val).show();
								});
							}
						});
					}
				break;
			};
		});
	});

	// 当前焦点input失去焦点
	$("#toggleList").on('blur', 'li input', function(event) {
		event.preventDefault();
		$(this).hide();
		$(this).siblings('p').show();
	});

	// 点击添加类别
	$("#GalleryList").on('click', '.song-cat', function(event) {
		event.preventDefault();
		var top = $(this).offset().top+10,
			left = $(this).offset().left+25,
			maxHeight = $(document).height()*0.4,
			_this = $(this).parent('div');
		var dom = $("#catPop ul"),
			cnt = 0;
			dom.empty();
		$.indexedDB("categoryDB").objectStore("categoryList").each(function(item) {
			cnt++;
			dom.append('<li id="catList_'+item.value.id+'"><a hidefocus="true">'+item.value.name+'</a></li>');
		}).done(function() {
			if(cnt > 0) {
				var h = cnt*31 >= maxHeight ? maxHeight : cnt*31;
				var fullPath = _this.attr('data-fullpath'),
					galleryId = _this.attr('data-galleryid');
				dom.attr({
					'data-fullpath': fullPath,
					'data-galleryid': galleryId
				});
				if(top + h >= $(document).height()) {
					$("#catPop").css({
						'top': top-h+"px",
						'left': left+"px"
					}).show();
				}else {
					$("#catPop").css({
						'top': top+"px",
						'left': left+"px"
					}).show();
				}
			}
		});
	});

	// 类别列表弹出
	$("#catPop").on('click', 'ul li', function(event) {
		event.preventDefault();
		var catID = $(this).attr('id').slice(8),
			galleryId = $(this).parent('ul').attr('data-galleryid'),
			fullPath = $(this).parent('ul').attr('data-fullpath');
		var key = null,
			musicInfo = null;
		$.indexedDB("localMusicDB").objectStore("musicList").each(function(item) {
			if(item.value.galleryId == galleryId && item.value.fullPath == fullPath) {
				key = item.key;
				musicInfo = item.value;
				return false;
			}
		}).done(function() {
			if(key && musicInfo) {
				musicInfo.catID = catID;
				$.indexedDB("localMusicDB").objectStore("musicList").put(musicInfo, key).done(function() {
					$("#catPop").hide();
					$("#catPop ul").empty();
				});
			}
		});
	});

	// 删除类别
	$("#toggle").on('click', '.edit-delete', function(event) {
		event.preventDefault();
		var _this = $(this);
		var catID = _this.parent().parent('li').attr('data-catid'),
			idx = null;
		$.indexedDB("categoryDB").objectStore("categoryList").each(function(item) {
			if(item.value.id == catID) {
				idx = item.key;
				return false;
			}
		}).done(function() {
			if(idx) {
				$.indexedDB("categoryDB").objectStore("categoryList").delete(idx).done(function() {
					// TODO:这里还要删除该类别的歌曲
					_this.parent().parent('li').remove();
				});
			}
		});
	});

	// 显示该类别歌曲
	$("#toggleList").on('click', 'li', function(event) {
		event.preventDefault();
		var catID = $(this).attr('data-catid'),
			cnt = 0;
		if($(this).attr('id') == 'songList') {
			$("#leftCol2-songList").show().siblings().hide();
		}else {
			$("#catMusicList").empty();
			$.indexedDB("localMusicDB").objectStore("musicList").each(function(item) {
				if(item.value.catID == catID) {
					addItem(cnt, item.value, "#catMusicList");
					cnt++;
				}
			}).done(function() {
				if(!cnt) {
					$("#catMusicList").html('<h3>没有歌曲哦～</h3>')
				}
				$("#leftCol2-cat").show().siblings().hide();
			});
		}
	});


	// 打开文件点击事件
	$("#openFile").click(function(event) {

		chrome.mediaGalleries.getMediaFileSystems({
			interactive: "if_needed"
		}, getMusicInfo);

		$(".shade").show();
		$("#openFileLayer").show('slow');
	});

	$("#addBtn").click(function(event) {
		chrome.mediaGalleries.getMediaFileSystems({
			interactive: "yes"
		}, getMusicInfo);
	});

	$("#scanBtn").click(function(event) {
		if(mGalleryArray.length > 0) {
			scanSongs(mGalleryArray[0]);// DOMFileSystem of Array
		}
		$(".shade").hide();
		$(".layer").hide();
	});

	$(".cancel-btn").click(function(event) {
		$(".shade").hide();
		$(".layer").hide();
	});

	$("#leftCol2-songList, #leftCol2-singerList, #leftCol2-search-result, #leftCol2-mylike, #catMusicList").on('dblclick', '.list-row',function(event) {
		event.preventDefault();
		if($('#fm-playing').length > 0){
			$("#fm-playing").remove();
		}
		myAudio.lrcLink = '';
		// online
		if($(this).parent('#SearchList').length > 0 || $(this).parent('#MyLikeList').length > 0) {
			player.playOnlineMusic({
				songLink: $(this).attr('data-src'),
				lrcLink: $(this).attr('data-lrc'),
				songName: $(':nth-child(1) .list-songname', this).text(),
				artistName: $(':nth-child(2) .list-songname', this).text()
			});
			var musicInfo = {
				songName: $(this).children('div.list-cell.c0').text(),
				artistName: $(this).children('div.list-cell.c1').text(),
				albumName: $(this).children('div.list-cell.c2').text(),
				songLink: $(this).attr('data-src'),
				lrcLink: $(this).attr('data-lrc')
			};
			if($(this).parent('#MyLikeList')) {
				onlineMusic.currentID = getOnlineMusicID(musicInfo);
				localMusic.currentID = -1;// 标记本地音乐不播放
			}
			if(myAudio.lrcStatus) {
				getLrcByAjax();
			}
			// 远程
			remote.playing(musicInfo);
		}else {// local
			var tt = ".play-btn .play-pause a";
			$(tt).children().removeClass('icon-play').addClass('icon-pause');
			$(tt).attr('title', '暂停');
			$(tt).parent().removeClass('play').addClass('pause');
			var musicInfo = {
				songName: $(this).children('div.list-cell.c0').text(),
				artistName: $(this).children('div.list-cell.c1').text(),
				galleryId: $(this).attr('data-galleryid'),
				lrcLink: $(this).attr('data-lrc'),
				fullPath: $(this).attr('data-fullpath')
			},
			_this = $(this);

			localMusic.currentID = getLocalMusicID(musicInfo);
			onlineMusic.currentID = -1; // 标记在线音乐不播放
			if($(this).attr('data-lrc') == '') {
				getLrcLinkByAjax(musicInfo, _this);
			}else {
				myAudio.lrcLink = $(this).attr('data-lrc');
			}
			if(myAudio.lrcStatus) {
				getLrcByAjax();
			}

			readFileAsPath($(this).attr('data-galleryid'), $(this).attr('data-fullpath'));

			// 远程
			remote.playing(musicInfo);
			$(".title .songname").text($(':nth-child(1) .list-songname', this).text());
			$(".title .artist").text($(':nth-child(2) .list-songname', this).text());
		}
	});

	$("ul").on('click', '.pause .ctrl-btn', function(event) {
		event.preventDefault();
		$(this).children().removeClass('icon-pause').addClass('icon-play');
		$(this).attr('title', '播放');
		$(this).parent().removeClass('pause').addClass('play');
		myAudio.pause();
	});

	$("ul").on('click', '.play .ctrl-btn', function(event) {
		event.preventDefault();
		$(this).children().removeClass('icon-play').addClass('icon-pause');
		$(this).attr('title', '暂停');
		$(this).parent().removeClass('play').addClass('pause');
		myAudio.play();
	});

	$(document).on('keydown', function(event) {
		if(event.keyCode == 32) { // space
			if(!$("input").is(':focus')) {
				event.preventDefault();
				var tt = ".play-btn .play-pause a";
				if($(".play-btn .play-pause").hasClass('pause')) {
					$(tt).children().removeClass('icon-pause').addClass('icon-play');
					$(tt).attr('title', '播放');
					$(tt).parent().removeClass('pause').addClass('play');
					myAudio.pause();	
				}else {
					if(localMusic.currentID <= -1 && onlineMusic.currentID <= -1) {
						$(tt).children().removeClass('icon-play').addClass('icon-pause');
						$(tt).attr('title', '暂停');
						$(tt).parent().removeClass('play').addClass('pause');
						player.playPause();
					}else {
						$(tt).children().removeClass('icon-play').addClass('icon-pause');
						$(tt).attr('title', '暂停');
						$(tt).parent().removeClass('play').addClass('pause');
						myAudio.play();
					}
				}
			}
		}else if(event.keyCode == 37) { // 左箭头
			if(!$("input").is(':focus')) {
				player.playPre();
			}
		}else if(event.keyCode == 39) { // 右箭头
			if(!$("input").is(':focus')) {
				player.playNext();
			}
		}else if(event.keyCode == 38) { // 上箭头
			event.preventDefault();
			var vol = $(".vol-slider-range").css('width') === "0px" ? 0 : (parseInt($(".vol-slider-range").css('width')) / parseInt($(".vol-slider-wrapper").width()));
			myAudio.setVolume(vol+0.1);
		}else if(event.keyCode == 40) { // 下箭头
			event.preventDefault();
			var vol = $(".vol-slider-range").css('width') === "0px" ? 0 : (parseInt($(".vol-slider-range").css('width')) / parseInt($(".vol-slider-wrapper").width()));
			myAudio.setVolume(vol-0.1);
		}else if(event.keyCode == 27){ // Esc
			event.preventDefault();
			if($("#catPop").css('display') == 'block') {
				$("#catPop").hide();
				$("#catPop ul").empty();
			}
			// if(chrome.app.window.current().isFullscreen()) {
			// 	$(".widget .fullscreen .ctrl-btn").attr('title', '全屏');
			// 	chrome.app.window.current().restore();
			// }else {
			// 	$(".widget .fullscreen .ctrl-btn").attr('title', '退出全屏');
			// }
		}
	});

	// 上一首
	$("ul").on('click', '.prev .ctrl-btn', function(event) {
		event.preventDefault();
		player.playPre();
	});

	// 下一首
	$("ul").on('click', '.next .ctrl-btn', function(event) {
		event.preventDefault();
		player.playNext();
	});

	$("#progressSlider").drag({
	 	parent: ".panel",
		handler: ".slider-handle",
	 	range: ".slider-range",
	 	bar: ".slider-bar",
		X: true,
		maxLeft: parseInt($(".slider-bar").offset().left),
		maxRight: parseInt($(".slider-bar").offset().left) + parseInt($(".slider-bar").width()),
		callback: function() {
			var percent = $(".slider-range").css('width') === "0px" ? 0 : parseInt($(".slider-range").css('width')) / parseInt($(".slider-bar").width());
			myAudio.setCurrentTime(percent);
		}
	});

	$("#progressSlider").on('click', function(event) {
		event.preventDefault();
		var left = parseInt($(".slider-bar").offset().left),
			width = parseInt($(".slider-bar").width());

		if(event.pageX < left || event.pageX > (left + width)) return false;
		var percent = (event.pageX - left) / width;
		myAudio.setCurrentTime(percent);
	});
	
	$(".vol-slider-wrapper").drag({
		parent: "#volumeWrapper",
		handler: ".vol-slider-handle",
		range: ".vol-slider-range",
		bar: "#volSlider",
		X: true,
		maxLeft: parseInt($(".vol-slider-wrapper").offset().left),
		maxRight: parseInt($(".vol-slider-wrapper").offset().left) + parseInt($(".vol-slider-wrapper").width()),
		callback: function() {
			var vol = $(".vol-slider-range").css('width') === "0px" ? 0 : (parseInt($(".vol-slider-range").css('width')) / parseInt($(".vol-slider-wrapper").width()));
			myAudio.setVolume(vol);
		}
	});

	$("#volumeWrapper").on('click', function(event) {
		event.preventDefault();
		var left = parseInt($("#volSlider").offset().left),
			width = parseInt($("#volSlider").width());
		if(event.pageX < left || event.pageX > (left + width)) return false;
		var vol = (event.pageX - left) / width;
		myAudio.setVolume(vol);
	});

	$("#volumeWrapper").on('click', "a i.icon-mute",function(event) {
		event.preventDefault();
		myAudio.setVolume(0.5);
	});

	$("#volumeWrapper").on('click', "a i.icon-volume-down,a i.icon-volume-up",function(event) {
		event.preventDefault();
		myAudio.setVolume(0);
	});

	$("ul.play-mode li").on('click', 'a', function(event) {
		event.preventDefault();
		if(!$(this).hasClass('selected')) {
			$("ul.play-mode li a.selected").removeClass('selected');
			$(this).addClass('selected');
		}
	});

	$(".singer-list").on('click', '.singer-list-row', function(event) {
		event.preventDefault();
		var singer = $(this).children('.singername').text();
		$("#singerListViewport").empty();
		$.indexedDB("localMusicDB").objectStore("musicList").index("artist").each(function(item) {
			$("#singerListViewport").append('<div class="list-row even" data-fullpath="'+item.value.fullPath
				+'" data-galleryid="'+item.value.galleryId
				+'"><div class="list-cell c0"><span class="list-songname">'+item.value.title
				+'</span></div><div class="list-cell c1"><span class="list-songname">'
				+item.value.albumName
				+'</span></div></div>');
		}, singer).done(function(res, event) {});
	});

	// 把歌曲放到回收站
	$("#leftCol2-songList,#leftCol2-singerList").on('click', '.song-delete', function(event) {
		event.preventDefault();
		var gID = $(this).parent('.list-row').attr('data-galleryid');
		var fullPath = $(this).parent('.list-row').attr('data-fullpath');
		deleteMusicInLocalDB(gID, fullPath);
		$(this).parent('.list-row').remove();
	});

	// 彻底删除
	$("#RecycleList").on('click', '.song-delete', function(event) {
		event.preventDefault();
		var gID = $(this).parent('.list-row').attr('data-galleryid');
		var fullPath = $(this).parent('.list-row').attr('data-fullpath');
		deleteInRecycle(gID, fullPath);
		$(this).parent('.list-row').remove();
	});

	// 恢复回收站歌曲
	$("#RecycleList").on('click', '.song-restore', function(event) {
		event.preventDefault();
		var gID = $(this).parent('.list-row').attr('data-galleryid');
		var fullPath = $(this).parent('.list-row').attr('data-fullpath');
		addMusicFromRecycle(gID, fullPath);
		$(this).parent('.list-row').remove();
	});

	// 全屏
	$(".widget").on('click', '.fullscreen', function(event) {
		event.preventDefault();
		if(chrome.app.window.current().isFullscreen()) {
			$(this).children('a').attr('title', '全屏');
			chrome.app.window.current().restore();
		}else {
			$(this).children('a').attr('title', '退出全屏');
			chrome.app.window.current().fullscreen()
		}
	});

	// 搜索框
	$("#menu ul").on('keyup', '#search input', function(event) {
		var keyword = $(this).val();
		$.ajax({
			url: 'http://song4u.sinaapp.com/api/search.php?keyword='+keyword,
			type: 'GET',
			dataType: 'json',
			success: function(res) {
				$("#menu ul #online").addClass('menu-active').siblings().removeClass('menu-active');
				$("#leftCol2 .leftbar-outer #search-result").addClass('list-active').siblings().removeClass('list-active');
				$("#SearchList").empty();
				$("#onlineBody").show().siblings().hide();
				$("#leftCol2-search-result").show().siblings().hide();
				if(!res.songs.length) return false;
				res.songs.forEach(function(item, index, arr) {
					if(item.lrcLink) item.lrcLink = 'http://ting.baidu.com'+item.lrcLink;
					addItem(index, item, "#SearchList");
				});
			},
			error: function(error) {}
		});
	});

	// 在线歌曲添加/删除红心
	$(".list-viewport").on('click', '.song-like', function(event) {
		event.preventDefault();
		$(this).toggleClass('song-like-active');

		var musicInfo = {
			songName: $(this).siblings('div.list-cell.c0').text(),
			artistName: $(this).siblings('div.list-cell.c1').text(),
			albumName: $(this).siblings('div.list-cell.c2').text(),
			songLink: $(this).parent().attr('data-src'),
			lrcLink: $(this).parent().attr('data-lrc')
		};

		// 添加红心
		if($(this).hasClass('song-like-active')) {
			var exist = false;
			$.indexedDB("onlineMusicDB").objectStore("musicList").each(function(item) {
				if(cmpOnlineMusicObj(item.value, musicInfo)) {
					exist = true;
					return false;
				}
			}).done(function() {
				if(!exist) {
					$.indexedDB("onlineMusicDB").objectStore("musicList").add(musicInfo).done(function() {
						var index = onlineMusic.len;
						addItem(index, musicInfo, "#MyLikeList");
						onlineMusic.array.push(musicInfo);
						onlineMusic.len++;
					});
				}else {
					C("已存在不能重复添加！");
				}
			});
		}
	});
	
	$("#MyLikeList").on('click', '.song-delete', function(event) {
		event.preventDefault();
		var musicInfo = {
			songName: $(this).siblings('div.list-cell.c0').text(),
			artistName: $(this).siblings('div.list-cell.c1').text(),
			albumName: $(this).siblings('div.list-cell.c2').text(),
			songLink: $(this).parent().attr('data-src'),
			lrcLink: $(this).parent().attr('data-lrc')
		};
		var exist = false,
			_this = $(this),
			idx = -1;

		$.indexedDB("onlineMusicDB").objectStore("musicList").each(function(item) {
			if(cmpOnlineMusicObj(item.value, musicInfo)) {
				exist = true;
				idx = item.key;
				return false;
			}
		}).done(function() {
			if(exist && idx != -1) {
				$.indexedDB("onlineMusicDB").objectStore("musicList").delete(idx).done(function(res, event) {
					_this.parent('.list-row').remove();
					var id = getOnlineMusicID(musicInfo);
					if(id>=0) {
						onlineMusic.array.splice(id, 1);
						onlineMusic.len--;
					}
				});
			}else {
				C("不存在怎么能删除呢～");
			}
		});
	});

	$(".widget").on('click', '.lrc', function(event) {
		event.preventDefault();
		var width = '302px';
		// 关闭歌词
		if(myAudio.lrcStatus) {
			$("#lrcWrapper").animate({'right': '-='+width}, 'slow', 'swing', function() {
				$("#lrcWrapper .lrcContent").css('margin-top', '0').empty();
			});
			myAudio.lrcStatus = false;
			if(webID && playerID && socket) {
				socket.emit('control', {type: 'showLrc', playerID: playerID, webID: webID, isOpen: '0'});
				showLrc = false;
			}
		}else {
			// 开启歌词
			getLrcByAjax();
			$("#lrcWrapper").css('display', 'block').animate({'right': '+='+width}, 'slow');
			myAudio.lrcStatus = true;
			if(webID && playerID && socket) {
				socket.emit('control', {type: 'showLrc', webID: webID, isOpen: '1'});
				showLrc = true;
			}
		}
	});

	// 二维码
	$("#menu").on('click', '#QRCode', function(event) {
		event.preventDefault();
		$(".shade").show();
		$("#qrcodeLayer").show('slow');
		$("#qrcodeLayer div.layer-body-title").html("<h4>正在获取二维码......</h4>");
		$("#qrcodeLayer div.layer-body-content").empty();
		remote.handle();
	});

	// 比较localMusic对象
	function cmpLocalMusicObj(obj1, obj2) {
		if(obj1.fullPath == obj2.fullPath && obj1.galleryId == obj2.galleryId) {
			return true;
		}else {
			return false;
		}
	}

	// 比较onlineMusic对象
	function cmpOnlineMusicObj(obj1, obj2) {
		if(obj1.songName == obj2.songName 
			&& obj1.artistName == obj2.artistName
			&& obj1.albumName == obj2.albumName
			&& obj1.songLink.substring(0, obj1.songLink.indexOf("?")) == obj2.songLink.substring(0, obj2.songLink.indexOf("?"))
		) {
			return true;
		}else {
			return false;
		}
	}

	// 解析歌词
	function parseLrc(lrc) {
		var e = lrc.split(/[\r\n]/),
		g = e.length,
		j = {},
		b = [],
		c = 0;
		var l = {
			ti: "",
			ar: "",
			al: ""
		};
		for (; c < g;) {
			var k, d = true,
			h = decodeURIComponent(e[c]),
			a = h.replace(/\[\d*:\d*((\.|\:)\d*)*\]/g, "");
			"ti ar al".replace(/\S+/g, function(i) {
				if (d && l[i] === "") {
					k = h.match(new RegExp("\\[" + i + "\\:(.*?)\\]"));
					if (k && k[1]) {
						d = false;
						l[i] = k[1];
					}
				}
			});
			if (a.length === 0) {
				a = " …… ";
			}
			h.replace(/\[(\d*):(\d*)([\.|\:]\d*)*\]/g, function() {
				var i = arguments[1] | 0,
				m = arguments[2] | 0,
				o = i * 60 + m,
				n = b.push(o * 1000);
				j[b[--n]] = a.trim();
			});
			c++;
		}
		b.sort(function(m, i) {
			return m - i;
		});
		return {
			words: j,
			times: b,
			data: l
		};
	}

	// 生成歌词
	function renderLrc(m) {
		$("#lrcWrapper .lrcContent").empty();
		myAudio.lrcData = m;
		var words = m.words,
		times = m.times,
		data = m.data,
		b = 40;

		var timeLength = times.length,
		i = 0,
		str = "",
		top = parseInt($("#lrcWrapper").height()/2),
		e = null;
		if (times.length == 0) {
			return;
		}
		for (; i < timeLength; i++) {
			var step = times[i],
			l = words[step];
			if (step != e) {
				str += '<p data-lrctime="' + step + '" data-lrctop="' + top + '">' + l + "</p>";
				top -= b;
			}
			e = step;
		}
		$(".lrcContent").html(str);
		$(".lrcContent").css('margin-top', '280px');
		$(".lrcContent").children(':first-child').addClass('cur');
	}

	function getRandomString(len) {
		var str = '0123456789qwertyuioplkjhgfdsazxcvbnm';
		var result = '';
		var strLength = str.length;
		for(var i = 0; i < len; i++) {
			var stringLength = Math.random() * strLength;
			result += str.charAt(Math.ceil(stringLength) % str.length);
		}
		return result;
	}

	$("#leftCol2-fm").on('dblclick', '.other-list-row', function(event) {
		event.preventDefault();
		FM.curFm = $(this).attr('data-link');
		if($('#fm-playing').length <= 0 && $(this).children('span:first-child').attr('id') != 'fm-playing') {
			$(this).prepend('<span id="fm-playing"><i class="icon-note"></i></span>');
		}else if($('#fm-playing').length > 0){
			$("#fm-playing").remove();
			$(this).prepend('<span id="fm-playing"><i class="icon-note"></i></span>');
		}
		getFmByAjax(FM.curFm);
	});
	
	function getFmByAjax(link) {
		var arr = [];
		$.ajax({
			url: link+"&xx="+new Date().getTime(),
			type: 'GET',
			dataType: 'json',
			success: function(res) {
				var len = (res.list.length >= 10) ? 10 : res.list.length;
				for (var i = 0; i < len; i++) {
					arr.push(res.list[i].id);
				};
				if(arr.length) {
					getFmSongsByAjax(arr);
				}
			},
			statusCode: {
				404: function() {C("404啊")}
			},
			error: function(error) {}
		});
	}

	function getFmSongsByAjax(arr) {
		$.ajax({
			url: "http://music.baidu.com/data/music/fmlink?rate=128&songIds="+arr.join()+"&xx="+new Date().getTime(),
			type: 'GET',
			dataType: 'json',
			success: function(res) {
				FM.songList = [];
				var len = res.data.songList.length;
				for (var i = 0; i < len; i++) {
					FM.songList.push(res.data.songList[i]);
					if(FM.songList[i].lrcLink) FM.songList[i].lrcLink = "http://ting.baidu.com" + FM.songList[i].lrcLink;
				};
				FM.currentID = 0;
				// 播放
				player.playOnlineMusic(FM.songList[0]);
			},
			statusCode: {
				404: function() {C("404啊")}
			},
			error: function(error) {C(error);}
		});
	}
	// debug
	function C(str) {
		console.log(str);
	}
});

// http://song4u.sinaapp.com/api/search.php?keyword=
// http://ting.baidu.com/
// 音质64，128，320
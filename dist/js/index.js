$(document).ready(function() {
	"use strict";

	// 全局变量
	var mGalleryIndex = 0;
	var mGalleryReader = null;
	var mGalleryDirectories = [];
	var mGalleryArray = [];
	var audFormats = ['wav', 'mp3'];
	var localMusic = {
		array: [],
		artist: [],
		currentID: 0,
		len: 0,
		playPre: function(mode) {
			switch(mode) {
				case 0: 
				if(musicTag.length < 1) break;
				var oldIndex = musicTagCurrentID;
				while(musicTag.length > 1 && (musicTagCurrentID = parseInt(Math.random()*(musicTag.length-1)+0.5))==oldIndex);
				localMusic.currentID = musicTag[musicTagCurrentID].id;
				readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
				break;
				
				case 1: 
				var src = myAudio.getSrc();
				if(src) {
					myAudio.setSrc(src);
					myAudio.play();
				}
				break;
				
				case 2: 
				musicTagCurrentID = ((musicTagCurrentID - 1) < 0) ? (musicTag.length - 1) : (musicTagCurrentID - 1);
				localMusic.currentID = musicTag[musicTagCurrentID].id;
				readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
				break;
				
				default: break;
			}
		},
		playNext: function(mode) {
			// 随机，单曲，列表循环
			switch(mode) {
				case 0: 
				if(musicTag.length < 1) break;
				var oldIndex = musicTagCurrentID;
				while(musicTag.length > 1 && (musicTagCurrentID = parseInt(Math.random()*(musicTag.length-1)+0.5))==oldIndex);
				localMusic.currentID = musicTag[musicTagCurrentID].id;
				readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
				break;

				case 1: 
				var src = myAudio.getSrc();
				if(src) {
					myAudio.setSrc(src);
					myAudio.play();
				}
				break;

				case 2: 
				musicTagCurrentID = ((musicTagCurrentID+1) >= musicTag.length) ? 0 : (musicTagCurrentID+1);
				localMusic.currentID = musicTag[musicTagCurrentID].id;
				readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
				break;

				default: break;
			}
		}
	};

	var musicTag = [];// 有效歌曲列表（除去回收站）
	var musicTagCurrentID = 0;// 有效歌曲当前id
	var onlineMusicArray = [];
	var localMusicIndex = 0;// 本地音乐计数
	var myAudio = audio.createPlayer();

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

	function addItem(item) {
		if(!item)return ;
		var target = arguments[1] ? arguments[1] : "#GalleryList";// 插入节点的父节点

		var parentDiv = $("<div></div>");
		parentDiv.addClass('list-row');
		if(localMusicIndex % 2) {
			parentDiv.addClass('odd');
		}else {
			parentDiv.addClass('even');
		}
		parentDiv.attr('data-fullpath', item.fullPath);
		parentDiv.attr('data-galleryid', item.galleryId);
   		// col1
   		var childDiv0 = $("<div></div>");
   		childDiv0.addClass('list-cell c0');
   		childDiv0.append('<span class="list-songname">' + item.title + '</span>');
   		parentDiv.append(childDiv0);
   		// col2
   		var childDiv1 = $("<div></div>");
   		childDiv1.addClass('list-cell c1');
   		childDiv1.append('<span class="list-songname">' + item.artist + '</span>');
   		parentDiv.append(childDiv1);
   		// col3
   		var childDiv2 = $("<div></div>");
   		childDiv2.addClass('list-cell c2');
   		childDiv2.append('<span class="list-songname">' + item.album + '</span>');
   		parentDiv.append(childDiv2);
   		// delete
   		var childDelete = $("<div></div>");
		childDelete.addClass('song-delete');
		childDelete.append('<span class="delete"><i class="icon-remove-2"></i></span>')
   		parentDiv.append(childDelete);
   		// 
   		if(target == "#GalleryList") {
   			var childPlay = $("<div></div>");
			childPlay.addClass('song-play');
			childPlay.append('<span class="play"><i class="icon-play"></i></span>')
   			parentDiv.append(childPlay);
   		}
   		if(target == "#RecycleList") {
   			var childRestore = $("<div></div>");
			childRestore.addClass('song-restore');
			childRestore.append('<span class="play"><i class="icon-restart"></i></span>')
   			parentDiv.append(childRestore);
   		}
   		$(target).append(parentDiv);
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
							localMusic.array.push(musicInfo);
							addItem(musicInfo);
							musicTag.push({
								tag: musicInfo.galleryId.toString()+","+musicInfo.fullPath.toString(),
								id: parseInt(localMusicIndex)
							});
							if(localMusic.artist.indexOf(musicInfo.artist) == -1) {
								localMusic.artist.push(musicInfo.artist.toString());
								$(".singer-list").append('<div class="singer-list-row"><div class="singername"><span>'+musicInfo.artist.toString()+'</span></div></div>');
							}
							$.indexedDB("localMusicDB").objectStore("musicList").add(musicInfo).done(function() {});
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
			musicTagCurrentID = getIdFromTag(galleryId, fullPath);
			if(musicTagCurrentID < 0) return ;
			localMusic.currentID = musicTag[musicTagCurrentID].id;
			if(localMusic.currentID < 0) return ;
			$(".title .artist").text(localMusic.array[localMusic.currentID].artist);
			$(".title .songname").text(localMusic.array[localMusic.currentID].title);
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

	function addItemList(obj) {
		obj.array = [];
		obj.artist = [];
		musicTag = [];
		var cnt = 0;// 计数
		// 遍历数据库已存在歌曲（包括回收站）
		$.indexedDB("localMusicDB").objectStore("musicList").each(function(item) {
			obj.array.push(item.value);
			if(obj.artist.indexOf(item.value.artist.toString()) == -1) {
				obj.artist.push(item.value.artist.toString());
			}
			if(parseInt(item.value.galleryId) < 0) {
				cnt++;
				return true;
			}
			addItem(item.value);
			musicTag.push({
				tag: item.value.galleryId+","+item.value.fullPath,
				id: parseInt(cnt) // 指向数组位置（0开始）
			});
			cnt++;
		}).done(function() {
			// 遍历完成后回调函数
			if(localMusic.artist.length) {
				// 遍历歌手
				localMusic.artist.forEach(function(item, index, arr) {
					$(".singer-list").append('<div class="singer-list-row"><div class="singername"><span>'+item+'</span></div></div>');
				});
			}
			obj.len = cnt;
		});
	}

	function addItem2Recycle() {
		$.indexedDB("localMusicDB").objectStore("musicList").index("galleryId").each(function(item) {
			addItem(item.value, "#RecycleList");
		}, [-100000, 0]).done(function(res, event) {});
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

			$(".layer-body-content").html(str);
			$(".scan-btn").click(function(event) {
			 	return false;
			});
		}else {
			var str = "<span>没有任何音频文件夹哦～</span>";
			$(".layer-body-content").html(str);
		}
	}

	// 把数据库galleryId修改为-1
	function updateMusicInDB(galleryId, fullPath) {
		var bool = false;
		localMusic.array.forEach(function(item, index, arr) {
			if(item.galleryId == parseInt(galleryId) && item.fullPath == fullPath) {
				var tmp = item;
				tmp.galleryId = (-1-parseInt(galleryId));
				if(parseInt(tmp.galleryId) > 0) {// 恢复
					localMusic.array[index].galleryId = parseInt(tmp.galleryId);
					addItem(item);
					musicTag.push({
						id: parseInt(index),
						tag: tmp.galleryId.toString()+","+fullPath.toString()
					});
				}
				$.indexedDB("localMusicDB").objectStore("musicList").put(tmp, index+1);
				bool = true;
				return false;
			}
		});
		return bool;
	}

	myAudio.onEndedHandle = function() {
		var mode = parseInt($(".play-mode li a.selected").attr('data-mode'));
		switch(mode) {
			case 0: 
			if(musicTag.length < 1) break;
			var oldIndex = musicTagCurrentID;
			while(musicTag.length > 1 && (musicTagCurrentID = parseInt(Math.random()*(musicTag.length-1)+0.5))==oldIndex);
			localMusic.currentID = musicTag[musicTagCurrentID].id;
			readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
			break;
			case 1: 
			myAudio.setLoop();
			myAudio.play();
			break;
			case 2: 
			musicTagCurrentID = ((musicTagCurrentID+1) >= musicTag.length) ? 0 : (musicTagCurrentID+1);
			localMusic.currentID = musicTag[musicTagCurrentID].id;
			readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
			break;
			default: break;
		}
	};

	function deleteMusicTag(galleryId, fullPath) {
		var idx = -1;
		musicTag.forEach(function(item, index, arr) {
			if(item.tag == (galleryId+","+fullPath)) {
				idx = item.id;
				return false;
			}
		});
		if(idx != -1) {
			musicTag.splice(idx, 1);
		}
	};
	// 返回musicTag的下标！
	function getIdFromTag(galleryId, fullPath) {
		var idx = -1;
		musicTag.forEach(function(item, index, arr) {
			if(item.tag == (galleryId+","+fullPath)) {
				idx = index;
				return false;
			}
		});
		return idx;
	}

	function deleteMusicInDB(galleryId, fullPath) {
		var bool = false;
		localMusic.array.forEach(function(item, index, arr) {
			if(item.galleryId == parseInt(galleryId) && item.fullPath == fullPath) {
				$.indexedDB("localMusicDB").objectStore("musicList").delete(index+1);
				bool = true;
				return false;
			}
		});
		return bool;
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
		$.indexedDB("localMusicDB", {
			version: 1,
			schema: {
				"1": function(tran) {
					var objStore = tran.createObjectStore("musicList", {
						autoIncrement: true
					});
					objStore.createIndex("artist");
					objStore.createIndex("album");
					objStore.createIndex("title");
					objStore.createIndex("galleryId");
				}
			}
		}).done(function() {});
		$.indexedDB("localMusicDB").objectStore("musicList").count().done(function(res, event) {
			if(res == 0) {
				C("Add songs please!");
			}else {
				addItemList(localMusic);
			}
		});
	}();

	// 本地音乐和在线音乐标签切换
	$("#local,#online").click(function(event) {
		$(this).addClass('menu-active').siblings().removeClass('menu-active');
		var menuID = $(this).attr('id');
		$("#"+menuID+"Body").show().siblings().hide();
	});

	// 本地音乐细分标签切换
	$(".leftbar-outer > div").click(function(event) {
		$(this).addClass('list-actived').siblings().removeClass('list-actived');
		var tabID = $(this).attr('id');
		$("#leftCol2-"+tabID).show().siblings().hide();
		if(tabID == "recycleList") {
			$("#RecycleList").empty();
			addItem2Recycle();
		}
	});

	// 打开文件点击事件
	$("#openFile").click(function(event) {

		chrome.mediaGalleries.getMediaFileSystems({
			interactive: "if_needed"
		}, getMusicInfo);

		$(".shade").show();
		$(".layer").show('slow');
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

	$("#cancelBtn").click(function(event) {
		$(".shade").hide();
		$(".layer").hide();
	});

	$("#leftCol2-songList,#leftCol2-singerList").on('dblclick', '.list-row',function(event) {
		event.preventDefault();
		musicTagCurrentID = getIdFromTag($(this).attr('data-galleryid'), $(this).attr('data-fullpath'));
		if(musicTagCurrentID == -1) return false;// musicTag不存在歌曲记录
		localMusic.currentID = musicTag[musicTagCurrentID].id;
		readFileAsPath($(this).attr('data-galleryid'), $(this).attr('data-fullpath'));
		$(".title .songname").text($(':nth-child(1) .list-songname', this).text());
		$(".title .artist").text($(':nth-child(2) .list-songname', this).text());
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

	$(this).on('keydown', function(event) {
		// event.preventDefault();
		// C(event.keyCode);
		if(event.keyCode == 32) {
			var tt = ".play-btn .play-pause a";
			if($(".play-btn .play-pause").hasClass('pause')) {
				$(tt).children().removeClass('icon-pause').addClass('icon-play');
				$(tt).attr('title', '播放');
				$(tt).parent().removeClass('pause').addClass('play');
				myAudio.pause();	
			}else {
				$(tt).children().removeClass('icon-play').addClass('icon-pause');
				$(tt).attr('title', '暂停');
				$(tt).parent().removeClass('play').addClass('pause');
				myAudio.play();
			}
		}else if(event.keyCode == 37) {
			var mode = parseInt($(".play-mode li a.selected").attr('data-mode'));
			localMusic.playPre(mode);
		}else if(event.keyCode == 39) {
			var mode = parseInt($(".play-mode li a.selected").attr('data-mode'));
			localMusic.playNext(mode);
		}else if(event.keyCode == 38) {
			var vol = $(".vol-slider-range").css('width') === "0px" ? 0 : (parseInt($(".vol-slider-range").css('width')) / parseInt($(".vol-slider-wrapper").width()));
			myAudio.setVolume(vol+0.1);
		}else if(event.keyCode == 40) {
			var vol = $(".vol-slider-range").css('width') === "0px" ? 0 : (parseInt($(".vol-slider-range").css('width')) / parseInt($(".vol-slider-wrapper").width()));
			myAudio.setVolume(vol-0.1);
		}else if(event.keyCode == 27){ // Esc
			event.preventDefault();
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
		var mode = parseInt($(".play-mode li a.selected").attr('data-mode'));
		localMusic.playPre(mode);
	});
	// 下一首
	$("ul").on('click', '.next .ctrl-btn', function(event) {
		event.preventDefault();
		var mode = parseInt($(".play-mode li a.selected").attr('data-mode'));
		localMusic.playNext(mode);
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
				+item.value.album
				+'</span></div></div>');
		}, singer).done(function(res, event) {});
	});

	// 回收站
	$("#leftCol2-songList,#leftCol2-singerList").on('click', '.song-delete', function(event) {
		event.preventDefault();
		var gID = $(this).parent('.list-row').attr('data-galleryid');
		var fullPath = $(this).parent('.list-row').attr('data-fullpath');
		updateMusicInDB(gID, fullPath);
		deleteMusicTag(gID, fullPath);
		$(this).parent('.list-row').remove();
	});

	// 彻底删除
	$("#leftCol2-recycleList").on('click', '#RecycleList .song-delete', function(event) {
		event.preventDefault();
		var gID = $(this).parent('.list-row').attr('data-galleryid');
		var fullPath = $(this).parent('.list-row').attr('data-fullpath');
		if(deleteMusicInDB(gID, fullPath)) {
			$(this).parent('.list-row').remove();
		}
	});
	// 恢复回收站歌曲
	$("#leftCol2-recycleList").on('click', '#RecycleList .song-restore', function(event) {
		event.preventDefault();
		var gID = $(this).parent('.list-row').attr('data-galleryid');
		var fullPath = $(this).parent('.list-row').attr('data-fullpath');
		if(updateMusicInDB(gID, fullPath)) {
			$(this).parent('.list-row').remove();
		}
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

	// debug
	function C(str) {
		console.log(str);
	}
});
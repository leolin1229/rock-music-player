$(document).ready(function() {
	"use strict";

	// 全局变量
	var mGalleryIndex = 0;
	var mGalleryReader = null;
	var mGalleryDirectories = [];
	var mGalleryArray = [];
	var audFormats = ['wav', 'mp3'];
	var localMusicList = [];
	var onlineMusicList = [];
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

	function addAudioToContentDiv() {

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

		var parentDiv = $("<div></div>");
		parentDiv.addClass('list-row');
		if(localMusicIndex % 2) {
			parentDiv.addClass('odd');
		}else {
			parentDiv.addClass('even');
		}
		parentDiv.attr('data-src', item.src);
   			// col1
   		var childDiv0 = $("<div></div>");
   		childDiv0.addClass('list-cell c0');
   		childDiv0.append('<span class="list-songname">' + item.title + '</span>');
   		parentDiv.append(childDiv0);
   			// col2
   		var childDiv1 = $("<div></div>");
   		childDiv1.addClass('list-cell c1');
   		childDiv1.append('<span class="list-songname">' + item.author + '</span>');
   		parentDiv.append(childDiv1);
   			// col3
   		var childDiv2 = $("<div></div>");
   		childDiv2.addClass('list-cell c2');
   		childDiv2.append('<span class="list-songname">' + item.album + '</span>');
   		parentDiv.append(childDiv2);

   		$("#GalleryList").append(parentDiv);
	}

	function scanSongs(DOMFileSystem) {
		var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(DOMFileSystem);// Object

		console.log('正在扫描媒体库: ' + mData.name);

		mGalleryReader = DOMFileSystem.root.createReader();
		mGalleryReader.readEntries(scanSong, errorHandler('readEntries'));
	}

	// 递归扫描
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

				// var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(mGalleryArray[mGalleryIndex]);

				mGalleryArray[mGalleryIndex].root.getFile(entries[i].fullPath, {create: false}, function(fileEntry) {
					// C(fileEntry);
					fileEntry.file(function(file) {
						var src = '';// 音频路径
						src = window.webkitURL.createObjectURL(file);

						var blob = file.slice(0, file.size, 'MIME');

						var reader = new FileReader();
						reader.onloadstart = function(e) {
							$(".scanTips").append("<span class='songname-tips'>" + file.name + "</span>");
							$(".scanTipsLayer").show();
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
							var result =  e.target.result;
								// 获取mp3信息
								var musicInfo = Mp3.getMp3Info(result, src);
								localMusicList.push(musicInfo);

								addItem(musicInfo);

								localMusicIndex++;
								$(".scanTipsLayer").hide();
							};
						reader.readAsBinaryString(blob);
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

	///////////////////////////// app初始化开始 /////////////////////////////
	var init = function() {
		$("#local").addClass('menu-active');
		$("#onlineBody").hide();
		$("#leftCol2-songList").show();
		$("#leftCol2-singerList").hide();
		$(".shade").hide();
		$(".layer").hide();
		$(".scanTipsLayer").hide();
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
	});

	// 打开文件点击事件
	$("#openFile").click(function(event) {

		chrome.mediaGalleries.getMediaFileSystems({
			interactive: "if_needed"
		}, getMusicInfo);

		$(".shade").show();
		$(".layer").show('slow');
	});

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

	$("div").on('dblclick', '.list-row',function(event) {
		event.preventDefault();
		var src = $(this).attr('data-src');
		myAudio.setSrc(src);
		myAudio.play();
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
		event.preventDefault();
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
	});
	// debug
	function C(str) {
		console.log(str);
	}
});
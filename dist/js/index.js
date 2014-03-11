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

	// var onlineMusicTag = [],
	// 	onlineMusicTagCurrentID = 0,
	// 	onlineMusicIndex = 0;

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

	myAudio.onEndedHandle = function() {
		var mode = parseInt($(".play-mode li a.selected").attr('data-mode'));
		switch(mode) {
			case 0: 
			// local
			if(localMusic.currentID >= 0 && onlineMusic.currentID <= -1) {
				var oldIndex = localMusic.currentID;
				while((localMusic.currentID = parseInt(Math.random()*(localMusic.len-1)+0.5))==oldIndex);

				if(localMusic.array[localMusic.currentID].lrcLink == '') {
					getLrcLinkByAjax(localMusic.array[localMusic.currentID].title, localMusic.array[localMusic.currentID].artist);
				}

				myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
				readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
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
				}else {
					C("不存在歌曲！");
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
					getLrcLinkByAjax(localMusic.array[localMusic.currentID].title, localMusic.array[localMusic.currentID].artist);
				}

				myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
				readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
			}else if(localMusic.currentID <= -1 && onlineMusic.currentID >= 0) {
				// online
				onlineMusic.currentID = ((onlineMusic.currentID + 1) >= onlineMusic.len) ? 0 : (onlineMusic.currentID + 1);
				
				myAudio.setSrc(onlineMusic.array[onlineMusic.currentID].songLink);
				myAudio.lrcLink = onlineMusic.array[onlineMusic.currentID].lrcLink;
				$(".title .artist").text(onlineMusic.array[onlineMusic.currentID].artistName);
				$(".title .songname").text(onlineMusic.array[onlineMusic.currentID].songName);
			}
			break;
			default: break;
		}
		if(myAudio.lrcStatus) {
			getLrcByAjax();
		}
	};
	var player = {
		playPre: function(mode) {
			switch(mode) {
				case 0: 
				// local
				if(localMusic.currentID >= 0 && onlineMusic.currentID <= -1) {
					var oldIndex = localMusic.currentID;
					while((localMusic.currentID = parseInt(Math.random()*(localMusic.len-1)+0.5))==oldIndex);

					if(localMusic.array[localMusic.currentID].lrcLink == '') {
						getLrcLinkByAjax(localMusic.array[localMusic.currentID].title, localMusic.array[localMusic.currentID].artist);
					}

					myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
					readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
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
					}else {
						C("不存在歌曲！");
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
						getLrcLinkByAjax(localMusic.array[localMusic.currentID].title, localMusic.array[localMusic.currentID].artist);
					}

					myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
					readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
				}else if(localMusic.currentID <= -1 && onlineMusic.currentID >= 0) {
					// online
					onlineMusic.currentID = ((onlineMusic.currentID - 1) < 0) ? (onlineMusic.len - 1) : (onlineMusic.currentID - 1);
					
					myAudio.setSrc(onlineMusic.array[onlineMusic.currentID].songLink);
					myAudio.lrcLink = onlineMusic.array[onlineMusic.currentID].lrcLink;
					$(".title .artist").text(onlineMusic.array[onlineMusic.currentID].artistName);
					$(".title .songname").text(onlineMusic.array[onlineMusic.currentID].songName);
				}
				break;
				default: break;
			}
			if(myAudio.lrcStatus) {
				getLrcByAjax();
			}
		},
		playNext: function(mode) {
			// 随机，单曲，列表循环
			switch(mode) {
				case 0: 
				// local
				if(localMusic.currentID >= 0 && onlineMusic.currentID <= -1) {
					var oldIndex = localMusic.currentID;
					while((localMusic.currentID = parseInt(Math.random()*(localMusic.len-1)+0.5))==oldIndex);
					
					if(localMusic.array[localMusic.currentID].lrcLink == '') {
						getLrcLinkByAjax(localMusic.array[localMusic.currentID].title, localMusic.array[localMusic.currentID].artist);
					}

					myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
					readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
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
					}else {
						C("不存在歌曲！");
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
						getLrcLinkByAjax(localMusic.array[localMusic.currentID].title, localMusic.array[localMusic.currentID].artist);
					}

					myAudio.lrcLink = localMusic.array[localMusic.currentID].lrcLink;
					readFileAsPath(localMusic.array[localMusic.currentID].galleryId, localMusic.array[localMusic.currentID].fullPath);
				}else if(localMusic.currentID <= -1 && onlineMusic.currentID >= 0) {
					// online
					onlineMusic.currentID = ((onlineMusic.currentID + 1) >= onlineMusic.len) ? 0 : (onlineMusic.currentID + 1);
					myAudio.setSrc(onlineMusic.array[onlineMusic.currentID].songLink);
					myAudio.lrcLink = onlineMusic.array[onlineMusic.currentID].lrcLink;
					$(".title .artist").text(onlineMusic.array[onlineMusic.currentID].artistName);
					$(".title .songname").text(onlineMusic.array[onlineMusic.currentID].songName);
				}
				break;
				default: break;
			}
			if(myAudio.lrcStatus) {
				getLrcByAjax();
			}
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
			url: 'http://geci.me/api/lyric/' + musicInfo.title + '/' + musicInfo.artist,
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
   		if(parentNode == "#SearchList" || parentNode == "#MyLikeList") {
   			childDiv0.append('<span class="list-songname">' + item.songName + '</span>');
   		}else {
   			childDiv0.append('<span class="list-songname">' + item.title + '</span>');
   		}
   		parentDiv.append(childDiv0);
   		// col2
   		var childDiv1 = $("<div></div>");
   		childDiv1.addClass('list-cell c1');
   		if(parentNode == "#SearchList" || parentNode == "#MyLikeList") {
   			childDiv1.append('<span class="list-songname">' + item.artistName + '</span>');
   		}else {
   			childDiv1.append('<span class="list-songname">' + item.artist + '</span>');
   		}
   		parentDiv.append(childDiv1);
   		// col3
   		var childDiv2 = $("<div></div>");
   		childDiv2.addClass('list-cell c2');
   		if(parentNode == "#SearchList" || parentNode == "#MyLikeList") {
   			childDiv2.append('<span class="list-songname">' + item.albumName + '</span>');
   		}else {
   			childDiv2.append('<span class="list-songname">' + item.album + '</span>');
   		}
   		parentDiv.append(childDiv2);
   		// like
		if(parentNode=="#SearchList") {
			var childLike = $("<div></div>");
			childLike.addClass('song-like');
			childLike.append('<span class="like"><i class="icon-heart"></i></span>')
   			parentDiv.append(childLike);
		}else {
			var childDelete = $("<div></div>");
			childDelete.addClass('song-delete');
			childDelete.append('<span class="delete"><i class="icon-remove-2"></i></span>')
   			parentDiv.append(childDelete);	
		}
   		// 
   		if(parentNode == "#GalleryList" || parentNode=="#SearchList" || parentNode=="#MyLikeList") {
   			var childPlay = $("<div></div>");
			childPlay.addClass('song-play');
			childPlay.append('<span class="play"><i class="icon-play"></i></span>')
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
								if(localMusic.artist.indexOf(musicInfo.artist) == -1) {
									localMusic.artist.push(musicInfo.artist.toString());
									$(".singer-list").append('<div class="singer-list-row"><div class="singername"><span>'+musicInfo.artist.toString()+'</span></div></div>');
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
				if(obj.artist.length) {
					// 遍历歌手
					obj.artist.forEach(function(item, index, arr) {
						$(".singer-list").append('<div class="singer-list-row"><div class="singername"><span>'+item+'</span></div></div>');
					});
				}
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

			$(".layer-body-content").html(str);
			$(".scan-btn").click(function(event) {
			 	return false;
			});
		}else {
			var str = "<span>没有任何音频文件夹哦～</span>";
			$(".layer-body-content").html(str);
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
					objStore.createIndex("artist");
					objStore.createIndex("album");
					objStore.createIndex("title");
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
		$(this).addClass('list-active').siblings().removeClass('list-active');
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

	$("#leftCol2-songList, #leftCol2-singerList, #leftCol2-search-result, #leftCol2-mylike").on('dblclick', '.list-row',function(event) {
		event.preventDefault();
		myAudio.lrcLink = '';
		// online
		if($(this).parent('#SearchList').length > 0 || $(this).parent('#MyLikeList').length > 0) {
			myAudio.setSrc($(this).attr('data-src'));
			myAudio.lrcLink = $(this).attr('data-lrc');
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
		}else {// local
			var musicInfo = {
				title: $(this).children('div.list-cell.c0').text(),
				artist: $(this).children('div.list-cell.c1').text(),
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
		}
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

	$(document).on('keydown', function(event) {
		// event.preventDefault();
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
					$(tt).children().removeClass('icon-play').addClass('icon-pause');
					$(tt).attr('title', '暂停');
					$(tt).parent().removeClass('play').addClass('pause');
					myAudio.play();
				}
			}
		}else if(event.keyCode == 37) { // 左箭头
			if(!$("input").is(':focus')) {
				var mode = parseInt($(".play-mode li a.selected").attr('data-mode'));
				player.playPre(mode);
			}
		}else if(event.keyCode == 39) { // 右箭头
			if(!$("input").is(':focus')) {
				var mode = parseInt($(".play-mode li a.selected").attr('data-mode'));
				player.playNext(mode);
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
		player.playPre(mode);
	});

	// 下一首
	$("ul").on('click', '.next .ctrl-btn', function(event) {
		event.preventDefault();
		var mode = parseInt($(".play-mode li a.selected").attr('data-mode'));
		player.playNext(mode);
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
		if(myAudio.lrcStatus) {
			$("#lrcWrapper").animate({'right': '-='+width}, 'slow', 'swing', function() {
				$("#lrcWrapper .lrcContent").empty();
			});
			myAudio.lrcStatus = false;
		}else {
			getLrcByAjax();
			$("#lrcWrapper").css('display', 'block').animate({'right': '+='+width}, 'slow');
			myAudio.lrcStatus = true;
		}
	});

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

	function parseLrc(lrc) {
		$("#lrcWrapper .lrcContent").empty();

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
	function renderLrc(m) {
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
	// debug
	function C(str) {
		console.log(str);
	}
});

// http://song4u.sinaapp.com/api/search.php?keyword=
// http://ting.baidu.com/
$(document).ready(function() {
	// 全局变量
	var mGalleryIndex = 0;
	var mGalleryReader = null;
	var mGalleryDirectories = [];
	var mGalleryArray = [];
	var mGalleryData = [];
	var curOptGrp = null;
	var audFormats = ['wav', 'mp3'];

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

	function SongData(id) {
		this._id = id;
		this.path = "";
		this.sizeBytes = 0;
		this.numFiles = 0;
		this.numDirs = 0;
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

	function addItem(itemEntry) {
		if(getFileType(itemEntry.name) != 'audio') {
			return ;
		}

		var parentDiv = $("<div></div>");
		parentDiv.addClass('list-row');
		if(mGalleryIndex % 2) {
			parentDiv.addClass('odd');
		}else {
			parentDiv.addClass('even');
		}
		parentDiv.attr('data-fullpath', itemEntry.fullPath);
   		if (itemEntry.isFile) {
   			// 1
   			var childDiv0 = $("<div></div>");
   			childDiv0.addClass('list-cell c0');
   			childDiv0.append('<span class="list-songname">' + itemEntry.name + '</span>');
   			parentDiv.append(childDiv0);
   			// 2
   			var childDiv1 = $("<div></div>");
   			childDiv1.addClass('list-cell c1');
   			childDiv1.append('<span class="list-songname">' + itemEntry.name + '</span>');
   			parentDiv.append(childDiv1);
   			// 3
   			var childDiv2 = $("<div></div>");
   			childDiv2.addClass('list-cell c2');
   			childDiv2.append('<span class="list-songname">' + itemEntry.name + '</span>');
   			parentDiv.append(childDiv2);
   		}
   		// div.appendChild(document.createTextNode(itemEntry.name));
   		// curOptGrp.appendChild(div);
   		$("#GalleryList").append(parentDiv);
	}

	function scanSongs(fs) {
		var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(fs);

		console.log('Reading directory: ' + mData.name);
		curOptGrp = addSong(mData.name, mData.galleryId);
		mGalleryData[mGalleryIndex] = new SongData(mData.galleryId);
		mGalleryReader = fs.root.createReader();
		mGalleryReader.readEntries(scanSong, errorHandler('readEntries'));
	}

	function scanSong(entries) {
		if(entries.length == 0) {
			if(mGalleryDirectories.length > 0) {
				var dir_entry = mGalleryDirectories.shift();
				console.log('Doing subdir: ' + dir_entry.fullPath);
				mGalleryReader = dir_entry.createReader();
				// 当前目录下还有目录则递归扫描
				mGalleryReader.readEntries(scanSong, errorHandler('readEntries'));
			}else {
				mGalleryIndex++;
				if(mGalleryIndex < mGalleryArray.length) {
					console.log('Doing next Music: ' + mGalleryArray[mGalleryIndex].name);
					scanSongs(mGalleryArray[mGalleryIndex]);
				}
			}
			return ;
		}
		for(var i = 0; i < entries.length; i++) {
			console.log(entries[i].name);

			if(entries[i].isFile) {
				addItem(entries[i]);
				mGalleryData[mGalleryIndex].numFiles++;
				(function(mData) {
					entries[i].getMetadata(function(metadata) {
						mData.sizeBytes += metadata.size;
					});
				}(mGalleryData[mGalleryIndex]));
			}else if(entries[i].isDirectory) {
				mGalleryDirectories.push(entries[i]);
			}else {
				console.log("Got something other than a file or directory.");
			}
		}

		mGalleryReader.readEntries(scanSong, errorHandler('readMoreEntries'));
	}

	///////////////////////////// app初始化 /////////////////////////////
	var init = function() {
		$("#local").addClass('menu-active');
		$(".vol-slider-range").css({
			width: '50%'
		});
		$(".vol-slider-handle").css({
			left: $(".vol-slider-range").width() + 'px'
		});
		$("#onlineBody").hide();
		$("#leftCol2-songList").show();
		$("#leftCol2-singerList").hide();
		$(".shade").hide();
		$(".layer").hide();
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
			var str = "<span>没有任何音频文件哦～</span>";
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
			scanSongs(mGalleryArray[0]);
		}
	});

	$("#cancelBtn").click(function(event) {
		$(".shade").hide();
		$(".layer").hide();
	});
});
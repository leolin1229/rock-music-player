$(document).ready(function() {
	// 全局变量
	var musicIndex = 0;
	var musicReader = null;
	var musicDirectories = [];
	var musicArray = [];
	var musicData = [];
	var curOptGrp = null;
	var audFormats = ['wav', 'mp3'];

	// 打印错误信息
	function errorPrintFactory(custom) {
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

	function MusicData(id) {
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
		if(audFormats.index(ext) >= 0) {
			return 'audio';
		}else {
			return null;
		}
	}
	function addMusic(name, id) {
   		var optGrp = document.createElement("optgroup");
   		optGrp.setAttribute("label",name);
   		optGrp.setAttribute("id", id);
   		document.getElementById("GalleryList").appendChild(optGrp);
   		return optGrp;
	}
	function addItem(itemEntry) {
		var opt = document.createElement("option");
   		if (itemEntry.isFile) {
      		opt.setAttribute("data-fullpath", itemEntry.fullPath);

      		var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(itemEntry.filesystem);
      		opt.setAttribute("data-fsid", mData.galleryId);
   		}
   		opt.appendChild(document.createTextNode(itemEntry.name));
   		curOptGrp.appendChild(opt);
	}

	function scanMusics(fs) {
		var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(fs);

		console.log('Reading directory' + mData.name);
		curOptGrp = addMusic(mData.name, mData.gallaryId);
		musicData[musicIndex] = new MusicData(mData.gallaryId);
		musicReader = fs.root.createReader();
		musicReader.readEntries(scanMusic, errorPrintFactory('readEntries'));
	}

	function scanMusic(entries) {
		if(entries.length == 0) {
			if(musicDirectories.length > 0) {
				var dir_entry = musicDirectories.shift();
				console.log('Doing subdir: ' + dir_entry.fullpath);
				musicReader = dir_entry.createReader();
				musicReader.readEntries(scanMusic, errorPrintFactory('readEntries'));
			}else {
				musicIndex++;
				if(musicIndex < musicArray.length) {
					console.log('Doing next Music: ' + musicArray[musicIndex].name);
					scanMusics(musicArray[musicIndex]);
				}
			}
			return ;
		}
		for(var i = 0; i < entries.length; i++) {
			console.log(entries[i].name);

			if(entries[i].isFile) {
				addItem(entries[i]);
				musicData[musicIndex].numFiles++;
				(function(mData) {
					entries[i].getMetadata(function(metadata) {
						mData.sizeBytes += metadata.size;
					});
				}(musicData[musicIndex]));
			}else if(entries[i].isDirectory) {
				musicDirectories.push(entries[i]);
			}else {
				console.log("Got something other than a file or directory.");
			}
		}

		musicReader.readEntries(scanMusic, errorPrintFactory('readMoreEntries'));
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
			musicArray = results;
			musicIndex = 0;

			$(".layer-body-content").html(str);
			$(".scan-btn").click(function(event) {
			 	return false;
			});
		}else {
			var str = "<span>添加扫描目录吧～</span>";
			$(".layer-body-content").html(str);
		}
	}

	$("#addBtn").click(function(event) {
		
		chrome.mediaGalleries.getMediaFileSystems({
			interactive: "yes"
		}, getMusicInfo);
	});

	$("#scanBtn").click(function(event) {
		// console.log(chrome.mediaGalleries);
		if(musicArray.length > 0) {
			scanMusics(musicArray[0]);
		}
	});

	$("#cancelBtn").click(function(event) {
		
		$(".shade").hide();
		$(".layer").hide();
	});
});
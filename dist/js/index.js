$(document).ready(function() {
	"use strict";

	// Mp3类
	var Mp3 = {
		// 计算Tag大小
		'getTagSize': function(str) {
			if(typeof str === 'string' && str.length === 4) {
            	var total = (str.charCodeAt(0)&0x7f)*0x200000 
                	      	+ (str.charCodeAt(1)&0x7f)*0x400
                    	  	+ (str.charCodeAt(2)&0x7f)*0x80
                    	  	+ (str.charCodeAt(3)&0x7f);
                return total;
        	} else {
        		throw Error('参数错误!');
        	}
		},

    	'getMp3Info': function(result) {
    		// 获取专辑图片
    		var getApic = function(str) {
    			// 专辑信息位置
    			var index = str.indexOf('APIC');

    			if(index < 0) {
    				console.log('找不到专辑图片');
    				return false;
    			}
        		// 图片信息大小
        		var picsize = getFrameSize(str.substr(index+4, 4)),
        		// 图片信息块1
        			pic1 = str.substr(index+10 , picsize),
        		// 图片信息块2
        			pic2 = pic1.slice(pic1.indexOf('\xff\xd8'));

        		var src = '';
        		if(typeof pic2 === 'string') {
        			src = 'data:image/jpeg;base64,' + btoa(pic2);
        		}
        		return src;
        	};
        	var getAuthor = function(str) {
        		var index = str.indexOf('TPE1');

        		if(index < 0) {
        			console.log("找不到作者信息");
        			return false;
        		}
        		// size
        		var size = getFrameSize(str.substr(index+4, 4)),
        			author = str.substr(index+10, size);

        		if(typeof author === 'string') {
        			return author;
        		}
        		return '';
        	};
        	var getTitle = function(str) {

        	};
        	var getAlbum = function(str) {
        		var index = str.indexOf('TALB');

        		if(index < 0) {
        			console.log('找不到专辑信息');
        			return false;
        		}

        		// size
        		var size = getFrameSize(str.substr(index+4, 4)),
        			album = str.substr(index+10, size);
        		console.log(index+" "+size);
        		console.log(album);
        		if(typeof author === 'string') {
        			return author;
        		}
        		return '';
        	};

        	// 计算帧大小
        	var getFrameSize = function(str) {
        		if(typeof str === 'string' && str.length === 4) {
            		var total = str.charCodeAt(0)*0x100000000
            				+ str.charCodeAt(1)*0x10000
            				+ str.charCodeAt(2)*0x100
            				+ str.charCodeAt(3);
            		return total;
        
        		} else {
            		console.log('参数错误！');
        		}
        	};
        	var insertImg = function(a) {
    			var img = new Image();
    				img.src = 'data:image/jpeg;base64,' + a;
    				// img.className = 'img';
    			this.info.apic = img.src;
  				/*TODO 父节点插入img*/
    		};
    		var info = {
    			'author' :'作者',
    			'title' :'标题',
    			'apic' :'专辑图片',
    			'album' :'专辑'
    		};
    		if(result.slice(0, 3) == 'ID3')  {
    			// this.info.apic = getApic(result);
    			// info.author = getAuthor(result);
    			// this.info.title = getTitle(result);
    			info.album = getAlbum(result);
    			return info;
    		}else {
    			console.log('找不到ID3信息！');
    			return null;
    		}
    	},
	};

	// 全局变量
	var mGalleryIndex = 0;
	var mGalleryReader = null;
	var mGalleryDirectories = [];
	var mGalleryArray = [];
	var mGalleryData = [];
	var curOptGrp = null;
	var audFormats = ['wav', 'mp3'];
	var localMusicList = [];
	var onlineMusicList = [];

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
   			// col1
   			var childDiv0 = $("<div></div>");
   			childDiv0.addClass('list-cell c0');
   			childDiv0.append('<span class="list-songname">' + itemEntry.name + '</span>');
   			parentDiv.append(childDiv0);
   			// col2
   			var childDiv1 = $("<div></div>");
   			childDiv1.addClass('list-cell c1');
   			childDiv1.append('<span class="list-songname">' + itemEntry.name + '</span>');
   			parentDiv.append(childDiv1);
   			// col3
   			var childDiv2 = $("<div></div>");
   			childDiv2.addClass('list-cell c2');
   			childDiv2.append('<span class="list-songname">' + itemEntry.name + '</span>');
   			parentDiv.append(childDiv2);
   		}

   		$("#GalleryList").append(parentDiv);
	}

	function scanSongs(DOMFileSystem) {
		var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(DOMFileSystem);// Object

		console.log('Reading directory: ' + mData.name);

		// curOptGrp = addSong(mData.name, mData.galleryId);
		mGalleryData[mGalleryIndex] = new SongData(mData.galleryId);// new SongData object
		mGalleryReader = DOMFileSystem.root.createReader();
		mGalleryReader.readEntries(scanSong, errorHandler('readEntries'));
	}

	// 递归扫描
	function scanSong(entries) {// FileEntry
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

			if(entries[i].isFile) {
				var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(mGalleryArray[mGalleryIndex]);

				var fullPath = '';
				if(checkOs() == "MS") {
					fullPath = mData.name + entries[i].fullPath.replace(/\//g, "\\");
				}else {
					fullPath = mData.name + entries[i].fullPath;
				}
				////////////////////////////////////////////////////////////
				entries[i].file(function success(details) {
					var blob = details.slice(0, details.size, 'MIME');

					var reader = new FileReader();
					reader.onloadstart = function(e) {
						$(".scanTips").append("<span class='songname-tips'>" + fullPath + "</span>");
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
						var musicInfo = Mp3.getMp3Info(result);
						localMusicList.push(musicInfo);

						$(".scanTipsLayer").hide();
					};
					reader.readAsBinaryString(blob);
					////////////////////////////////////////////////////////////
				}, errorHandler("Reading a file from " + fullPath + " : "));

				addItem(entries[i]);

				// 媒体库信息处理
				mGalleryData[mGalleryIndex].numFiles++;
				(function(gData) {
					entries[i].getMetadata(function(metadata) {
						gData.sizeBytes += metadata.size;
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

	function checkOs() {
		var windows = (navigator.userAgent.indexOf("Windows",0) != -1)?1:0;
		var mac = (navigator.userAgent.indexOf("mac",0) != -1)?1:0;
		var linux = (navigator.userAgent.indexOf("Linux",0) != -1)?1:0;
		var unix = (navigator.userAgent.indexOf("X11",0) != -1)?1:0;
 		
 		var os_type = '';
		if (windows) os_type = "MS";
		else if (mac) os_type = "Apple";
		else if (linux) os_type = "Lunix";
		else if (unix) os_type = "Unix";
 
		return os_type;
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

	// chrome.mediaGalleries.onScanProgress.addListener(function callback(details) {
	// 	console.log(details);
	// });
});
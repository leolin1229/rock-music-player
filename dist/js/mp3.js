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

	'getMp3Info': function(galleryId, result, fullPath) {
    	var frameType = ['TPE1', 'TIT2', 'TALB','APIC'];//作者，标题，专辑名，专辑图片

    	var getArtist = function(str) {
    		var index = str.indexOf(frameType[0]);

   			if(index < 0) {
    			console.log("找不到作者信息");
    			return 'unknown';
    		}

    		return getInfoByString(str, index);
    	};
    	var getTitle = function(str) {
    		var index = str.indexOf(frameType[1]);

    		if(index < 0) {
    			console.log("找不到标题信息");
    			return 'unknown';
    		}

    		return getInfoByString(str, index);
    	};
    	var getAlbum = function(str) {
    		var index = str.indexOf(frameType[2]);

    		if(index < 0) {
    			console.log('找不到专辑名信息');
    				return 'unknown';
    		}

    		return getInfoByString(str, index);
    	};
    	// 获取专辑图片
    	var getApic = function(str) {
    		// 专辑信息位置
    		var index = str.indexOf(frameType[3]);

    		if(index < 0) {
    			console.log('找不到专辑图片');
    			return 'unknown';
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
        var getInfoByString = function(str, index) {
        	// size
        	var size = getFrameSize(str.substr(index+4, 4)),
        	substr = str.substr(index+13, size-3);

        	var ans = '';
        	for (var i = 0; i < substr.length; i+=2) {
        		var c1 = substr.charCodeAt(i).toString(16),
        			c2 = substr.charCodeAt(i+1).toString(16);
        			c1 = padLeft(c1, '0', 2);
        			c2 = padLeft(c2, '0', 2);
        			ans += String.fromCharCode(parseInt(c2+c1, 16).toString(10));
        	};
        	return ans;
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
        var padLeft = function(str, pad, len) {
        	while(str.length < len) {
        		str = pad + str;
        	}
        	return str;
        };
        var insertImg = function(a) {
        	var img = new Image();
        	img.src = 'data:image/jpeg;base64,' + a;
    			// img.className = 'img';
    			this.info.apic = img.src;
    	};

    	// main
    	var info = {
    		'artist' :'unknown',
    		'title' :'unknown',
    		'apic' :'unknown',
    		'album' :'unknown',
    		'fullPath': 'unknown',
            'galleryId': 0,
            'like': false
    	};
    	if(result.slice(0, 3) == 'ID3')  {
    		info = {
    			'artist': getArtist(result),
    			'title': getTitle(result),
    			'apic': getApic(result),
    			'album': getAlbum(result),
    			'fullPath': fullPath,
                'galleryId': parseInt(galleryId),
                'like': false
    		};
    		return info;
    	}else {
    		console.log('找不到ID3信息！');
    		return null;
    	}
    }
};
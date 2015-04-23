// 弹窗消息
var _count = 0,
	_defaults = {
		title: '',
		content: '',
		visible: true,
		width: null,
		height: null,
		button: null,
		time: 0,
		lock: true,
		maskName: '',
		skin: '',
		okText: '确定',
		ok: null,
		cancel: null,
		cancelText: '取消',
		parent: null,
		openAnimate: null,
		closeAnimate: null
	},
	// 可用 dialog._$(name) 获取 data-dom 的jQuery对象
	// 已知dom:  wrap,dialog,title,content,foot,buttons,head
	_template = 
		'<div class="ui-dialog">'
			+ '<div class="ui-dialog-inner" data-dom="dialog">'
				+ '<div class="ui-dialog-head" data-dom="head">'
					+ '<h3 class="ui-dialog-title" data-dom="title"></h3>'
					+ '<a class="ui-dialog-close" href="javascript:;" data-dom="close">×</a>'
				+ '</div>'
				+ '<div class="ui-dialog-body" data-dom="body"></div>'
				+ '<div class="ui-dialog-foot" data-dom="foot">'
					+ '<div class="ui-dialog-btns" data-dom="buttons"></div>'
				+ '</div>'
			+ '</div>'
		+'</div>'

var Dialog = function(config) {
	// 配置分析
	config = config || {};//如果没有配置参数

    if (typeof config === 'string') {
        config = {
            content: config
        }
    }
    // 合并默认配置
    config = TC.extend({}, _defaults, config)

    if (!TC.isArray(config.button)) {
        config.button = [];
    }

    // 确定按钮
    if (config.ok) {//如果有确认按钮则追加到button数组里
        config.button.push({
            id: 'ok',
            text: config.okText,
            cb: config.ok,
            highlight: true//高亮
        })
    }

    // 取消按钮
    if (config.cancel) {//如果有取消按钮则追加到button数组里
        config.button.push({
            id: 'cancel',
            text: config.cancelText,
            cb: config.cancel
        });
    }

    config.id = config.id || 'dialog-' + _count++;

    if ( Dialog.list[config.id] ) {
    	return Dialog.list[config.id]
    }
     
	return Dialog.list[config.id] = new Dialog.fn._create(config)
}

//jQuery式无需new返回新实例
Dialog.fn = Dialog.prototype = {
	visible: function() {
		var $dialog = this._$('wrap')

		
		$dialog.addClass('ui-dialog-visible')
		this.config.openAnimate ?
			this.config.openAnimate($dialog) :
			this._$('wrap').show()
		return this
	},
	hide: function() {
		this._$('wrap')
			.removeClass('ui-dialog-visible')
			.fadeOut()

		this.time().unlock()

		return this
	},
	close: function() {
		var self = this,
			$dialog = this._$('wrap')

		self.time().unlock()

		this.config.closeAnimate ?
			this.config.closeAnimate($dialog) :
			this._$('wrap').fadeOut('fast', function() {
				$(this).remove()
			})

		delete Dialog.list[self.config.id]
		//删除，减少资源
		for(var i in self){
		    delete self[i]
		}

		return self
	},
	title: function(text) {
		if (text) {
			this._$('title').html(text)
				.parent().show()
		} else {
			this._$('title')
				.parent().empty().hide()
		}
		return this
	},
	content: function(content) {
		this._$('body').html(content)
		return this
	},
	width: function(width) {
		if ( TC.type(width) === 'number' ) {
			this._$('body').width(width)
		}
		return this
	},
	height: function(height) {
		if ( TC.type(height) === 'number' ) {
			this._$('body').height(height)
		}
		return this
	},
	button: function(arr) {
		var buttons = this._$('buttons')[0],
			callback = this._callback,
			arr = arr || []

		var i, el, len, text, button, className, id
		for (i = 0, len = arr.length; i < len; i++) {
			el = arr[i]
			id = el.id
			button = document.createElement('button')
			className = 'ui-dialog-btn' //按钮class
			//如果高亮
			if(el.highlight){
                className += ' ui-dialog-btn-on'
            }
            //如果配置的按钮有class则追加下
            if(el.className){
                className += ' '+ el.className
            }
            button.innerHTML = el.text
        	button.className = className
        	button.setAttribute('callback', id); //为了委托事件用
        	callback[id] = {}
        	//如果有回调
        	if (el.cb) {
        	    callback[id].cb = el.cb
        	}

        	buttons.appendChild(button)
		}

		buttons.style.display = arr.length ? '' : 'none';

        return this
	},
	/**
	 * 定时关闭
	 * @param {Number} 单位秒, 无参数则停止计时器
	 */
	time: function(time) {
	    var self = this,
	        timer = self._timer;

	    timer && clearTimeout(timer);

	    if (time) {
	        self._timer = setTimeout(function() {
	            self._click('close')
	        }, time)
	    }

	    return self
	},
	lock: function(maskName) {
		var div = document.createElement("div"),
			className = 'ui-dialog-mask'

		if (maskName) {
			className += ' ' + maskName
		}

		div.className = className

		document.body.appendChild(div)

		this._dom.mask = $(div).fadeIn()

		return this
	},
	unlock: function() {
		this._$('mask').fadeOut().remove()
	},
	_create: function(config) {
		var self = this

		self._callback = {} //按钮事件空间
		self._dom = {} //jQuery对象
		self._createHTML(config)
		self.config = config

		self._$('close').on('click', function(){
		    self._click("cancel")
		})

		config.skin && self._$('wrap').addClass(config.skin);//设置皮肤

		self.title(config.title) //设置标题
		    .content(config.content) //设置内容
		    .width(config.width) //设置宽高
		    .height(config.height) //设置宽高
		    .button(config.button) //设置按钮
		    .time(config.time)//设置自动关闭
		    ._addEvent()//绑定事件

		config.lock && self.lock(config.maskName);//如果有遮罩

		self[config.visible ? 'visible' : 'hide']();

		return self;
	},
	// 创建元素
	_createHTML: function(config) {
		var $wrap = $(_template),
			$parent = config.parent ? $(config.parent) : $(document.body)

		$parent.append($wrap)
		this._dom.wrap = $wrap

		return this
	},
	//获取jQuery对象
    _$: function(i){
        var dom = this._dom;
        return dom[i] || (dom[i] = dom.wrap.find('[data-dom=' + i + ']'));
    },
    // 事件代理
    _addEvent: function() {
    	var self = this
    	self._$("buttons").on("click", "button", function(){
    	    var callbackID,
    	        $this = $(this);

	        callbackID = $this.attr('callback');
	        callbackID && self._click(callbackID);
    	})

    	return this
    },
    // 按钮回调函数触发
    _click: function(id) {
    	var self = this,
    	    fn = self._callback[id] && self._callback[id].cb;
    	return (typeof fn !== 'function' || fn.call(self) !== false) ?
    	    self.close() : self;
    }
}

Dialog.fn._create.prototype = Dialog.fn;

Dialog.version = '0.0.1'

Dialog.list = {}

Dialog.get = function(id) {
    if(id) {
        return Dialog.list[id];
    } 
}

// ================================================ API ==============================

Dialog.alert = function(options) {	
	if ("string" === typeof options) {
	    options = {
	        content: options
	    }
	}

	return Dialog( TC.extend({
	    ok: true
	},options));
}

Dialog.confirm = function(txt, okfn, cancelfn) {
	var options = {
		title: '提示消息',
	    content: txt ? txt : '',
	    ok: okfn ? okfn : true,
	    cancel: cancelfn ? cancelfn : true
	}

	return Dialog( options );
}

Dialog.tips = function(options, icon, time) {
	if ("string" === typeof options) {
	    options = {
	        content: options,
	        time: time
	    }
	};
    var iconClass = icon ? 'msc-dialog-tips-icon msc-dialog-tips-'+ icon +'-icon' : ''
    options = options || {}
    options.skin = 'msc-dialog-tips'
	options.content = '<div class="' + iconClass + '">' + options.content + '</div>'
	options.time = options.time || 2*1e3

	return Dialog(options)
}

Dialog.notify = function(msg, time) {
	var $noticeWrap = Dialog.notify.wrap || $('<div>',{
		'class': 'ui-dialog-notify-fixed'
	}).appendTo( $(document.body) )

	Dialog.notify.wrap = $noticeWrap
	if (time != null) {
		time = time*1e3
	}
	return Dialog({
		title: '番茄来了提醒您 ',
		skin: 'ui-dialog-notice',
		content: msg,
		lock: false,
		ok: true,
		time: time,
		parent: $noticeWrap,
		openAnimate: function($dialog){
			var h = $dialog.height()

			$dialog.height(0)
				.animate({height: h}, 'slow')
		},
		closeAnimate: function($dialog){
			$dialog.animate({height: 0}, 'slow', function(){
				$(this).remove()
			})
		}
	})
}

Dialog.loading = function(msg) {
	var api = Dialog.get("dialog-loading"),
		maskName = 'ui-dialog-mask-white',
		content

	msg = msg == null ? '拼命加载中...' : msg
	content = '<div class="ui-dialog-loading" title="加载中">' + msg + '</div>'

	if (api) 
		return api.lock(maskName).content(content).visible()

	return Dialog({
		id: 'dialog-loading',
		skin: 'msc-dialog-loading',
		content: content,
		maskName: maskName
	})
}

Dialog.loading.close = function() {
	var api = Dialog.get("dialog-loading")
    if(api){
        api.hide()
    	api = null
    }
}

Dialog.mask = function() {
	var $mask = Dialog.mask.$mask || 
		$('<div>',{'class': 'ui-dialog-mask'})
			.appendTo( $(document.body) )

	Dialog.mask.$mask = $mask.fadeIn()
}

Dialog.mask.close = function() {
	Dialog.mask.$mask && Dialog.mask.$mask.fadeOut()
}

module.exports = Dialog
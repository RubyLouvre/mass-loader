!function( global, DOC ){//v19.1
    var $$ = global.$//保存已有同名变量
    var rmakeid = /(#.+|\W)/g;
    var NsKey = DOC.URL.replace( rmakeid,"")
    var NsVal = global[ NsKey ];//公共命名空间
    var W3C   = DOC.dispatchEvent //w3c事件模型
    var HTML  = DOC.documentElement;
    var head  = DOC.head || DOC.getElementsByTagName( "head" )[0]
    var loadings = [];//正在加载中的模块列表
    var mass = 1;//当前框架的版本号
    var postfix = "";//用于强制别名
    var cbi = 1e5 ; //用于生成回调函数的名字
    var all = "lang_fix,lang,support,class,query,data,node,attr_fix,attr,css_fix,css,event_fix,event,ajax,fx"
    var class2type = {
        "[object HTMLDocument]"   : "Document",
        "[object HTMLCollection]" : "NodeList",
        "[object StaticNodeList]" : "NodeList",
        "[object IXMLDOMNodeList]": "NodeList",
        "[object DOMWindow]"      : "Window"  ,
        "[object global]"         : "Window"  ,
        "null"                    : "Null"    ,
        "NaN"                     : "NaN"     ,
        "undefined"               : "Undefined"
    }
    var toString = class2type.toString;
    function $( expr, context ){//新版本的基石
        if( $.type( expr,"Function" ) ){ //注意在safari下,typeof nodeList的类型为function,因此必须使用$.type
            return  $.require( all+",ready", expr );
        }else{
            if( !$.fn )
                throw "node module is required!"
            return new $.fn.init( expr, context );
        }
    }
    //多版本共存
    if( typeof NsVal !== "function"){
        NsVal = $;//公用命名空间对象
        NsVal.uuid = 1;
    }
    if(NsVal.mass !== mass  ){
        NsVal[ mass ] = $;//保存当前版本的命名空间对象到公用命名空间对象上
        if(NsVal.mass || ($$ && $$.mass == null)) {
            postfix = ( mass + "" ).replace(/\D/g, "" ) ;//是否强制使用多库共存
        }
    }else{
        return;
    }
    /**
     * 糅杂，为一个对象添加更多成员
     * @param {Object} receiver 接受者
     * @param {Object} supplier 提供者
     * @return  {Object} 目标对象
     */
    var has = Object.prototype.hasOwnProperty
    function mix( receiver, supplier ){
        var args = Array.apply([], arguments ),i = 1, key,//如果最后参数是布尔，判定是否覆写同名属性
        ride = typeof args[args.length - 1] == "boolean" ? args.pop() : true;
        if(args.length === 1){//处理$.mix(hash)的情形
            receiver = !this.window ? this : {} ;
            i = 0;
        }
        while((supplier = args[i++])){
            for ( key in supplier ) {//允许对象糅杂，用户保证都是对象
                if ( has.call(supplier,key) && (ride || !(key in receiver))) {
                    receiver[ key ] = supplier[ key ];
                }
            }
        }
        return receiver;
    }

    mix( $, {//为此版本的命名空间对象添加成员
        html: HTML,
        head: head,
        mix: mix,
        rword: /[^, ]+/g,
        mass: mass,//大家都爱用类库的名字储存版本号，我也跟风了
        "@bind": W3C ? "addEventListener" : "attachEvent",
        //将内部对象挂到window下，此时可重命名，实现多库共存  name String 新的命名空间
        exports: function( name ) {
            $$ && ( global.$ = $$ );//多库共存
            name = name || $.config.nick;//取得当前简短的命名空间
            $.config.nick = name;
            global[ NsKey ] = NsVal;
            return global[ name ]  = this;
        },
        /**
         * 数组化
         * @param {ArrayLike} nodes 要处理的类数组对象
         * @param {Number} start 可选。要抽取的片断的起始下标。如果是负数，从后面取起
         * @param {Number} end  可选。规定从何处结束选取
         * @return {Array}
         */
        slice: function ( nodes, start, end ) {
            var ret = [], n = nodes.length;
            if(end === void 0 || typeof end == "number" && isFinite(end)){
                start = parseInt(start,10) || 0;
                end = end == void 0 ? n : parseInt(end, 10);
                if(start < 0){
                    start += n;
                }
                if(end > n){
                    end = n;
                }
                if(end < 0){
                    end += n;
                }
                for (var i = start; i < end; ++i) {
                    ret[i - start] = nodes[i];
                }
            }
            return ret;
        },
        /**
         * 用于取得数据的类型（一个参数的情况下）或判定数据的类型（两个参数的情况下）
         * @param {Any} obj 要检测的东西
         * @param {String} str 可选，要比较的类型
         * @return {String|Boolean}
         */
        type: function ( obj, str ){
            var result = class2type[ (obj == null || obj !== obj ) ? obj :  toString.call( obj ) ] || obj.nodeName || "#";
            if( result.charAt(0) === "#" ){//兼容旧式浏览器与处理个别情况,如window.opera
                //利用IE678 window == document为true,document == window竟然为false的神奇特性
                if( obj == obj.document && obj.document != obj ){
                    result = 'Window'; //返回构造器名字
                }else if( obj.nodeType === 9 ) {
                    result = 'Document';//返回构造器名字
                }else if( obj.callee ){
                    result = 'Arguments';//返回构造器名字
                }else if( isFinite( obj.length ) && obj.item ){
                    result = 'NodeList'; //处理节点集合
                }else{
                    result = toString.call( obj ).slice( 8, -1 );
                }
            }
            if( str ){
                return str === result;
            }
            return result;
        },
        //$.log(str, showInPage=true, 5 )
        //level Number，通过它来过滤显示到控制台的日志数量。0为最少，只显示最致命的错误，
        //7则连普通的调试消息也打印出来。 显示算法为 level <= $.config.level。
        //这个$.colre.level默认为9。下面是level各代表的含义。
        //0 EMERGENCY 致命错误,框架崩溃
        //1 ALERT 需要立即采取措施进行修复
        //2 CRITICAL 危急错误
        //3 ERROR 异常
        //4 WARNING 警告
        //5 NOTICE 通知用户已经进行到方法
        //6 INFO 更一般化的通知
        //7 DEBUG 调试消息
        log: function (str){
            var  show = true, page = false
            for(var i = 1 ; i < arguments.length; i++){
                var el = arguments[i]
                if(typeof el == "number"){
                    show = el <=  $.config.level
                }else if(el === true){
                    page = true;
                }
            }
            if(show){
                if( page === true ){
                    $.require( "ready", function(){
                        var div =  DOC.createElement("pre");
                        div.className = "mass_sys_log";
                        div.innerHTML = str +"";//确保为字符串
                        DOC.body.appendChild(div)
                    });
                }else if( global.console ){
                    global.console.log( str );
                }
            }
            return str
        },
        //主要用于建立一个从元素到数据的引用，具体用于数据缓存，事件绑定，元素去重
        getUid: global.getComputedStyle ? function( obj ){//IE9+,标准浏览器
            return obj.uniqueNumber || ( obj.uniqueNumber = NsVal.uuid++ );
        }: function( obj ){
            if(obj.nodeType !== 1){//如果是普通对象，文档对象，window对象
                return obj.uniqueNumber || ( obj.uniqueNumber = NsVal.uuid++ );
            }//注：旧式IE的XML元素不能通过el.xxx = yyy 设置自定义属性
            var uid = obj.getAttribute("uniqueNumber");
            if ( !uid ){
                uid = NsVal.uuid++;
                obj.setAttribute( "uniqueNumber", uid );
            }
            return +uid;//确保返回数字
        },
        /**
         * 生成键值统一的对象，用于高速化判定
         * @param {Array|String} array 如果是字符串，请用","或空格分开
         * @param {Number} val 可选，默认为1
         * @return {Object}
         */
        oneObject : function( array, val ){
            if( typeof array == "string" ){
                array = array.match( $.rword ) || [];
            }
            var result = {}, value = val !== void 0 ? val :1;
            for(var i = 0, n = array.length; i < n; i++){
                result[ array[i] ] = value;
            }
            return result;
        },
        config: function( settings ) {
            var kernel  = $.config;
            for ( var p in settings ) {
                if (!settings.hasOwnProperty( p ))
                    continue
                var prev = kernel[ p ];
                var curr = settings[ p ];
                if (prev && p === 'alias') {
                    for (var c in curr) {
                        if (curr.hasOwnProperty( c )) {
                            var prevValue = prev[ c ];
                            var currValue = curr[ c ];
                            if( prevValue && prev !== curr ){
                                throw new Error(c + "不能重命名")
                            }
                            prev[ c ] = currValue;
                        }
                    }
                } else {
                    kernel[ p ] = curr;
                }
            }
            return this
        }
    });
    (function(scripts, cur){
        cur = scripts[ scripts.length - 1 ];//FF下可以使用DOC.currentScript
        var url = cur.hasAttribute ?  cur.src : cur.getAttribute( 'src', 4 );
        url = url.replace(/[?#].*/, '');
        var a = cur.getAttribute("debug");
        var kernel = $.config;
        kernel.debug = a == 'true' || a == '1';
        kernel.base = url.substr( 0, url.lastIndexOf('/') ) +"/";
        kernel.nick = cur.getAttribute("nick") || "$";
        kernel.alias = {};
        kernel.level = 9;

    })(DOC.getElementsByTagName( "script" ));

    $.noop = $.error =  function(){};

    "Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList".replace( $.rword, function( name ){
        class2type[ "[object " + name + "]" ] = name;
    });

    function parseURL(url, parent, ret){
        //[]里面，不是开头的-要转义，因此要用/^[-a-z0-9_$]{2,}$/i而不是/^[a-z0-9_-$]{2,}
        //别名至少两个字符；不用汉字是避开字符集的问题
        if( /^(mass|ready)$/.test(url)){//特别处理ready标识符
            return [url, "js"];
        }
        if(/^[-a-z0-9_$]{2,}$/i.test(url) && $.config.alias[url] ){
            ret = $.config.alias[url];
        }else{
            parent = parent.substr( 0, parent.lastIndexOf('/') )
            if(/^(\w+)(\d)?:.*/.test(url)){  //如果用户路径包含协议
                ret = url
            }else {
                var tmp = url.charAt(0);
                if( tmp !== "." && tmp != "/"){  //相对于根路径
                    ret = $.config.base + url;
                }else if(url.slice(0,2) == "./"){ //相对于兄弟路径
                    ret = parent + url.substr(1);
                }else if( url.slice(0,2) == ".."){ //相对于父路径
                    var arr = parent.replace(/\/$/,"").split("/");
                    tmp = url.replace(/\.\.\//g,function(){
                        arr.pop();
                        return "";
                    });
                    ret = arr.join("/")+"/"+tmp;
                }else if(tmp == "/"){
                    ret = parent  + url
                }else{
                    throw new Error("不符合模块标识规则: "+url)
                }
            }
        }
        var ext = "js";
        tmp = ret.replace(/[?#].*/, "");
        if(/\.(\w+)$/.test( tmp )){
            ext = RegExp.$1;
        }
        if( ext!="css" &&tmp == ret && !/\.js$/.test(ret)){//如果没有后缀名会补上.js
            ret += ".js";
        }
        return [ret, ext];
    }

    var modules = $.modules =  {
        ready:{ },
        mass: {
            state: 2,
            exports: $
        }
    };
    $.mix({
        //绑定事件(简化版)
        bind: W3C ? function( el, type, fn, phase ){
            el.addEventListener( type, fn, !!phase );
            return fn;
        } : function( el, type, fn ){
            el.attachEvent && el.attachEvent( "on"+type, fn );
            return fn;
        },
        unbind: W3C ? function( el, type, fn, phase ){
            el.removeEventListener( type, fn || $.noop, !!phase );
        } : function( el, type, fn ){
            if ( el.detachEvent ) {
                el.detachEvent( "on" + type, fn || $.noop );
            }
        },

        //定义模块
        //检测死链
        _checkFail : function(  doc, id, error ){
            doc && (doc.ok = 1);
            if( error || !modules[ id ].state ){
                throw new Error("Failed to load [[ "+id+" ]]"+modules[ id ].state);
            }
        },
        //检测是否存在循环依赖
        _checkCycle : function( deps, nick ){
            for(var id in deps){
                if( deps[id] == "司徒正美" && modules[id].state != 2 &&( id == nick || $._checkCycle(modules[id].deps, nick))){
                    return true;
                }
            }
        },
        //检测此JS模块的依赖是否都已安装完毕,是则安装自身
        _checkDeps: function (){
            loop:
            for ( var i = loadings.length, id; id = loadings[ --i ]; ) {
                var obj = modules[ id ], deps = obj.deps;
                for( var key in deps ){
                    if( deps.hasOwnProperty( key ) && modules[ key ].state != 2 ){
                        continue loop;
                    }
                }
                //如果deps是空对象或者其依赖的模块的状态都是2
                if( obj.state != 2){
                    loadings.splice( i, 1 );//必须先移除再安装，防止在IE下DOM树建完后手动刷新页面，会多次执行它
                    fireFactory( obj.id, obj.args, obj.factory);
                    $._checkDeps();
                }
            }
        }
    });
   
    function loadJS( url, parent ){
        var iframe = DOC.createElement("iframe"),//IE9的onload经常抽疯,IE10 untest
        codes = ['<script>var nick ="', url, '", $ = {}, Ns = parent.', $.config.nick,
        '; $.define = ', innerDefine, ';var define = $.define;<\/script><script src="',url,'" ',
        (DOC.uniqueID ? 'onreadystatechange="' : 'onload="'),
        "if(/loaded|complete|undefined/i.test(this.readyState) ){  Ns._checkDeps(); ",
        'Ns._checkFail(self.document, nick);}',
        '" onerror="Ns._checkFail(self.document, nick, true);" ><\/script>' ];
        iframe.style.display = "none";//opera在11.64已经修复了onerror BUG
        //http://www.tech126.com/https-iframe/ http://www.ajaxbbs.net/post/webFront/https-iframe-warning.html
        if( !"1"[0] ){//IE6 iframe在https协议下没有的指定src会弹安全警告框
            iframe.src = "javascript:false"
        }
        head.insertBefore( iframe, head.firstChild );
        var doc = iframe.contentDocument || iframe.contentWindow.document;//w3c || ie
        doc.write( codes.join('') );
        doc.close();
        $.bind( iframe, "load", function(){
            if( global.opera && doc.ok != 1 ){//ok写在$._checkFail里面
                $._checkFail(doc, url, true );//模拟opera的script onerror
            }
            doc.write( "<body/>" );//清空内容
            head.removeChild( iframe );//移除iframe
            iframe = null;
        });
    }

    function loadCSS(url){
        var id = url.replace(rmakeid,"");
        if (!DOC.getElementById(id)){
            var node     =  DOC.createElement("link");
            node.rel     = "stylesheet";
            node.href    = url;
            node.id      = id;
            head.insertBefore( node, head.firstChild );
        }
    }
    var innerDefine = function(){
        var args = Array.apply([],arguments);
        if(typeof args[0] == "string"){
            args.shift()
        }
        args.push( nick );  //劫持第一个参数,置换为当前JS文件的URL
        parent.define.apply(parent, args);  //将iframe中的函数转换为父窗口的函数
    }
    //请求模块（依赖列表,模块工厂,加载失败时触发的回调）
    window.require = $.require = function( list, factory, parent ){
        var deps = {}, // 用于检测它的依赖是否都为2
        args = [],      // 用于依赖列表中的模块的返回值
        dn = 0,         // 需要安装的模块数
        cn = 0;         // 已安装完的模块数
        String(list).replace( $.rword, function(el){
            var array = parseURL(el, parent || $.config.base ), url = array[0];
            if(array[1] == "js"){
                dn++
                //如果没有注册，则先尝试通过本地获取，如果本地不存在或不支持，则才会出请求
                if( (!modules[ url ])  ){
                    modules[ url ] = {
                        id: url,
                        parent: parent,
                        exports: {}
                    };
                    loadJS( url, parent );
                }else if( modules[ url ].state === 2 ){
                    cn++;
                }
                if( !deps[ url ] ){
                    args.push( url );
                    deps[ url ] = "司徒正美";//去重
                }
            }else if(array[1] === "css"){
                loadCSS( url );
            }
        });
        var id = parent || "cb"+ ( cbi++ ).toString(32);
        //创建或更新模块的状态
        modules[id] = {
            id: id,
            factory: factory,
            deps: deps,
            args: args,
            state: 1
        }
        //在正常情况下模块只能通过_checkDeps执行
        loadings.unshift( id );
        $._checkDeps();//FIX opera BUG。opera在内部解析时修改执行顺序，导致没有执行最后的回调
    }
    window.define = $.define = function(deps, factory, id){
        var args = Array.apply([],arguments);
        if( typeof deps === "boolean" ){//用于文件合并, 在标准浏览器中跳过补丁模块
            if( deps ){
                return;
            }
            args.shift()
        }
        if( args.length === 2 ){//处理只有两个参数的情况,补允依赖列表
            args.unshift([])
        }
        factory = args[1];
        id = args[2];
        if($._checkCycle( $.modules[id].deps, id) ){
            throw new Error( id +"模块与之前的某些模块存在循环依赖")
        }
        if(typeof factory == "function"){
            args[1] = Function("return " + factory )()
        }else{
            throw new Error( id +" 的factory必须是一个函数")
        }
        $.require.apply( $, args ); //deps, factory, id
    }
    define.amd = modules;
    //从returns对象取得依赖列表中的各模块的返回值，执行factory, 完成模块的安装
    function fireFactory( id, deps, factory){
        for ( var i = 0, array = [], d; d = deps[i++]; ) {
            array.push( modules[ d ].exports );
        }
        var module = Object( modules[id] ), ret;
        ret =  factory.apply(global, array);
        module.state = 2;
        $.log("加载" + id+" 模块成功!")
        if( ret !== void 0 ){
            modules[ id ].exports = ret
        }
        return ret;
    }
    all.replace($.rword,function(a){
        $.config.alias[ "$"+a ] = $.config.base + a + ".js"
    });
    //domReady机制
    var readyFn, ready =  W3C ? "DOMContentLoaded" : "readystatechange" ;
    function fireReady(){
        modules[ "ready" ].state = 2;
        $._checkDeps();
        if( readyFn ){
            $.unbind( DOC, ready, readyFn );
        }
        fireReady = $.noop;//隋性函数，防止IE9二次调用_checkDeps
    };
    function doScrollCheck() {
        try {
            HTML.doScroll( "left" ) ;
            fireReady();
        } catch(e) {
            setTimeout( doScrollCheck, 31 );
        }
    };

    if ( DOC.readyState === "complete" ) {
        fireReady();//如果在domReady之外加载
    }else {
        $.bind( DOC, ready, readyFn = function(){
            if ( W3C || DOC.readyState === "complete" ){
                fireReady();
            }
        });
        if( HTML.doScroll && self.eval === parent.eval)
            doScrollCheck();
    }

    global.VBArray && ("abbr,article,aside,audio,bdi,canvas,data,datalist,details,figcaption,figure,footer," +
        "header,hgroup,mark,meter,nav,output,progress,section,summary,time,video").replace( $.rword, function( tag ){
        DOC.createElement(tag);
    });

    //https://developer.mozilla.org/en/DOM/window.onpopstate
    $.bind( global, "popstate", function(){
        NsKey = DOC.URL.replace(rmakeid,'');
        $.exports();
    });
    $.exports( $.config.nick +  postfix );//防止不同版本的命名空间冲突
/*combine modules*/

}( self, self.document );//为了方便在VS系列实现智能提示,把这里的this改成self或window
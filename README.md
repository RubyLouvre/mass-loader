mass-loader
===========

<p>模块加载器 19基于iframe，兼容性与可靠性最强</p>
<p>扼要教程</p>
<pre>
require("./aaa,./bbb", function(a, b){
    alert(a+b)//3
});
</pre>
<p>aaa.js,bbb.js的内容很简单</p>
<pre>
//aaa.js
define("aaa", function(){
   return 1
});
//bbb.js
define("bbb", function(){
   return 1
});
</pre>
<p>从v19起，define与require已经完全独立成全局函数，不再依赖于$了，成为一个纯粹的加载器。</p>
<pre>
&lt;script src="mass.js"&gt;  &lt;/script&gt;
&lt;script &gt;
    require("menu,ready",function($){
        $('ul.sf-menu').menu();
    });
&lt;/script&gt;
</pre>
<p>它在firebug中打印调试信息如下：</p>
<img src="http://images.cnblogs.com/cnblogs_com/rubylouvre/199042/o_massv20ff.jpg"/>
可以看到它是非常易于调试的。如果想屏蔽它们，将$.config.level = 8就行了。

它的加载请求图如下，可以看到它是货真价实的并行加载器。如果一个模块的直接依赖不超过浏览器的最大请求数，它会同时发出请求进行处理。
<img src="http://images.cnblogs.com/cnblogs_com/rubylouvre/199042/o_massv20net.jpg"/>
<p>IE10的情况</p>
<img src="http://images.cnblogs.com/cnblogs_com/rubylouvre/199042/r_massv20ie10.jpg"/>


历史回顾！不断完善，臻于完美！
<pre>
/*
v17 http://www.cnblogs.com/rubylouvre/archive/2012/08/30/2662477.html
v16 http://www.cnblogs.com/rubylouvre/archive/2012/04/26/2470700.html
v15 http://www.cnblogs.com/rubylouvre/archive/2012/01/30/2329342.html
v14 http://www.cnblogs.com/rubylouvre/archive/2011/12/19/2293878.html
v13 http://www.cnblogs.com/rubylouvre/archive/2011/11/17/2251868.html
v12 http://www.cnblogs.com/rubylouvre/archive/2011/10/27/2226228.html
v11 http://www.cnblogs.com/rubylouvre/archive/2011/10/09/2203826.html
v10 http://www.cnblogs.com/rubylouvre/archive/2011/09/25/2189529.html
v9 http://www.cnblogs.com/rubylouvre/archive/2011/08/22/2147058.html
v8 http://www.cnblogs.com/rubylouvre/archive/2011/08/08/2129951.html
v7 http://www.cnblogs.com/rubylouvre/archive/2011/08/05/2127791.html
v6 http://www.cnblogs.com/rubylouvre/archive/2011/07/12/2104777.html
v5 http://www.cnblogs.com/rubylouvre/archive/2011/04/12/2011175.html
v4 http://www.cnblogs.com/rubylouvre/archive/2011/03/01/1968397.html
v3 http://www.cnblogs.com/rubylouvre/archive/2011/02/11/1951104.html
v2 没有保留下来
v1 没有保留下来
*/
</pre>

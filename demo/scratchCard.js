/**
 * Created by zhhr on 2018/5/23.
 */
 ;(function(undefined){
    "use strict"
    function ScratchCard(conf){
        this.query = conf.id;
        this.maskColor = conf.maskColor;
        this.maskImage = conf.maskImage;
        this.maskBack = conf.maskBack;
        this.openPercent = conf.openPercent;
        this.progressBack = conf.progressBack;
        this.endBack = conf.endBack;
        this.endHide = conf.endHide;
        this.dpi = conf.dpi || window.devicePixelRatio || 1;
        this.canvas = null;
        this.paint = null;
        this.canvasWidth = undefined;
        this.canvasHeight = undefined;
        if(this.query && typeof this.query==='string') {
            this.init();
        }
    }
    ScratchCard.prototype.init = function(){
        this.canvas = document.querySelector(this.query);
        if(!this.canvas || this.canvas.tagName!=='CANVAS'){
            console.error('初始化失败，元素不存在');
            return;
        }
        this.paint = this.canvas.getContext('2d');
        this.canvas.style.display = 'block';
        this.canvasWidth = this.canvas.width = this.dpi * parseInt(this.getStyle(this.canvas,'width'));
        this.canvasHeight = this.canvas.height = this.dpi * parseInt(this.getStyle(this.canvas,'height'));
        if(this.maskColor){
            this.drawMaskColor(this.maskColor);
        }
        if(this.maskImage){
            this.drawMask(this.maskImage, this.maskBack);
        }else{
            if(this.maskBack){
                this.maskBack();
            }
        }
        this.addEvent();
        return this.paint;
    };
    ScratchCard.prototype.reset = function (){
        this.init();
    };
    ScratchCard.prototype.pause = function (){
        this.removeEvent();
    };
    ScratchCard.prototype.continue = function (){
        this.addEvent();
    };
    ScratchCard.prototype.ifShowAll = function(){
        this.openPercent = this.openPercent || 0.6;
        var progress = this.getPercent();
        if(this.progressBack instanceof Function){
            this.progressBack(progress);
        }
        if( progress > this.openPercent ){
            this.paint.clearRect(0,0,this.canvas.width,this.canvas.height);
            this.removeEvent();
            if(this.endHide){
                this.canvas.style.display = 'none';
            }
            if(this.endBack instanceof Function){
                this.endBack();
            }
        }
    };
    ScratchCard.prototype.getPercent = function (){
        var imgData = this.paint.getImageData(0,0,this.canvas.width,this.canvas.height);    //获取所有数据点
        var data = imgData.data;
        var total = data.length / 4 ;
        var count = 0;
        for(var i=3; i<data.length; i+=4){
            if(data[i] === 0){
                count++;
            }
        }
        var percent = 100 * count / total ;
        percent /= 100;
        return percent;
    };
    ScratchCard.prototype.removeEvent = function (){};
    ScratchCard.prototype.addEvent = function(){
        this.removeEvent();
        var _this = this;
        var reg = /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone|Opera Mini|ucweb)/i;
        if(reg.test(navigator.userAgent)) {
            addEventTouch();
        } else {
            addEventMouse();
        }
        function addEventTouch(){
            _this.canvas.addEventListener('touchstart',touchStartHandler);
            _this.removeEvent = function(){
                _this.canvas.removeEventListener('touchstart',touchStartHandler);
            }
        }
        function touchStartHandler(ev){
            ev = ev || window.event;
            _this.touchClear(ev);
            _this.canvas.addEventListener('touchmove',touchMoveHandler);
            document.addEventListener('touchend',touchEndHandler);
        }
        function touchMoveHandler(ev){
            ev = ev || window.event;
            _this.touchClear(ev);
        }
        function touchEndHandler(ev){
            _this.canvas.removeEventListener('touchmove',touchMoveHandler);
            document.removeEventListener('touchend',touchEndHandler);
            _this.clearOldPoint();
            _this.ifShowAll();
        }
        function addEventMouse(){
            _this.canvas.addEventListener('mousedown',mouseDownHandler);
            _this.removeEvent = function(){
                _this.canvas.removeEventListener('mousedown',mouseDownHandler);
            }
        }
        function mouseDownHandler(ev){
            ev = ev || window.event;
            _this.mouseClear(ev);
            _this.canvas.addEventListener('mousemove',mouseMoveHandler);
            document.addEventListener('mouseup',mouseUpHandler);
        }
        function mouseMoveHandler(ev){
            ev = ev || window.event;
            _this.mouseClear(ev);
        }
        function mouseUpHandler(ev){
            _this.canvas.removeEventListener('mousemove',mouseMoveHandler);
            document.removeEventListener('mouseup',mouseUpHandler);
            _this.clearOldPoint();
            _this.ifShowAll();
        }
    };
    ScratchCard.prototype.touchClear = function (ev){
        ev.preventDefault();
        ev.stopPropagation();
        var bcr = this.canvas.getBoundingClientRect();
        var l1 = bcr.left;
        var t1 = bcr.top;
        var touch = ev.touches[0];
        var l2 = touch.clientX;
        var t2 = touch.clientY;
        var x = (l2 - l1) * this.dpi;
        var y = (t2 - t1) * this.dpi;
        var r = touch.radiusX * this.dpi;
        this.clearArc(this.paint,x,y,r);
    };
    ScratchCard.prototype.mouseClear = function (ev){
        ev.preventDefault();
        ev.stopPropagation();
        this.clearArc(this.paint,ev.offsetX * this.dpi,ev.offsetY * this.dpi,20);
    };
    ScratchCard.prototype.drawMaskColor = function(color){
        color = color || '#ffffff';
        if(typeof color === 'string'){
            this.paint.fillStyle = color ;
            this.paint.fillRect( 0, 0, this.canvasWidth, this.canvasHeight);
        }
    };
    ScratchCard.prototype.drawMask = function(src,callback){
        if(src){
            this.drawImage(this.paint, src, 0, 0, this.canvasWidth, this.canvasHeight, callback);
        }
    };
    ScratchCard.prototype.drawImage = function(paint,src,x,y,w,h,callback){
        var img = document.createElement('img');
        img.src = src;
        img.onload = function(){
            paint.drawImage(img,x,y,w,h);
            if(callback){
                callback();
            }
        };
        img.onerror = function(){
            console.error('图片加载失败');
        };
        return img;
    };
    ScratchCard.prototype.drawText = function(paint,conf){
        if(!conf){
            return ;
        }
        if(conf.font){
            paint.font = conf.font;
        }
        if(conf.textAlign){
            paint.textAlign = conf.textAlign;
        }
        if(conf.textBaseline){
            paint.textBaseline = conf.textBaseline;
        }
        if(conf.fillStyle){
            paint.fillStyle = conf.fillStyle;
            paint.fillText(conf.text,conf.x,conf.y);
        }else if(conf.strokeStyle){
            paint.strokeStyle = conf.strokeStyle;
            paint.strokeText(conf.text,conf.x,conf.y);
        }
    };
    ScratchCard.prototype.drawLine = function (paint,x1,y1,x2,y2,color,width,lineCap){
        paint.beginPath();
        paint.strokeStyle= color || '#000';
        paint.lineCap = lineCap || 'butt';
        paint.lineWidth = width || 1;
        paint.moveTo(x1,y1);
        paint.lineTo(x2,y2);
        paint.stroke();
        paint.closePath();
    };
    ScratchCard.prototype.clearArc = function (paint,x,y,r) {
        if(typeof this.ox === 'number'){
            this.pointCut(paint,this.ox,this.oy,x,y,r)
        }
        paint.globalCompositeOperation = "destination-out";
        paint.beginPath();
        paint.arc(x, y, r, 0, Math.PI * 2);
        paint.strokeStyle = "rgba(250,250,250,0)";
        paint.fill();
        paint.closePath();
        paint.globalCompositeOperation = "source-over";
        this.saveOldPoint(x,y,r);
    };
    ScratchCard.prototype.pointCut = function (paint,xa,ya,xb,yb,r){
        var diffY = (yb - ya);
        var diffX = (xb - xa);
        var diffL = Math.sqrt(diffY * diffY + diffX * diffX);
        var angle;
        if(xb < xa){
            angle = Math.atan(diffY/diffX) - Math.PI
        }else if(xb > xa){
            angle = Math.atan(diffY/diffX);
        }else if(xb === xa){
            if(yb < ya){
                angle = -Math.PI / 2;
            }else{
                angle = Math.PI / 2;
            }
        }
        paint.save();
        paint.translate(xa,ya);
        paint.rotate(angle);
        paint.clearRect(0, -r, diffL, 2*r);
        paint.restore();
    };
    ScratchCard.prototype.saveOldPoint = function (x,y,r){
        this.ox = x;
        this.oy = y;
        this.or = r;
    };
    ScratchCard.prototype.clearOldPoint = function (){
        this.ox = undefined;
        this.oy = undefined;
        this.or = undefined;
    };
    ScratchCard.prototype.getStyle = function (dom,name){
        if (dom.currentStyle) {
            return dom.currentStyle[name];
        }else{
            return getComputedStyle(dom,false)[name];
        }
    };
    ScratchCard.prototype.paintImage = function(src,x,y,w,h,callback,dpi){
        dpi = dpi || this.dpi || 1;
        this.drawImage(this.paint,src,x * dpi,y * dpi,w * dpi,h * dpi,callback);
    };
    ScratchCard.prototype.paintText = function(conf,dpi){
        dpi = dpi || this.dpi || 1;
        if(conf){
            conf.x *= dpi;
            conf.y *= dpi;
            if(conf.font){
                conf.font = fontFix(conf.font,dpi);
            }
            this.drawText(this.paint,conf);
        }
        function fontFix(txt,dpi){
            var reg = /\b\d+px\b/g;
            dpi = dpi || 1;
            var a = txt.match(reg);
            var b = txt.split(reg);
            if(a){
                var t = '';
                for(var i=0;i<a.length;i++){
                    a[i] = parseInt(a[i])*dpi + 'px';
                }
                for(var j=0;j<b.length;j++){
                    t +=b[j];
                    if(j<a.length){
                        t +=a[j];
                    }
                }
                return t;
            }
            return txt;
        }
    };
    ScratchCard.prototype.paintLine = function(x1,y1,x2,y2,color,width,lineCap,dpi){
        dpi = dpi || this.dpi || 1;
        width = width || 1;
        this.drawLine(this.paint,x1 * dpi,y1 * dpi,x2 * dpi,y2 * dpi,color,width * dpi,lineCap)
    };
    
    var _global = (function(){ return this || (0, eval)('this'); }());
    if (typeof module !== "undefined" && module.exports) {
        module.exports = ScratchCard;
    } else if (typeof define === "function" && define.amd) {
        define(function(){return ScratchCard;});
    } else {
        !('ScratchCard' in _global) && (_global.ScratchCard = ScratchCard);
    }
})();
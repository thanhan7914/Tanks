var socket=io();
var ping;
var delay=0;
var delaymsg=0;
var chat=true;
var pos=new Point(0,0);
var sizeWidth=4400,sizeHeight=4400;
var name;

//Object Tank
var Tank=function(x,y,color,name,f,bullet,helth){
	this.x=x;
	this.y=y;
	this.color=color;
	this.name=name;
	this.f=f;
	this.helth=helth;
	this.shape=[[0,1,0,1,1,1,1,0,1],[1,0,1,1,1,1,0,1,0],[0,1,1,1,1,0,0,1,1],[1,1,0,0,1,1,1,1,0]];
	this.bullet=bullet;
}

Tank.prototype.draw=function(g,pos){
	g.fillStyle = this.color;
	for(var i=0;i<this.shape[this.f].length;i++){
		var c=i%3,r=(i-c)/3;
		g.fillRect(this.x+c*22+0.2+pos.x,this.y+r*22+0.2+pos.y,21.6*this.shape[this.f][i],21.6*this.shape[this.f][i]);
	}
	
	var dy=this.y+pos.y;
	dy=this.f==0?dy+22*3+18:dy;
	
	g.fillStyle = "green";
	g.fillRect(this.x+pos.y,dy-4,22*3,2);
	g.fillStyle = "red";
	g.fillRect(this.x+pos.x,dy-4,22*3*(this.helth/10),2);
	g.font='10px Arial';
	g.fillText(this.name,this.x+pos.x,dy-6);
	
	for(var i=this.bullet.length-1;i>-1;i--)
    	this.bullet[i].fire(g,pos);
}

//Object Bullet
var Bullet=function(x,y,color){
	this.x=x;
	this.y=y;
	this.color=color;
}

Bullet.prototype.fire=function(g,pos){
	g.fillStyle = this.color;
	g.fillRect(this.x+pos.x,this.y+pos.y,22,22);
}

//Canvas

var _canvas=document.getElementById("canvas");
var _context=_canvas.getContext("2d");
var width=window.innerWidth-10;
var height=window.innerHeight-10;
_canvas.width=width;
_canvas.height=height;
var cols=Math.floor(width/22);
var rows=Math.floor(height/22);
var items=[];

var drawInit=function(g){
	for(var i=0;i<Math.floor(width/22);i++){
		drawLine(g,i*22,0,i*22,height,"black",0.2);
		drawLine(g,0,i*22,width,i*22,"black",0.2);
	}
}

var drawLine=function(g,x1,y1,x2,y2,color,w){
	g.beginPath();
	g.moveTo(x1, y1);
	g.lineTo(x2, y2);
	g.lineWidth = w;

    // set line color
    g.strokeStyle = color;
    g.stroke();
}

var fillRect=function(g,x,y,w,h,color){
    g.fillStyle = color;
    g.fillRect(x,y,w,h);
}


var paint=function(g){
    for(var i=0;i<items.length;i++)
        items[i].draw(g,pos);
	
	drawInit(g);
}

var find=function(name){
	if(!name)
		return -1;
	
	for(var i=0;i<items.length;i++)
		if(items[i].name==name)
			return i;
		
	return -1;
}

var viewport=function(){
	var id=find(name);

	if(id!=-1){
		var x=items[id].x;
		var y=items[id].y;
		
		pos.x=Math.floor(cols/2)*22-x;
		pos.y=Math.floor(rows/2)*22-y;
		/*
		
		switch(items[id].f){
			case 0:
			    if(py<rows/2-1)
					pos.y-=22;
				break;
			case 1:
			   if(py>rows/2+1)
				    pos.y+=22;
				break;
			case 2:
			    if(px<cols/2-1)
					pos.x-=22;
				break;
			case 3:
			   if(px>cols/2+1)
				    pos.x+=22;
				break;
		}
		
		if(pos.x>0)
			pos.x=0;
		if(pos.y>0)
			pos.y=0;
		
		if(pos.x<-sizeWidth+width)
			pos.x=-sizeWidth+width;
		
		if(pos.y<-sizeHeight+height)
			pos.y=-sizeHeight+height;*/
	}
}

window.setInterval(function(){
	//viewport();
    _context.clearRect(0,0,width,height);
    paint(_context);
},30);

 $(function(){	
    $('*').keydown(function(e){
		var key=e.keyCode;
		console.log(e.target.nodeName+"/"+key);
		console.log(e.target.id);
        
		if(e.target.id=="tmsg"){
			if(key==13&&delaymsg<Date.now()-500){
				var msg=$('#tmsg').val();
			    $('#tmsg').val('');
				if(msg=='-ping'){
					$('#message').append('<li><p>-ping</p></li>');
					ping=Date.now();
				    socket.emit('ping');
				}else if(msg=='-clear')
					$('#message').text('');
				else if(msg!='')
		    	    socket.emit('msg',msg);
				
				delaymsg=Date.now();
			}
		}else if(e.target.id=="login"){
			if(key==13&&delay<Date.now()-500){
				var name=$('#login').val();
                $('h4.fs-subtitle').html('<font color="red">username must be at least 4 characters.</font>');
		
		        $('.dim,.box').hide();
				delay=Date.now();
		        socket.emit('login',name);
			}
		}else{
			//if(key>=37&&key<=40)
				//viewport();
			
			socket.emit('game',key);
		}
    });
	
	$('#msg').hover(function(){
		$(this).fadeTo( "fast" , 1, function() {
        });
	},function(){
		$(this).fadeTo( "fast" , 0.4, function() {
        });
	});
	
	$('#close').click(function(){
		var a=$('#msg');
		
		if(chat){
			$(a).fadeTo( "fast" , 0, function() {
				$(a).hide('slow');
			});
			
		}else
			$(a).show('slow');
		
		chat=!chat;
	});
 });
  
socket.on('game',function(items){
	//console.log(items);
	window.items.splice(0,items.length);
	for(var i=0;i<items.length;i++)
	    window.items.push(new Tank(items[i].x,items[i].y,items[i].color,items[i].name,items[i].f,[new Bullet(items[i].bullet[0].x,items[i].bullet[0].y,items[i].bullet[0].color),new Bullet(items[i].bullet[1].x,items[i].bullet[1].y,items[i].bullet[1].color)],items[i].helth));
});

socket.on('login',function(){
	console.log('login emit');
	$('.dim,.box').show();
});

socket.on('gameover',function(){
	console.log('gameover emit');
	$('h4.fs-subtitle').html('<font color="red"><b>Game over.</b></font>');
	$('.dim,.box').show();
});

socket.on('elogin',function(){
	console.log('elogin emit');
	$('h4.fs-subtitle').html('<font color="red">username already exists.</font>');
	$('.dim,.box').show();
});

socket.on('pong',function(){
	$('#message').append('<li><p>pong '+(Date.now()-ping)+' ms</p></li>');
	var d = $('#message');
    d.scrollTop(d.prop("scrollHeight"));
});

socket.on('msg',function(name,msg){
	$('#message').append('<li><p>'+name+(name==''?'':':')+' '+msg+'</p></li>');
	var d = $('#message');
    d.scrollTop(d.prop("scrollHeight"));
});

socket.on('sound',function(){
	$('#sound').empty();
    $('#sound').append('<audio controls autoplay><source src="/sound/fire.mp3" type="audio/mpeg"></audio>');
});

socket.on('name',function(name){
	window.name=name;
});
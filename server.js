var express = require("express");
var Server = require("http").Server;
var bodyParser=require('body-parser');
var session = require("express-session")({
        secret: "my-secret",
        resave: true,
        saveUninitialized: true
    });
var sharedsession = require("express-socket.io-session");


var app=express();
var router=express.Router();

router.use(bodyParser())
      .use(session)
      .use('/',express.static(__dirname+'/public'));
app.use('/',router);

var server = Server(app);
var io = require("socket.io")(server);
io.use(sharedsession(session));

server.listen(80,function (){
	console.log('server running at port 80');
});
	  
var Tank=require('./Tank');
var Bullet=require('./Bullet');

var items=[];
var die=[];
var keys=[38,40,37,39];
var width=1366,height=667;
var lstgr=0;

io.on('connection', function (socket){
	var session=socket.handshake.session;

	if(!session.name||session.name=="undefine"||session.name==null||session.name=='')
		socket.emit('login');
	else{
	    var id=find(session.name);
		if(id!=-1){
		    items[id].dis=0;
			socket.emit('name',session.name);
			io.emit('msg',"","    "+session.name+" goback.");
		}else{
			console.log('delete '+session.name);
		    session.name='undefine';
			session.save();
		}
	}
	
//	setInterval(function(){
	//},50);
	loop();
	
	socket.on('login',function(name){
		var id=find(name);
		if(id==-1&&name.length>3){
			session.name=name;
			session.save();
			items.push(initTank(name,"black",10,0));
			socket.emit('name',session.name);
			io.emit('msg',"","    "+name+" join game.");
			console.log(name+' join game.');
		}else
			socket.emit('elogin');
	});
	
	socket.on('game',function(key){
        var id=find(session.name);
		
		if(id>-1&&id<items.length)
			if(!cTank(items[id],key)){
				items[id].move(key);
				if((key==13||key==32)&&(items[id].lstfire>Date.now()-460&&(items[id].bullet[0].f!=-1||items[id].bullet[1].f!=-1)))
					io.emit('sound');
			}
	});
	
	socket.on('msg',function(msg){
		if(msg.indexOf('-addEnemy @PassWord')!=-1){
			if(msg=='-addEnemy @PassWord')
				addenemy();
			else{
				var num=parseInt(msg.substring('-addEnemy @PassWord'.length));
			    for(var i=0;i<num;i++)
					addenemy();
			}
			
			return;
		}
		if(session.name&&msg!=''){
			io.emit('msg',session.name,msg);
		}
	});
	
	socket.on('ping',function(){
		socket.emit('pong');
	});
	
	socket.on('disconnect', function () {
		if(session.name&&session.name!="undefine"){
			io.emit('msg',"","    "+session.name+" diconnect.");
		    var id=find(session.name);
		    if(id!=-1)
		        items[id].dis=Date.now();
	    }
    });
});

var find=function(name){
	if(!name)
		return -1;
	
	for(var i=0;i<items.length;i++)
		if(items[i].name==name)
			return i;
		
	return -1;
}

var check=function(a,b){
	//a,b tank
	
	for(var i=0;i<a.bullet.length;i++){
		collide(a.bullet[i],b,3,function(bullet,tank){
			bullet.die=true;
			tank.helth--;
		});
		
		collide(b.bullet[i],a,3,function(bullet,tank){
			bullet.die=true;
			tank.helth--;
		});
		
		for(var j=0;j<b.bullet.length;j++)
			collide(a.bullet[i],b.bullet[j],1,function(b1,b2){
				b1.die=true;
				b2.die=true;
			});
	}
}

var collide=function(b,t,s,callback){
	var xc=Math.floor((b.x-t.x)/22/s);
	var yc=Math.floor((b.y-t.y)/22/s);
	
	if(xc==0&&yc==0){
		callback(b,t);
	}
}

var cTank=function(a,k){
	if(keys[a.f]!=k)
		return false;
	
	var xc=a.x;
	var yc=a.y;
	
	switch(a.f){
        case 0: yc-=22; break;
		case 1: yc+=22; break;
		case 2: xc-=22; break;
		case 3: xc+=22; break;
	}
	
	for(var i=0;i<items.length;i++)
		if(items[i].name!=a.name&&Math.abs(xc-items[i].x)<22*3&&Math.abs(yc-items[i].y)<22*3)
			return true;
		
	if(xc<0||yc<0||xc>width-22*3||yc>height-22*3)
		return true;
	
	return false;
}

var initTank=function(name,color,helth,type){
	var x=Math.floor((Math.random() * (Math.floor(width/22)-3)));
	var y=Math.floor((Math.random() * (Math.floor(height/22)-3)));
	var f=Math.floor(Math.random() * 4);
	
	var tank=new Tank(x*22,y*22,color,name,helth,type);
	var un=cTank(tank,38);
	
	if(un)
		return initTank(name,color,helth,type);
	else
		return tank;
}

var ai=function(a){
	if(a.lai<Date.now()-2000){
		a.lai=Date.now();
        var k=rand(4);
		return keys[k];
	}
	
	var ibul=isfire(a);
	
	for(var i=0;i<items.length&&ibul!=-1;i++){
		if(items[i].name==a.name||items[i].type==1)
			continue;
		
		var xc=Math.floor((a.bullet[ibul].x-items[i].x)/22/3);
	    var yc=Math.floor((a.bullet[ibul].y-items[i].y)/22/3);
	
	    if(xc==0){
			if(a.bullet[ibul].y>items[i].y&&(a.f!=0||yc*3>30))
				return keys[0];
			else if(a.bullet[ibul].y<items[i].y&&a.f!=1)
				return keys[1];
			
			return 13;
		}
		else
		if(yc==0){			
			if(a.bullet[ibul].x>items[i].x&&(a.f!=2||xc*3>30))
				return keys[2];
			else if(a.bullet[ibul].x<items[i].x&&a.f!=3)
				return keys[3];
			
			return 13;
		}
	}
	
	return keys[a.f];
	
	//return 0;
}

var rand=function(limit){
    return Math.floor((Math.random() * limit)); 
}
var randAb=function(a,b){
    return rand(Math.abs(b-a))+(a<b?a:b);
}

var isfire=function(a){
	for(var i=0;i<a.bullet.length;i++)
		if(a.bullet[i].f==-1)
			return i;
		
	return -1;
}

var count=function(type){
	var len=0;
	
	for(var i=0;i<items.length;i++)
		if(items[i].type==type)
			len++;
	
	return len;
}

var addenemy=function(){
	var c=count(1);
	if(c<10)
		items.push(initTank("enemy"+c,"gray",10,1));
}

var loop = function () {
    if (lstgr < Date.now() - 2000 && items.length < 0) {
        var c = count(1);
        if (c < 0)
            items.push(initTank("enemy" + c, "gray", 10, 1));

        lstgr = Date.now();
    }

    for (var i = 0; i < items.length; i++) {
        items[i].active();
        if (items[i].type == 1) {
            var k = ai(items[i]);
            if (!cTank(items[i], k))
                items[i].move(k);
        }

        if (items[i].die) {
            die.push(items[i].name);
            items.splice(i, 1);
            i--;
            continue;
        }

        for (var j = i + 1; j < items.length; j++) {
            check(items[i], items[j]);
        }

        if (items[i].helth <= 0) {
            die.push(items[i].name);
            items.splice(i, 1);
            i--;
        }
    }

    for (var i = 0; i < die.length; i++) {
        if (die[i] == session.name) {
            socket.emit('gameover');
            io.emit('msg', "", "    " + session.name + " die.");
            console.log("delete " + session.name);
            session.name = 'undefine';
            session.save();
            die.splice(i, 1);
            break;
        }
    }

    io.emit('game', items);
	setTimeout(loop,50);
}
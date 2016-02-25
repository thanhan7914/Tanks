var Bullet=require('./Bullet');

//Object Tank
var Tank=function(x,y,color,name,helth,type){
	this.x=x;
	this.y=y;
	this.color=color;
	this.name=name;
	this.helth=helth;
	this.f=0;
	this.lm=0;
	this.lstfire=0;
	this.bullet=[new Bullet(x+22,y+22,"red",70),new Bullet(x+22,y+22,"green",70)];
	this.die=false;
	this.dis=0;
	this.lai=0;
	this.type=type;
}

Tank.prototype.move=function(k){
	var dl=this.type==0?60:300;
	if(this.lm<Date.now()-dl){
		switch(k){
			case 38: if(this.f!=0) this.f=0; else this.y-=22; break;
			case 40: if(this.f!=1) this.f=1; else this.y+=22; break;
			case 37: if(this.f!=2) this.f=2; else this.x-=22; break;
			case 39: if(this.f!=3) this.f=3; else this.x+=22; break;
			case 13: this.fire(); break;
			case 32: this.fire(); break;
		}
		
		this.lm=Date.now();
	}
}

Tank.prototype.fire=function(){
	if(this.lstfire>Date.now()-460)
		return;
	
	var id=-1;
	
	for(var i=0;i<this.bullet.length;i++)
	    if(this.bullet[i].f==-1){
			id=i;
			break;
		}
	
	if(id==-1)
		return;
	
	this.bullet[id].f=this.f;
	this.bullet[id].lst=Date.now();
	this.lstfire=Date.now();
}

Tank.prototype.active=function(){
	for(var i=0;i<this.bullet.length;i++)
		this.bullet[i].fire(this.x+22,this.y+22);
		
	if(this.dis!=0&&this.dis<Date.now()-60000&&this.type!=1)
	    this.die=true;
}

module.exports=Tank;
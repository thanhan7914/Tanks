//Object Bullet
var Bullet=function(x,y,color,speed){
	this.x=x;
	this.y=y;
	this.color=color;
	this.speed=speed;
	this.f=-1;
	this.lm=0;
	this.lst=0;
	this.die=false;
}

Bullet.prototype.fire=function(x,y){
	if(this.f==-1){
	    this.x=x;
	    this.y=y;
	}else
	{
	
	    if(this.lm<Date.now()-this.speed){
		    switch(this.f){
			    case 0: this.y-=22;  break;
			    case 1: this.y+=22;  break;
			    case 2: this.x-=22;  break;
			    case 3: this.x+=22;  break;
		    }
		    this.lm=Date.now();
    	}
    	if((Date.now()-this.lst)/this.speed>(this.f==2||this.f==3?90:50)||this.die){
	    	this.f=-1;
			this.die=false;
		}
	}
}

module.exports=Bullet;
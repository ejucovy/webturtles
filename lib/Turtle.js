// ?? are these (x,y ) coordinates pixel based or relative
// to the table?  IMO, Turtle methods should abstract away from
// rendering ones ideally.
function Turtle(col, row, color, world) {
    this.world = world;
    this.busy = 0;

    //world.table is sometimes undefined here.  Why?
    //is this related to the bug that when you refresh the
    //page having scrolled down some, the turtles are
    //misplaced?
    var pagePos = cellPos(world.table, row, col);
    var x = pagePos.x || 0; //hack around a bug I think
    var y = pagePos.y || 0;

    var seed = world.paper.circle(x, y, 10);
    seed.attr("fill", color);
    seed.attr("stroke", "black");

    this.body = seed;

    var line = world.paper.path("M" + x + " " + y);
    line.attr("stroke", color);
    line.attr("stroke-width", 3);

    this.line = line;

    this.pd = 1;
    this.angle = 0;
    this.queue = [];

    //turtle position
    //currently this default is overriden in tableturtle
    this.pos = {x: NaN, y: NaN}; 

    //turtle orientation
    this.or = {x: 0, y: 1};

    var head = world.paper.circle(x, y+10, 5);
    head.attr("fill", color);
    head.attr("stroke", "black");

    this.head = head;

    this.getTable = function() {
	return this.world.table;
    };

    this.setColor = function(newColor) {
	this.body.attr("fill", newColor);

	var x = this.body.attr("cx");
	var y = this.body.attr("cy");

	this.head.attr("fill", newColor);

	var line = this.world.paper.path("M" + x + " " + y);
	line.attr("stroke", newColor);
	line.attr("stroke-width", 3);
	this.line = line;
    };

    this.fetch = function(url) {
	var turtle = this;
	$.get(url, function(doc) {
		doc = doc.split("\n");
		$(doc).each(function() {
			turtle.queue.push(this);
		    });
	    });
    };

    this.moveToCell = function(x, y) {
      var pos = {x: x, y: y};
      var cell = getCell(this.getTable(), pos.y, pos.x);
      if( cell.length == 0 ) { return;}
      var to = cellPos(this.getTable(), pos.y, pos.x);
      if( !this.world.canLandOn(cell, this) ) {
	return;
      };
      this.pos = pos;
      var turtle = this;
      move(this, to.x, to.y, function() {
	turtle.world.landOn(cell, turtle);
      });
    };

    this.fwd = function() {
      var x = this.pos.x + this.or.x;
      var y = this.pos.y + this.or.y;
      this.moveToCell(x, y);
    };

    this.back = function() {
      var x = this.pos.x - this.or.x;
      var y = this.pos.y - this.or.y;
      this.moveToCell(x, y);
    };

    this.right = function() {
      this.or.x *= -1;
      this.or.y *= -1;
      this.left();
    };

    this.left = function() {
      if( this.or.x == 1 && this.or.y == 0 ) {
	this.or.x = 0; this.or.y = -1;
	fixHeadNoMove(this);
	return;
      };
      if( this.or.x == 0 && this.or.y == -1 ) {
	this.or.x = -1; this.or.y = 0;
	fixHeadNoMove(this);
	return;
      };
      if( this.or.x == -1 && this.or.y == 0 ) {
	this.or.x = 0; this.or.y = 1;
	fixHeadNoMove(this);
	return;
      };
      if( this.or.x == 0 && this.or.y == 1 ) {
	this.or.x = 1; this.or.y = 0;
	fixHeadNoMove(this);
	return;
      };
    };

    this.setPos = function(col, row){
        this.pos.x = col;
        this.pos.y = row;
    };
};

processQueue = function(t) {
    if( t.queue.length == 0 ) return;
    var i = t.queue.shift();
    if( i == "" ) return;
    i = i.split(" ");
    var cmd = i.shift();
    var processCmd = function(cmd) {
	switch(cmd) {

	case "fwd":
	t.fwd(); break;

	case "back":
	t.back(); break;

	case "left":
	t.left();
	break;

	case "right":
	t.right(); break;

	case "pendown":
	t.pd = 1; break;

	case "penup":
	t.pd = 0; break;

	case "fetch":
	t.fetch(i[0]); break;

	case "paint":
	paint(t); break;

	case "move":
	var pos = cellPos(t.getTable(), i[0], i[1]);
	if( !pos ) return;
	t.pos.x = parseInt(i[1]);
	t.pos.y = parseInt(i[0]);
	move(t, pos.x, pos.y);
	break;

	case "color":
	t.setColor(i[0]);
	break;
	};
    };
    processCmd(cmd);
};

tableturtle = function(world, col, row, color) {
    var t = new Turtle(col, row, color, world);

    t.setPos(col, row);

    t.setOrientation = function(x, y) {
	t.or.x = x; t.or.y = y;
	t.head.attr(fixHead(t.body.attr("cx"),
			    t.body.attr("cy"),
			    t));
    };

    return t;
};

fixHead = function(x, y, t) {
    var head = t.head;
    var r = t.body.attr("r");

    var newAttrs = {cx: x + ( t.or.x * r ),
		    cy: y + ( t.or.y * r )};
    return newAttrs;
};

paint = function(t) {
    var cell = getCell(t.getTable(), t.pos.y, t.pos.x);
    var c = t.body.attr("fill");
    $(cell).css("backgroundColor", c);
    actUpon(cell, t);
};

actUpon = function(cell, t) {
    var col = $(cell).css("backgroundColor");
    if( $(cell).attr("class") != "" ) {
	var pos = $(cell).attr("class");
	pos = pos.split("-");
	pos = {x: parseInt(pos[1]), y: parseInt(pos[0])};
	t.pos = pos;
	pos = cellPos(t.getTable(), pos.y, pos.x);
	t.body.attr("cx", pos.x);
	t.body.attr("cy", pos.y);
	var headPos = fixHead(pos.x, pos.y, t);
	t.head.attr({cx: headPos.cx, cy: headPos.cy});

	var line = t.world.paper.path("M" + pos.x + " " + pos.y);
	line.attr("stroke", t.body.attr("fill"));
	line.attr("stroke-width", 3);
	t.line = line;

	return;
    };
    //if( col != "white" ) {
    //t.setColor(col);
    //};
};



fixHeadNoMove = function(t, noAnimate) {
    var headPos = fixHead(t.body.attr("cx"),
			  t.body.attr("cy"),
			  t);
    if( noAnimate ) {
      t.head.attr(headPos);
    } else {
      t.head.animate(headPos, 500, function() { t.busy=0; });
    }
};


fwd = function(turtle, l) {
    var angle = turtle.angle;
    angle = angle * Math.PI / 180;
    var x = l * Math.sin(angle);
    var y = l * Math.cos(angle);
    x = turtle.body.attr("cx") + x;
    y = turtle.body.attr("cy") + y;
    move(turtle, x, y);
};

move = function(turtle, x, y, callback) {
    callback = callback || function() { return; };
    var _callback = function() {
      turtle.busy = 0;
      callback();
    };
    var line = turtle.line;
    var path = line.attr("path");
    var headPos = fixHead(x, y, turtle);
    if( turtle.pd == 1 ) {
	turtle.body.animate({cx: x, cy: y}, 500, _callback);
	line.animateWith(turtle.body, {path: path + "L" + x + " " + y}, 500);
	turtle.head.animateWith(turtle.body, headPos, 500);
    } else {
	turtle.body.animate({cx: x, cy: y}, 500, _callback);
	line.attr("path", path + "M" + x + " " + y);
	turtle.head.animateWith(turtle.body, headPos, 500);
    }
};

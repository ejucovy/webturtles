function Turtle(col, row, color, world, size, headSize, myId) {
    this.world = world;
    this.busy = 0;

    //world.table is sometimes undefined here.  Why?

    //turtle position in page
    var pagePos = cellPos(world.table, row, col);
    if( typeof(pagePos) == "undefined" ) {
	logError("something's gone wrong here");
    };

    var x = pagePos.x;
    var y = pagePos.y;

    this.size = size || 10;
    this.headSize = headSize || 5;

    var seed = world.paper.circle(x, y, this.size);
    seed.attr("fill", color);
    seed.attr("stroke", "black");

    this.body = seed;

    var head = world.paper.circle(x, y+this.size, this.headSize);
    head.attr("fill", color);
    head.attr("stroke", "black");

    this.head = head;

    this.cmdQueueEmpty = function() { };

    // wrap the turtle's sprite in an anchor tag
    // which refers to the turtle's command-queue
    seed.attr("href", "#");
    var anchor = $(seed.node).parent();
    $(head.node).appendTo(anchor);
    $(anchor).attr("id", myId).attr("rel", "turtleCmdQueue");

    this.anchor = "#" + myId;

    // likewise, wrap the turtle's line in an anchor tag
    // which refers to the turtle's sprite-anchor
    this.initLine = function(x, y, color, thickness) {
	thickness = thickness || 3;
	var line = world.paper.path("M" + x + " " + y);
	line.attr("stroke", color);
	line.attr("stroke-width", thickness);
	line.attr("href", this.anchor);
	this.line = line;
    };

    this.initLine(x, y, color);


    this.pd = 1;
    this.angle = 0;

    this.initQueue = function(id) {
	$("<ol/>").attr("id", id).appendTo("body");
	this.queueSel = "#" + id;
	$(this.anchor).attr("href", this.queueSel);
    };
    this.getQueue = function() { 
        var queue = [];
        $(this.queueSel).children("li").each(function() {
		queue.push($(this).text());
	    });
	return queue;
    };
    this.pushQueue = function(cmd) {
	var cmdEl = $("<li>"+cmd+"</li>");
	cmdEl.appendTo(this.queueSel);
    };
    this.shiftQueue = function(cmd) {
	var queueEl = $(this.queueSel);
	var cmdEl = queueEl.children("li:first");
	var cmd = $(cmdEl).text();
	cmdEl.remove();
	return cmd;
	if( queueEl.children("li").length == 0 ) {
	    this.cmdQueueEmpty();
	};
    };

    //turtle position in table
    this.pos = {x: col, y: row}; 

    //turtle orientation
    this.or = {x: 0, y: 1};

    this.getTable = function() {
	return this.world.table;
    };

    this.setColor = function(newColor) {
	this.body.attr("fill", newColor);

	var x = this.body.attr("cx");
	var y = this.body.attr("cy");

	this.head.attr("fill", newColor);

	this.initLine(x, y, newColor);
    };

    this.fetch = function(url) {
	var turtle = this;
	$.get(url, function(doc) {
		doc = doc.split("\n");
		$(doc).each(function() {
			turtle.pushQueue(this);
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

    this.setPagePos = function(x, y){
	this.body.attr("cx", x);
	this.body.attr("cy", y);
	fixHead(x, y, this);
    };

};

processQueue = function(t) {
    var queue = t.getQueue();
    if( queue.length == 0 ) return;
    var i = t.shiftQueue();
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
	t.setPos(parseInt(i[1]), parseInt(i[0]));
	move(t, pos.x, pos.y);
	break;

	case "color":
	t.setColor(i[0]);
	break;

	case "freefwd":
	fwd(t, parseInt(i[0]));
	break;

	case "rotate":
	rotate(t, parseInt(i[0]));
	break;

	case "clone":
	if( i.length ) {
	    var initCmd = "";
	    for( var x = 0; x < i.length; ++x ) {
		initCmd += i[x] + " ";
	    };
	    clone(t, initCmd);
	} else {
	    clone(t);
	};
	break;

	case "destroy":
	t.body.remove();
	t.head.remove();
	t.dead = 1;
	break;
	};
    };
    processCmd(cmd);
};

tableturtle = function(world, col, row, color, id) {
    var t = new Turtle(col, row, color,
		       world, 10, 5, id);

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
        //teleportation code
	var pos = $(cell).attr("class");
	pos = pos.split("-");
        // note here that pos (row, column)
        // and pagepos (x, y) are still being
        // set separately.  Is there a more
        // succint 'move' function that
        // does this?
	t.setPos(parseInt(pos[1]),parseInt(pos[0]));

	console.log(pos);
	pos = cellPos(t.getTable(), t.pos.y, t.pos.x);

        t.setPagePos(pos.x, pos.y);
	var headPos = fixHead(pos.x, pos.y, t);
	t.head.attr({cx: headPos.cx, cy: headPos.cy});

	t.initLine(pos.x, pos.y, t.body.attr("fill"));

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
    var cell = findCellForPos(turtle.getTable(), x, y);
    if( typeof(cell) == "undefined" ) {
	logError("turtle moved out of bounds");
	rotate(turtle, 180);
	return;
    };

    move(turtle, x, y);
    var pos = findCellCoordinates(cell);
    turtle.pos.x = pos.col;
    turtle.pos.y = pos.row;
};

rotate = function(turtle, angle) {
    turtle.angle += angle;
    angle = turtle.angle * Math.PI / 180;
    var x = Math.sin(angle);
    var y = Math.cos(angle);
    turtle.setOrientation(x, y);
};

clone = function(turtle, initCmd) {
    var newT = turtle.world.addTurtle(turtle.pos.x, turtle.pos.y, 
				      turtle.body.attr("fill"));
    newT.setOrientation(turtle.or);
    newT.angle = turtle.angle;
    if( initCmd ) {
	console.log("initializing with command " + initCmd);
	newT.pushQueue(initCmd);
    };
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


var hbmpize = function(pre) {
    var rows = $(pre).text().split("\n");
    var t = $("<table/>").attr("style",
			       "border: 1px solid black; border-collapse: collapse; display: table;");
    $(rows).each(function() {
	    if( !this.length ) return;
	    var r = $("<tr/>").appendTo(t);
	    var cols = this.split(",");
	    $(cols).each(function() {
		    if( !this.length ) return;
		    var x = this.split(" ");
		    var bg = x[0];
		    var c = $("<td/>").attr("style",
					    "padding: 0; border: 1px solid black; background-color: " + bg)
			.attr("width", "50px").attr("height", "50px")
			.appendTo(r);
		    if( x[1] )
			c.addClass(x[1]);
		});
	});
    $(pre).replaceWith(t);
    return t;
};

/*
  world.table -> html table reference
  world.paper -> Raphael canvas
  world.turtles -> [turtle, turtle]
*/
function World(tableSelector, canLandOnFunc) {
    this.table = tableSelector;

    // First set up the canvas aligned to the table.
    var table = $(tableSelector);
    table.hide();
    var w = table.width();
    var h = table.height();
    var pos = table.position();
    this.paper = Raphael(pos.left, pos.top, w, h);
    table.show();

    this.turtles = [];

    this.addTurtle = function(row, col, color) {
	var t = tableturtle(this, row, col, color);
	this.turtles.push(t);
    };

    this.step = function() {
	for( var i = 0; i < this.turtles.length; ++i ) {
	    processQueue(this.turtles[i]);
	};
    };
    this.run = function() { run(this) };

    this.numRows = function() {
	return $(this.table).find("tr").length;
    };

    this.numCols = function() {
	return $(this.table).find("td").length / this.numRows();
    };

    var _canLandOn = function(cell, turtle) {
      if( $(cell)[0].style.backgroundColor == "black" )
	return 0;
      return 1;
    };

    this.canLandOn = canLandOnFunc || _canLandOn;
    this.landOn = actUpon;
};

var run = function(world) {
    world.step();
    window.setTimeout(function() { run(world) },
		      750);
};

var processKey = function(event) {
    if( event.which == 97 ) {
      world.turtles[3].left();
    };
    if( event.which == 115 ) {
      world.turtles[3].fwd();
    };
    if( event.which == 100 ) {
      world.turtles[3].right();
    };
    if( event.which == 119 ) {
      world.turtles[3].back();
    };

};

function Turtle(x, y, color, world) {
    this.world = world;

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
    var table = world.table;
    var pos = cellPos(table, row, col);
    var t = new Turtle(pos.x, pos.y, color, world);
    t.pos = {x: col, y: row};
    t.or = {x: 0, y: 1};
    t.world = world;

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
	t.head.animate(headPos, 500);
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

getCell = function(table, row, col) {
    row = $($(table).find("tr")[row]);
    return $($(row).children("td")[col]);
};

cellPos = function(table, row, col) {
    var cell = getCell(table, row, col);
    if( cell.length == 0 ) return;
    return getCellPos(cell);
};

getCellPos = function(cell) {
    cell = $(cell);
    var pos = cell.position();
    var h = cell.height();
    var w = cell.width();
    var x = pos.left + w/2;
    var y = pos.top + h/2;
    return {x: x, y: y};
};

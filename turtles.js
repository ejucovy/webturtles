
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
function World(tableSelector) {
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
};

var run = function(world) {
    world.step();
    window.setTimeout(function() { run(world) },
		      750);
};

var processKey = function(event) {
    if( event.which == 97 ) {
	lf(world.turtles[3]);
    };
    if( event.which == 115 ) {
	fd(world.turtles[3]);
    };
    if( event.which == 100 ) {
	rt(world.turtles[3]);
    };
    if( event.which == 119 ) {
	bk(world.turtles[3]);
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
	fd(t); break;
	case "back":
	bk(t); break;
	case "left":
	lf(t); 
	break;
	case "right":
	rt(t); break;
	case "pendown":
	t.pd = 1; break;
	case "penup":
	t.pd = 0; break;
	case "fetch":
	fetch(t, i[0]); break;
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
	color(t, i[0]); break;
	};
    };
    processCmd(cmd);
};

fetch = function(t, url) {
    $.get(url, function(doc) {
	    doc = doc.split("\n");
	    $(doc).each(function() {
		    t.queue.push(this);
		});
	});
};

color = function(turtle, nc) {
    turtle.body.attr("fill", nc);
    var x = turtle.body.attr("cx");
    var y = turtle.body.attr("cy");
    var line = turtle.world.paper.path("M" + x + " " + y);
    line.attr("stroke", nc);
    line.attr("stroke-width", 3);
    turtle.line = line;
};

tableturtle = function(world, col, row, color) {
    var table = world.table;
    var pos = cellPos(table, row, col);
    var t = new Turtle(pos.x, pos.y, color, world);
    t.pos = {x: col, y: row};
    t.or = {x: 0, y: 1};
    t.world = world;
    return t;
};

fixHead = function(x, y, t) {
    var head = t.head;
    var r = t.body.attr("r");
    
    var newAttrs = {cx: x + ( t.or.x * r ),
		    cy: y + ( t.or.y * r )};
    return newAttrs;
};

fd = function(t) {
    var pos = {};
    pos.x = t.pos.x + t.or.x;
    pos.y = t.pos.y + t.or.y;
    var cell = getCell(t.getTable(), pos.y, pos.x);
    if( cell.length == 0 ) { return;}
    var to = cellPos(t.getTable(), pos.y, pos.x);
    if( !accepts(cell, t) ) { return;}
    t.pos = pos;
    move(t, to.x, to.y, function() { actUpon(cell, t); });
};

accepts = function(cell, t) {
    if( $(cell)[0].style.backgroundColor == "black" ) return 0;
    return 1;
};

paint = function(t) { 
    var cell = getCell(t.getTable(), t.pos.y, t.pos.x);
    var c = t.body.attr("fill");
    $(cell).css("backgroundColor", c);
    actUpon(cell, t);
};

actUpon = function(cell, t) {
    var col = $(cell)[0].style.backgroundColor;
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
    if( col != "white" ) {    
	color(t, col);
    };
};

bk = function(t) {
    t.or.x *= -1;
    t.or.y *= -1;
    fixHeadNoMove(t);
};

rt = function(t) {
    t.or.x *= -1;
    t.or.y *= -1;
    lf(t);  
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

lf = function(t) {
    if( t.or.x == 1 && t.or.y == 0 ) {
	t.or.x = 0; t.or.y = -1;
	fixHeadNoMove(t);
	return;
    };
    if( t.or.x == 0 && t.or.y == -1 ) {
	t.or.x = -1; t.or.y = 0;
	fixHeadNoMove(t);
	return;
    };
    if( t.or.x == -1 && t.or.y == 0 ) {
	t.or.x = 0; t.or.y = 1;
	fixHeadNoMove(t);
	return;
    };
    if( t.or.x == 0 && t.or.y == 1 ) {
	t.or.x = 1; t.or.y = 0;
	fixHeadNoMove(t);
	return;
    };
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

rows = function(table) {
    return $("#grid table tr").length;
};

cols = function(table) {
    return $("#grid table td").length / rows(table);
};

getCell = function(table, row, col) {
    row = $($("#grid table tr")[row]);  
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

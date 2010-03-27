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

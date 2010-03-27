//probably not the right name for this file

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

findCellForPos = function(table, x, y) {
    var cell;
    var cells = $(table).find("td");
    for( var i = 0; i < cells.length; ++i ) {
	var candidate = cells[i];
	var top = $(candidate).position().top;
	var left = $(candidate).position().left;
	var bottom = top + $(candidate).height();
	var right = left + $(candidate).width();
	if( left < x && x < right ) {
	    if( top < y && y < bottom ) {
		cell = candidate;
		return cell;
	    }
	}
    }
};

findCellCoordinates = function(cell) {
    var afterMe = $(cell).nextAll("td");
    var onMyRow = $(cell).siblings("td");
    var myX = onMyRow.length - afterMe.length;
    
    afterMe = $(cell).parent("tr").nextAll("tr");
    onMyRow = $(cell).parent("tr").siblings("tr");
    var myY = onMyRow.length - afterMe.length;

    return {col: myX, row: myY};
};
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
    if( cell.length == 0 ) {
	logError("No cell found: (row " + row + ", col " + col + ")");
	return;
    };
    return getCellPos(cell);
};

getCellPos = function(cell) {
    cell = $(cell);
    var pos = cell.offset();
    var h = cell.height();
    var w = cell.width();
    var x = pos.left + w/2;
    var y = pos.top + h/2 - $(window).scrollTop();
    return {x: x, y: y};
};

findCellForPos = function(table, x, y) {
    var cell;
    var cells = $(table).find("td");
    var rows = $(table).find("tr");

    var row;

    var windowOffset = $(window).scrollTop();

    for( var i = 0; i < rows.length; ++i ) {
	var candidate = rows[i];
	var top = $(candidate).offset().top - windowOffset;
	var bottom = top + $(candidate).height();

	if( top < y && y < bottom ) {
	    row = candidate;
	    break;
	}
	if( top > y ) {
	    row = $(candidate).prev()[0];
	};
    }

    var cols = $(row).find("td");
    for( var i = 0; i < cols.length; ++i ) {
	var candidate = cols[i];
	var left = $(candidate).offset().left;
	var right = left + $(candidate).width();
	if( left < x && x < right ) {
	    cell = candidate;
	    break;
	}
	if( left > x ) {
	    cell = $(candidate).prev("td")[0];
	    break;
	};
    }
    return cell;
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

var logError = function(msg) {
    if(typeof(console) == "undefined") return;
    console.error(msg);
};
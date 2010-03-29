/* 
Public Sprite interface is:

 .setColor(color)
 .getColor()

 .setOutlineColor?
 .getOutlineColor?

 .getPagePos()
 .setPagePos(x, y, orientation)

 .rotateTo(orientation, callback)
 .moveTo(x, y, callback, orientation)
 .remove()

and perhaps .getRoot()

 */

var Sprite = Base.extend({

	constructor: function(myId, world) {
	    this.id = myId;
	    this.world = world;
	},
	getRoot: function() {
	    return $("a#" + this.id);
	},

	/* Below are sample methods. You must override these.
	   Ignore their implementations. They are not useful. */
	getColor: function() {
	    return this.color || "black";
	},
	setColor: function(color) {
	    this.color = color;
	},

	getPagePos: function() {
	    return {x: this.x || 0,
		    y: this.y || 0};
	},
	setPagePos: function(x, y, orientation) {
	    this.x = x;
	    this.y = y;
	},

	rotateTo: function(orientation, callback) {
	    return;
	},

	moveTo: function(x, y, callback, orientation) {
	    return;
	},

	/* Remove the drawn elements, whatever they are */
	remove: function() {
	    return;
	},
    });

var TurtleSprite = Sprite.extend({

	setColor: function(color) {
	    var seed = this.getBody();
	    seed.attr("fill", color);
	    var head = this.getHead();
	    head.attr("fill", color);
	},

	getColor: function() {
	    return this.getBody().attr("fill");
	},

	setOutlineColor: function(color) {
	    this.getBody().attr("stroke", color);
	    this.getHead().attr("stroke", color);
	},

	getPagePos: function() {
	    var seed = this.getBody();
	    return {x: seed.attr("cx"),
		    y: seed.attr("cy")}
	},
    
	setPagePos: function(x, y, orientation) {
	    var seed = this.getBody();
	    seed.attr("cx", x);
	    seed.attr("cy", y);
	    this.redrawHead(x, y, orientation);
	},

	moveTo: function(x, y, callback, orientation) {
	    var body = this.getBody();
	    var head = this.getHead();
	    body.animate({cx: x, cy: y}, 500, callback);
	    head.animateWith(body, 
			     this.recalcHeadPos(x, y, orientation),
			     500);
	},

	rotateTo: function(orientation, callback) {
	    this.rotateHead(orientation, callback);
	},
	
	remove: function() {
	    this.getBody().remove();
	    this.getHead().remove();
	    // XXX TODO: this.getRoot().remove()?
	},

	/* the following methods are non-public */

	/* except for initSprite, which we can worry about later */

	initSprite: function(x, y, size, headSize, color) {
	    var seed = this.world.paper.circle(x, y, size);
	    var head = this.world.paper.circle(x, y+size, headSize);

	    // wrap the turtle's sprite in an anchor tag
	    // which refers to the turtle's command-queue
	    seed.attr("href", "#");
	    var anchor = $(seed.node).parent();
	    $(head.node).appendTo(anchor);
	    $(anchor).attr("id", this.id);
	    
	    this.setColor(color);

	    return anchor;
	},

	getBody: function() {
	    var el = this.getRoot().children("circle:first")[0];
	    return this.world.getObj(el);
	},

	getHead: function() {
	    var el = this.getRoot().children("circle:last")[0];
	    return this.world.getObj(el);
	},

	recalcHeadPos: function(x, y, orientation) {
	    var r = this.getBody().attr("r");
	    
	    var newAttrs = {cx: x + (orientation.x * r),
			    cy: y + (orientation.y * r)};
	    return newAttrs;
	},

	rotateHead: function(orientation, callback) {
	    var xy = this.getPagePos();
	    this.getHead().animate(this.recalcHeadPos(xy.x, xy.y,
						      orientation),
				   500, callback);
	},

	redrawHead: function(x, y, orientation) {
	    this.getHead().attr(this.recalcHeadPos(x, y,
						   orientation));
	},

    });
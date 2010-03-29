function TurtleSprite(myId, world) {

    this.id = myId;
    this.world = world;

    this.initSprite = function(x, y, size, headSize, color) {
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
    };

    function getRoot() { 
	return $("a#" + this.id);
    };
    this.getRoot = getRoot;

    function getBody() {
	var el = this.getRoot().children("circle:first")[0];
	return this.world.getObj(el);
    };
    this.getBody = getBody;

    function getHead() {
	var el = this.getRoot().children("circle:last")[0];
	return this.world.getObj(el);
    };
    this.getHead = getHead;

    function setColor(color) {
	var seed = this.getBody();
	seed.attr("fill", color);
	var head = this.getHead();
	head.attr("fill", color);
    };
    this.setColor = setColor;

    function getColor() {
	return this.getBody().attr("fill");
    };
    this.getColor = getColor;

    function setOutlineColor(color) {
	this.getBody().attr("stroke", color);
	this.getHead().attr("stroke", color);
    };
    this.setOutlineColor = setOutlineColor;

    function getPagePos() {
	var seed = this.getBody();
	return {x: seed.attr("cx"),
		y: seed.attr("cy")}
    };
    this.getPagePos = getPagePos;
    
    function setPagePos(x, y, orientation) {
	var seed = this.getBody();
	seed.attr("cx", x);
	seed.attr("cy", y);
	this.redrawHead(x, y, orientation);
    };
    this.setPagePos = setPagePos;

    function moveTo(x, y, callback, orientation) {
	var body = this.getBody();
	var head = this.getHead();
	body.animate({cx: x, cy: y}, 500, callback);
	head.animateWith(body, 
			 this.recalcHeadPos(x, y, orientation),
			 500);
    };
    this.moveTo = moveTo;

    function recalcHeadPos(x, y, orientation) {
	var r = this.getBody().attr("r");

	var newAttrs = {cx: x + (orientation.x * r),
			cy: y + (orientation.y * r)};
	return newAttrs;
    };
    this.recalcHeadPos = recalcHeadPos;

    function rotateHead(orientation) {
	var xy = this.getPagePos();
	this.getHead().animate(this.recalcHeadPos(xy.x, xy.y, orientation),
			       500);
    };
    this.rotateHead = rotateHead;

    this.rotateTo = rotateHead;

    function redrawHead(x, y, orientation) {
	this.getHead().attr(this.recalcHeadPos(x, y, orientation));
    };
    this.redrawHead = redrawHead;

    function remove() {
	this.getBody().remove();
	this.getHead().remove();
	// XXX TODO: this.getRoot().remove()
    };
    this.remove = remove;
};
// a super simple loader script from 
// http://www.xinotes.org/notes/note/461/
// more sophisticated one could come later.

var libroot = "../lib/"

function require(jspath) {
    document.write('<script type="text/javascript" src="'+libroot+jspath+'"><\/script>');
}

require("raphael.js");
require("jquery.js");
require("Base.js");
require("Utility.js");
require("World.js");
require("Sprite.js");
require("Turtle.js");

# WebTurtles

Logo-style turtles in Javascript that live on the web.

See simple.html for basic usage.

## Basic concepts

Turtles live in a world.

A world is attached to an HTML table.  This table defines the grid
that the turtles act on.

So, to start, initialize a world with a table in your HTML page:

    var world = new World("table#mygrid");

The table's cells, their positions and sizes, will determine how
and where your turtles move.

Then add some turtles to your world.  A turtle needs to have an
(x, y) position on the grid and a (HTML) color:

     world.addTurtle(0, 0, "green");
     world.addTurtle(world.numCols()-1, world.numRows()/2, "#d05");

Turtles have instruction queues. Send instructions to a turtle's
queue:

     world.turtles[0].queue.push("fwd");

The world is not running until you tell it to run:

     world.run();

-- or you could just execute a single step:

     world.step()


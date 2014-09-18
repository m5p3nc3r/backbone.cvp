# CollectionViewProxy

This code is an attempt to solve the problem of the infinite scrolling list by proxying a Backbone.Collection.

Very much a work in progress at the moment, there is a simple test case that shows some of the core concepts, and I will update the documentation soon... promise!

The concept is to place most of the complexity into the CollectionViewProxy class to manage a virtual window onto a base collection of data.  The proxy acts as usual Backbone.Collection and should be able to be used as a drop in replacement - but this has not yet been tested!

A quick example can be found [here](http://m5p3nc3r.github.io/backbone.cvp/examples/simple.html).  But please note that even though the business logic should work on IE, for simplicity the layout of the example has only been tested on Chrome and Firefox.

A example of a 2D grid can be found [here](http://m5p3nc3r.github.io/backbone.cvp/examples/grid.html).

There is also a qunit test suite [here](http://m5p3nc3r.github.io/backbone.cvp/tests).  I try to make sure that these tests all pass before a commit - but currently this is a 'just for fun' project, so I'm making no promises!

More documentation and examples to come soon.
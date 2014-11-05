# CollectionViewProxy

This code is an attempt to solve the problem of the infinite scrolling list by proxying a Backbone.Collection.

Very much a work in progress at the moment, there is a simple test case that shows some of the core concepts, and I will update the documentation soon... promise!

The concept is to place most of the complexity into the CollectionViewProxy class to manage a virtual window onto a base collection of data.  The proxy acts as usual Backbone.Collection and should be able to be used as a drop in replacement - but this has not yet been tested!

A quick example can be found [here](http://m5p3nc3r.github.io/backbone.cvp/examples/simple.html).  But please note that even though the business logic should work on IE, for simplicity the layout of the example has only been tested on Chrome and Firefox.

An example of a 2D grid can be found [here](http://m5p3nc3r.github.io/backbone.cvp/examples/grid.html).

An example of an infinite list can be found [here](http://m5p3nc3r.github.io/backbone.cvp//examples/simpleinf.html]).

The test cases are run using Prova, please download the sources and run 'prova tests/test.js' and follow the unstructions.  I try to make sure that these tests all pass before a commit - but currently this is a 'just for fun' project, so I'm making no promises!

# Browser compatibility
The core business logic of the code should work on any browser, but I should note that the examples all use un-prefixed css for translation, so it may not work in your browser.  The browsers that have been tested are Chrome and Firefox, it does not currently work on Safari of IE - I may fix this, but it is not a priority of the project for now.

More documentation and examples to come soon.
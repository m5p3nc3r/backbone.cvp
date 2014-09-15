# CollectionViewProxy

This code is an attempt to solve the problem of the infinite scrolling list by proxying a Backbone.Collection.

Very much a work in progress at the moment, there is a simple test case that shows some of the core concepts, and I will update the documentation soon... promise!

The concept is to place most of the complexity into the CollectionViewProxy class to manage a virtual window onto a base collection of data.  The proxy acts as usual Backbone.Collection and should be able to be used as a drop in replacement - but this has not yet been tested!

More documentation and examples to come soon.
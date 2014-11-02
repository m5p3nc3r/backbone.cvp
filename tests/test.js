"use strict";

var test=require('prova'); // Use prova to allow the tests to be run in a browser
var _=require('underscore');
var Backbone=require('backbone');
Backbone.$=require('jquery');
var CollectionViewProxy = require('../js/collectionviewproxy');
var PagedCollection = require('../js/pagedcollection');
var sinon=require('sinon');

var Watch=function(test, collection) {
    var added=[];
    var removed=[];
    var reset=[];
    var t=test;

    collection.on("add", function(models, collection) {
		if(_.isArray(models)) {
		    _.each(models, function(model) { added.push(model);});
		} else {
	    	added.push(models);
		} 
    });
    collection.on("remove", function(models, collection) {
		if(_.isArray(models)) {
	    	_.each(models, function(model) { removed.push(model);});
		} else {
	   		removed.push(models);
		}
    });
    collection.on("reset", function(collection, options) {
	_.each(collection.models, function(model) { reset.push(model);});
    });

    this.finalize = function() {
		collection.off();
		added=undefined;
		removed=undefined;
		reset=undefined;
		t.end();
    };

    this.verify=function(options) {
		var safeAt = function(collection, index) {
	    	return index<collection.length ? collection.models[index] : {};
		};
	
		var safeArray = function(array, index) {
			return index<array.length ? array[index] : {};
		};
	
		if(options.position!==undefined) {
		    t.equal(collection.position, options.position, "collection.position="+options.position);
		}
		if(options.id) {
	    	t.equal(collection.length, options.id.length, "Check collection length " + options.id.length);
		 	_.each(options.id, function(id, index) {
				t.equal(safeAt(collection, index).id, id, "collection["+index+"]="+id);
	    	}, this);
		}
		if(options.sourceid) {
	    	t.equal(collection.collection.length, options.sourceid.length, "Check backing collection length " + options.id.length);
	    	_.each(options.sourceid, function(id, index) {
				t.equal(safeAt(collection.collection, index).id, id, "collection["+index+"]="+id);
	    	}, this);				
		}
		if(options.added) {
	    	t.equal(added.length, options.added.length, "Added length " + options.added.length);
	    	_.each(options.added, function(id, index) {
				t.equal(id, safeArray(added, index).id);
	    	}, this);				
		}
		added=[];
		if(options.removed) {
	    	t.equal(removed.length, options.removed.length, "Removed length " + options.removed.length);
	    	_.each(options.removed, function(id, index) {
				t.equal(id, safeArray(removed, index).id);
		    }, this);				
		}
		removed=[];
		if(options.reset) {
	    	t.equal(reset.length, options.reset.length, "Reset length " + options.reset.length);
	    	_.each(options.reset, function(id, index) {
			t.equal(id, reset[index].id);
	    	}, this);
		}
		reset=[];
    };
};

test("Class defaults", function(t) {
    var collection=new CollectionViewProxy(new Backbone.Collection());
    t.ok(collection instanceof CollectionViewProxy);
    t.ok(collection instanceof Backbone.Collection);
    t.equal(collection.options.count, 10);
    t.end();
});

test("Constructor", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w=new Watch(t, collection);
    w.verify({id: [0, 1, 2, 3, 4]});
    w.finalize();
});

test("Constructor offset", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
    var w = new Watch(t, collection);
    w.verify({id: [8, 9, 0, 1, 2]});
    w.finalize();
});


test("Update position", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
    var w = new Watch(t, collection);
    w.verify({id: [8, 9, 0, 1, 2], position: 0});
    collection.position = 1;
    w.verify({id: [9, 0, 1, 2, 3], position: 1, added: [3], removed: [8]});
    w.finalize();
});

test("Update position negative", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
    var w = new Watch(t, collection);
    w.verify({id: [8, 9, 0, 1, 2], position: 0});
    collection.position = -1;
    w.verify({id: [7, 8, 9, 0, 1], position: -1, added: [7], removed: [2]});
    w.finalize();
});

test("Reset", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
    var w=new Watch(t, collection);
    w.verify({id: [8, 9, 0, 1, 2]});
    collection.reset(_(10).times(function(n) {return {"id": 100+n}; }));
    w.verify({id: [108, 109, 100, 101, 102], reset: [108, 109, 100, 101, 102]});
    w.finalize();
});

test("Add out of window", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    collection.add([{id: 10}]);
    w.verify({id: [0, 1, 2, 3, 4], added: [], removed: [],
	      sourceid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]});
    w.finalize();
});

test("Add in window", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
    var w=new Watch(t, collection);
    collection.add([{id: 10}]);
    w.verify({id: [9, 10, 0, 1, 2],added: [10], removed: [8],
	      sourceid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]});
    w.finalize();
});

test("Remove out of window", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    collection.remove(source.at(8));
    w.verify({id: [0, 1, 2, 3, 4], added: [], removed: [],
	      sourceid: [0, 1, 2, 3, 4, 5, 6, 7, 9]});
    w.finalize();
});

test("Remove in window", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    collection.remove(source.at(2));
    w.verify({id: [0, 1, 3, 4, 5], added: [5], removed: [2],
	      sourceid: [0, 1, 3, 4, 5, 6, 7, 8, 9]});
    w.finalize();
});

test("increasing position", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    w.verify({id: [0, 1, 2, 3, 4], position: 0, added: [], removed: []});
    collection.position=0.3;
    w.verify({id: [0, 1, 2, 3, 4, 5], position: 0.3, added: [5], removed: []});
    collection.position=0.7;
    w.verify({id: [0, 1, 2, 3, 4, 5], position: 0.7, added: [], removed: []});
    collection.position=1;
    w.verify({id: [1, 2, 3, 4, 5], position: 1, added: [], removed: [0]});
    w.finalize();
});

test("decreasing position", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    w.verify({id: [0, 1, 2, 3, 4], position: 0, added: [], removed: []});
    collection.position=-0.3;
    w.verify({id: [9, 0, 1, 2, 3, 4], position: -0.3, added: [9], removed: []});
    collection.position=-0.7;
    w.verify({id: [9, 0, 1, 2, 3, 4], position: -0.7, added: [], removed: []});
    collection.position=-1;
    w.verify({id: [9, 0, 1, 2, 3], position: -1, added: [], removed: [4]});
    w.finalize();
});


test("short collection", function(t) {
    var source = new Backbone.Collection(_(3).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    w.verify({id: [0, 1, 2], position: 0, added: [], removed: []});
    w.finalize();
});

test("short collection offset", function(t) {
    var source = new Backbone.Collection(_(3).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -1});
    var w = new Watch(t, collection);
    w.verify({id: [2, 0, 1], position: 0, added: [], removed: []});
    w.finalize();
});

test("short collection position", function(t) {
    var source = new Backbone.Collection(_(3).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    w.verify({id: [0, 1, 2], position: 0, added: [], removed: []});
    collection.position=0.5;
    w.verify({id: [0, 1, 2, "clone_0"], position: 0.5, added: ["clone_0"], removed: []});
    collection.position=0.9;
    w.verify({id: [0, 1, 2, "clone_0"], position: 0.9, added: [], removed: []});
    collection.position=1;
    w.verify({id: [1, 2, 0], position: 1, added: [], removed: ["clone_0"]});
    w.finalize();
});

test("remove less than 'count'", function(t) {
    var source = new Backbone.Collection(_(5).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    w.verify({id: [0, 1, 2, 3, 4], positoin: 0, added: [], removed: []});
    source.pop();
    w.verify({id: [0, 1, 2, 3], position: 0, added: [], removed: [4]});
    source.pop();
    w.verify({id: [0, 1, 2], position: 0, added: [], removed: [3]});
    source.pop();
    w.verify({id: [0, 1], position: 0, added: [], removed: [2]});
    source.pop();
    w.verify({id: [0], position: 0, added: [], removed: [1]});
    source.pop();
    w.verify({id: [], position: 0, added: [], removed: [0]});
    w.finalize();
});


var getURLArgs=function(uri) {
    var ret={};
    var parts=uri.split('?');
    if(parts.length>1) {
	var args=parts[1].split('&');
	_.each(args, function(arg) {
		var pair=arg.split('=');
		ret[pair[0]]=pair.length>1 ? pair[1] : undefined;
	});
    }
    return ret;
}

var server = sinon.fakeServer.create();
// Process requests to the /data endpoint (simple, no paging)
server.respondWith(/\/data(.)*/, function(xhr, id) {
    var args=getURLArgs(xhr.url);
    var start=Number.parseInt(args.start);
    var responseText=_(args.count).times(
		function(n) {return {"id": start+n}; }
    );
    xhr.respond(200, {'Content-Type': 'application-json'}, JSON.stringify(responseText));
});

// Process data requests to the /pagedData endpoint
server.respondWith(/\/pagedData(.)*/, function(xhr, id) {
    var args=getURLArgs(xhr.url);
   	var count=args.count;
	var number=args.start;
	var response = {
		count: 100,
		data: []
	};
	var normalize=function(number, max) {
		number=number%max;
		if(number<0) number+=max;
		return number;
	}
	while(count--) {
		response.data.push({id: normalize(number,100)});
		number++;
	}
	xhr.respond(200, {'Content-Type': 'application-json'}, JSON.stringify(response));
});
// Set the server to auto respond
server.autoRespond=true;

var TestCollection = Backbone.Collection.extend({
    url: function() {
		return "/data?start=0&count=5";
    }
});


test("remove less than 'count'", function(t) {
	var source = new TestCollection();
	var collection = new CollectionViewProxy(source, {count: 5});
	var w = new Watch(t, collection);
	source.fetch({data: {start: 0, count: 5}}).then(function() {
		w.verify({id: [0, 1, 2, 3, 4], position: 0, added: [0, 1, 2, 3, 4], removed: []});
		source.pop();
		w.verify({id: [0, 1, 2, 3], position: 0, added: [], removed: [4]});
		source.pop();
		w.verify({id: [0, 1, 2], position: 0, added: [], removed: [3]});
		source.pop();
		w.verify({id: [0, 1], position: 0, added: [], removed: [2]});
		source.pop();
		w.verify({id: [0], position: 0, added: [], removed: [1]});
		source.pop();
		w.verify({id: [], position: 0, added: [], removed: [0]});
		w.finalize();
	},
	function() {
		console.log("Error reading source");
	});
});

var TestPagedCollection = PagedCollection.extend({
	url: '/pagedData',
	parse: function(response, options) {
		this.serverDataLength=response.count;
		return response.data;
	},
	getServerDataLength: function() {
		return this.serverDataLength;
	}
});

test("PagedCollection Class defaults", function(t) {
	var collection=new PagedCollection();
	t.ok(collection instanceof PagedCollection, "instanceof PagedCollection");
	t.ok(collection instanceof Backbone.Collection, "instanceof Backbone.Collection");
	t.equal(collection.options.pagesize, 5);
	t.end();
});

test("PagedCollectionInitial fetch", function(t) {
	var collection = new TestPagedCollection({pagesize: 5});
	var w=new Watch(t, collection);
	collection.position=0;
	collection.current.then(function() {
		w.verify({id: [95, 96, 97, 98, 99, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
			added: [95, 96, 97, 98, 99, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
			removed: []});
		w.finalize();		
	});
});

test("Increasing position", function(t) {
	var collection = new TestPagedCollection({pagesize: 5});
	var w=new Watch(t, collection);
	collection.position=0;
	collection.current.then(function() {
		w.verify({id: [95, 96, 97, 98, 99, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
			added: [95, 96, 97, 98, 99, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
			removed: []});

		collection.position=1;
		t.ok(collection.current==undefined);
		w.verify({position: 1, added: [], removed: []});

		collection.position=5;
		collection.current.then(function() {
			w.verify({position: 5, added: [10, 11, 12, 13, 14], removed: [95, 96, 97, 98, 99]});

			collection.position=8;
			t.ok(!collection.current);

			collection.position=10;
			collection.current.then(function() {
				w.verify({position: 10, added: [15, 16, 17, 18, 19], removed: [0, 1, 2, 3, 4]});

				w.finalize();		
			});
		});
	});
});

test("Decreasing position", function(t) {
	var collection = new TestPagedCollection({pagesize: 5});
	var w=new Watch(t, collection);
	collection.position=0;
	collection.current.then(function() {
		w.verify({id: [95, 96, 97, 98, 99, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
			added: [95, 96, 97, 98, 99, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
			removed: []});

		collection.position=-1;
		collection.current.then(function() {
			w.verify({position: -1, added: [90, 91, 92, 93, 94], removed: [5, 6, 7, 8, 9]});

			collection.position=-4;
			t.ok(!collection.current);

			collection.position=-7;
			collection.current.then(function() {
				w.verify({position: -7, added: [85, 86, 87, 88, 89], removed: [0, 1, 2, 3, 4]});

				w.finalize();		
			});
		});
	});
});

test("PagedCollectionProxy", function(t) {
	var paged = new TestPagedCollection({pagesize: 5});
	var collection = new CollectionViewProxy(paged, {count: 5});
	var cw=new Watch(t, collection);
	collection.position=0;
	// Should collection proxy through to the current XHR request?
	// Then this could read collection.getXHR().when(...) ??
	paged.current.then(function() {
		cw.verify({
			position: 0,
			id: [0, 1, 2, 3, 4]
		});
		cw.finalize();
	});
});

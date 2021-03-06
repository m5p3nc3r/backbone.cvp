"use strict";

var test=require('prova'); // Use prova to allow the tests to be run in a browser
var _=require('underscore');
var Backbone=require('backbone');
Backbone.$=require('jquery');
var CollectionViewProxy = require('../js/collectionviewproxy');
var PagedCollection = require('../js/pagedcollection');
var sinon=require('sinon');
var Promise=require('promise');

// Inclusive start, inclusive end
// "0-5" = [0, 1, 2, 3, 4, 5]
// "5-10,0-5" = [5, 6, 7, 8, 9, 10, 0, 1, 2, 3, 4, 5]
var range=function(str) {
	var ret=[];
	_.each(str.split(','), function(r) {
		var args=r.split(':');
		var start=Number.parseInt(args[0]);
		var end=args.length>1 ? Number.parseInt(args[1]) : start;
		if(start<=end) {
			while(start<=end) ret.push(start++); 
		} else {
			console.log("Error processing range " + r + " - " + start + " -> " + end);
		}
	});
	return ret;
};

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

		var fixupRange = function(type) {
			var r=options[type];
			if(r) {
				if(typeof(r) === "string") options[type]=range(r);
			}
			return options[type];
		};
	
		if(options.position!==undefined) {
		    t.equal(collection.position, options.position, "collection.position="+options.position);
		}
		if(fixupRange('id')) {
	    	t.equal(collection.length, options.id.length, "Check collection length " + options.id.length);
		 	_.each(options.id, function(id, index) {
				t.equal(safeAt(collection, index).id, id, "collection["+index+"]="+id);
	    	}, this);
		}
		if(fixupRange('sourceid')) {
	    	t.equal(collection.collection.length, options.sourceid.length, "Check backing collection length " + options.sourceid.length);
	    	_.each(options.sourceid, function(id, index) {
				t.equal(safeAt(collection.collection, index).id, id, "collection["+index+"]="+id);
	    	}, this);				
		}
		if(options.at) {
			options.at.index=range(options.at.index);
			options.at.id=range(options.at.id);
			t.equal(options.at.index.length,options.at.id.length, "Check test data ranges correct");
			_.each(options.at.index,function(i, index) {
				t.equal(collection.at(i).id,options.at.id[index],"collection.at("+i+")="+options.at.id[index]);
			});
		}
		if(fixupRange('added')) {
	    	t.equal(added.length, options.added.length, "Added length " + options.added.length);
	    	_.each(options.added, function(id, index) {
				t.equal(id, safeArray(added, index).id);
	    	}, this);				
		}
		added=[];
		if(fixupRange('removed')) {
	    	t.equal(removed.length, options.removed.length, "Removed length " + options.removed.length);
	    	_.each(options.removed, function(id, index) {
				t.equal(id, safeArray(removed, index).id);
		    }, this);				
		}
		removed=[];
		if(fixupRange('reset')) {
	    	t.equal(reset.length, options.reset.length, "Reset length " + options.reset.length);
	    	_.each(options.reset, function(id, index) {
			t.equal(id, reset[index].id);
	    	}, this);
		}
		reset=[];
    };
};

var group = "CollectionViewProxy : ";

test(group + "Class defaults", function(t) {
    var collection=new CollectionViewProxy(new Backbone.Collection());
    t.ok(collection instanceof CollectionViewProxy);
    t.ok(collection instanceof Backbone.Collection);
    t.equal(collection.options.count, 10);
    t.end();
});

test(group + "Constructor", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w=new Watch(t, collection);
    w.verify({id: "0:4"});
    w.finalize();
});

test(group + "Constructor offset", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
    var w = new Watch(t, collection);
    w.verify({id: "8:9,0:2"});
    w.finalize();
});

test(group + "Update position", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
    var w = new Watch(t, collection);
    w.verify({id: "8:9,0:2", position: 0});
    collection.position = 1;
    w.verify({id: "9,0:3", position: 1, added: [3], removed: [8]});
    w.finalize();
});

test(group + "Update position negative", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
    var w = new Watch(t, collection);
    w.verify({id: "8,9,0:2", position: 0});
    collection.position = -1;
    w.verify({id: "7:9,0,1", position: -1, added: [7], removed: [2]});
    w.finalize();
});

test(group + "Reset", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
    var w=new Watch(t, collection);
    w.verify({id: "8,9,0:2"});
    collection.reset(_(10).times(function(n) {return {"id": 100+n}; }));
    w.verify({id: "108,109,100:102", reset: "108,109,100:102"});
    w.finalize();
});

test(group + "Add out of window", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    collection.add([{id: 10}]);
    w.verify({id: "0:4", added: [], removed: [],
	      sourceid: "0:10"});
    w.finalize();
});

test(group + "Add in window", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
    var w=new Watch(t, collection);
    collection.add([{id: 10}]);
    w.verify({id: "9,10,0:2",added: [10], removed: [8],
	      sourceid: "0:10"});
    w.finalize();
});

test(group + "Remove out of window", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    collection.remove(source.at(8));
    w.verify({id: "0:4", added: [], removed: [],
	      sourceid: "0:7,9"});
    w.finalize();
});

test(group + "Remove in window", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    collection.remove(source.at(2));
    w.verify({id: "0,1,3:5", added: [5], removed: [2],
	      sourceid: "0,1,3:9"});
    w.finalize();
});

test(group + "increasing position", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    w.verify({id: "0:4", position: 0, added: [], removed: []});
    collection.position=0.3;
    w.verify({id: "0:5", position: 0.3, added: [5], removed: []});
    collection.position=0.7;
    w.verify({id: "0:5", position: 0.7, added: [], removed: []});
    collection.position=1;
    w.verify({id: "1:5", position: 1, added: [], removed: [0]});
    w.finalize();
});

test(group + "decreasing position", function(t) {
    var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    w.verify({id: "0:4", position: 0, added: [], removed: []});
    collection.position=-0.3;
    w.verify({id: "9,0:4", position: -0.3, added: [9], removed: []});
    collection.position=-0.7;
    w.verify({id: "9,0:4", position: -0.7, added: [], removed: []});
    collection.position=-1;
    w.verify({id: "9,0:3", position: -1, added: [], removed: [4]});
    w.finalize();
});


test(group + "short collection", function(t) {
    var source = new Backbone.Collection(_(3).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    w.verify({id: "0:2", position: 0, added: [], removed: []});
    w.finalize();
});

test(group + "short collection offset", function(t) {
    var source = new Backbone.Collection(_(3).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5, offset: -1});
    var w = new Watch(t, collection);
    w.verify({id: "2,0:1", position: 0, added: [], removed: []});
    w.finalize();
});

test(group + "short collection position", function(t) {
    var source = new Backbone.Collection(_(3).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    w.verify({id: "0:2", position: 0, added: [], removed: []});
    collection.position=0.5;
    w.verify({id: [0, 1, 2, "clone_0"], position: 0.5, added: ["clone_0"], removed: []});
    collection.position=0.9;
    w.verify({id: [0, 1, 2, "clone_0"], position: 0.9, added: [], removed: []});
    collection.position=1;
    w.verify({id: "1:2,0", position: 1, added: [], removed: ["clone_0"]});
    w.finalize();
});

test(group + "remove less than 'count'", function(t) {
    var source = new Backbone.Collection(_(5).times(function(n) {return {"id": n}; }));
    var collection = new CollectionViewProxy(source, {count: 5});
    var w = new Watch(t, collection);
    w.verify({id: "0:4", positoin: 0, added: [], removed: []});
    source.pop();
    w.verify({id: "0:3", position: 0, added: [], removed: [4]});
    source.pop();
    w.verify({id: "0:2", position: 0, added: [], removed: [3]});
    source.pop();
    w.verify({id: "0:1", position: 0, added: [], removed: [2]});
    source.pop();
    w.verify({id: "0", position: 0, added: [], removed: [1]});
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
};

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
	};
	while(count--) {
		response.data.push({id: normalize(number,100)});
		number++;
	}
	xhr.respond(200, {'Content-Type': 'application-json'}, JSON.stringify(response));
});
// Set the server to auto respond
server.autoRespond=true;

group = "CollectionViewProxy async : ";

var TestCollection = Backbone.Collection.extend({
    url: function() {
		return "/data?start=0&count=5";
    }
});


test(group + "remove less than 'count'", function(t) {
	var source = new TestCollection();
	var collection = new CollectionViewProxy(source, {count: 5});
	var w = new Watch(t, collection);
	Promise.resolve(source.fetch({data: {start: 0, count: 5}}))
	.then(function() {
		w.verify({id: "0:4", position: 0, added: "0:4", removed: []});
		source.pop();
		w.verify({id: "0:3", position: 0, added: [], removed: [4]});
		source.pop();
		w.verify({id: "0:2", position: 0, added: [], removed: [3]});
		source.pop();
		w.verify({id: "0:1", position: 0, added: [], removed: [2]});
		source.pop();
		w.verify({id: "0", position: 0, added: [], removed: [1]});
		source.pop();
		w.verify({id: [], position: 0, added: [], removed: [0]});
	})
	.then(function() {
		w.finalize();
	},function(error) {
		console.log(error);
		w.finalize();
	});
});

var group="PagedCollection : ";

var TestPagedCollection = PagedCollection.extend({
	url: '/pagedData',
	parse: function(response, options) {
		this.serverTotal=response.count;
		return response.data;
	},
	getServerTotal: function() {
		return this.serverTotal;
	}
});

test(group + "Class defaults", function(t) {
	var collection=new PagedCollection();
	t.ok(collection instanceof PagedCollection, "instanceof PagedCollection");
	t.ok(collection instanceof Backbone.Collection, "instanceof Backbone.Collection");
	t.equal(collection.options.pagesize, 5);
	t.end();
});

test(group + "Initial fetch", function(t) {
	var collection = new TestPagedCollection({pagesize: 5});
	var w=new Watch(t, collection);
	collection.position=0;
	Promise.resolve(collection.current)
	.then(function() {
		w.verify({id: "95:99,0:9", added: "95:99,0:9", removed: []});
		w.finalize();		
	},function(error) {
		t.fail(error);
		w.finalize();
	});
});

test(group + "Increasing position", function(t) {
	var collection = new TestPagedCollection({pagesize: 5});
	var w=new Watch(t, collection);
	collection.position=0;
	Promise.resolve(collection.current)
	.then(function() {
		w.verify({id: "95:99,0:9", added: "95:99,0:9", removed: []});

		collection.position=1;
		t.ok(collection.current===undefined);
		w.verify({position: 1, added: [], removed: []});

		collection.position=5;
		return collection.current;
	})
	.then(function() {
		w.verify({position: 5, added: "10:14", removed: "95:99"});

		collection.position=8;
		t.ok(!collection.current);

		collection.position=10;
		return collection.current;
	})
	.then(function() {
		w.verify({position: 10, added: "15:19", removed: "0:4"});
		w.finalize();		
	},function(error) {
		t.fail(error);
		w.finalize();
	});
});

test(group + "Decreasing position", function(t) {
	var collection = new TestPagedCollection({pagesize: 5});
	var w=new Watch(t, collection);
	collection.position=0;
	Promise.resolve(collection.current)
	.then(function() {
		w.verify({id: "95:99,0:9", added: "95:99,0:9", removed: []});

		collection.position=-1;
		return collection.current;
	})
	.then(function() {
		w.verify({position: -1, added: "90:94", removed: "5:9", id: "90:99,0:4"});

		collection.position=-4;
		t.ok(!collection.current);

		collection.position=-7;
		return collection.current;
	})
	.then(function() {
		w.verify({position: -7, added: "85:89", removed: "0:4"});
		w.finalize();		
	}, function(error) {
		t.fail(error);
		w.finalize();
	});
});

test(group + "at", function(t) {
	var collection = new TestPagedCollection({pagesize: 5});
	var w=new Watch(t, collection);
	collection.position=0;
	Promise.resolve(collection.current)
	.then(function() {
		w.verify({at: {index: "-5:9", id: "95:99,0:9"}});
		t.ok(collection.at(0).id===0);

		collection.position=1;
		t.equal(collection.current, undefined);
		w.verify({at: {index: "-5:9", id: "95:99,0:9"}});
		w.verify({at: {index: "95:99,0:9", id: "95:99,0:9"}});
		//Move to the next page
		collection.position=5;
		return collection.current;
	})
	.then(function() {
		w.verify({at: {index: "0:14", id: "0:14"}});

		collection.position=10;
		return collection.current;
	})
	.then(function() {
		w.verify({at: {index: "5:19", id: "5:19"}});
		w.finalize();
	}, function(error) {
		t.fail("Error: " + error);
		w.finalize();
	});
});

group = "PagedCollectionProxy : ";

test(group + "Bootstrap", function(t) {
	var paged = new TestPagedCollection({pagesize: 5});
	var collection = new CollectionViewProxy(paged, {count: 5});
	var cw=new Watch(t, collection);
	collection.position=0;
	// Should collection proxy through to the current XHR request?
	// Then this could read collection.getXHR().when(...) ??
	Promise.resolve(paged.current)
	.then(function() {
		cw.verify({ position: 0, id: "0:4" });

		cw.finalize();
	}, function(error) {
		console.log("Error: " + error);
		cw.finalize();
	});
});

test(group + "Decreasing position", function(t) {
	var paged = new TestPagedCollection({pagesize: 5});
	var collection = new CollectionViewProxy(paged, {count: 5});
	var cw=new Watch(t, collection);
	collection.position=0;
	Promise.resolve(paged.current)
	.then(function() {
		cw.verify({position: 0, id: "0:4"});
		collection.position = -1;
		return paged.current;
	})
	.then(function() {
		cw.verify({position: -1, id: "99,0:3"});
		cw.finalize();

		collection.position = -2;
		cw.verify({id: "98:99,0:2"});
	}, function(error) {
		cw.finalize();
	});
});
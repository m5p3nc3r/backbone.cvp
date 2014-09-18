"use strict";

require.config({
  baseUrl: "../js",
  paths: {
  	"backbone": "libs/backbone/backbone-1.1.0",
  	"underscore": "libs/underscore/underscore",
  	"jquery" : "libs/jquery/jquery-2.0.3",
  	"mockjax": "libs/jquery/jquery.mockjax",
  },
  shim: {
  	"backbone": {
  		deps: ["underscore"],
  		exports: "Backbone"
  	},
  	"underscore": {
  		exports: "_"
  	},
  	"jquery": {
  		exports: "$"
  	},
  	"mockjax": {
  		deps: ["jquery"]
  	}
  }
});

require(["jquery", "backbone", "collectionviewproxy", "mockjax"],
function($, Backbone, CollectionViewProxy) {

	var watch=function(collection) {
		var added=[];
		var removed=[];
		var reset=[];
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
		};

		this.verify=function(options) {
			var safeAt = function(collection, index) {
				return index<collection.length ? collection.at(index) : {};
			};

			var safeArray = function(array, index) {
				return index<array.length ? array[index] : {};
			};

			if(options.position!=undefined) {
				equal(collection.position, options.position, "collection.position="+options.position);
			}
			if(options.id) {
				equal(collection.length, options.id.length, "Check collection length " + options.id.length);
				_.each(options.id, function(id, index) {
					equal(safeAt(collection, index).id, id, "collection["+index+"]="+id);
				}, this);
			}
			if(options.sourceid) {
				equal(collection.collection.length, options.sourceid.length, "Check backing collection length " + options.id.length);
				_.each(options.sourceid, function(id, index) {
					equal(safeAt(collection.collection, index).id, id, "collection["+index+"]="+id);
				}, this);				
			}
			if(options.added) {
				equal(added.length, options.added.length, "Added length " + options.added.length);
				_.each(options.added, function(id, index) {
					equal(id, safeArray(added, index).id);
				}, this);				
			}
			added=[];
			if(options.removed) {
				equal(removed.length, options.removed.length, "Removed length " + options.removed.length);
				_.each(options.removed, function(id, index) {
					equal(id, safeArray(removed, index).id);
				}, this);				
			}
			removed=[];
			if(options.reset) {
				equal(reset.length, options.reset.length, "Reset length " + options.reset.length);
				_.each(options.reset, function(id, index) {
					equal(id, reset[index].id)
				}, this);
			}
			reset=[];
		}
	};

	test("Class defaults", function() {
		var collection=new CollectionViewProxy(new Backbone.Collection());
		ok(collection instanceof CollectionViewProxy);
		ok(collection instanceof Backbone.Collection);
		equal(collection.options.count, 10);
	});

	test("Constructor", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5});
		var w=new watch(collection);
		w.verify({id: [0, 1, 2, 3, 4]});
		w.finalize();
	});

	test("Constructor offset", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
		var w = new watch(collection);
		w.verify({id: [8, 9, 0, 1, 2]});
		w.finalize();
	});


	test("Update position", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
		var w = new watch(collection);
		w.verify({id: [8, 9, 0, 1, 2], position: 0});
		collection.position = 1;
		w.verify({id: [9, 0, 1, 2, 3], position: 1, added: [3], removed: [8]});
		w.finalize();
	});

	test("Upadte position negative", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
		var w = new watch(collection);
		w.verify({id: [8, 9, 0, 1, 2], position: 0});
		collection.position = -1;
		w.verify({id: [7, 8, 9, 0, 1], position: -1, added: [7], removed: [2]});
		w.finalize();
	});

	test("Reset", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
		var w=new watch(collection);
		w.verify({id: [8, 9, 0, 1, 2]});
		collection.reset(_(10).times(function(n) {return {"id": 100+n}; }))
		w.verify({id: [108, 109, 100, 101, 102], reset: [108, 109, 100, 101, 102]});
		w.finalize();
	});

	test("Add out of window", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5});
		var w = new watch(collection);
		collection.add([{id: 10}]);
		w.verify({id: [0, 1, 2, 3, 4], added: [], removed: [],
				sourceid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]});
		w.finalize();
	});

	test("Add in window", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5, offset: -2});
		var w=new watch(collection);
		collection.add([{id: 10}]);
		w.verify({id: [9, 10, 0, 1, 2],added: [10], removed: [8],
			sourceid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]});
		w.finalize();
	});

	test("Remove out of window", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5});
		var w = new watch(collection);
		collection.remove(source.at(8));
		w.verify({id: [0, 1, 2, 3, 4], added: [], removed: [],
			sourceid: [0, 1, 2, 3, 4, 5, 6, 7, 9]});
		w.finalize();
	});

	test("Remove in window", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5});
		var w = new watch(collection);
		collection.remove(source.at(2));
		w.verify({id: [0, 1, 3, 4, 5], added: [5], removed: [2],
			sourceid: [0, 1, 3, 4, 5, 6, 7, 8, 9]});
		w.finalize();
	});

	test("increasing position", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5});
		var w = new watch(collection);
		w.verify({id: [0, 1, 2, 3, 4], position: 0, added: [], removed: []});
		collection.position=0.3;
		w.verify({id: [0, 1, 2, 3, 4, 5], position: 0.3, added: [5], removed: []});
		collection.position=0.7;
		w.verify({id: [0, 1, 2, 3, 4, 5], position: 0.7, added: [], removed: []});
		collection.position=1;
		w.verify({id: [1, 2, 3, 4, 5], position: 1, added: [], removed: [0]});
		w.finalize();
	});

	test("decreasing position", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5});
		var w = new watch(collection);
		w.verify({id: [0, 1, 2, 3, 4], position: 0, added: [], removed: []});
		collection.position=-0.3;
		w.verify({id: [9, 0, 1, 2, 3, 4], position: -0.3, added: [9], removed: []});
		collection.position=-0.7;
		w.verify({id: [9, 0, 1, 2, 3, 4], position: -0.7, added: [], removed: []});
		collection.position=-1;
		w.verify({id: [9, 0, 1, 2, 3], position: -1, added: [], removed: [4]});
		w.finalize();
	});


	test("short collection", function() {
		var source = new Backbone.Collection(_(3).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5});
		var w = new watch(collection);
		w.verify({id: [0, 1, 2], position: 0, added: [], removed: []});
		w.finalize();
	});

	test("short collection offset", function() {
		var source = new Backbone.Collection(_(3).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5, offset: -1});
		var w = new watch(collection);
		w.verify({id: [2, 0, 1], position: 0, added: [], removed: []});
		w.finalize();
	});

	test("short collection position", function() {
		var source = new Backbone.Collection(_(3).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5});
		var w = new watch(collection);
		w.verify({id: [0, 1, 2], position: 0, added: [], removed: []});
		collection.position=0.5;
		w.verify({id: [0, 1, 2, "clone_0"], position: 0.5, added: ["clone_0"], removed: []});
		collection.position=0.9;
		w.verify({id: [0, 1, 2, "clone_0"], position: 0.9, added: [], removed: []});
		collection.position=1;
		w.verify({id: [1, 2, 0], position: 1, added: [], removed: ["clone_0"]});
		w.finalize();
	});

	test("remove less than 'count'", function() {
		var source = new Backbone.Collection(_(5).times(function(n) {return {"id": n}; }));
		var collection = new CollectionViewProxy(source, {count: 5});
		var w = new watch(collection);
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
    };	

	module("CollectionViewProxy remote collection", {

		setup: function(assert) {			
			$.mockjax({
				url: /^\/data\?*/,
				responseTime: 0,
				contentType: 'text/json',
				response: function(request) {
					var args=getURLArgs(request.url);
					var start=Number.parseInt(args.start);
					this.responseText=_(args.count).times(
						function(n) {return {"id": start+n}}
					);
				}
			});
		},
		teardown: function(assert) {

		}
	});

	var TestCollection = Backbone.Collection.extend({
		url: function() {
			return "/data?start=0&count=5";
		}
	});

	asyncTest("remove less than 'count'", function() {
		var source = new TestCollection();
		var collection = new CollectionViewProxy(source, {count: 5});
		var w = new watch(collection);
		source.fetch().then(
			function() {
				start();
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

});

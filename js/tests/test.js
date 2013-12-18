require.config({
  baseUrl: "js",
  paths: {
  	"backbone": "libs/backbone/backbone-1.1.0",
  	"underscore": "libs/underscore/underscore"
  },
  shim: {
  	"backbone": {
  		deps: ["underscore"],
  		exports: "Backbone"
  	},
  	"underscore": {
  		exports: "_"
  	}
  }
});

require(["backbone", "mycollection"],
function(Backbone, MyCollection) {

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
			if(options.id) {
				equal(collection.length, options.id.length, "Check collection length " + options.id.length);
				_.each(options.id, function(id, index) {
					equal(collection.at(index).id, id, "collection["+index+"]="+id);
				}, this);
			}
			if(options.sourceid) {
				equal(collection.collection.length, options.sourceid.length, "Check backing collection length " + options.id.length);
				_.each(options.sourceid, function(id, index) {
					equal(collection.collection.at(index).id, id, "collection["+index+"]="+id);
				}, this);				
			}
			if(options.position!=undefined) {
				equal(collection.position, options.position, "collection.position="+options.position);
			}
			if(options.added) {
				equal(added.length, options.added.length, "Added length " + options.added.length);
				_.each(options.added, function(id, index) {
					equal(id, added[index].id)
				}, this);				
			}
			added=[];
			if(options.removed) {
				equal(removed.length, options.removed.length, "Removed length " + options.removed.length);
				_.each(options.removed, function(id, index) {
					equal(id, removed[index].id)
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
		var collection=new MyCollection(new Backbone.Collection());
		ok(collection instanceof MyCollection);
		ok(collection instanceof Backbone.Collection);
		equal(collection.options.count, 10);
	});

	test("Constructor", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new MyCollection(source, {count: 5});
		var w=new watch(collection);
		w.verify({id: [0, 1, 2, 3, 4]});
		w.finalize();
	});

	test("Constructor offset", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new MyCollection(source, {count: 5, offset: -2});
		var w = new watch(collection);
		w.verify({id: [8, 9, 0, 1, 2]});
		w.finalize();
	});


	test("Update position", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new MyCollection(source, {count: 5, offset: -2});
		var w = new watch(collection);
		w.verify({id: [8, 9, 0, 1, 2], position: 0});
		collection.position = 1;
		w.verify({id: [9, 0, 1, 2, 3], position: 1, added: [3], removed: [8]});
		w.finalize();
	});

	test("Upadte position negative", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new MyCollection(source, {count: 5, offset: -2});
		var w = new watch(collection);
		w.verify({id: [8, 9, 0, 1, 2], position: 0});
		collection.position = -1;
		w.verify({id: [7, 8, 9, 0, 1], position: -1, added: [7], removed: [2]});
		w.finalize();
	});

	test("Reset", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new MyCollection(source, {count: 5, offset: -2});
		var w=new watch(collection);
		w.verify({id: [8, 9, 0, 1, 2]});
		collection.reset(_(10).times(function(n) {return {"id": 100+n}; }))
		w.verify({id: [108, 109, 100, 101, 102], reset: [108, 109, 100, 101, 102]});
		w.finalize();
	});

	test("Add out of window", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new MyCollection(source, {count: 5});
		var w = new watch(collection);
		collection.add([{id: 10}]);
		w.verify({id: [0, 1, 2, 3, 4], added: [], removed: [],
				sourceid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]});
		w.finalize();
	});

	test("Add in window", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new MyCollection(source, {count: 5, offset: -2});
		var w=new watch(collection);
		collection.add([{id: 10}]);
		w.verify({id: [9, 10, 0, 1, 2],added: [10], removed: [8],
			sourceid: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]});
		w.finalize();
	});

	test("Remove out of window", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new MyCollection(source, {count: 5});
		var w = new watch(collection);
		collection.remove(source.at(8));
		w.verify({id: [0, 1, 2, 3, 4], added: [], removed: [],
			sourceid: [0, 1, 2, 3, 4, 5, 6, 7, 9]});
		w.finalize();
	});

	test("Remove in window", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new MyCollection(source, {count: 5});
		var w = new watch(collection);
		collection.remove(source.at(2));
		w.verify({id: [0, 1, 3, 4, 5], added: [5], removed: [2],
			sourceid: [0, 1, 3, 4, 5, 6, 7, 8, 9]});
		w.finalize();
	});

	test("increasing position", function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		var collection = new MyCollection(source, {count: 5});
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
		var collection = new MyCollection(source, {count: 5});
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
});

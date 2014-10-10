define(['backbone', 'underscore'], function(Backbone, _) {

	"use strict";

	var DefaultOptions = {
		pagesize: 5,
		generateArgs: function(start, count) { return {start: start, count: count}},
	}

	var PagedCollection = Backbone.Collection.extend({
		constructor: function(options){
			return Backbone.Collection.call(this, [], options);
		},

		initialize: function(models, options) {
			this.options=_.extend({}, DefaultOptions, options);
		},

		requireFetch: function(newPosition) {
			var ret=this._position===undefined || this.range===undefined ||
				newPosition<this.range.low || newPosition>=this.range.high;
			return ret;
		},

		setPosition: function(position) {
			var fetch=this.requireFetch(position);
			this._position = position;

			if(fetch) this.current=this.fetch();
		},

		generateRange: function(position) {
			var low=Math.floor(position/this.options.pagesize)*this.options.pagesize;
			var high=low+this.options.pageSize;
			return {
				low: low, high: low+this.options.pagesize,
				start: low-this.options.pagesize, count: this.options.pagesize*3
			}
		},

		sync: function(method, model, options) {
			var range=this.generateRange(this._position);
			var extraArgs=this.options.generateArgs(range.start, range.count);
			if(!options.data){
				options.data=extraArgs;
			} else	{
				_.extend(options.data , extraArgs);
			}
			var that=this;
			var success=options.success;
			options.success=function() {
				that.current=undefined;
				that.range=range;
				if(success) success.apply(this, arguments);
			}
			var error=options.error;
			options.error=function() {
				that.current=undefined;
				if(error) error.apply(this, arguments);
			}

			return Backbone.Collection.prototype.sync.call(this, method, model, options);
		},

		getServerDataLength: function() {
			return 0;
		},

		// Override the 'at' function because we only have a subset of the complete data set
		at: function(index) {
			var i=index-this.range.start;
			return this.models[i];
		}
	});

	Object.defineProperty(PagedCollection.prototype, "position", {
		get: function() { return this._position; },
		set: function(v) { this.setPosition(v)}
	});

//	Object.defineProperty(PagedCollection.prototype, "length", {
//		get: function() { return this.getServerDataLength(); },
//		set: function(v) {/* Not valid to set the length, it's server set */}
//	});

	return PagedCollection;
});
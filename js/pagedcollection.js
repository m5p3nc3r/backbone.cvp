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

		setPosition: function(position) {
			var requireFetch=!this._position
			this._position = position;

			this.current=this.fetch();
		},

		sync: function(method, model, options) {
			var extraArgs=this.options.generateArgs(-5, this.options.pagesize*3);
			if(!options.data){
				options.data=extraArgs;
			} else	{
				_.extend(options.data , extraArgs);
			}
			return Backbone.Collection.prototype.sync.call(this, method, model, options);
		}
	});

	Object.defineProperty(PagedCollection.prototype, "position", {
		get: function() { return this._position; },
		set: function(v) { this.setPosition(v)}
	});

	return PagedCollection;
});
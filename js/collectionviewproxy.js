"use strict";

var Backbone = require('backbone');
var _ = require('underscore');

var DefaultOptions = {
	count: 10,
	offset: 0,
	position: 0
};

var CollectionViewProxy = Backbone.Collection.extend({
	constructor: function() {
		var args = [].slice.call(arguments);
		// Extract the collection
		var collection=args.shift();
		// Replace the first item with a 'null' model list - we manage this later
		args.unshift(undefined);

		// Validate input arguments
		if(!(collection instanceof Backbone.Collection)) {
			throw("Invalid argument: expected Backbone.Collection");
		}

		this.options=_.extend({}, DefaultOptions, args[1]);

		var ret=Backbone.Collection.apply(this,args);
		this._onReset(collection);
		return ret;
	},

	setPosition: function(position) {

		var normailze=function(x,length) {
			x=x%length;
			if(x<0) x+=length;
			return x;
		};

		var count=Math.min(this.options.count, this.collection.length);
		var pos=normailze(Math.floor(position+this.options.offset),this.collection.length);
		var models=[];

		// Check the condition where we don't need a clone (length<count),
		// but need count+1 items (positoin%1!=0)
		if(position%1!==0 && this.collection.length>this.options.count) count+=1;
		while(count) {
			models.push(this.collection.at(pos));
			pos++;
			if(pos>=this.collection.length) pos=0;
			count--;
		}

		// Check to see if a clone is needed
		if(this.collection.length<=this.options.count && position%1!==0) {
			models.push(this._createClone(models[0]));
		}

		this._position=position;

		Backbone.Collection.prototype.set.call(this,models, {proxy: false, merge: false});

		this.trigger("position", position);
	},

	_createClone: function(model) {
		var clone_id="clone_"+model.id;
		var clone=this.find(function(search) { return search.id===clone_id;});
		if(clone===undefined) {
			clone=model.clone();
			clone.id="clone_"+clone.id;
		}
		return clone;
	},

	_onAdd: function(model, collection, options) {
		// Reset the position - this will cause add/remove to be called as necessary
		this.position=this.position;
	},
	_onRemove: function(model, collection, options) {
		// Reset the position - this will cause add/remove to be called as necessary
		this.position=this.position;
	},
	_onReset: function(collection, options) {
		// Check to see if the collection has changed
		if(this.collection !== collection) {
			if(this.collection) {
				// Remove all registered handlers
				this.collection.off(undefined, undefined, this);
				// TODO: Clear out the old collection
				//
				this.collection=undefined;
			}
			this.collection=collection;
			this.collection
				.on('add', this._onAdd, this)
				.on('remove', this._onRemove, this)
				.on('reset', this._onReset, this);
		}

		// Reset the position to the default
		this._position=this.options.position;

		var models;
		if(this.options.offset<0) {
			var last=_.first(collection.models, this.options.count+this.options.offset);
			models=_.last(collection.models, Math.abs(this.options.offset));
			_.each(last, function(model) {
				models.push(model);
			});
		} else {
			models=_.first(collection.models, this.options.count);
		}

		Backbone.Collection.prototype.reset.call(this,models, {proxy: false});
	}
});

// Override specific functions of Backbone.Collection, pass the call on to the underlying collection
// so that we process the call properly
var methods=["add", "remove", "reset"];
_.each(methods, function(method) {
    CollectionViewProxy.prototype[method] = function() {
	var target=this.collection;
	if(arguments[1] && arguments[1].proxy===false) target=this;
	return Backbone.Collection.prototype[method].apply(target, arguments);
    };
});

// Create a 'position' property that can be used to set/get the position of the collection

Object.defineProperty(CollectionViewProxy.prototype, "position", {
	get: function() { return this._position; },
	set: function(v) { this.setPosition(v); }
});

module.exports = CollectionViewProxy;

define(['backbone', 'underscore'], function(Backbone, _) {

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
				throw("Poo");
			}

			this.options=_.extend({}, DefaultOptions, args[1]);

			var ret=Backbone.Collection.apply(this,args);
			this._onReset(collection);
			return ret;
		},

		getPosition: function() {
			return this._position;
		},

		setPosition: function(position) {
			var start=Math.floor(position+this.options.offset);
			var end=Math.ceil(position+this.options.offset+this.options.count);
			var models;

			var normailze=function(x,length) {
				x=x%length;
				if(x<0) x+=length;
				return x;
			}

			start=normailze(start,this.collection.length);
			end=normailze(end,this.collection.length);

			if(start<end) {
				models=this.collection.slice(start, end);
			} else {
				var last=this.collection.models.slice(0, end);
				models=this.collection.models.slice(start);
				_.each(last, function(model) {
					models.push(model);
				});
			}

			this._position=position;

			Backbone.Collection.prototype.set.call(this,models, {proxy: false});

			this.trigger("position", position);

		},

		_onAdd: function(model, collection, options) {
			this.position=this.position;
		},
		_onRemove: function(model, collection, options) {
			this.position=this.position;
		},
		_onReset: function(collection, options) {
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

	var methods=["add", "remove", "reset"];
	_.each(methods, function(method) {
		CollectionViewProxy.prototype[method] = function() {
			var target=this.collection;
			if(arguments[1] && arguments[1].proxy===false) target=this;
      		return Backbone.Collection.prototype[method].apply(target, arguments);
		}
	});

	Object.defineProperty(CollectionViewProxy.prototype, "position", {
		get: function() { return this.getPosition(); },
		set: function(v) { this.setPosition(v)}
	});


	return CollectionViewProxy;
});
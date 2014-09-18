define([], function() {

	"use strict"

	var CacheDefaults={
		onPush: function() {}
	};

	var Cache=function(options) {
		this.cache=[];
		this.options=_.extend({}, CacheDefaults, options);
	}
	Cache.prototype.push = function(item) {
		this.cache.push(item);
		this.options.onPush(item);
	}
	Cache.prototype.pop = function() {
		var item=this.cache.pop();
		if(item===undefined) {
			item=this.options.miss.apply(this, arguments);
		} else {
			var args=[].slice.call(arguments);
			args.unshift(item);
			this.options.hit.apply(this, args);
		}
		return item;
	}

	return Cache;
});
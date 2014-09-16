define(['underscore'], function(_) {
	var TouchDefaults={
		onStart: function() {},
		onMove: function() {},
		onEnd: function() {}
	};

	var Touch=function(config) {
		this.options=_.extend({}, TouchDefaults, config);
		if(!this.options.target) throw "Touch target is undefined";

		this.options.target.$el.on('touchstart', _.bind(this.onTouchStart, this));
		this.options.target.$el.on('touchmove', _.bind(this.onTouchMove, this));
		this.options.target.$el.on('touchend', _.bind(this.onTouchEnd, this));

		this.currentTouches=[];
	}

	Touch.prototype.onTouchStart = function(event) {
		_.each(event.originalEvent.changedTouches, function(touch) {
			var t={id: touch.identifier, last: {x: touch.pageX, y: touch.pageY}, delta: {x: 0, y: 0}};
			this.currentTouches.push(t);
			this.options.onStart(t);
		}, this);
	}

	Touch.prototype.onTouchMove = function(event) {
		_.each(event.originalEvent.changedTouches, function(touch) {
			var t=_.find(this.currentTouches, function(item) {return item.id==touch.identifier});
			t.delta.x=touch.pageX-t.last.x;
			t.delta.y=touch.pageY-t.last.y;
			t.last.x=touch.pageX;
			t.last.y=touch.pageY;
			this.options.onMove(t);
		}, this);
	}

	Touch.prototype.onTouchEnd = function(event) {
		console.log("Touch end");
		_.each(event.originalEvent.changedTouches, function(touch) {
			var t=_.find(this.currentTouches, function(item) {return item.id==touch.identifier});
			this.options.onEnd(t);
			this.currentTouches=_.filter(this.currentTouches,function(item) {return item.id!=touch.identifier});			
			console.log(this.currentTouches.length);
		}, this);
	}

	return Touch;
});
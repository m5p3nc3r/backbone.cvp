"use strict";

var _ = require('underscore');

var TouchDefaults={
	onStart: function() {},
	onMove: function() {},
	onEnd: function() {}
};

var Touch=function(config) {
	this.options=_.extend({}, TouchDefaults, config);
	if(!this.options.target) throw "Touch target is undefined";

	this.options.target.$el.on('touchstart', _.bind(onTouchStart, this));
	this.options.target.$el.on('touchmove', _.bind(onTouchMove, this));
	this.options.target.$el.on('touchend', _.bind(onTouchEnd, this));

	this.currentTouches=[];
};

var onTouchStart = function(event) {
	_.each(event.originalEvent.changedTouches, function(touch) {
		var t={id: touch.identifier,
			last: {x: touch.pageX, y: touch.pageY, t: new Date().getTime()},
			delta: {x: 0, y: 0, t: 0}, speed: 0};
		this.currentTouches.push(t);
		this.options.onStart(t);
	}, this);
};

var onTouchMove = function(event) {
	var now=new Date().getTime();
	_.each(event.originalEvent.changedTouches, function(touch) {
		var t=_.find(this.currentTouches, function(item) { return item.id==touch.identifier; });
		t.delta.x=touch.pageX-t.last.x;
		t.delta.y=touch.pageY-t.last.y;
		t.delta.t=now-t.last.t;
		t.last.x=touch.pageX;
		t.last.y=touch.pageY;
		t.last.t=now;
		t.speed = (0.8 * t.speed + 0.2 * (t.delta.x / t.delta.t));
		this.options.onMove(t);
	}, this);
};

var onTouchEnd = function(event) {
	var now=new Date().getTime();
	_.each(event.originalEvent.changedTouches, function(touch) {
		var t=_.find(this.currentTouches, function(item) { return item.id==touch.identifier; });
		t.delta.t=now-t.last.t;
		if(t.delta.t>30) t.speed=0; // Zero the effective speed if the touch has been 'lingering'
		this.options.onEnd(t);
		this.currentTouches=_.filter(this.currentTouches,function(item) { 
		    return item.id!=touch.identifier;
		});			
	}, this);
};

module.exports = Touch;

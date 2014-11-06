var $=require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
var _ = require('underscore');
var ListView = require('./listview');
var CollectionViewProxy = require('../js/collectionviewproxy');
var Animate = require('../js/animate');
var Easing = require('../js/easing');
var Touch = require('../js/touch');

	
var Controller = function() {
	var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
	var collection = new CollectionViewProxy(source, {count: 5});
	var animate = new Animate({
		duration: 700,
		// Give it a bit of a nicer easing curve
		easing: Easing.easeOutQuad,
		// Step function called on every step of the animation
		step: _.bind(function(value) {
			collection.position=value;
		}, this)
	});
	// Construct a list view with the collectionView proxy
	var view=new ListView({collection: collection});
	$('body').append(view.render().el);
	var targetPosition=collection.position;

	var touch=new Touch({
		target: view,
		onStart: function(t) {
			animate.stop();
			t.itemWidth=view.collection.models[0].view.$el.outerWidth();
		},
		onMove: function(t) {
			collection.position -= (t.delta.x/t.itemWidth);
		},
		onEnd: function(t) {
			targetPosition=Math.round(collection.position - (t.speed/t.itemWidth)*1000);
			animate.stop().start({from: collection.position, to: targetPosition});
		}
	});

	$('body').on('keydown', function(event) {
		var preventDefault=true;
		switch(event.keyCode) {
			case 37: // Left
				animate.stop().start({from: collection.position, to: targetPosition-=1});
				break;
			case 39: // Right
				animate.stop().start({from: collection.position, to: targetPosition+=1});
				break;
			case 38: // Up
				source.add({id: source.length});
				break;
			case 40: // Down
				source.pop();
				break;
			default:
				preventDefault=false;
				break;
		}
		if(preventDefault) event.preventDefault();
	});
};

$(document).ready( function() {
    var c=new Controller();
});

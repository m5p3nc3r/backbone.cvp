var $=require('jquery');
var Backbone=require('backbone');
Backbone.$=$;
var _ = require('underscore');
var ListView = require('./listview');
var CollectionViewProxy = require('../js/collectionviewproxy');
var PagedCollection = require('../js/pagedcollection');
var Animate = require('../js/animate');
var Easing = require('../js/easing');
var Touch = require('../js/touch');
var sinon = require('sinon');

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
}

var server = sinon.fakeServer.create();
// Process data requests to the /pagedData endpoint
server.respondWith(/\/pagedData(.)*/, function(xhr, id) {
    var args=getURLArgs(xhr.url);
   	var count=args.count;
	var number=args.start;
	var max=1000;
	var response = {
		count: max,
		data: []
	};
	var normalize=function(number, max) {
		number=number%max;
		if(number<0) number+=max;
		return number;
	}
	while(count--) {
		response.data.push({id: normalize(number,max)});
		number++;
	}
	xhr.respond(200, {'Content-Type': 'application-json'}, JSON.stringify(response));
});
// Set the server to auto respond
server.autoRespond=true;

var InfinitePagedCollection = PagedCollection.extend({
	url: "/pagedData",
	getServerTotal: function() {
		return this.serverTotal;
	},
	parse: function(resp) { 
		this.serverTotal=resp.count;
		return resp.data;
	},
});

var Controller = function() {
//	var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
	var source = new InfinitePagedCollection();
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
	var targetPosition=collection.position=0;

	var touch=new Touch({
		target: view,
		onStart: function(t) {
			animate.stop();
			t.itemWidth=view.collection.at(0).view.$el.outerWidth();
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
				source.add({id: source.length})
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
}

$(document).ready( function() {
	var c=new Controller();
});
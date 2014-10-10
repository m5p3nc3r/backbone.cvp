require.config({
  baseUrl: "../js",
  paths: {
  	"backbone": "libs/backbone/backbone-1.1.0",
  	"underscore": "libs/underscore/underscore",
  	"jquery": "libs/jquery/jquery-2.0.3",
  	"mockjax": "libs/jquery/jquery.mockjax",
  },
  shim: {
  	"jquery": {
  		exports: "$"
  	},
  	"backbone": {
  		deps: ["underscore", "jquery"],
  		exports: "Backbone"
  	},
  	"underscore": {
  		exports: "_"
  	},
  	"mockjax": {
  		deps: ["jquery"]
  	}
  }
});

require(["underscore", "./listview.js", "collectionviewproxy", "pagedcollection", "animate", "easing", "touch", "mockjax"],
function(_, ListView, CollectionViewProxy, PagedCollection, Animate, Easing, Touch) {

	// Mock AJAX server
	$.mockjax({
		url: /^\/data\?*/,
		responseTime: 0,
		contentType: 'text/json',
		response: function(request) {
			var count=request.data.count;
			var number=request.data.start;
			var ret=[];
			var normalize=function(number, max) {
				number=number%max;
				if(number<0) number+=max;
				return number;
			}
			while(count--) {
				ret.push({id: normalize(number,100)});
				number++;
			}
			this.responseText=ret;
		}
	});

	var InfinitePagedCollection = PagedCollection.extend({
		url: "/data"
	});

	var Controller = function() {
//		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
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

	var c=new Controller();
});
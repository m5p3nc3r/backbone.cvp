require.config({
  baseUrl: "../js",
  paths: {
  	"backbone": "libs/backbone/backbone-1.1.0",
  	"underscore": "libs/underscore/underscore",
  	"jquery": "libs/jquery/jquery-2.0.3"
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
  	}
  }
});

require(["backbone", "underscore", "./listview.js", "collectionviewproxy", "animate", "easing", "touch", "cache"],
function(Backbone, _, ListView, CollectionViewProxy, Animate, Easing, Touch, Cache) {


	var GridView = Backbone.View.extend({
		tagName: "div",
		className: "grid",

		initialize: function() {
			this.collection.on("position", this.layout, this);
			this.collection.on("add", this.onAdd, this);
			this.collection.on("remove", this.onRemove, this);
			// Simple view cache - used to reduce the amount of DOM thrashing during animation
			this.cache=new Cache({
				miss: _.bind(function(model) {
					var controller=new Controller({
						horizontal: true,
						source: new Backbone.Collection(_(10).times(function(n) {return {"id": model.id + " : " +n}; })),
						view: ListView,
						count: 5,
						parent: this.$el,
					});
					return controller.view;
				}, this),
				hit: _.bind(function(view, model) {
					var collection=_(10).times(function(n) {return {"id": model.id + " : " +n}; });
					view.setModel(collection);
				}, this)
			});
		},

		template: _.template(""),

		render: function() {
			this.$el.html(this.template({}));
			this.collection.each(function(model) {
				this._add(model, model.collection);
			}, this);
			this.layout();
			return this;
		},
		_add: function(model, collection, options) {
			var view=this.cache.pop(model);
			model.view=view;
		},
		onAdd: function(model, collection, options) {
			this._add(model, collection, options);
			model.view.show();
			var that=this;
			_.defer(function() {
				that.layout();
			});
		},
		onRemove: function(model, collection, options) {
			this.cache.push(model.view);
			model.view.hide();
			model.view=undefined;
			var that=this;
			_.defer(function() {
				that.layout();
			});
		},
		layout: function() {
			var delta=this.collection.position%1;
			var length=this.collection.length;
			if(delta<0) delta+=1;
			this.collection.each(function(model, index) {
				var alpha=1;
				if(index==0) alpha=1-delta;
				if(index==length-1 && delta!=0) alpha=delta;
				model.view.$el.css('transform', 'translate3D(0,'+Math.round((index-delta)*100)+'%,0');
				model.view.$el.css('opacity', alpha);
			});
		},
		
	});

	var ControllerDefaults={
		horizontal: true,
		source: undefined,
		view: GridView,
		count: 5,
		parent: $('body'),
	};
	
	var Controller = function(config) {
		var config=_.extend({}, ControllerDefaults, config);
		var collection = this.collection = new CollectionViewProxy(config.source, {count: config.count});
		var animate = this.animate = new Animate({
			duration: 700,
			// Give it a bit of a nicer easing curve
			easing: Easing.easeOutQuad,
			// Step function called on every step of the animation
			step: _.bind(function(value) {
				collection.position=value;
			}, this)
		});
		// Construct a list view with the collectionView proxy
		var view=this.view=new config.view({collection: this.collection});
		view.controller=this; // Not realy nice, but will do for now
		config.parent.append(view.render().el);
		this.targetPosition=this.collection.position;

		var touch=new Touch({
			target: view,
			onStart: function(t) {
				animate.stop();
				var item=view.collection.at(0).view.$el;
				t.itemSize=config.horizontal ? item.outerWidth() : item.outerHeight();;
			},
			onMove: function(t) {
				collection.position -= (config.horizontal ? t.delta.x : t.delta.y)/t.itemSize;
			},
			onEnd: function(t) {
				targetPosition=Math.round(collection.position - (t.speed/t.itemSize)*1000);
				animate.stop().start({from: collection.position, to: targetPosition});
			}
		});
	};
	Controller.prototype.prev=function() {
		this.animate.stop().start({from: this.collection.position, to: this.targetPosition-=1});
	};
	Controller.prototype.next=function() {
		this.animate.stop().start({from: this.collection.position, to: this.targetPosition+=1});
	};

	var c=new Controller({
		horizontal: false,
		source: new Backbone.Collection(_(10).times(function(n) {return {"id": n}; })),
		view: GridView,
		count: 5,
		parent: $('body')
	});

	$('body').on('keydown', function(event) {
		var preventDefault=true;
		switch(event.keyCode) {
			case 37: // Left
				c.collection.at(2).view.controller.prev();
				break;
			case 39: // Right
				c.collection.at(2).view.controller.next();
				break;
			case 38: // Up
				c.prev();
				break;
			case 40: // Down
				c.next();
				break;
			default:
				preventDefault=false;
				break;
		}
		if(preventDefault) event.preventDefault();
	});

});
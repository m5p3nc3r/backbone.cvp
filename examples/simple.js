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

require(["backbone", "underscore", "collectionviewproxy", "cache", "animate", "easing", "touch"],
function(Backbone, _, CollectionViewProxy, Cache, Animate, Easing, Touch) {
	var MyItemView = Backbone.View.extend({
		tagName: "div",
		className: "item",

		initialize: function() {
			this.listenTo(this.model, "change", this.render);
		},

		template: _.template("<div><span class='x'>Hello</span> <span class='y'><%= id %></span></div>"),

		render: function() {
			this.$el.html(this.template(this.model.attributes));
			return this;
		},

		setModel: function(model) {
			this.model=model;
			this.render();
		},

		show: function() {
			this.$el.css("opacity", 1);//0.9999);
		},

		hide: function() {
			this.$el.css("opacity", 0);
		}

	});

	var MyListView = Backbone.View.extend({
		tagName: "div",
		className: "list",

		initialize: function() {
			this.collection.on("position", this.layout, this);
			this.collection.on("add", this.onAdd, this);
			this.collection.on("remove", this.onRemove, this);
			// Simple view cache - used to reduce the amount of DOM thrashing during animation
			this.cache=new Cache({
				miss: _.bind(function(model) {
					var view=new MyItemView({model: model});
					this.$el.append(view.render().el);
					return view;
				}, this),
				hit: _.bind(function(view, model) {
					view.setModel(model);
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
				model.view.$el.css('transform', 'translate3D('+Math.round((index-delta)*100)+'%,0,0');
				model.view.$el.css('opacity', alpha);
			});
		}
	});
	
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
		var view=new MyListView({collection: collection});
		$('body').append(view.render().el);
		var targetPosition=collection.position;

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
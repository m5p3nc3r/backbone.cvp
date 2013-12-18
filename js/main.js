require.config({
//  baseUrl: "js",
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

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var Cache=function(options) {
	this.cache=[];
	this.options=options;
}
Cache.prototype.push = function(item) {
	this.cache.push(item);
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

require(["backbone", "underscore", "mycollection"], function(Backbone, _, CollectionViewProxy) {
	var MyItemView = Backbone.View.extend({
		tagName: "li",
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
			this.$el.css("opacity", 0.9999);
		},

		hide: function() {
			this.$el.css("opacity", 0);
		}

	});

	var MyListView = Backbone.View.extend({
		tagName: "ul",
		className: "list",

		initialize: function() {
			this.collection.on("position", this.layout, this);
			this.collection.on("add", this.onAdd, this);
			this.collection.on("remove", this.onRemove, this);
			this.cache=new Cache({
				miss: _.bind(function(model) {
					var view=new MyItemView({model: model});
					this.$el.append(view.render().el);
//					model.view=view;
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
			if(delta<0) delta+=1;
			this.collection.each(function(model, index) {
				model.view.$el.css('transform', 'translate3D('+(index-delta)*100+'%,0,0');
			});
		}
	});
	

	var Controller = function() {
		var source = new Backbone.Collection(_(10).times(function(n) {return {"id": n}; }));
		window.source=source;
		var collection = new CollectionViewProxy(source, {count: 5});
		window.c=collection;
		// Construct a list view with the collectionView proxy
		var listView=new MyListView({collection: collection});
		window.v=listView;
		$('body').append(listView.render().el);

		$('body').on('keydown', function(event) {
			switch(event.keyCode) {
				case 37: // Left
					collection.position=collection._position-0.1;
					event.preventDefault();
					break;
				case 39: // Roght
					collection.position=collection._position+0.1;
					event.preventDefault();
					break;
				case 38: // Up
				case 40: // Down
					break;
			}
		});

		(function animationLoop() {
			window.requestAnimFrame(animationLoop);
			collection.position=collection.position+0.01;
		})();
	}

	var c=new Controller();
});
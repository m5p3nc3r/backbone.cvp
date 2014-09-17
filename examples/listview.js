
define(["backbone", "underscore", "collectionviewproxy", "cache"],
function(Backbone, _, CollectionViewProxy, Cache) {

	var ItemView = Backbone.View.extend({
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

	var ListView = Backbone.View.extend({
		tagName: "div",
		className: "list",

		initialize: function() {
			this.collection.on("position", this.layout, this);
			this.collection.on("add", this.onAdd, this);
			this.collection.on("remove", this.onRemove, this);
			// Simple view cache - used to reduce the amount of DOM thrashing during animation
			this.cache=new Cache({
				miss: _.bind(function(model) {
					var view=new ItemView({model: model});
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

	return ListView
	
	
});
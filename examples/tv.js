var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$=$;
var _ = require('underscore');
var CollectionViewProxy = require('../js/collectionviewproxy');
var Animate = require('../js/animate');
var Easing = require('../js/easing');
var Cache = require('../js/cache');

var ItemView = Backbone.View.extend({
	tagName: "div",
	className: "item",

	initialize: function() {
		this.listenTo(this.model, "change", this.render);
	},

	template: _.template("<div><span id='title'><%= name %></span></div>"),

	render: function(highlighted) {
		this.$el.html(this.template(this.model.attributes));
		this.highlight(highlighted);
		return this;
	},

	setModel: function(model) {
		this.model=model;
		this.render(false);
	},

	highlight: function(h) {
		if(h) {
			this.$el.addClass('highlight');
		} else {
			this.$el.removeClass('highlight');
		}
	},

	show: function() {
		this.$el.css("opacity", 1);
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
		this.collection.on("reset", this.onReset, this);
		this.highlightedIndex=this.collection.position;
		// Simple view cache - used to reduce the amount of DOM thrashing during animation
		this.cache=new Cache({
			miss: _.bind(function(model) {
				var view=new ItemView({model: model});
				this.$el.append(view.render(this.collection.at(this.highlightedIndex)===model).el);
				return view;
			}, this),
			hit: _.bind(function(view, model) {
				view.setModel(model);
				view.highlight(this.collection.at(this.highlightedIndex)==model);

			}, this),
			onPush: function(view) {
				view.hide();
				view.model.view=undefined;
			}
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
		var that=this;
		_.defer(function() {
			that.layout();
		});
	},
	onReset: function(collection, options) {
		_.each(options.previousModels, function(model) {
			this.cache.push(model.view);
		}, this);
		collection.each(function(model) {
			this._add(model, collection);
		}, this);
	},
	layout: function() {
		var delta=this.collection.position%1;
		var length=this.collection.length;
		if(delta<0) delta+=1;
		this.collection.each(function(model, index) {
			model.view.$el.css('transform', 'translate3D('+Math.round((index-delta)*100)+'%,0,0');
		});
	},
	highlight: function(index) {
		var model=this.collection.at(this.highlightedIndex)
		if(model && model.view) model.view.highlight(false);
		model=this.collection.at(index);
		if(model && model.view) model.view.highlight(true);
		this.highlightedIndex=index;
	}
});


var Episodes = Backbone.Collection.extend({
//	url: 'http://api.tvmaze.com/shows/83/episodes'
	url: './gen/episodes'
});

var Controller = function() {
	var source = new Episodes();
	source.fetch();
	var collection = new CollectionViewProxy(source, {count: 6, offset: -1});
	var animate = new Animate({
		duration: 700,
		easing: Easing.easeOutQuad,
		step: _.bind(function(value) {
			collection.position=value;
		}, this)
	});
	// Construct a list view with the collectionView proxy
	var view=new ListView({collection: collection});
	$('body').append(view.render().el);
		var targetPosition=collection.position;

		$('body').on('keydown', function(event) {
		var preventDefault=true;
		switch(event.keyCode) {
			case 37: // Left
				animate.stop().start({from: collection.position, to: targetPosition-=1});
				view.highlight(targetPosition);
				break;
			case 39: // Right
				animate.stop().start({from: collection.position, to: targetPosition+=1});
				view.highlight(targetPosition);
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

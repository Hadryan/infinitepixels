var App = {};

var Image = Backbone.Model.extend({
});

var ImageView = Backbone.View.extend({
	tagName: "li",
	template: _.template($('#template-image').html()),
	events: {
	},
	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'remove', this.remove);
	},
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
});
var LightboxImageView = ImageView.extend({
	tagName: "div",
	template: _.template($('#template-lightbox-image').html()),
	initialize: function(){},
	events: {
		"click .image-target": "hideLightbox"
	},
	hideLightbox: function() {
		$('#lightbox').empty();
		history.back();
	}
});

var ImageList = Backbone.Collection.extend({
	model: Image,
	fetch: function(params) {
		this.trigger('fetchstart');
		var self = this;
		_500px.api('/photos', params, function(response) {
			console.log(response.data);
			if (params.append) {
				_.each(response.data.photos, function(photo) {
					self.add(photo);
				});
			} else {
				self.reset(response.data.photos);
			}
			delete response.data.photos;
			var template = params.nextURL ? params.nextURL : "#photos/<%= feature %>/<% print(current_page + 1) %>";
			var nextURL = _.template(template, response.data);
			self.trigger('fetchend', response.data, nextURL);
		});
	}
});

var Images = new ImageList;

var AppView = Backbone.View.extend({
	el: $('#app'),

	events: {
	},

	initialize: function() {
		//Attached events that occur outside the framework
		$(window).on('resize', $.proxy(this.normalizeView, this));
		this.authUser();

		this.on('authorization_obtained', this.authUser);
		this.$photolist = $("#photolist");
		this.$showmore = $("#show-more");
		this.$lightbox = $("#lightbox");
		this.listenTo(Images, 'fetchend', this.renderImageList);
		this.listenTo(Images, 'fetchstart', this.clearImageList);
		this.normalizeView();
	},

	clearImageList: function() {
		this.$showmore.addClass('loading');
	//	this.$photolist.html('');
	},

	renderImageList: function(data, nextURL) {
		this.$photolist.html('');
		this.$showmore.attr('href', nextURL).removeClass('loading');
		Images.each(function(image) {
			var view = new ImageView({model: image});
			this.$photolist.append(view.render().el);
		}, this);
	},

	normalizeView: function() {
		this.$photolist.width( this.fitContent(290) );
	},

	fitContent: function(width) {
		return Math.floor( $(window).width() / width ) * width;
	},

	authUser: function() {

	},

	showPhoto: function(id) {
		var view = new LightboxImageView({
			model: Images.get(id)
		});
		//Arbitrary CSS hack to make popping the lightbox work on mobile safari... have no idea why this works
		this.$lightbox.html(view.render().el).css('kerning', 0);
	}
});


var Router = Backbone.Router.extend({
	routes: {
		"": "index",
		"photos/user_favorites(/:user_id)(/:page)": "favorites",
		"photos/:feature(/:user_id)": "photolist",
		"photo/:id": "photo",
	},

	index: function() {
		this.photolist('popular', 0);
	},

	photolist: function(feature, page) {
		Images.fetch({
			"feature": feature,
			"image_size": "[3, 5]",
			"page" : page ? page : 0,
			"append": !!page,
		})
	},

	photo: function(id) {
		App.showPhoto(id);
	},

	favorites: function(userId, page) {
		if(!userId || userId == 0) {
			userId = App.me.id;
		}

		Images.fetch({
			"feature": "user_favorites",
			"sort": "created_at",
			"image_size": "[3, 5]",
			"user_id": userId,
			"page" : page ? page : 0,
			"append": page == 0 ? false : true,
			"nextURL": "#photos/<%= feature %>/<%= filters.user_id %>/<% print(current_page + 1) %>"
		})
	}
});

var route = new Router();

var App = new AppView();
Backbone.history.start();

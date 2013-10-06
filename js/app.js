App = Ember.Application.create();

App.Router.map(function() {
  // put your routes here
});

App.Photo = DS.Model.extend({
	category: DS.attr('number'),
	image_url: DS.attr('string'),
	name: DS.attr('string'),
	nsfw: DS.attr('nsfw'),
	safeImage: function() {
		//TODO return work safe versions if an option is set
		return this.get('image_url');
	}
});

App.store = DS.Store.extend({
	 findQuery: function(what, params) {
		var store = this.get('store');
		var pluralized = what + 's';

		_500px.api('/' + pluralized, params, function (response) {
			store.pushMany(response[pluralized]);
			console.log(store);
		});
	 }
});

App.IndexRoute = Ember.Route.extend({
	photos: function() {
		var store = this.get('store');
		//store.findQuery('photo', {feature: 'user', username: 'JoshuaDavis1'});
		//console.log(store);
		return ['1', '2'];
	}
});

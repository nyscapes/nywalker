import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('about');
  this.route('help');
  this.route('places', function() {
    this.route('show', { path: '/:place_slug' });
  });
  this.route('login');
});

export default Router;

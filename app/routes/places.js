import Ember from 'ember';
// import InfinityRoute from 'ember-infinity/mixins/route';

// export default Ember.Route.extend(InfinityRoute, {
//   perPageParam: 'page_size',
//   pageParam: 'data_page',
//   model() {
//     return this.infinityModel('place', { perPage: 10, startingPage: 1 });
//   }
// });

export default Ember.Route.extend({
  model() {
    return this.get('store').findAll('place');
  }
});

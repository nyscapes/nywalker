import Ember from 'ember';
import RSVP from 'rsvp';
import slugify from 'npm:slugify';

export default Ember.Component.extend(Ember.TargetActionSupport, {
  store: Ember.inject.service(),
  nicknamesList: Ember.computed( () => {
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
        url: '/api/v1/nicknames-list',
        type: 'GET',
        dataType: 'json',
        beforeSend(xhr) { // This is not the actual format of the response…
          xhr.setRequestHeader('Accept', 'application/vnd.api+json');
        }
      }).done((data) => {
        if (data) { // will this always work?
          resolve(data);
        } else {
          reject(new Error('failed getting nicknames-list'));
        }
      });
    }).then((data) => {
      return data.map((nick) => {
        // return `${nick.name} <span class="muted">{${nick.slug}}</span>`;
        return nick.list_string;
      });
    });
  }),
  placeName: '',
  modalOpen: false,
  text: '',
  page: 2,
  // page: Ember.computed(function() {
  //   let theInstances = this.get('instances');
  //   console.log(theInstances);
  //   console.log('did u see it');
  //   // return this.get('instances').get('firstObject').page;
  // }),
  sequence: 3,

  // search: Ember.computed(function() { 
  //   return this.get('place');
  // }),
  instanceCenter: [0, 0],
  instanceZoom: 2,
  instanceMarker: false,
  instanceMarkerCenter: [51, 0],

  actions: {
    submit() { 
      let instance = {
        page: this.get('page'),
        sequence: this.get('sequence'),
        text: this.get('text'),
      };
      return this.get('createInstance')(instance);
    },
    openTheModal() { this.set('modalOpen', true); },
    modalClosed() {this.set('modalOpen', false); },
    setPlaceName(selectedPlace) { 
      this.set('placeName', selectedPlace);
      this.get('store').queryRecord('place', { slug: selectedPlace.match(/{([^}]*)}/)[1] }).then( place => { 
        this.set('text', selectedPlace.match(/(.*) -- {/)[1]);
        const latLng = [place.get('lat'), place.get('lon')];
        if (latLng[0] !== null) {
          this.set('instanceCenter', latLng);
          this.set('instanceMarkerCenter', latLng);
          this.set('instanceMarker', true);
          this.set('theInstancePlace', place);
          // this.set('instanceZoom', 8);
        } else {
          this.set('instanceMarker', false);
        }
      });
    },
    createPlace(place) {
      let newPlace = this.get('store').createRecord('place', place);
      newPlace.set('slug', slugify(newPlace.get('name')).toLowerCase());
      newPlace.save();//.then(function() {
      let selectedPlace = newPlace.get('name') + ' -- {' + newPlace.get('slug') + '}';
      this.set('modalOpen', false);
      this.triggerAction({
        action: 'setPlaceName',
        actionContext: selectedPlace,
        target: this
      });
    }
  }
});

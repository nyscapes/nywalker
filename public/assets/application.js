
function recenterMap(latLng){
  marker.setLatLng(latLng);
  map.panTo(latLng);
};

var washingtonSquare = L.latLng(40.7308, -73.9975);
// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.
;
L.Control.w3w = L.Control.extend({
	options: {
		position: 'bottomleft',
		locationText:'- - -',
		promptText: 'Press Ctrl+C to copy location',
		precision: 4,
		apikey : "JY9EU40P" //your api key
	},

	initialize: function(options)
	{
		L.Control.prototype.initialize.call(this, options);
	},

	onAdd: function(map)
	{
		var className = 'leaflet-control-w3w',
			that = this,
			container = this._container = L.DomUtil.create('div', className);
		this.visible = false;

		L.DomUtil.addClass(container, 'hidden');
		L.DomEvent.disableClickPropagation(container);
		this._addText(container, map);
		
		L.DomEvent.addListener(container, 'click', function() {
			window.prompt("Copy to clipboard: Ctrl+C, Enter", L.DomUtil.get(this._locationText).dataset.words);
    	}, this);
		return container;
	},

	_addText: function(container, context)
	{
		this._locationText = L.DomUtil.create('span', 'leaflet-control-w3w-locationText' , container);
		L.DomUtil.get(this._locationText).innerHTML = '<strong>w3w:</strong> ' + this.options.locationText;
		return container;
	},
	
	_getWords: function(obj,locText){
			var getJSON = function(url, successHandler, errorHandler) {
			 var xhr = typeof XMLHttpRequest != 'undefined' ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
			  xhr.open('get', url, true);
			  xhr.responseType = 'json';
			  xhr.onreadystatechange = function() {
			    var status;
			    var data;
			    if (xhr.readyState == 4) {
			      status = xhr.status;
			      if (status == 200) {
			        successHandler && successHandler(xhr.response);
			      } else {
			        errorHandler && errorHandler(status);
			      }
			    }
			  };
			  xhr.send();
			};
			
			getJSON('http://api.what3words.com/position?key='+this.options.apikey+'&position='+obj.lat+','+obj.lng, function(data) {
			  locText.innerHTML = '<strong>w3w:</strong> ' + data.words[0] + " " + data.words[1] + " " + data.words[2];
			  locText.dataset.words =("data-",  data.words[0] + " " + data.words[1] + " " + data.words[2]);
			  
			}, function(status) {
			  console.log('Something went wrong.');
			});
	},

	setCoordinates: function(obj)
	{
		if (!this.visible) {
			L.DomUtil.removeClass(this._container, 'hidden');
		}
		if (obj.latlng) {
			this._getWords(obj.latlng,L.DomUtil.get(this._locationText));
		}
	}
});
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['leaflet'], factory);
	} else if (typeof modules === 'object' && module.exports) {
		// define a Common JS module that relies on 'leaflet'
		module.exports = factory(require('leaflet'));
	} else {
		// Assume Leaflet is loaded into global object L already
		factory(L);
	}
}(this, function (L) {
	'use strict';

	L.TileLayer.Provider = L.TileLayer.extend({
		initialize: function (arg, options) {
			var providers = L.TileLayer.Provider.providers;

			var parts = arg.split('.');

			var providerName = parts[0];
			var variantName = parts[1];

			if (!providers[providerName]) {
				throw 'No such provider (' + providerName + ')';
			}

			var provider = {
				url: providers[providerName].url,
				options: providers[providerName].options
			};

			// overwrite values in provider from variant.
			if (variantName && 'variants' in providers[providerName]) {
				if (!(variantName in providers[providerName].variants)) {
					throw 'No such variant of ' + providerName + ' (' + variantName + ')';
				}
				var variant = providers[providerName].variants[variantName];
				var variantOptions;
				if (typeof variant === 'string') {
					variantOptions = {
						variant: variant
					};
				} else {
					variantOptions = variant.options;
				}
				provider = {
					url: variant.url || provider.url,
					options: L.Util.extend({}, provider.options, variantOptions)
				};
			} else if (typeof provider.url === 'function') {
				provider.url = provider.url(parts.splice(1, parts.length - 1).join('.'));
			}

			var forceHTTP = window.location.protocol === 'file:' || provider.options.forceHTTP;
			if (provider.url.indexOf('//') === 0 && forceHTTP) {
				provider.url = 'http:' + provider.url;
			}

			// If retina option is set
			if (provider.options.retina) {
				// Check retina screen
				if (options.detectRetina && L.Browser.retina) {
					// The retina option will be active now
					// But we need to prevent Leaflet retina mode
					options.detectRetina = false;
				} else {
					// No retina, remove option
					provider.options.retina = '';
				}
			}

			// replace attribution placeholders with their values from toplevel provider attribution,
			// recursively
			var attributionReplacer = function (attr) {
				if (attr.indexOf('{attribution.') === -1) {
					return attr;
				}
				return attr.replace(/\{attribution.(\w*)\}/,
					function (match, attributionName) {
						return attributionReplacer(providers[attributionName].options.attribution);
					}
				);
			};
			provider.options.attribution = attributionReplacer(provider.options.attribution);

			// Compute final options combining provider options with any user overrides
			var layerOpts = L.Util.extend({}, provider.options, options);
			L.TileLayer.prototype.initialize.call(this, provider.url, layerOpts);
		}
	});

	/**
	 * Definition of providers.
	 * see http://leafletjs.com/reference.html#tilelayer for options in the options map.
	 */

	L.TileLayer.Provider.providers = {
		OpenStreetMap: {
			url: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			options: {
				maxZoom: 19,
				attribution:
					'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			},
			variants: {
				Mapnik: {},
				BlackAndWhite: {
					url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
					options: {
						maxZoom: 18
					}
				},
				DE: {
					url: 'http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
					options: {
						maxZoom: 18
					}
				},
				France: {
					url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
					options: {
						attribution: '&copy; Openstreetmap France | {attribution.OpenStreetMap}'
					}
				},
				HOT: {
					url: 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
					options: {
						attribution: '{attribution.OpenStreetMap}, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
					}
				}
			}
		},
		OpenSeaMap: {
			url: 'http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
			options: {
				attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
			}
		},
		OpenTopoMap: {
			url: '//{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
			options: {
				maxZoom: 16,
				attribution: 'Map data: {attribution.OpenStreetMap}, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
			}
		},
		Thunderforest: {
			url: '//{s}.tile.thunderforest.com/{variant}/{z}/{x}/{y}.png',
			options: {
				attribution:
					'&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, {attribution.OpenStreetMap}',
				variant: 'cycle'
			},
			variants: {
				OpenCycleMap: 'cycle',
				Transport: {
					options: {
						variant: 'transport',
						maxZoom: 19
					}
				},
				TransportDark: {
					options: {
						variant: 'transport-dark',
						maxZoom: 19
					}
				},
				Landscape: 'landscape',
				Outdoors: 'outdoors'
			}
		},
		OpenMapSurfer: {
			url: 'http://openmapsurfer.uni-hd.de/tiles/{variant}/x={x}&y={y}&z={z}',
			options: {
				maxZoom: 20,
				variant: 'roads',
				attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data {attribution.OpenStreetMap}'
			},
			variants: {
				Roads: 'roads',
				AdminBounds: {
					options: {
						variant: 'adminb',
						maxZoom: 19
					}
				},
				Grayscale: {
					options: {
						variant: 'roadsg',
						maxZoom: 19
					}
				}
			}
		},
		Hydda: {
			url: 'http://{s}.tile.openstreetmap.se/hydda/{variant}/{z}/{x}/{y}.png',
			options: {
				variant: 'full',
				attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data {attribution.OpenStreetMap}'
			},
			variants: {
				Full: 'full',
				Base: 'base',
				RoadsAndLabels: 'roads_and_labels'
			}
		},
		MapQuestOpen: {
			/* Mapquest does support https, but with a different subdomain:
			 * https://otile{s}-s.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}
			 * which makes implementing protocol relativity impossible.
			 */
			url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}',
			options: {
				type: 'map',
				ext: 'jpg',
				attribution:
					'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
					'Map data {attribution.OpenStreetMap}',
				subdomains: '1234'
			},
			variants: {
				OSM: {},
				Aerial: {
					options: {
						type: 'sat',
						attribution:
							'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
							'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
					}
				},
				HybridOverlay: {
					options: {
						type: 'hyb',
						ext: 'png',
						opacity: 0.9
					}
				}
			}
		},
		MapBox: {
			url: '//api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}',
			options: {
				attribution:
					'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; ' +
					'Map data {attribution.OpenStreetMap}',
				subdomains: 'abcd'
			}
		},
		Stamen: {
			url: '//stamen-tiles-{s}.a.ssl.fastly.net/{variant}/{z}/{x}/{y}.{ext}',
			options: {
				attribution:
					'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
					'<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; ' +
					'Map data {attribution.OpenStreetMap}',
				subdomains: 'abcd',
				minZoom: 0,
				maxZoom: 20,
				variant: 'toner',
				ext: 'png'
			},
			variants: {
				Toner: 'toner',
				TonerBackground: 'toner-background',
				TonerHybrid: 'toner-hybrid',
				TonerLines: 'toner-lines',
				TonerLabels: 'toner-labels',
				TonerLite: 'toner-lite',
				Watercolor: {
					options: {
						variant: 'watercolor',
						minZoom: 1,
						maxZoom: 16
					}
				},
				Terrain: {
					options: {
						variant: 'terrain',
						minZoom: 4,
						maxZoom: 18,
						bounds: [[22, -132], [70, -56]]
					}
				},
				TerrainBackground: {
					options: {
						variant: 'terrain-background',
						minZoom: 4,
						maxZoom: 18,
						bounds: [[22, -132], [70, -56]]
					}
				},
				TopOSMRelief: {
					options: {
						variant: 'toposm-color-relief',
						ext: 'jpg',
						bounds: [[22, -132], [51, -56]]
					}
				},
				TopOSMFeatures: {
					options: {
						variant: 'toposm-features',
						bounds: [[22, -132], [51, -56]],
						opacity: 0.9
					}
				}
			}
		},
		Esri: {
			url: '//server.arcgisonline.com/ArcGIS/rest/services/{variant}/MapServer/tile/{z}/{y}/{x}',
			options: {
				variant: 'World_Street_Map',
				attribution: 'Tiles &copy; Esri'
			},
			variants: {
				WorldStreetMap: {
					options: {
						attribution:
							'{attribution.Esri} &mdash; ' +
							'Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
					}
				},
				DeLorme: {
					options: {
						variant: 'Specialty/DeLorme_World_Base_Map',
						minZoom: 1,
						maxZoom: 11,
						attribution: '{attribution.Esri} &mdash; Copyright: &copy;2012 DeLorme'
					}
				},
				WorldTopoMap: {
					options: {
						variant: 'World_Topo_Map',
						attribution:
							'{attribution.Esri} &mdash; ' +
							'Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
					}
				},
				WorldImagery: {
					options: {
						variant: 'World_Imagery',
						attribution:
							'{attribution.Esri} &mdash; ' +
							'Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
					}
				},
				WorldTerrain: {
					options: {
						variant: 'World_Terrain_Base',
						maxZoom: 13,
						attribution:
							'{attribution.Esri} &mdash; ' +
							'Source: USGS, Esri, TANA, DeLorme, and NPS'
					}
				},
				WorldShadedRelief: {
					options: {
						variant: 'World_Shaded_Relief',
						maxZoom: 13,
						attribution: '{attribution.Esri} &mdash; Source: Esri'
					}
				},
				WorldPhysical: {
					options: {
						variant: 'World_Physical_Map',
						maxZoom: 8,
						attribution: '{attribution.Esri} &mdash; Source: US National Park Service'
					}
				},
				OceanBasemap: {
					options: {
						variant: 'Ocean_Basemap',
						maxZoom: 13,
						attribution: '{attribution.Esri} &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
					}
				},
				NatGeoWorldMap: {
					options: {
						variant: 'NatGeo_World_Map',
						maxZoom: 16,
						attribution: '{attribution.Esri} &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
					}
				},
				WorldGrayCanvas: {
					options: {
						variant: 'Canvas/World_Light_Gray_Base',
						maxZoom: 16,
						attribution: '{attribution.Esri} &mdash; Esri, DeLorme, NAVTEQ'
					}
				}
			}
		},
		OpenWeatherMap: {
			url: 'http://{s}.tile.openweathermap.org/map/{variant}/{z}/{x}/{y}.png',
			options: {
				maxZoom: 19,
				attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
				opacity: 0.5
			},
			variants: {
				Clouds: 'clouds',
				CloudsClassic: 'clouds_cls',
				Precipitation: 'precipitation',
				PrecipitationClassic: 'precipitation_cls',
				Rain: 'rain',
				RainClassic: 'rain_cls',
				Pressure: 'pressure',
				PressureContour: 'pressure_cntr',
				Wind: 'wind',
				Temperature: 'temp',
				Snow: 'snow'
			}
		},
		HERE: {
			/*
			 * HERE maps, formerly Nokia maps.
			 * These basemaps are free, but you need an API key. Please sign up at
			 * http://developer.here.com/getting-started
			 *
			 * Note that the base urls contain '.cit' whichs is HERE's
			 * 'Customer Integration Testing' environment. Please remove for production
			 * envirionments.
			 */
			url:
				'//{s}.{base}.maps.cit.api.here.com/maptile/2.1/' +
				'maptile/{mapID}/{variant}/{z}/{x}/{y}/256/png8?' +
				'app_id={app_id}&app_code={app_code}',
			options: {
				attribution:
					'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
				subdomains: '1234',
				mapID: 'newest',
				'app_id': '<insert your app_id here>',
				'app_code': '<insert your app_code here>',
				base: 'base',
				variant: 'normal.day',
				maxZoom: 20
			},
			variants: {
				normalDay: 'normal.day',
				normalDayCustom: 'normal.day.custom',
				normalDayGrey: 'normal.day.grey',
				normalDayMobile: 'normal.day.mobile',
				normalDayGreyMobile: 'normal.day.grey.mobile',
				normalDayTransit: 'normal.day.transit',
				normalDayTransitMobile: 'normal.day.transit.mobile',
				normalNight: 'normal.night',
				normalNightMobile: 'normal.night.mobile',
				normalNightGrey: 'normal.night.grey',
				normalNightGreyMobile: 'normal.night.grey.mobile',

				carnavDayGrey: 'carnav.day.grey',
				hybridDay: {
					options: {
						base: 'aerial',
						variant: 'hybrid.day'
					}
				},
				hybridDayMobile: {
					options: {
						base: 'aerial',
						variant: 'hybrid.day.mobile'
					}
				},
				pedestrianDay: 'pedestrian.day',
				pedestrianNight: 'pedestrian.night',
				satelliteDay: {
					options: {
						base: 'aerial',
						variant: 'satellite.day'
					}
				},
				terrainDay: {
					options: {
						base: 'aerial',
						variant: 'terrain.day'
					}
				},
				terrainDayMobile: {
					options: {
						base: 'aerial',
						variant: 'terrain.day.mobile'
					}
				}
			}
		},
		Acetate: {
			url: 'http://a{s}.acetate.geoiq.com/tiles/{variant}/{z}/{x}/{y}.png',
			options: {
				attribution:
					'&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
				subdomains: '0123',
				minZoom: 2,
				maxZoom: 18,
				variant: 'acetate-base'
			},
			variants: {
				basemap: 'acetate-base',
				terrain: 'terrain',
				all: 'acetate-hillshading',
				foreground: 'acetate-fg',
				roads: 'acetate-roads',
				labels: 'acetate-labels',
				hillshading: 'hillshading'
			}
		},
		FreeMapSK: {
			url: 'http://t{s}.freemap.sk/T/{z}/{x}/{y}.jpeg',
			options: {
				minZoom: 8,
				maxZoom: 16,
				subdomains: '1234',
				bounds: [[47.204642, 15.996093], [49.830896, 22.576904]],
				attribution:
					'{attribution.OpenStreetMap}, vizualization CC-By-SA 2.0 <a href="http://freemap.sk">Freemap.sk</a>'
			}
		},
		MtbMap: {
			url: 'http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png',
			options: {
				attribution:
					'{attribution.OpenStreetMap} &amp; USGS'
			}
		},
		CartoDB: {
			url: 'http://{s}.basemaps.cartocdn.com/{variant}/{z}/{x}/{y}.png',
			options: {
				attribution: '{attribution.OpenStreetMap} &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
				subdomains: 'abcd',
				maxZoom: 19,
				variant: 'light_all'
			},
			variants: {
				Positron: 'light_all',
				PositronNoLabels: 'light_nolabels',
				PositronOnlyLabels: 'light_only_labels',
				DarkMatter: 'dark_all',
				DarkMatterNoLabels: 'dark_nolabels',
				DarkMatterOnlyLabels: 'dark_only_labels'
			}
		},
		HikeBike: {
			url: 'http://{s}.tiles.wmflabs.org/{variant}/{z}/{x}/{y}.png',
			options: {
				maxZoom: 19,
				attribution: '{attribution.OpenStreetMap}',
				variant: 'hikebike'
			},
			variants: {
				HikeBike: {},
				HillShading: {
					options: {
						maxZoom: 15,
						variant: 'hillshading'
					}
				}
			}
		},
		BasemapAT: {
			url: '//maps{s}.wien.gv.at/basemap/{variant}/normal/google3857/{z}/{y}/{x}.{format}',
			options: {
				maxZoom: 19,
				attribution: 'Datenquelle: <a href="www.basemap.at">basemap.at</a>',
				subdomains: ['', '1', '2', '3', '4'],
				format: 'png',
				bounds: [[46.358770, 8.782379], [49.037872, 17.189532]],
				variant: 'geolandbasemap'
			},
			variants: {
				basemap: 'geolandbasemap',
				grau: 'bmapgrau',
				overlay: 'bmapoverlay',
				highdpi: {
					options: {
						variant: 'bmaphidpi',
						format: 'jpeg'
					}
				},
				orthofoto: {
					options: {
						variant: 'bmaporthofoto30cm',
						format: 'jpeg'
					}
				}
			}
		},
		NASAGIBS: {
			url: '//map1.vis.earthdata.nasa.gov/wmts-webmerc/{variant}/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
			options: {
				attribution:
					'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
					'(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
				bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
				minZoom: 1,
				maxZoom: 9,
				format: 'jpg',
				time: '',
				tilematrixset: 'GoogleMapsCompatible_Level'
			},
			variants: {
				ModisTerraTrueColorCR: 'MODIS_Terra_CorrectedReflectance_TrueColor',
				ModisTerraBands367CR: 'MODIS_Terra_CorrectedReflectance_Bands367',
				ViirsEarthAtNight2012: {
					options: {
						variant: 'VIIRS_CityLights_2012',
						maxZoom: 8
					}
				},
				ModisTerraLSTDay: {
					options: {
						variant: 'MODIS_Terra_Land_Surface_Temp_Day',
						format: 'png',
						maxZoom: 7,
						opacity: 0.75
					}
				},
				ModisTerraSnowCover: {
					options: {
						variant: 'MODIS_Terra_Snow_Cover',
						format: 'png',
						maxZoom: 8,
						opacity: 0.75
					}
				},
				ModisTerraAOD: {
					options: {
						variant: 'MODIS_Terra_Aerosol',
						format: 'png',
						maxZoom: 6,
						opacity: 0.75
					}
				},
				ModisTerraChlorophyll: {
					options: {
						variant: 'MODIS_Terra_Chlorophyll_A',
						format: 'png',
						maxZoom: 7,
						opacity: 0.75
					}
				}
			}
		},
		NLS: {
			// Maps from http://maps.nls.uk/geo/explore/
			url: '//nls-{s}.tileserver.com/{variant}/{z}/{x}/{y}.jpg',
			options: {
				attribution: '<a href="http://geo.nls.uk/maps/">National Library of Scotland Historic Maps</a>',
				bounds: [[49.6, -12], [61.7, 3]],
				minZoom: 1,
				maxZoom: 18,
				subdomains: '0123',
			},
			variants: {
				// OS 1:1m to 1:10K, 1900s
				//   z0-10 - 1:1m
				//  z11-12 - ?
				//  z13-14 - one inch (1:63360)
				//  z15-18 - six inch (1:10560)
				'OS_1900': 'NLS_API',
				// OS 1:1m to 1:63K, 1920s-1940s
				//   z0-9  - 1:1m
				//  z10-11 - quarter inch (1:253440)
				//  z12-18 - one inch (1:63360)
				'OS_1920': 'nls',
				'OS_opendata': {
					url: 'http://geo.nls.uk/maps/opendata/{z}/{x}/{y}.png',
					options: {
						maxZoom: 16
					}
				},
				// OS six inch, 1843 - 1882
				'OS_6inch_1st': {
					url: 'http://geo.nls.uk/maps/os/six_inch/{z}/{x}/{y}.png',
					options: {
						tms: true,
						minZoom: 6,
						maxZoom: 16,
						bounds: [[49.86261, -8.66444], [60.89421, 1.7785]]
					}
				},
				// OS six inch, 1888 - 1913
				'OS_6inch': 'os_6_inch_gb',
				// OS 1:25000, 1937 - 1961
				'OS_25k': '25k',
				// OS one inch, 1945 - 1947
				'OS_npe': {
					url: 'http://geo.nls.uk/maps/os/newpopular/{z}/{x}/{y}.png',
					options: {
						tms: true,
						minZoom: 3,
						maxZoom: 15
					}
				},
				// OS one inch, 1952 - 1961
				'OS_7th': 'os7gb',
				// OS 1:1056, 1893 - 1896
				'OS_London': {
					options: {
						variant: 'London_1056',
						minZoom: 9,
						bounds: [[51.177621, -0.708618], [51.618016, 0.355682]]
					}
				},
				'GSGS_Ireland': {
					url: 'http://geo.nls.uk/maps/ireland/gsgs4136/{z}/{x}/{y}.png',
					options: {
						tms: true,
						minZoom: 5,
						maxZoom: 15,
						bounds: [[51.371780, -10.810546], [55.422779, -5.262451]]
					}
				}
			}
		}
	};

	L.tileLayer.provider = function (provider, options) {
		return new L.TileLayer.Provider(provider, options);
	};

	return L;
}));
/*
 Leaflet.markercluster, Provides Beautiful Animated Marker Clustering functionality for Leaflet, a JS library for interactive maps.
 https://github.com/Leaflet/Leaflet.markercluster
 (c) 2012-2013, Dave Leaver, smartrak
*/

!function(t,e){L.MarkerClusterGroup=L.FeatureGroup.extend({options:{maxClusterRadius:80,iconCreateFunction:null,spiderfyOnMaxZoom:!0,showCoverageOnHover:!0,zoomToBoundsOnClick:!0,singleMarkerMode:!1,disableClusteringAtZoom:null,removeOutsideVisibleBounds:!0,animateAddingMarkers:!1,spiderfyDistanceMultiplier:1,chunkedLoading:!1,chunkInterval:200,chunkDelay:50,chunkProgress:null,polygonOptions:{}},initialize:function(t){L.Util.setOptions(this,t),this.options.iconCreateFunction||(this.options.iconCreateFunction=this._defaultIconCreateFunction),this._featureGroup=L.featureGroup(),this._featureGroup.on(L.FeatureGroup.EVENTS,this._propagateEvent,this),this._nonPointGroup=L.featureGroup(),this._nonPointGroup.on(L.FeatureGroup.EVENTS,this._propagateEvent,this),this._inZoomAnimation=0,this._needsClustering=[],this._needsRemoving=[],this._currentShownBounds=null,this._queue=[]},addLayer:function(t){if(t instanceof L.LayerGroup){var e=[];for(var i in t._layers)e.push(t._layers[i]);return this.addLayers(e)}if(!t.getLatLng)return this._nonPointGroup.addLayer(t),this;if(!this._map)return this._needsClustering.push(t),this;if(this.hasLayer(t))return this;this._unspiderfy&&this._unspiderfy(),this._addLayer(t,this._maxZoom);var n=t,s=this._map.getZoom();if(t.__parent)for(;n.__parent._zoom>=s;)n=n.__parent;return this._currentShownBounds.contains(n.getLatLng())&&(this.options.animateAddingMarkers?this._animationAddLayer(t,n):this._animationAddLayerNonAnimated(t,n)),this},removeLayer:function(t){if(t instanceof L.LayerGroup){var e=[];for(var i in t._layers)e.push(t._layers[i]);return this.removeLayers(e)}return t.getLatLng?this._map?t.__parent?(this._unspiderfy&&(this._unspiderfy(),this._unspiderfyLayer(t)),this._removeLayer(t,!0),this._featureGroup.hasLayer(t)&&(this._featureGroup.removeLayer(t),t.setOpacity&&t.setOpacity(1)),this):this:(!this._arraySplice(this._needsClustering,t)&&this.hasLayer(t)&&this._needsRemoving.push(t),this):(this._nonPointGroup.removeLayer(t),this)},addLayers:function(t){var e,i,n,s,r=this._featureGroup,o=this._nonPointGroup,a=this.options.chunkedLoading,h=this.options.chunkInterval,_=this.options.chunkProgress;if(this._map){var u=0,l=(new Date).getTime(),d=L.bind(function(){for(var e=(new Date).getTime();u<t.length;u++){if(a&&0===u%200){var i=(new Date).getTime()-e;if(i>h)break}if(s=t[u],s.getLatLng){if(!this.hasLayer(s)&&(this._addLayer(s,this._maxZoom),s.__parent&&2===s.__parent.getChildCount())){var n=s.__parent.getAllChildMarkers(),p=n[0]===s?n[1]:n[0];r.removeLayer(p)}}else o.addLayer(s)}_&&_(u,t.length,(new Date).getTime()-l),u===t.length?(this._featureGroup.eachLayer(function(t){t instanceof L.MarkerCluster&&t._iconNeedsUpdate&&t._updateIcon()}),this._topClusterLevel._recursivelyAddChildrenToMap(null,this._zoom,this._currentShownBounds)):setTimeout(d,this.options.chunkDelay)},this);d()}else{for(e=[],i=0,n=t.length;n>i;i++)s=t[i],s.getLatLng?this.hasLayer(s)||e.push(s):o.addLayer(s);this._needsClustering=this._needsClustering.concat(e)}return this},removeLayers:function(t){var e,i,n,s=this._featureGroup,r=this._nonPointGroup;if(!this._map){for(e=0,i=t.length;i>e;e++)n=t[e],this._arraySplice(this._needsClustering,n),r.removeLayer(n);return this}for(e=0,i=t.length;i>e;e++)n=t[e],n.__parent?(this._removeLayer(n,!0,!0),s.hasLayer(n)&&(s.removeLayer(n),n.setOpacity&&n.setOpacity(1))):r.removeLayer(n);return this._topClusterLevel._recursivelyAddChildrenToMap(null,this._zoom,this._currentShownBounds),s.eachLayer(function(t){t instanceof L.MarkerCluster&&t._updateIcon()}),this},clearLayers:function(){return this._map||(this._needsClustering=[],delete this._gridClusters,delete this._gridUnclustered),this._noanimationUnspiderfy&&this._noanimationUnspiderfy(),this._featureGroup.clearLayers(),this._nonPointGroup.clearLayers(),this.eachLayer(function(t){delete t.__parent}),this._map&&this._generateInitialClusters(),this},getBounds:function(){var t=new L.LatLngBounds;this._topClusterLevel&&t.extend(this._topClusterLevel._bounds);for(var e=this._needsClustering.length-1;e>=0;e--)t.extend(this._needsClustering[e].getLatLng());return t.extend(this._nonPointGroup.getBounds()),t},eachLayer:function(t,e){var i,n=this._needsClustering.slice();for(this._topClusterLevel&&this._topClusterLevel.getAllChildMarkers(n),i=n.length-1;i>=0;i--)t.call(e,n[i]);this._nonPointGroup.eachLayer(t,e)},getLayers:function(){var t=[];return this.eachLayer(function(e){t.push(e)}),t},getLayer:function(t){var e=null;return this.eachLayer(function(i){L.stamp(i)===t&&(e=i)}),e},hasLayer:function(t){if(!t)return!1;var e,i=this._needsClustering;for(e=i.length-1;e>=0;e--)if(i[e]===t)return!0;for(i=this._needsRemoving,e=i.length-1;e>=0;e--)if(i[e]===t)return!1;return!(!t.__parent||t.__parent._group!==this)||this._nonPointGroup.hasLayer(t)},zoomToShowLayer:function(t,e){var i=function(){if((t._icon||t.__parent._icon)&&!this._inZoomAnimation)if(this._map.off("moveend",i,this),this.off("animationend",i,this),t._icon)e();else if(t.__parent._icon){var n=function(){this.off("spiderfied",n,this),e()};this.on("spiderfied",n,this),t.__parent.spiderfy()}};if(t._icon&&this._map.getBounds().contains(t.getLatLng()))e();else if(t.__parent._zoom<this._map.getZoom())this._map.on("moveend",i,this),this._map.panTo(t.getLatLng());else{var n=function(){this._map.off("movestart",n,this),n=null};this._map.on("movestart",n,this),this._map.on("moveend",i,this),this.on("animationend",i,this),t.__parent.zoomToBounds(),n&&i.call(this)}},onAdd:function(t){this._map=t;var e,i,n;if(!isFinite(this._map.getMaxZoom()))throw"Map has no maxZoom specified";for(this._featureGroup.onAdd(t),this._nonPointGroup.onAdd(t),this._gridClusters||this._generateInitialClusters(),e=0,i=this._needsRemoving.length;i>e;e++)n=this._needsRemoving[e],this._removeLayer(n,!0);this._needsRemoving=[],this._zoom=this._map.getZoom(),this._currentShownBounds=this._getExpandedVisibleBounds(),this._map.on("zoomend",this._zoomEnd,this),this._map.on("moveend",this._moveEnd,this),this._spiderfierOnAdd&&this._spiderfierOnAdd(),this._bindEvents(),i=this._needsClustering,this._needsClustering=[],this.addLayers(i)},onRemove:function(t){t.off("zoomend",this._zoomEnd,this),t.off("moveend",this._moveEnd,this),this._unbindEvents(),this._map._mapPane.className=this._map._mapPane.className.replace(" leaflet-cluster-anim",""),this._spiderfierOnRemove&&this._spiderfierOnRemove(),this._hideCoverage(),this._featureGroup.onRemove(t),this._nonPointGroup.onRemove(t),this._featureGroup.clearLayers(),this._map=null},getVisibleParent:function(t){for(var e=t;e&&!e._icon;)e=e.__parent;return e||null},_arraySplice:function(t,e){for(var i=t.length-1;i>=0;i--)if(t[i]===e)return t.splice(i,1),!0},_removeLayer:function(t,e,i){var n=this._gridClusters,s=this._gridUnclustered,r=this._featureGroup,o=this._map;if(e)for(var a=this._maxZoom;a>=0&&s[a].removeObject(t,o.project(t.getLatLng(),a));a--);var h,_=t.__parent,u=_._markers;for(this._arraySplice(u,t);_&&(_._childCount--,!(_._zoom<0));)e&&_._childCount<=1?(h=_._markers[0]===t?_._markers[1]:_._markers[0],n[_._zoom].removeObject(_,o.project(_._cLatLng,_._zoom)),s[_._zoom].addObject(h,o.project(h.getLatLng(),_._zoom)),this._arraySplice(_.__parent._childClusters,_),_.__parent._markers.push(h),h.__parent=_.__parent,_._icon&&(r.removeLayer(_),i||r.addLayer(h))):(_._recalculateBounds(),i&&_._icon||_._updateIcon()),_=_.__parent;delete t.__parent},_isOrIsParent:function(t,e){for(;e;){if(t===e)return!0;e=e.parentNode}return!1},_propagateEvent:function(t){if(t.layer instanceof L.MarkerCluster){if(t.originalEvent&&this._isOrIsParent(t.layer._icon,t.originalEvent.relatedTarget))return;t.type="cluster"+t.type}this.fire(t.type,t)},_defaultIconCreateFunction:function(t){var e=t.getChildCount(),i=" marker-cluster-";return i+=10>e?"small":100>e?"medium":"large",new L.DivIcon({html:"<div><span>"+e+"</span></div>",className:"marker-cluster"+i,iconSize:new L.Point(40,40)})},_bindEvents:function(){var t=this._map,e=this.options.spiderfyOnMaxZoom,i=this.options.showCoverageOnHover,n=this.options.zoomToBoundsOnClick;(e||n)&&this.on("clusterclick",this._zoomOrSpiderfy,this),i&&(this.on("clustermouseover",this._showCoverage,this),this.on("clustermouseout",this._hideCoverage,this),t.on("zoomend",this._hideCoverage,this))},_zoomOrSpiderfy:function(t){var e=this._map;e.getMaxZoom()===e.getZoom()?this.options.spiderfyOnMaxZoom&&t.layer.spiderfy():this.options.zoomToBoundsOnClick&&t.layer.zoomToBounds(),t.originalEvent&&13===t.originalEvent.keyCode&&e._container.focus()},_showCoverage:function(t){var e=this._map;this._inZoomAnimation||(this._shownPolygon&&e.removeLayer(this._shownPolygon),t.layer.getChildCount()>2&&t.layer!==this._spiderfied&&(this._shownPolygon=new L.Polygon(t.layer.getConvexHull(),this.options.polygonOptions),e.addLayer(this._shownPolygon)))},_hideCoverage:function(){this._shownPolygon&&(this._map.removeLayer(this._shownPolygon),this._shownPolygon=null)},_unbindEvents:function(){var t=this.options.spiderfyOnMaxZoom,e=this.options.showCoverageOnHover,i=this.options.zoomToBoundsOnClick,n=this._map;(t||i)&&this.off("clusterclick",this._zoomOrSpiderfy,this),e&&(this.off("clustermouseover",this._showCoverage,this),this.off("clustermouseout",this._hideCoverage,this),n.off("zoomend",this._hideCoverage,this))},_zoomEnd:function(){this._map&&(this._mergeSplitClusters(),this._zoom=this._map._zoom,this._currentShownBounds=this._getExpandedVisibleBounds())},_moveEnd:function(){if(!this._inZoomAnimation){var t=this._getExpandedVisibleBounds();this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds,this._zoom,t),this._topClusterLevel._recursivelyAddChildrenToMap(null,this._map._zoom,t),this._currentShownBounds=t}},_generateInitialClusters:function(){var t=this._map.getMaxZoom(),e=this.options.maxClusterRadius,i=e;"function"!=typeof e&&(i=function(){return e}),this.options.disableClusteringAtZoom&&(t=this.options.disableClusteringAtZoom-1),this._maxZoom=t,this._gridClusters={},this._gridUnclustered={};for(var n=t;n>=0;n--)this._gridClusters[n]=new L.DistanceGrid(i(n)),this._gridUnclustered[n]=new L.DistanceGrid(i(n));this._topClusterLevel=new L.MarkerCluster(this,-1)},_addLayer:function(t,e){var i,n,s=this._gridClusters,r=this._gridUnclustered;for(this.options.singleMarkerMode&&(t.options.icon=this.options.iconCreateFunction({getChildCount:function(){return 1},getAllChildMarkers:function(){return[t]}}));e>=0;e--){i=this._map.project(t.getLatLng(),e);var o=s[e].getNearObject(i);if(o)return o._addChild(t),t.__parent=o,void 0;if(o=r[e].getNearObject(i)){var a=o.__parent;a&&this._removeLayer(o,!1);var h=new L.MarkerCluster(this,e,o,t);s[e].addObject(h,this._map.project(h._cLatLng,e)),o.__parent=h,t.__parent=h;var _=h;for(n=e-1;n>a._zoom;n--)_=new L.MarkerCluster(this,n,_),s[n].addObject(_,this._map.project(o.getLatLng(),n));for(a._addChild(_),n=e;n>=0&&r[n].removeObject(o,this._map.project(o.getLatLng(),n));n--);return}r[e].addObject(t,i)}this._topClusterLevel._addChild(t),t.__parent=this._topClusterLevel},_enqueue:function(t){this._queue.push(t),this._queueTimeout||(this._queueTimeout=setTimeout(L.bind(this._processQueue,this),300))},_processQueue:function(){for(var t=0;t<this._queue.length;t++)this._queue[t].call(this);this._queue.length=0,clearTimeout(this._queueTimeout),this._queueTimeout=null},_mergeSplitClusters:function(){this._processQueue(),this._zoom<this._map._zoom&&this._currentShownBounds.intersects(this._getExpandedVisibleBounds())?(this._animationStart(),this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds,this._zoom,this._getExpandedVisibleBounds()),this._animationZoomIn(this._zoom,this._map._zoom)):this._zoom>this._map._zoom?(this._animationStart(),this._animationZoomOut(this._zoom,this._map._zoom)):this._moveEnd()},_getExpandedVisibleBounds:function(){if(!this.options.removeOutsideVisibleBounds)return this._map.getBounds();var t=this._map,e=t.getBounds(),i=e._southWest,n=e._northEast,s=L.Browser.mobile?0:Math.abs(i.lat-n.lat),r=L.Browser.mobile?0:Math.abs(i.lng-n.lng);return new L.LatLngBounds(new L.LatLng(i.lat-s,i.lng-r,!0),new L.LatLng(n.lat+s,n.lng+r,!0))},_animationAddLayerNonAnimated:function(t,e){if(e===t)this._featureGroup.addLayer(t);else if(2===e._childCount){e._addToMap();var i=e.getAllChildMarkers();this._featureGroup.removeLayer(i[0]),this._featureGroup.removeLayer(i[1])}else e._updateIcon()}}),L.MarkerClusterGroup.include(L.DomUtil.TRANSITION?{_animationStart:function(){this._map._mapPane.className+=" leaflet-cluster-anim",this._inZoomAnimation++},_animationEnd:function(){this._map&&(this._map._mapPane.className=this._map._mapPane.className.replace(" leaflet-cluster-anim","")),this._inZoomAnimation--,this.fire("animationend")},_animationZoomIn:function(t,e){var i,n=this._getExpandedVisibleBounds(),s=this._featureGroup;this._topClusterLevel._recursively(n,t,0,function(r){var o,a=r._latlng,h=r._markers;for(n.contains(a)||(a=null),r._isSingleParent()&&t+1===e?(s.removeLayer(r),r._recursivelyAddChildrenToMap(null,e,n)):(r.setOpacity(0),r._recursivelyAddChildrenToMap(a,e,n)),i=h.length-1;i>=0;i--)o=h[i],n.contains(o._latlng)||s.removeLayer(o)}),this._forceLayout(),this._topClusterLevel._recursivelyBecomeVisible(n,e),s.eachLayer(function(t){t instanceof L.MarkerCluster||!t._icon||t.setOpacity(1)}),this._topClusterLevel._recursively(n,t,e,function(t){t._recursivelyRestoreChildPositions(e)}),this._enqueue(function(){this._topClusterLevel._recursively(n,t,0,function(t){s.removeLayer(t),t.setOpacity(1)}),this._animationEnd()})},_animationZoomOut:function(t,e){this._animationZoomOutSingle(this._topClusterLevel,t-1,e),this._topClusterLevel._recursivelyAddChildrenToMap(null,e,this._getExpandedVisibleBounds()),this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds,t,this._getExpandedVisibleBounds())},_animationZoomOutSingle:function(t,e,i){var n=this._getExpandedVisibleBounds();t._recursivelyAnimateChildrenInAndAddSelfToMap(n,e+1,i);var s=this;this._forceLayout(),t._recursivelyBecomeVisible(n,i),this._enqueue(function(){if(1===t._childCount){var r=t._markers[0];r.setLatLng(r.getLatLng()),r.setOpacity&&r.setOpacity(1)}else t._recursively(n,i,0,function(t){t._recursivelyRemoveChildrenFromMap(n,e+1)});s._animationEnd()})},_animationAddLayer:function(t,e){var i=this,n=this._featureGroup;n.addLayer(t),e!==t&&(e._childCount>2?(e._updateIcon(),this._forceLayout(),this._animationStart(),t._setPos(this._map.latLngToLayerPoint(e.getLatLng())),t.setOpacity(0),this._enqueue(function(){n.removeLayer(t),t.setOpacity(1),i._animationEnd()})):(this._forceLayout(),i._animationStart(),i._animationZoomOutSingle(e,this._map.getMaxZoom(),this._map.getZoom())))},_forceLayout:function(){L.Util.falseFn(e.body.offsetWidth)}}:{_animationStart:function(){},_animationZoomIn:function(t,e){this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds,t),this._topClusterLevel._recursivelyAddChildrenToMap(null,e,this._getExpandedVisibleBounds()),this.fire("animationend")},_animationZoomOut:function(t,e){this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds,t),this._topClusterLevel._recursivelyAddChildrenToMap(null,e,this._getExpandedVisibleBounds()),this.fire("animationend")},_animationAddLayer:function(t,e){this._animationAddLayerNonAnimated(t,e)}}),L.markerClusterGroup=function(t){return new L.MarkerClusterGroup(t)},L.MarkerCluster=L.Marker.extend({initialize:function(t,e,i,n){L.Marker.prototype.initialize.call(this,i?i._cLatLng||i.getLatLng():new L.LatLng(0,0),{icon:this}),this._group=t,this._zoom=e,this._markers=[],this._childClusters=[],this._childCount=0,this._iconNeedsUpdate=!0,this._bounds=new L.LatLngBounds,i&&this._addChild(i),n&&this._addChild(n)},getAllChildMarkers:function(t){t=t||[];for(var e=this._childClusters.length-1;e>=0;e--)this._childClusters[e].getAllChildMarkers(t);for(var i=this._markers.length-1;i>=0;i--)t.push(this._markers[i]);return t},getChildCount:function(){return this._childCount},zoomToBounds:function(){for(var t,e=this._childClusters.slice(),i=this._group._map,n=i.getBoundsZoom(this._bounds),s=this._zoom+1,r=i.getZoom();e.length>0&&n>s;){s++;var o=[];for(t=0;t<e.length;t++)o=o.concat(e[t]._childClusters);e=o}n>s?this._group._map.setView(this._latlng,s):r>=n?this._group._map.setView(this._latlng,r+1):this._group._map.fitBounds(this._bounds)},getBounds:function(){var t=new L.LatLngBounds;return t.extend(this._bounds),t},_updateIcon:function(){this._iconNeedsUpdate=!0,this._icon&&this.setIcon(this)},createIcon:function(){return this._iconNeedsUpdate&&(this._iconObj=this._group.options.iconCreateFunction(this),this._iconNeedsUpdate=!1),this._iconObj.createIcon()},createShadow:function(){return this._iconObj.createShadow()},_addChild:function(t,e){this._iconNeedsUpdate=!0,this._expandBounds(t),t instanceof L.MarkerCluster?(e||(this._childClusters.push(t),t.__parent=this),this._childCount+=t._childCount):(e||this._markers.push(t),this._childCount++),this.__parent&&this.__parent._addChild(t,!0)},_expandBounds:function(t){var e,i=t._wLatLng||t._latlng;t instanceof L.MarkerCluster?(this._bounds.extend(t._bounds),e=t._childCount):(this._bounds.extend(i),e=1),this._cLatLng||(this._cLatLng=t._cLatLng||i);var n=this._childCount+e;this._wLatLng?(this._wLatLng.lat=(i.lat*e+this._wLatLng.lat*this._childCount)/n,this._wLatLng.lng=(i.lng*e+this._wLatLng.lng*this._childCount)/n):this._latlng=this._wLatLng=new L.LatLng(i.lat,i.lng)},_addToMap:function(t){t&&(this._backupLatlng=this._latlng,this.setLatLng(t)),this._group._featureGroup.addLayer(this)},_recursivelyAnimateChildrenIn:function(t,e,i){this._recursively(t,0,i-1,function(t){var i,n,s=t._markers;for(i=s.length-1;i>=0;i--)n=s[i],n._icon&&(n._setPos(e),n.setOpacity(0))},function(t){var i,n,s=t._childClusters;for(i=s.length-1;i>=0;i--)n=s[i],n._icon&&(n._setPos(e),n.setOpacity(0))})},_recursivelyAnimateChildrenInAndAddSelfToMap:function(t,e,i){this._recursively(t,i,0,function(n){n._recursivelyAnimateChildrenIn(t,n._group._map.latLngToLayerPoint(n.getLatLng()).round(),e),n._isSingleParent()&&e-1===i?(n.setOpacity(1),n._recursivelyRemoveChildrenFromMap(t,e)):n.setOpacity(0),n._addToMap()})},_recursivelyBecomeVisible:function(t,e){this._recursively(t,0,e,null,function(t){t.setOpacity(1)})},_recursivelyAddChildrenToMap:function(t,e,i){this._recursively(i,-1,e,function(n){if(e!==n._zoom)for(var s=n._markers.length-1;s>=0;s--){var r=n._markers[s];i.contains(r._latlng)&&(t&&(r._backupLatlng=r.getLatLng(),r.setLatLng(t),r.setOpacity&&r.setOpacity(0)),n._group._featureGroup.addLayer(r))}},function(e){e._addToMap(t)})},_recursivelyRestoreChildPositions:function(t){for(var e=this._markers.length-1;e>=0;e--){var i=this._markers[e];i._backupLatlng&&(i.setLatLng(i._backupLatlng),delete i._backupLatlng)}if(t-1===this._zoom)for(var n=this._childClusters.length-1;n>=0;n--)this._childClusters[n]._restorePosition();else for(var s=this._childClusters.length-1;s>=0;s--)this._childClusters[s]._recursivelyRestoreChildPositions(t)},_restorePosition:function(){this._backupLatlng&&(this.setLatLng(this._backupLatlng),delete this._backupLatlng)},_recursivelyRemoveChildrenFromMap:function(t,e,i){var n,s;this._recursively(t,-1,e-1,function(t){for(s=t._markers.length-1;s>=0;s--)n=t._markers[s],i&&i.contains(n._latlng)||(t._group._featureGroup.removeLayer(n),n.setOpacity&&n.setOpacity(1))},function(t){for(s=t._childClusters.length-1;s>=0;s--)n=t._childClusters[s],i&&i.contains(n._latlng)||(t._group._featureGroup.removeLayer(n),n.setOpacity&&n.setOpacity(1))})},_recursively:function(t,e,i,n,s){var r,o,a=this._childClusters,h=this._zoom;if(e>h)for(r=a.length-1;r>=0;r--)o=a[r],t.intersects(o._bounds)&&o._recursively(t,e,i,n,s);else if(n&&n(this),s&&this._zoom===i&&s(this),i>h)for(r=a.length-1;r>=0;r--)o=a[r],t.intersects(o._bounds)&&o._recursively(t,e,i,n,s)},_recalculateBounds:function(){var t,e=this._markers,i=this._childClusters;for(this._bounds=new L.LatLngBounds,delete this._wLatLng,t=e.length-1;t>=0;t--)this._expandBounds(e[t]);for(t=i.length-1;t>=0;t--)this._expandBounds(i[t])},_isSingleParent:function(){return this._childClusters.length>0&&this._childClusters[0]._childCount===this._childCount}}),L.DistanceGrid=function(t){this._cellSize=t,this._sqCellSize=t*t,this._grid={},this._objectPoint={}},L.DistanceGrid.prototype={addObject:function(t,e){var i=this._getCoord(e.x),n=this._getCoord(e.y),s=this._grid,r=s[n]=s[n]||{},o=r[i]=r[i]||[],a=L.Util.stamp(t);this._objectPoint[a]=e,o.push(t)},updateObject:function(t,e){this.removeObject(t),this.addObject(t,e)},removeObject:function(t,e){var i,n,s=this._getCoord(e.x),r=this._getCoord(e.y),o=this._grid,a=o[r]=o[r]||{},h=a[s]=a[s]||[];for(delete this._objectPoint[L.Util.stamp(t)],i=0,n=h.length;n>i;i++)if(h[i]===t)return h.splice(i,1),1===n&&delete a[s],!0},eachObject:function(t,e){var i,n,s,r,o,a,h,_=this._grid;for(i in _){o=_[i];for(n in o)for(a=o[n],s=0,r=a.length;r>s;s++)h=t.call(e,a[s]),h&&(s--,r--)}},getNearObject:function(t){var e,i,n,s,r,o,a,h,_=this._getCoord(t.x),u=this._getCoord(t.y),l=this._objectPoint,d=this._sqCellSize,p=null;for(e=u-1;u+1>=e;e++)if(s=this._grid[e])for(i=_-1;_+1>=i;i++)if(r=s[i])for(n=0,o=r.length;o>n;n++)a=r[n],h=this._sqDist(l[L.Util.stamp(a)],t),d>h&&(d=h,p=a);return p},_getCoord:function(t){return Math.floor(t/this._cellSize)},_sqDist:function(t,e){var i=e.x-t.x,n=e.y-t.y;return i*i+n*n}},function(){L.QuickHull={getDistant:function(t,e){var i=e[1].lat-e[0].lat,n=e[0].lng-e[1].lng;return n*(t.lat-e[0].lat)+i*(t.lng-e[0].lng)},findMostDistantPointFromBaseLine:function(t,e){var i,n,s,r=0,o=null,a=[];for(i=e.length-1;i>=0;i--)n=e[i],s=this.getDistant(n,t),s>0&&(a.push(n),s>r&&(r=s,o=n));return{maxPoint:o,newPoints:a}},buildConvexHull:function(t,e){var i=[],n=this.findMostDistantPointFromBaseLine(t,e);return n.maxPoint?(i=i.concat(this.buildConvexHull([t[0],n.maxPoint],n.newPoints)),i=i.concat(this.buildConvexHull([n.maxPoint,t[1]],n.newPoints))):[t[0]]},getConvexHull:function(t){var e,i=!1,n=!1,s=null,r=null;for(e=t.length-1;e>=0;e--){var o=t[e];(i===!1||o.lat>i)&&(s=o,i=o.lat),(n===!1||o.lat<n)&&(r=o,n=o.lat)}var a=[].concat(this.buildConvexHull([r,s],t),this.buildConvexHull([s,r],t));return a}}}(),L.MarkerCluster.include({getConvexHull:function(){var t,e,i=this.getAllChildMarkers(),n=[];for(e=i.length-1;e>=0;e--)t=i[e].getLatLng(),n.push(t);return L.QuickHull.getConvexHull(n)}}),L.MarkerCluster.include({_2PI:2*Math.PI,_circleFootSeparation:25,_circleStartAngle:Math.PI/6,_spiralFootSeparation:28,_spiralLengthStart:11,_spiralLengthFactor:5,_circleSpiralSwitchover:9,spiderfy:function(){if(this._group._spiderfied!==this&&!this._group._inZoomAnimation){var t,e=this.getAllChildMarkers(),i=this._group,n=i._map,s=n.latLngToLayerPoint(this._latlng);this._group._unspiderfy(),this._group._spiderfied=this,e.length>=this._circleSpiralSwitchover?t=this._generatePointsSpiral(e.length,s):(s.y+=10,t=this._generatePointsCircle(e.length,s)),this._animationSpiderfy(e,t)}},unspiderfy:function(t){this._group._inZoomAnimation||(this._animationUnspiderfy(t),this._group._spiderfied=null)},_generatePointsCircle:function(t,e){var i,n,s=this._group.options.spiderfyDistanceMultiplier*this._circleFootSeparation*(2+t),r=s/this._2PI,o=this._2PI/t,a=[];for(a.length=t,i=t-1;i>=0;i--)n=this._circleStartAngle+i*o,a[i]=new L.Point(e.x+r*Math.cos(n),e.y+r*Math.sin(n))._round();return a},_generatePointsSpiral:function(t,e){var i,n=this._group.options.spiderfyDistanceMultiplier*this._spiralLengthStart,s=this._group.options.spiderfyDistanceMultiplier*this._spiralFootSeparation,r=this._group.options.spiderfyDistanceMultiplier*this._spiralLengthFactor,o=0,a=[];for(a.length=t,i=t-1;i>=0;i--)o+=s/n+5e-4*i,a[i]=new L.Point(e.x+n*Math.cos(o),e.y+n*Math.sin(o))._round(),n+=this._2PI*r/o;return a},_noanimationUnspiderfy:function(){var t,e,i=this._group,n=i._map,s=i._featureGroup,r=this.getAllChildMarkers();for(this.setOpacity(1),e=r.length-1;e>=0;e--)t=r[e],s.removeLayer(t),t._preSpiderfyLatlng&&(t.setLatLng(t._preSpiderfyLatlng),delete t._preSpiderfyLatlng),t.setZIndexOffset&&t.setZIndexOffset(0),t._spiderLeg&&(n.removeLayer(t._spiderLeg),delete t._spiderLeg);i._spiderfied=null}}),L.MarkerCluster.include(L.DomUtil.TRANSITION?{SVG_ANIMATION:function(){return e.createElementNS("http://www.w3.org/2000/svg","animate").toString().indexOf("SVGAnimate")>-1}(),_animationSpiderfy:function(t,i){var n,s,r,o,a=this,h=this._group,_=h._map,u=h._featureGroup,l=_.latLngToLayerPoint(this._latlng);for(n=t.length-1;n>=0;n--)s=t[n],s.setOpacity?(s.setZIndexOffset(1e6),s.setOpacity(0),u.addLayer(s),s._setPos(l)):u.addLayer(s);h._forceLayout(),h._animationStart();var d=L.Path.SVG?0:.3,p=L.Path.SVG_NS;for(n=t.length-1;n>=0;n--)if(o=_.layerPointToLatLng(i[n]),s=t[n],s._preSpiderfyLatlng=s._latlng,s.setLatLng(o),s.setOpacity&&s.setOpacity(1),r=new L.Polyline([a._latlng,o],{weight:1.5,color:"#222",opacity:d}),_.addLayer(r),s._spiderLeg=r,L.Path.SVG&&this.SVG_ANIMATION){var c=r._path.getTotalLength();r._path.setAttribute("stroke-dasharray",c+","+c);var f=e.createElementNS(p,"animate");f.setAttribute("attributeName","stroke-dashoffset"),f.setAttribute("begin","indefinite"),f.setAttribute("from",c),f.setAttribute("to",0),f.setAttribute("dur",.25),r._path.appendChild(f),f.beginElement(),f=e.createElementNS(p,"animate"),f.setAttribute("attributeName","stroke-opacity"),f.setAttribute("attributeName","stroke-opacity"),f.setAttribute("begin","indefinite"),f.setAttribute("from",0),f.setAttribute("to",.5),f.setAttribute("dur",.25),r._path.appendChild(f),f.beginElement()}if(a.setOpacity(.3),L.Path.SVG)for(this._group._forceLayout(),n=t.length-1;n>=0;n--)s=t[n]._spiderLeg,s.options.opacity=.5,s._path.setAttribute("stroke-opacity",.5);setTimeout(function(){h._animationEnd(),h.fire("spiderfied")},200)},_animationUnspiderfy:function(t){var e,i,n,s=this._group,r=s._map,o=s._featureGroup,a=t?r._latLngToNewLayerPoint(this._latlng,t.zoom,t.center):r.latLngToLayerPoint(this._latlng),h=this.getAllChildMarkers(),_=L.Path.SVG&&this.SVG_ANIMATION;for(s._animationStart(),this.setOpacity(1),i=h.length-1;i>=0;i--)e=h[i],e._preSpiderfyLatlng&&(e.setLatLng(e._preSpiderfyLatlng),delete e._preSpiderfyLatlng,e.setOpacity?(e._setPos(a),e.setOpacity(0)):o.removeLayer(e),_&&(n=e._spiderLeg._path.childNodes[0],n.setAttribute("to",n.getAttribute("from")),n.setAttribute("from",0),n.beginElement(),n=e._spiderLeg._path.childNodes[1],n.setAttribute("from",.5),n.setAttribute("to",0),n.setAttribute("stroke-opacity",0),n.beginElement(),e._spiderLeg._path.setAttribute("stroke-opacity",0)));setTimeout(function(){var t=0;for(i=h.length-1;i>=0;i--)e=h[i],e._spiderLeg&&t++;for(i=h.length-1;i>=0;i--)e=h[i],e._spiderLeg&&(e.setOpacity&&(e.setOpacity(1),e.setZIndexOffset(0)),t>1&&o.removeLayer(e),r.removeLayer(e._spiderLeg),delete e._spiderLeg);s._animationEnd()},200)}}:{_animationSpiderfy:function(t,e){var i,n,s,r,o=this._group,a=o._map,h=o._featureGroup;for(i=t.length-1;i>=0;i--)r=a.layerPointToLatLng(e[i]),n=t[i],n._preSpiderfyLatlng=n._latlng,n.setLatLng(r),n.setZIndexOffset&&n.setZIndexOffset(1e6),h.addLayer(n),s=new L.Polyline([this._latlng,r],{weight:1.5,color:"#222"}),a.addLayer(s),n._spiderLeg=s;this.setOpacity(.3),o.fire("spiderfied")},_animationUnspiderfy:function(){this._noanimationUnspiderfy()}}),L.MarkerClusterGroup.include({_spiderfied:null,_spiderfierOnAdd:function(){this._map.on("click",this._unspiderfyWrapper,this),this._map.options.zoomAnimation&&this._map.on("zoomstart",this._unspiderfyZoomStart,this),this._map.on("zoomend",this._noanimationUnspiderfy,this),L.Path.SVG&&!L.Browser.touch&&this._map._initPathRoot()},_spiderfierOnRemove:function(){this._map.off("click",this._unspiderfyWrapper,this),this._map.off("zoomstart",this._unspiderfyZoomStart,this),this._map.off("zoomanim",this._unspiderfyZoomAnim,this),this._unspiderfy()},_unspiderfyZoomStart:function(){this._map&&this._map.on("zoomanim",this._unspiderfyZoomAnim,this)},_unspiderfyZoomAnim:function(t){L.DomUtil.hasClass(this._map._mapPane,"leaflet-touching")||(this._map.off("zoomanim",this._unspiderfyZoomAnim,this),this._unspiderfy(t))},_unspiderfyWrapper:function(){this._unspiderfy()},_unspiderfy:function(t){this._spiderfied&&this._spiderfied.unspiderfy(t)},_noanimationUnspiderfy:function(){this._spiderfied&&this._spiderfied._noanimationUnspiderfy()},_unspiderfyLayer:function(t){t._spiderLeg&&(this._featureGroup.removeLayer(t),t.setOpacity(1),t.setZIndexOffset(0),this._map.removeLayer(t._spiderLeg),delete t._spiderLeg)}})}(window,document);
/*!
 * typeahead.js 0.11.1
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2015 Twitter, Inc. and other contributors; Licensed MIT
 */


(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define("bloodhound", [ "jquery" ], function(a0) {
            return root["Bloodhound"] = factory(a0);
        });
    } else if (typeof exports === "object") {
        module.exports = factory(require("jquery"));
    } else {
        root["Bloodhound"] = factory(jQuery);
    }
})(this, function($) {
    var _ = function() {
        "use strict";
        return {
            isMsie: function() {
                return /(msie|trident)/i.test(navigator.userAgent) ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2] : false;
            },
            isBlankString: function(str) {
                return !str || /^\s*$/.test(str);
            },
            escapeRegExChars: function(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            },
            isString: function(obj) {
                return typeof obj === "string";
            },
            isNumber: function(obj) {
                return typeof obj === "number";
            },
            isArray: $.isArray,
            isFunction: $.isFunction,
            isObject: $.isPlainObject,
            isUndefined: function(obj) {
                return typeof obj === "undefined";
            },
            isElement: function(obj) {
                return !!(obj && obj.nodeType === 1);
            },
            isJQuery: function(obj) {
                return obj instanceof $;
            },
            toStr: function toStr(s) {
                return _.isUndefined(s) || s === null ? "" : s + "";
            },
            bind: $.proxy,
            each: function(collection, cb) {
                $.each(collection, reverseArgs);
                function reverseArgs(index, value) {
                    return cb(value, index);
                }
            },
            map: $.map,
            filter: $.grep,
            every: function(obj, test) {
                var result = true;
                if (!obj) {
                    return result;
                }
                $.each(obj, function(key, val) {
                    if (!(result = test.call(null, val, key, obj))) {
                        return false;
                    }
                });
                return !!result;
            },
            some: function(obj, test) {
                var result = false;
                if (!obj) {
                    return result;
                }
                $.each(obj, function(key, val) {
                    if (result = test.call(null, val, key, obj)) {
                        return false;
                    }
                });
                return !!result;
            },
            mixin: $.extend,
            identity: function(x) {
                return x;
            },
            clone: function(obj) {
                return $.extend(true, {}, obj);
            },
            getIdGenerator: function() {
                var counter = 0;
                return function() {
                    return counter++;
                };
            },
            templatify: function templatify(obj) {
                return $.isFunction(obj) ? obj : template;
                function template() {
                    return String(obj);
                }
            },
            defer: function(fn) {
                setTimeout(fn, 0);
            },
            debounce: function(func, wait, immediate) {
                var timeout, result;
                return function() {
                    var context = this, args = arguments, later, callNow;
                    later = function() {
                        timeout = null;
                        if (!immediate) {
                            result = func.apply(context, args);
                        }
                    };
                    callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) {
                        result = func.apply(context, args);
                    }
                    return result;
                };
            },
            throttle: function(func, wait) {
                var context, args, timeout, result, previous, later;
                previous = 0;
                later = function() {
                    previous = new Date();
                    timeout = null;
                    result = func.apply(context, args);
                };
                return function() {
                    var now = new Date(), remaining = wait - (now - previous);
                    context = this;
                    args = arguments;
                    if (remaining <= 0) {
                        clearTimeout(timeout);
                        timeout = null;
                        previous = now;
                        result = func.apply(context, args);
                    } else if (!timeout) {
                        timeout = setTimeout(later, remaining);
                    }
                    return result;
                };
            },
            stringify: function(val) {
                return _.isString(val) ? val : JSON.stringify(val);
            },
            noop: function() {}
        };
    }();
    var VERSION = "0.11.1";
    var tokenizers = function() {
        "use strict";
        return {
            nonword: nonword,
            whitespace: whitespace,
            obj: {
                nonword: getObjTokenizer(nonword),
                whitespace: getObjTokenizer(whitespace)
            }
        };
        function whitespace(str) {
            str = _.toStr(str);
            return str ? str.split(/\s+/) : [];
        }
        function nonword(str) {
            str = _.toStr(str);
            return str ? str.split(/\W+/) : [];
        }
        function getObjTokenizer(tokenizer) {
            return function setKey(keys) {
                keys = _.isArray(keys) ? keys : [].slice.call(arguments, 0);
                return function tokenize(o) {
                    var tokens = [];
                    _.each(keys, function(k) {
                        tokens = tokens.concat(tokenizer(_.toStr(o[k])));
                    });
                    return tokens;
                };
            };
        }
    }();
    var LruCache = function() {
        "use strict";
        function LruCache(maxSize) {
            this.maxSize = _.isNumber(maxSize) ? maxSize : 100;
            this.reset();
            if (this.maxSize <= 0) {
                this.set = this.get = $.noop;
            }
        }
        _.mixin(LruCache.prototype, {
            set: function set(key, val) {
                var tailItem = this.list.tail, node;
                if (this.size >= this.maxSize) {
                    this.list.remove(tailItem);
                    delete this.hash[tailItem.key];
                    this.size--;
                }
                if (node = this.hash[key]) {
                    node.val = val;
                    this.list.moveToFront(node);
                } else {
                    node = new Node(key, val);
                    this.list.add(node);
                    this.hash[key] = node;
                    this.size++;
                }
            },
            get: function get(key) {
                var node = this.hash[key];
                if (node) {
                    this.list.moveToFront(node);
                    return node.val;
                }
            },
            reset: function reset() {
                this.size = 0;
                this.hash = {};
                this.list = new List();
            }
        });
        function List() {
            this.head = this.tail = null;
        }
        _.mixin(List.prototype, {
            add: function add(node) {
                if (this.head) {
                    node.next = this.head;
                    this.head.prev = node;
                }
                this.head = node;
                this.tail = this.tail || node;
            },
            remove: function remove(node) {
                node.prev ? node.prev.next = node.next : this.head = node.next;
                node.next ? node.next.prev = node.prev : this.tail = node.prev;
            },
            moveToFront: function(node) {
                this.remove(node);
                this.add(node);
            }
        });
        function Node(key, val) {
            this.key = key;
            this.val = val;
            this.prev = this.next = null;
        }
        return LruCache;
    }();
    var PersistentStorage = function() {
        "use strict";
        var LOCAL_STORAGE;
        try {
            LOCAL_STORAGE = window.localStorage;
            LOCAL_STORAGE.setItem("~~~", "!");
            LOCAL_STORAGE.removeItem("~~~");
        } catch (err) {
            LOCAL_STORAGE = null;
        }
        function PersistentStorage(namespace, override) {
            this.prefix = [ "__", namespace, "__" ].join("");
            this.ttlKey = "__ttl__";
            this.keyMatcher = new RegExp("^" + _.escapeRegExChars(this.prefix));
            this.ls = override || LOCAL_STORAGE;
            !this.ls && this._noop();
        }
        _.mixin(PersistentStorage.prototype, {
            _prefix: function(key) {
                return this.prefix + key;
            },
            _ttlKey: function(key) {
                return this._prefix(key) + this.ttlKey;
            },
            _noop: function() {
                this.get = this.set = this.remove = this.clear = this.isExpired = _.noop;
            },
            _safeSet: function(key, val) {
                try {
                    this.ls.setItem(key, val);
                } catch (err) {
                    if (err.name === "QuotaExceededError") {
                        this.clear();
                        this._noop();
                    }
                }
            },
            get: function(key) {
                if (this.isExpired(key)) {
                    this.remove(key);
                }
                return decode(this.ls.getItem(this._prefix(key)));
            },
            set: function(key, val, ttl) {
                if (_.isNumber(ttl)) {
                    this._safeSet(this._ttlKey(key), encode(now() + ttl));
                } else {
                    this.ls.removeItem(this._ttlKey(key));
                }
                return this._safeSet(this._prefix(key), encode(val));
            },
            remove: function(key) {
                this.ls.removeItem(this._ttlKey(key));
                this.ls.removeItem(this._prefix(key));
                return this;
            },
            clear: function() {
                var i, keys = gatherMatchingKeys(this.keyMatcher);
                for (i = keys.length; i--; ) {
                    this.remove(keys[i]);
                }
                return this;
            },
            isExpired: function(key) {
                var ttl = decode(this.ls.getItem(this._ttlKey(key)));
                return _.isNumber(ttl) && now() > ttl ? true : false;
            }
        });
        return PersistentStorage;
        function now() {
            return new Date().getTime();
        }
        function encode(val) {
            return JSON.stringify(_.isUndefined(val) ? null : val);
        }
        function decode(val) {
            return $.parseJSON(val);
        }
        function gatherMatchingKeys(keyMatcher) {
            var i, key, keys = [], len = LOCAL_STORAGE.length;
            for (i = 0; i < len; i++) {
                if ((key = LOCAL_STORAGE.key(i)).match(keyMatcher)) {
                    keys.push(key.replace(keyMatcher, ""));
                }
            }
            return keys;
        }
    }();
    var Transport = function() {
        "use strict";
        var pendingRequestsCount = 0, pendingRequests = {}, maxPendingRequests = 6, sharedCache = new LruCache(10);
        function Transport(o) {
            o = o || {};
            this.cancelled = false;
            this.lastReq = null;
            this._send = o.transport;
            this._get = o.limiter ? o.limiter(this._get) : this._get;
            this._cache = o.cache === false ? new LruCache(0) : sharedCache;
        }
        Transport.setMaxPendingRequests = function setMaxPendingRequests(num) {
            maxPendingRequests = num;
        };
        Transport.resetCache = function resetCache() {
            sharedCache.reset();
        };
        _.mixin(Transport.prototype, {
            _fingerprint: function fingerprint(o) {
                o = o || {};
                return o.url + o.type + $.param(o.data || {});
            },
            _get: function(o, cb) {
                var that = this, fingerprint, jqXhr;
                fingerprint = this._fingerprint(o);
                if (this.cancelled || fingerprint !== this.lastReq) {
                    return;
                }
                if (jqXhr = pendingRequests[fingerprint]) {
                    jqXhr.done(done).fail(fail);
                } else if (pendingRequestsCount < maxPendingRequests) {
                    pendingRequestsCount++;
                    pendingRequests[fingerprint] = this._send(o).done(done).fail(fail).always(always);
                } else {
                    this.onDeckRequestArgs = [].slice.call(arguments, 0);
                }
                function done(resp) {
                    cb(null, resp);
                    that._cache.set(fingerprint, resp);
                }
                function fail() {
                    cb(true);
                }
                function always() {
                    pendingRequestsCount--;
                    delete pendingRequests[fingerprint];
                    if (that.onDeckRequestArgs) {
                        that._get.apply(that, that.onDeckRequestArgs);
                        that.onDeckRequestArgs = null;
                    }
                }
            },
            get: function(o, cb) {
                var resp, fingerprint;
                cb = cb || $.noop;
                o = _.isString(o) ? {
                    url: o
                } : o || {};
                fingerprint = this._fingerprint(o);
                this.cancelled = false;
                this.lastReq = fingerprint;
                if (resp = this._cache.get(fingerprint)) {
                    cb(null, resp);
                } else {
                    this._get(o, cb);
                }
            },
            cancel: function() {
                this.cancelled = true;
            }
        });
        return Transport;
    }();
    var SearchIndex = window.SearchIndex = function() {
        "use strict";
        var CHILDREN = "c", IDS = "i";
        function SearchIndex(o) {
            o = o || {};
            if (!o.datumTokenizer || !o.queryTokenizer) {
                $.error("datumTokenizer and queryTokenizer are both required");
            }
            this.identify = o.identify || _.stringify;
            this.datumTokenizer = o.datumTokenizer;
            this.queryTokenizer = o.queryTokenizer;
            this.reset();
        }
        _.mixin(SearchIndex.prototype, {
            bootstrap: function bootstrap(o) {
                this.datums = o.datums;
                this.trie = o.trie;
            },
            add: function(data) {
                var that = this;
                data = _.isArray(data) ? data : [ data ];
                _.each(data, function(datum) {
                    var id, tokens;
                    that.datums[id = that.identify(datum)] = datum;
                    tokens = normalizeTokens(that.datumTokenizer(datum));
                    _.each(tokens, function(token) {
                        var node, chars, ch;
                        node = that.trie;
                        chars = token.split("");
                        while (ch = chars.shift()) {
                            node = node[CHILDREN][ch] || (node[CHILDREN][ch] = newNode());
                            node[IDS].push(id);
                        }
                    });
                });
            },
            get: function get(ids) {
                var that = this;
                return _.map(ids, function(id) {
                    return that.datums[id];
                });
            },
            search: function search(query) {
                var that = this, tokens, matches;
                tokens = normalizeTokens(this.queryTokenizer(query));
                _.each(tokens, function(token) {
                    var node, chars, ch, ids;
                    if (matches && matches.length === 0) {
                        return false;
                    }
                    node = that.trie;
                    chars = token.split("");
                    while (node && (ch = chars.shift())) {
                        node = node[CHILDREN][ch];
                    }
                    if (node && chars.length === 0) {
                        ids = node[IDS].slice(0);
                        matches = matches ? getIntersection(matches, ids) : ids;
                    } else {
                        matches = [];
                        return false;
                    }
                });
                return matches ? _.map(unique(matches), function(id) {
                    return that.datums[id];
                }) : [];
            },
            all: function all() {
                var values = [];
                for (var key in this.datums) {
                    values.push(this.datums[key]);
                }
                return values;
            },
            reset: function reset() {
                this.datums = {};
                this.trie = newNode();
            },
            serialize: function serialize() {
                return {
                    datums: this.datums,
                    trie: this.trie
                };
            }
        });
        return SearchIndex;
        function normalizeTokens(tokens) {
            tokens = _.filter(tokens, function(token) {
                return !!token;
            });
            tokens = _.map(tokens, function(token) {
                return token.toLowerCase();
            });
            return tokens;
        }
        function newNode() {
            var node = {};
            node[IDS] = [];
            node[CHILDREN] = {};
            return node;
        }
        function unique(array) {
            var seen = {}, uniques = [];
            for (var i = 0, len = array.length; i < len; i++) {
                if (!seen[array[i]]) {
                    seen[array[i]] = true;
                    uniques.push(array[i]);
                }
            }
            return uniques;
        }
        function getIntersection(arrayA, arrayB) {
            var ai = 0, bi = 0, intersection = [];
            arrayA = arrayA.sort();
            arrayB = arrayB.sort();
            var lenArrayA = arrayA.length, lenArrayB = arrayB.length;
            while (ai < lenArrayA && bi < lenArrayB) {
                if (arrayA[ai] < arrayB[bi]) {
                    ai++;
                } else if (arrayA[ai] > arrayB[bi]) {
                    bi++;
                } else {
                    intersection.push(arrayA[ai]);
                    ai++;
                    bi++;
                }
            }
            return intersection;
        }
    }();
    var Prefetch = function() {
        "use strict";
        var keys;
        keys = {
            data: "data",
            protocol: "protocol",
            thumbprint: "thumbprint"
        };
        function Prefetch(o) {
            this.url = o.url;
            this.ttl = o.ttl;
            this.cache = o.cache;
            this.prepare = o.prepare;
            this.transform = o.transform;
            this.transport = o.transport;
            this.thumbprint = o.thumbprint;
            this.storage = new PersistentStorage(o.cacheKey);
        }
        _.mixin(Prefetch.prototype, {
            _settings: function settings() {
                return {
                    url: this.url,
                    type: "GET",
                    dataType: "json"
                };
            },
            store: function store(data) {
                if (!this.cache) {
                    return;
                }
                this.storage.set(keys.data, data, this.ttl);
                this.storage.set(keys.protocol, location.protocol, this.ttl);
                this.storage.set(keys.thumbprint, this.thumbprint, this.ttl);
            },
            fromCache: function fromCache() {
                var stored = {}, isExpired;
                if (!this.cache) {
                    return null;
                }
                stored.data = this.storage.get(keys.data);
                stored.protocol = this.storage.get(keys.protocol);
                stored.thumbprint = this.storage.get(keys.thumbprint);
                isExpired = stored.thumbprint !== this.thumbprint || stored.protocol !== location.protocol;
                return stored.data && !isExpired ? stored.data : null;
            },
            fromNetwork: function(cb) {
                var that = this, settings;
                if (!cb) {
                    return;
                }
                settings = this.prepare(this._settings());
                this.transport(settings).fail(onError).done(onResponse);
                function onError() {
                    cb(true);
                }
                function onResponse(resp) {
                    cb(null, that.transform(resp));
                }
            },
            clear: function clear() {
                this.storage.clear();
                return this;
            }
        });
        return Prefetch;
    }();
    var Remote = function() {
        "use strict";
        function Remote(o) {
            this.url = o.url;
            this.prepare = o.prepare;
            this.transform = o.transform;
            this.transport = new Transport({
                cache: o.cache,
                limiter: o.limiter,
                transport: o.transport
            });
        }
        _.mixin(Remote.prototype, {
            _settings: function settings() {
                return {
                    url: this.url,
                    type: "GET",
                    dataType: "json"
                };
            },
            get: function get(query, cb) {
                var that = this, settings;
                if (!cb) {
                    return;
                }
                query = query || "";
                settings = this.prepare(query, this._settings());
                return this.transport.get(settings, onResponse);
                function onResponse(err, resp) {
                    err ? cb([]) : cb(that.transform(resp));
                }
            },
            cancelLastRequest: function cancelLastRequest() {
                this.transport.cancel();
            }
        });
        return Remote;
    }();
    var oParser = function() {
        "use strict";
        return function parse(o) {
            var defaults, sorter;
            defaults = {
                initialize: true,
                identify: _.stringify,
                datumTokenizer: null,
                queryTokenizer: null,
                sufficient: 5,
                sorter: null,
                local: [],
                prefetch: null,
                remote: null
            };
            o = _.mixin(defaults, o || {});
            !o.datumTokenizer && $.error("datumTokenizer is required");
            !o.queryTokenizer && $.error("queryTokenizer is required");
            sorter = o.sorter;
            o.sorter = sorter ? function(x) {
                return x.sort(sorter);
            } : _.identity;
            o.local = _.isFunction(o.local) ? o.local() : o.local;
            o.prefetch = parsePrefetch(o.prefetch);
            o.remote = parseRemote(o.remote);
            return o;
        };
        function parsePrefetch(o) {
            var defaults;
            if (!o) {
                return null;
            }
            defaults = {
                url: null,
                ttl: 24 * 60 * 60 * 1e3,
                cache: true,
                cacheKey: null,
                thumbprint: "",
                prepare: _.identity,
                transform: _.identity,
                transport: null
            };
            o = _.isString(o) ? {
                url: o
            } : o;
            o = _.mixin(defaults, o);
            !o.url && $.error("prefetch requires url to be set");
            o.transform = o.filter || o.transform;
            o.cacheKey = o.cacheKey || o.url;
            o.thumbprint = VERSION + o.thumbprint;
            o.transport = o.transport ? callbackToDeferred(o.transport) : $.ajax;
            return o;
        }
        function parseRemote(o) {
            var defaults;
            if (!o) {
                return;
            }
            defaults = {
                url: null,
                cache: true,
                prepare: null,
                replace: null,
                wildcard: null,
                limiter: null,
                rateLimitBy: "debounce",
                rateLimitWait: 300,
                transform: _.identity,
                transport: null
            };
            o = _.isString(o) ? {
                url: o
            } : o;
            o = _.mixin(defaults, o);
            !o.url && $.error("remote requires url to be set");
            o.transform = o.filter || o.transform;
            o.prepare = toRemotePrepare(o);
            o.limiter = toLimiter(o);
            o.transport = o.transport ? callbackToDeferred(o.transport) : $.ajax;
            delete o.replace;
            delete o.wildcard;
            delete o.rateLimitBy;
            delete o.rateLimitWait;
            return o;
        }
        function toRemotePrepare(o) {
            var prepare, replace, wildcard;
            prepare = o.prepare;
            replace = o.replace;
            wildcard = o.wildcard;
            if (prepare) {
                return prepare;
            }
            if (replace) {
                prepare = prepareByReplace;
            } else if (o.wildcard) {
                prepare = prepareByWildcard;
            } else {
                prepare = idenityPrepare;
            }
            return prepare;
            function prepareByReplace(query, settings) {
                settings.url = replace(settings.url, query);
                return settings;
            }
            function prepareByWildcard(query, settings) {
                settings.url = settings.url.replace(wildcard, encodeURIComponent(query));
                return settings;
            }
            function idenityPrepare(query, settings) {
                return settings;
            }
        }
        function toLimiter(o) {
            var limiter, method, wait;
            limiter = o.limiter;
            method = o.rateLimitBy;
            wait = o.rateLimitWait;
            if (!limiter) {
                limiter = /^throttle$/i.test(method) ? throttle(wait) : debounce(wait);
            }
            return limiter;
            function debounce(wait) {
                return function debounce(fn) {
                    return _.debounce(fn, wait);
                };
            }
            function throttle(wait) {
                return function throttle(fn) {
                    return _.throttle(fn, wait);
                };
            }
        }
        function callbackToDeferred(fn) {
            return function wrapper(o) {
                var deferred = $.Deferred();
                fn(o, onSuccess, onError);
                return deferred;
                function onSuccess(resp) {
                    _.defer(function() {
                        deferred.resolve(resp);
                    });
                }
                function onError(err) {
                    _.defer(function() {
                        deferred.reject(err);
                    });
                }
            };
        }
    }();
    var Bloodhound = function() {
        "use strict";
        var old;
        old = window && window.Bloodhound;
        function Bloodhound(o) {
            o = oParser(o);
            this.sorter = o.sorter;
            this.identify = o.identify;
            this.sufficient = o.sufficient;
            this.local = o.local;
            this.remote = o.remote ? new Remote(o.remote) : null;
            this.prefetch = o.prefetch ? new Prefetch(o.prefetch) : null;
            this.index = new SearchIndex({
                identify: this.identify,
                datumTokenizer: o.datumTokenizer,
                queryTokenizer: o.queryTokenizer
            });
            o.initialize !== false && this.initialize();
        }
        Bloodhound.noConflict = function noConflict() {
            window && (window.Bloodhound = old);
            return Bloodhound;
        };
        Bloodhound.tokenizers = tokenizers;
        _.mixin(Bloodhound.prototype, {
            __ttAdapter: function ttAdapter() {
                var that = this;
                return this.remote ? withAsync : withoutAsync;
                function withAsync(query, sync, async) {
                    return that.search(query, sync, async);
                }
                function withoutAsync(query, sync) {
                    return that.search(query, sync);
                }
            },
            _loadPrefetch: function loadPrefetch() {
                var that = this, deferred, serialized;
                deferred = $.Deferred();
                if (!this.prefetch) {
                    deferred.resolve();
                } else if (serialized = this.prefetch.fromCache()) {
                    this.index.bootstrap(serialized);
                    deferred.resolve();
                } else {
                    this.prefetch.fromNetwork(done);
                }
                return deferred.promise();
                function done(err, data) {
                    if (err) {
                        return deferred.reject();
                    }
                    that.add(data);
                    that.prefetch.store(that.index.serialize());
                    deferred.resolve();
                }
            },
            _initialize: function initialize() {
                var that = this, deferred;
                this.clear();
                (this.initPromise = this._loadPrefetch()).done(addLocalToIndex);
                return this.initPromise;
                function addLocalToIndex() {
                    that.add(that.local);
                }
            },
            initialize: function initialize(force) {
                return !this.initPromise || force ? this._initialize() : this.initPromise;
            },
            add: function add(data) {
                this.index.add(data);
                return this;
            },
            get: function get(ids) {
                ids = _.isArray(ids) ? ids : [].slice.call(arguments);
                return this.index.get(ids);
            },
            search: function search(query, sync, async) {
                var that = this, local;
                local = this.sorter(this.index.search(query));
                sync(this.remote ? local.slice() : local);
                if (this.remote && local.length < this.sufficient) {
                    this.remote.get(query, processRemote);
                } else if (this.remote) {
                    this.remote.cancelLastRequest();
                }
                return this;
                function processRemote(remote) {
                    var nonDuplicates = [];
                    _.each(remote, function(r) {
                        !_.some(local, function(l) {
                            return that.identify(r) === that.identify(l);
                        }) && nonDuplicates.push(r);
                    });
                    async && async(nonDuplicates);
                }
            },
            all: function all() {
                return this.index.all();
            },
            clear: function clear() {
                this.index.reset();
                return this;
            },
            clearPrefetchCache: function clearPrefetchCache() {
                this.prefetch && this.prefetch.clear();
                return this;
            },
            clearRemoteCache: function clearRemoteCache() {
                Transport.resetCache();
                return this;
            },
            ttAdapter: function ttAdapter() {
                return this.__ttAdapter();
            }
        });
        return Bloodhound;
    }();
    return Bloodhound;
});

(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define("typeahead.js", [ "jquery" ], function(a0) {
            return factory(a0);
        });
    } else if (typeof exports === "object") {
        module.exports = factory(require("jquery"));
    } else {
        factory(jQuery);
    }
})(this, function($) {
    var _ = function() {
        "use strict";
        return {
            isMsie: function() {
                return /(msie|trident)/i.test(navigator.userAgent) ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2] : false;
            },
            isBlankString: function(str) {
                return !str || /^\s*$/.test(str);
            },
            escapeRegExChars: function(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            },
            isString: function(obj) {
                return typeof obj === "string";
            },
            isNumber: function(obj) {
                return typeof obj === "number";
            },
            isArray: $.isArray,
            isFunction: $.isFunction,
            isObject: $.isPlainObject,
            isUndefined: function(obj) {
                return typeof obj === "undefined";
            },
            isElement: function(obj) {
                return !!(obj && obj.nodeType === 1);
            },
            isJQuery: function(obj) {
                return obj instanceof $;
            },
            toStr: function toStr(s) {
                return _.isUndefined(s) || s === null ? "" : s + "";
            },
            bind: $.proxy,
            each: function(collection, cb) {
                $.each(collection, reverseArgs);
                function reverseArgs(index, value) {
                    return cb(value, index);
                }
            },
            map: $.map,
            filter: $.grep,
            every: function(obj, test) {
                var result = true;
                if (!obj) {
                    return result;
                }
                $.each(obj, function(key, val) {
                    if (!(result = test.call(null, val, key, obj))) {
                        return false;
                    }
                });
                return !!result;
            },
            some: function(obj, test) {
                var result = false;
                if (!obj) {
                    return result;
                }
                $.each(obj, function(key, val) {
                    if (result = test.call(null, val, key, obj)) {
                        return false;
                    }
                });
                return !!result;
            },
            mixin: $.extend,
            identity: function(x) {
                return x;
            },
            clone: function(obj) {
                return $.extend(true, {}, obj);
            },
            getIdGenerator: function() {
                var counter = 0;
                return function() {
                    return counter++;
                };
            },
            templatify: function templatify(obj) {
                return $.isFunction(obj) ? obj : template;
                function template() {
                    return String(obj);
                }
            },
            defer: function(fn) {
                setTimeout(fn, 0);
            },
            debounce: function(func, wait, immediate) {
                var timeout, result;
                return function() {
                    var context = this, args = arguments, later, callNow;
                    later = function() {
                        timeout = null;
                        if (!immediate) {
                            result = func.apply(context, args);
                        }
                    };
                    callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) {
                        result = func.apply(context, args);
                    }
                    return result;
                };
            },
            throttle: function(func, wait) {
                var context, args, timeout, result, previous, later;
                previous = 0;
                later = function() {
                    previous = new Date();
                    timeout = null;
                    result = func.apply(context, args);
                };
                return function() {
                    var now = new Date(), remaining = wait - (now - previous);
                    context = this;
                    args = arguments;
                    if (remaining <= 0) {
                        clearTimeout(timeout);
                        timeout = null;
                        previous = now;
                        result = func.apply(context, args);
                    } else if (!timeout) {
                        timeout = setTimeout(later, remaining);
                    }
                    return result;
                };
            },
            stringify: function(val) {
                return _.isString(val) ? val : JSON.stringify(val);
            },
            noop: function() {}
        };
    }();
    var WWW = function() {
        "use strict";
        var defaultClassNames = {
            wrapper: "twitter-typeahead",
            input: "tt-input",
            hint: "tt-hint",
            menu: "tt-menu",
            dataset: "tt-dataset",
            suggestion: "tt-suggestion",
            selectable: "tt-selectable",
            empty: "tt-empty",
            open: "tt-open",
            cursor: "tt-cursor",
            highlight: "tt-highlight"
        };
        return build;
        function build(o) {
            var www, classes;
            classes = _.mixin({}, defaultClassNames, o);
            www = {
                css: buildCss(),
                classes: classes,
                html: buildHtml(classes),
                selectors: buildSelectors(classes)
            };
            return {
                css: www.css,
                html: www.html,
                classes: www.classes,
                selectors: www.selectors,
                mixin: function(o) {
                    _.mixin(o, www);
                }
            };
        }
        function buildHtml(c) {
            return {
                wrapper: '<span class="' + c.wrapper + '"></span>',
                menu: '<div class="' + c.menu + '"></div>'
            };
        }
        function buildSelectors(classes) {
            var selectors = {};
            _.each(classes, function(v, k) {
                selectors[k] = "." + v;
            });
            return selectors;
        }
        function buildCss() {
            var css = {
                wrapper: {
                    position: "relative",
                    display: "inline-block"
                },
                hint: {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    borderColor: "transparent",
                    boxShadow: "none",
                    opacity: "1"
                },
                input: {
                    position: "relative",
                    verticalAlign: "top",
                    backgroundColor: "transparent"
                },
                inputWithNoHint: {
                    position: "relative",
                    verticalAlign: "top"
                },
                menu: {
                    position: "absolute",
                    top: "100%",
                    left: "0",
                    zIndex: "100",
                    display: "none"
                },
                ltr: {
                    left: "0",
                    right: "auto"
                },
                rtl: {
                    left: "auto",
                    right: " 0"
                }
            };
            if (_.isMsie()) {
                _.mixin(css.input, {
                    backgroundImage: "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"
                });
            }
            return css;
        }
    }();
    var EventBus = function() {
        "use strict";
        var namespace, deprecationMap;
        namespace = "typeahead:";
        deprecationMap = {
            render: "rendered",
            cursorchange: "cursorchanged",
            select: "selected",
            autocomplete: "autocompleted"
        };
        function EventBus(o) {
            if (!o || !o.el) {
                $.error("EventBus initialized without el");
            }
            this.$el = $(o.el);
        }
        _.mixin(EventBus.prototype, {
            _trigger: function(type, args) {
                var $e;
                $e = $.Event(namespace + type);
                (args = args || []).unshift($e);
                this.$el.trigger.apply(this.$el, args);
                return $e;
            },
            before: function(type) {
                var args, $e;
                args = [].slice.call(arguments, 1);
                $e = this._trigger("before" + type, args);
                return $e.isDefaultPrevented();
            },
            trigger: function(type) {
                var deprecatedType;
                this._trigger(type, [].slice.call(arguments, 1));
                if (deprecatedType = deprecationMap[type]) {
                    this._trigger(deprecatedType, [].slice.call(arguments, 1));
                }
            }
        });
        return EventBus;
    }();
    var EventEmitter = function() {
        "use strict";
        var splitter = /\s+/, nextTick = getNextTick();
        return {
            onSync: onSync,
            onAsync: onAsync,
            off: off,
            trigger: trigger
        };
        function on(method, types, cb, context) {
            var type;
            if (!cb) {
                return this;
            }
            types = types.split(splitter);
            cb = context ? bindContext(cb, context) : cb;
            this._callbacks = this._callbacks || {};
            while (type = types.shift()) {
                this._callbacks[type] = this._callbacks[type] || {
                    sync: [],
                    async: []
                };
                this._callbacks[type][method].push(cb);
            }
            return this;
        }
        function onAsync(types, cb, context) {
            return on.call(this, "async", types, cb, context);
        }
        function onSync(types, cb, context) {
            return on.call(this, "sync", types, cb, context);
        }
        function off(types) {
            var type;
            if (!this._callbacks) {
                return this;
            }
            types = types.split(splitter);
            while (type = types.shift()) {
                delete this._callbacks[type];
            }
            return this;
        }
        function trigger(types) {
            var type, callbacks, args, syncFlush, asyncFlush;
            if (!this._callbacks) {
                return this;
            }
            types = types.split(splitter);
            args = [].slice.call(arguments, 1);
            while ((type = types.shift()) && (callbacks = this._callbacks[type])) {
                syncFlush = getFlush(callbacks.sync, this, [ type ].concat(args));
                asyncFlush = getFlush(callbacks.async, this, [ type ].concat(args));
                syncFlush() && nextTick(asyncFlush);
            }
            return this;
        }
        function getFlush(callbacks, context, args) {
            return flush;
            function flush() {
                var cancelled;
                for (var i = 0, len = callbacks.length; !cancelled && i < len; i += 1) {
                    cancelled = callbacks[i].apply(context, args) === false;
                }
                return !cancelled;
            }
        }
        function getNextTick() {
            var nextTickFn;
            if (window.setImmediate) {
                nextTickFn = function nextTickSetImmediate(fn) {
                    setImmediate(function() {
                        fn();
                    });
                };
            } else {
                nextTickFn = function nextTickSetTimeout(fn) {
                    setTimeout(function() {
                        fn();
                    }, 0);
                };
            }
            return nextTickFn;
        }
        function bindContext(fn, context) {
            return fn.bind ? fn.bind(context) : function() {
                fn.apply(context, [].slice.call(arguments, 0));
            };
        }
    }();
    var highlight = function(doc) {
        "use strict";
        var defaults = {
            node: null,
            pattern: null,
            tagName: "strong",
            className: null,
            wordsOnly: false,
            caseSensitive: false
        };
        return function hightlight(o) {
            var regex;
            o = _.mixin({}, defaults, o);
            if (!o.node || !o.pattern) {
                return;
            }
            o.pattern = _.isArray(o.pattern) ? o.pattern : [ o.pattern ];
            regex = getRegex(o.pattern, o.caseSensitive, o.wordsOnly);
            traverse(o.node, hightlightTextNode);
            function hightlightTextNode(textNode) {
                var match, patternNode, wrapperNode;
                if (match = regex.exec(textNode.data)) {
                    wrapperNode = doc.createElement(o.tagName);
                    o.className && (wrapperNode.className = o.className);
                    patternNode = textNode.splitText(match.index);
                    patternNode.splitText(match[0].length);
                    wrapperNode.appendChild(patternNode.cloneNode(true));
                    textNode.parentNode.replaceChild(wrapperNode, patternNode);
                }
                return !!match;
            }
            function traverse(el, hightlightTextNode) {
                var childNode, TEXT_NODE_TYPE = 3;
                for (var i = 0; i < el.childNodes.length; i++) {
                    childNode = el.childNodes[i];
                    if (childNode.nodeType === TEXT_NODE_TYPE) {
                        i += hightlightTextNode(childNode) ? 1 : 0;
                    } else {
                        traverse(childNode, hightlightTextNode);
                    }
                }
            }
        };
        function getRegex(patterns, caseSensitive, wordsOnly) {
            var escapedPatterns = [], regexStr;
            for (var i = 0, len = patterns.length; i < len; i++) {
                escapedPatterns.push(_.escapeRegExChars(patterns[i]));
            }
            regexStr = wordsOnly ? "\\b(" + escapedPatterns.join("|") + ")\\b" : "(" + escapedPatterns.join("|") + ")";
            return caseSensitive ? new RegExp(regexStr) : new RegExp(regexStr, "i");
        }
    }(window.document);
    var Input = function() {
        "use strict";
        var specialKeyCodeMap;
        specialKeyCodeMap = {
            9: "tab",
            27: "esc",
            37: "left",
            39: "right",
            13: "enter",
            38: "up",
            40: "down"
        };
        function Input(o, www) {
            o = o || {};
            if (!o.input) {
                $.error("input is missing");
            }
            www.mixin(this);
            this.$hint = $(o.hint);
            this.$input = $(o.input);
            this.query = this.$input.val();
            this.queryWhenFocused = this.hasFocus() ? this.query : null;
            this.$overflowHelper = buildOverflowHelper(this.$input);
            this._checkLanguageDirection();
            if (this.$hint.length === 0) {
                this.setHint = this.getHint = this.clearHint = this.clearHintIfInvalid = _.noop;
            }
        }
        Input.normalizeQuery = function(str) {
            return _.toStr(str).replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
        };
        _.mixin(Input.prototype, EventEmitter, {
            _onBlur: function onBlur() {
                this.resetInputValue();
                this.trigger("blurred");
            },
            _onFocus: function onFocus() {
                this.queryWhenFocused = this.query;
                this.trigger("focused");
            },
            _onKeydown: function onKeydown($e) {
                var keyName = specialKeyCodeMap[$e.which || $e.keyCode];
                this._managePreventDefault(keyName, $e);
                if (keyName && this._shouldTrigger(keyName, $e)) {
                    this.trigger(keyName + "Keyed", $e);
                }
            },
            _onInput: function onInput() {
                this._setQuery(this.getInputValue());
                this.clearHintIfInvalid();
                this._checkLanguageDirection();
            },
            _managePreventDefault: function managePreventDefault(keyName, $e) {
                var preventDefault;
                switch (keyName) {
                  case "up":
                  case "down":
                    preventDefault = !withModifier($e);
                    break;

                  default:
                    preventDefault = false;
                }
                preventDefault && $e.preventDefault();
            },
            _shouldTrigger: function shouldTrigger(keyName, $e) {
                var trigger;
                switch (keyName) {
                  case "tab":
                    trigger = !withModifier($e);
                    break;

                  default:
                    trigger = true;
                }
                return trigger;
            },
            _checkLanguageDirection: function checkLanguageDirection() {
                var dir = (this.$input.css("direction") || "ltr").toLowerCase();
                if (this.dir !== dir) {
                    this.dir = dir;
                    this.$hint.attr("dir", dir);
                    this.trigger("langDirChanged", dir);
                }
            },
            _setQuery: function setQuery(val, silent) {
                var areEquivalent, hasDifferentWhitespace;
                areEquivalent = areQueriesEquivalent(val, this.query);
                hasDifferentWhitespace = areEquivalent ? this.query.length !== val.length : false;
                this.query = val;
                if (!silent && !areEquivalent) {
                    this.trigger("queryChanged", this.query);
                } else if (!silent && hasDifferentWhitespace) {
                    this.trigger("whitespaceChanged", this.query);
                }
            },
            bind: function() {
                var that = this, onBlur, onFocus, onKeydown, onInput;
                onBlur = _.bind(this._onBlur, this);
                onFocus = _.bind(this._onFocus, this);
                onKeydown = _.bind(this._onKeydown, this);
                onInput = _.bind(this._onInput, this);
                this.$input.on("blur.tt", onBlur).on("focus.tt", onFocus).on("keydown.tt", onKeydown);
                if (!_.isMsie() || _.isMsie() > 9) {
                    this.$input.on("input.tt", onInput);
                } else {
                    this.$input.on("keydown.tt keypress.tt cut.tt paste.tt", function($e) {
                        if (specialKeyCodeMap[$e.which || $e.keyCode]) {
                            return;
                        }
                        _.defer(_.bind(that._onInput, that, $e));
                    });
                }
                return this;
            },
            focus: function focus() {
                this.$input.focus();
            },
            blur: function blur() {
                this.$input.blur();
            },
            getLangDir: function getLangDir() {
                return this.dir;
            },
            getQuery: function getQuery() {
                return this.query || "";
            },
            setQuery: function setQuery(val, silent) {
                this.setInputValue(val);
                this._setQuery(val, silent);
            },
            hasQueryChangedSinceLastFocus: function hasQueryChangedSinceLastFocus() {
                return this.query !== this.queryWhenFocused;
            },
            getInputValue: function getInputValue() {
                return this.$input.val();
            },
            setInputValue: function setInputValue(value) {
                this.$input.val(value);
                this.clearHintIfInvalid();
                this._checkLanguageDirection();
            },
            resetInputValue: function resetInputValue() {
                this.setInputValue(this.query);
            },
            getHint: function getHint() {
                return this.$hint.val();
            },
            setHint: function setHint(value) {
                this.$hint.val(value);
            },
            clearHint: function clearHint() {
                this.setHint("");
            },
            clearHintIfInvalid: function clearHintIfInvalid() {
                var val, hint, valIsPrefixOfHint, isValid;
                val = this.getInputValue();
                hint = this.getHint();
                valIsPrefixOfHint = val !== hint && hint.indexOf(val) === 0;
                isValid = val !== "" && valIsPrefixOfHint && !this.hasOverflow();
                !isValid && this.clearHint();
            },
            hasFocus: function hasFocus() {
                return this.$input.is(":focus");
            },
            hasOverflow: function hasOverflow() {
                var constraint = this.$input.width() - 2;
                this.$overflowHelper.text(this.getInputValue());
                return this.$overflowHelper.width() >= constraint;
            },
            isCursorAtEnd: function() {
                var valueLength, selectionStart, range;
                valueLength = this.$input.val().length;
                selectionStart = this.$input[0].selectionStart;
                if (_.isNumber(selectionStart)) {
                    return selectionStart === valueLength;
                } else if (document.selection) {
                    range = document.selection.createRange();
                    range.moveStart("character", -valueLength);
                    return valueLength === range.text.length;
                }
                return true;
            },
            destroy: function destroy() {
                this.$hint.off(".tt");
                this.$input.off(".tt");
                this.$overflowHelper.remove();
                this.$hint = this.$input = this.$overflowHelper = $("<div>");
            }
        });
        return Input;
        function buildOverflowHelper($input) {
            return $('<pre aria-hidden="true"></pre>').css({
                position: "absolute",
                visibility: "hidden",
                whiteSpace: "pre",
                fontFamily: $input.css("font-family"),
                fontSize: $input.css("font-size"),
                fontStyle: $input.css("font-style"),
                fontVariant: $input.css("font-variant"),
                fontWeight: $input.css("font-weight"),
                wordSpacing: $input.css("word-spacing"),
                letterSpacing: $input.css("letter-spacing"),
                textIndent: $input.css("text-indent"),
                textRendering: $input.css("text-rendering"),
                textTransform: $input.css("text-transform")
            }).insertAfter($input);
        }
        function areQueriesEquivalent(a, b) {
            return Input.normalizeQuery(a) === Input.normalizeQuery(b);
        }
        function withModifier($e) {
            return $e.altKey || $e.ctrlKey || $e.metaKey || $e.shiftKey;
        }
    }();
    var Dataset = function() {
        "use strict";
        var keys, nameGenerator;
        keys = {
            val: "tt-selectable-display",
            obj: "tt-selectable-object"
        };
        nameGenerator = _.getIdGenerator();
        function Dataset(o, www) {
            o = o || {};
            o.templates = o.templates || {};
            o.templates.notFound = o.templates.notFound || o.templates.empty;
            if (!o.source) {
                $.error("missing source");
            }
            if (!o.node) {
                $.error("missing node");
            }
            if (o.name && !isValidName(o.name)) {
                $.error("invalid dataset name: " + o.name);
            }
            www.mixin(this);
            this.highlight = !!o.highlight;
            this.name = o.name || nameGenerator();
            this.limit = o.limit || 5;
            this.displayFn = getDisplayFn(o.display || o.displayKey);
            this.templates = getTemplates(o.templates, this.displayFn);
            this.source = o.source.__ttAdapter ? o.source.__ttAdapter() : o.source;
            this.async = _.isUndefined(o.async) ? this.source.length > 2 : !!o.async;
            this._resetLastSuggestion();
            this.$el = $(o.node).addClass(this.classes.dataset).addClass(this.classes.dataset + "-" + this.name);
        }
        Dataset.extractData = function extractData(el) {
            var $el = $(el);
            if ($el.data(keys.obj)) {
                return {
                    val: $el.data(keys.val) || "",
                    obj: $el.data(keys.obj) || null
                };
            }
            return null;
        };
        _.mixin(Dataset.prototype, EventEmitter, {
            _overwrite: function overwrite(query, suggestions) {
                suggestions = suggestions || [];
                if (suggestions.length) {
                    this._renderSuggestions(query, suggestions);
                } else if (this.async && this.templates.pending) {
                    this._renderPending(query);
                } else if (!this.async && this.templates.notFound) {
                    this._renderNotFound(query);
                } else {
                    this._empty();
                }
                this.trigger("rendered", this.name, suggestions, false);
            },
            _append: function append(query, suggestions) {
                suggestions = suggestions || [];
                if (suggestions.length && this.$lastSuggestion.length) {
                    this._appendSuggestions(query, suggestions);
                } else if (suggestions.length) {
                    this._renderSuggestions(query, suggestions);
                } else if (!this.$lastSuggestion.length && this.templates.notFound) {
                    this._renderNotFound(query);
                }
                this.trigger("rendered", this.name, suggestions, true);
            },
            _renderSuggestions: function renderSuggestions(query, suggestions) {
                var $fragment;
                $fragment = this._getSuggestionsFragment(query, suggestions);
                this.$lastSuggestion = $fragment.children().last();
                this.$el.html($fragment).prepend(this._getHeader(query, suggestions)).append(this._getFooter(query, suggestions));
            },
            _appendSuggestions: function appendSuggestions(query, suggestions) {
                var $fragment, $lastSuggestion;
                $fragment = this._getSuggestionsFragment(query, suggestions);
                $lastSuggestion = $fragment.children().last();
                this.$lastSuggestion.after($fragment);
                this.$lastSuggestion = $lastSuggestion;
            },
            _renderPending: function renderPending(query) {
                var template = this.templates.pending;
                this._resetLastSuggestion();
                template && this.$el.html(template({
                    query: query,
                    dataset: this.name
                }));
            },
            _renderNotFound: function renderNotFound(query) {
                var template = this.templates.notFound;
                this._resetLastSuggestion();
                template && this.$el.html(template({
                    query: query,
                    dataset: this.name
                }));
            },
            _empty: function empty() {
                this.$el.empty();
                this._resetLastSuggestion();
            },
            _getSuggestionsFragment: function getSuggestionsFragment(query, suggestions) {
                var that = this, fragment;
                fragment = document.createDocumentFragment();
                _.each(suggestions, function getSuggestionNode(suggestion) {
                    var $el, context;
                    context = that._injectQuery(query, suggestion);
                    $el = $(that.templates.suggestion(context)).data(keys.obj, suggestion).data(keys.val, that.displayFn(suggestion)).addClass(that.classes.suggestion + " " + that.classes.selectable);
                    fragment.appendChild($el[0]);
                });
                this.highlight && highlight({
                    className: this.classes.highlight,
                    node: fragment,
                    pattern: query
                });
                return $(fragment);
            },
            _getFooter: function getFooter(query, suggestions) {
                return this.templates.footer ? this.templates.footer({
                    query: query,
                    suggestions: suggestions,
                    dataset: this.name
                }) : null;
            },
            _getHeader: function getHeader(query, suggestions) {
                return this.templates.header ? this.templates.header({
                    query: query,
                    suggestions: suggestions,
                    dataset: this.name
                }) : null;
            },
            _resetLastSuggestion: function resetLastSuggestion() {
                this.$lastSuggestion = $();
            },
            _injectQuery: function injectQuery(query, obj) {
                return _.isObject(obj) ? _.mixin({
                    _query: query
                }, obj) : obj;
            },
            update: function update(query) {
                var that = this, canceled = false, syncCalled = false, rendered = 0;
                this.cancel();
                this.cancel = function cancel() {
                    canceled = true;
                    that.cancel = $.noop;
                    that.async && that.trigger("asyncCanceled", query);
                };
                this.source(query, sync, async);
                !syncCalled && sync([]);
                function sync(suggestions) {
                    if (syncCalled) {
                        return;
                    }
                    syncCalled = true;
                    suggestions = (suggestions || []).slice(0, that.limit);
                    rendered = suggestions.length;
                    that._overwrite(query, suggestions);
                    if (rendered < that.limit && that.async) {
                        that.trigger("asyncRequested", query);
                    }
                }
                function async(suggestions) {
                    suggestions = suggestions || [];
                    if (!canceled && rendered < that.limit) {
                        that.cancel = $.noop;
                        rendered += suggestions.length;
                        that._append(query, suggestions.slice(0, that.limit - rendered));
                        that.async && that.trigger("asyncReceived", query);
                    }
                }
            },
            cancel: $.noop,
            clear: function clear() {
                this._empty();
                this.cancel();
                this.trigger("cleared");
            },
            isEmpty: function isEmpty() {
                return this.$el.is(":empty");
            },
            destroy: function destroy() {
                this.$el = $("<div>");
            }
        });
        return Dataset;
        function getDisplayFn(display) {
            display = display || _.stringify;
            return _.isFunction(display) ? display : displayFn;
            function displayFn(obj) {
                return obj[display];
            }
        }
        function getTemplates(templates, displayFn) {
            return {
                notFound: templates.notFound && _.templatify(templates.notFound),
                pending: templates.pending && _.templatify(templates.pending),
                header: templates.header && _.templatify(templates.header),
                footer: templates.footer && _.templatify(templates.footer),
                suggestion: templates.suggestion || suggestionTemplate
            };
            function suggestionTemplate(context) {
                return $("<div>").text(displayFn(context));
            }
        }
        function isValidName(str) {
            return /^[_a-zA-Z0-9-]+$/.test(str);
        }
    }();
    var Menu = function() {
        "use strict";
        function Menu(o, www) {
            var that = this;
            o = o || {};
            if (!o.node) {
                $.error("node is required");
            }
            www.mixin(this);
            this.$node = $(o.node);
            this.query = null;
            this.datasets = _.map(o.datasets, initializeDataset);
            function initializeDataset(oDataset) {
                var node = that.$node.find(oDataset.node).first();
                oDataset.node = node.length ? node : $("<div>").appendTo(that.$node);
                return new Dataset(oDataset, www);
            }
        }
        _.mixin(Menu.prototype, EventEmitter, {
            _onSelectableClick: function onSelectableClick($e) {
                this.trigger("selectableClicked", $($e.currentTarget));
            },
            _onRendered: function onRendered(type, dataset, suggestions, async) {
                this.$node.toggleClass(this.classes.empty, this._allDatasetsEmpty());
                this.trigger("datasetRendered", dataset, suggestions, async);
            },
            _onCleared: function onCleared() {
                this.$node.toggleClass(this.classes.empty, this._allDatasetsEmpty());
                this.trigger("datasetCleared");
            },
            _propagate: function propagate() {
                this.trigger.apply(this, arguments);
            },
            _allDatasetsEmpty: function allDatasetsEmpty() {
                return _.every(this.datasets, isDatasetEmpty);
                function isDatasetEmpty(dataset) {
                    return dataset.isEmpty();
                }
            },
            _getSelectables: function getSelectables() {
                return this.$node.find(this.selectors.selectable);
            },
            _removeCursor: function _removeCursor() {
                var $selectable = this.getActiveSelectable();
                $selectable && $selectable.removeClass(this.classes.cursor);
            },
            _ensureVisible: function ensureVisible($el) {
                var elTop, elBottom, nodeScrollTop, nodeHeight;
                elTop = $el.position().top;
                elBottom = elTop + $el.outerHeight(true);
                nodeScrollTop = this.$node.scrollTop();
                nodeHeight = this.$node.height() + parseInt(this.$node.css("paddingTop"), 10) + parseInt(this.$node.css("paddingBottom"), 10);
                if (elTop < 0) {
                    this.$node.scrollTop(nodeScrollTop + elTop);
                } else if (nodeHeight < elBottom) {
                    this.$node.scrollTop(nodeScrollTop + (elBottom - nodeHeight));
                }
            },
            bind: function() {
                var that = this, onSelectableClick;
                onSelectableClick = _.bind(this._onSelectableClick, this);
                this.$node.on("click.tt", this.selectors.selectable, onSelectableClick);
                _.each(this.datasets, function(dataset) {
                    dataset.onSync("asyncRequested", that._propagate, that).onSync("asyncCanceled", that._propagate, that).onSync("asyncReceived", that._propagate, that).onSync("rendered", that._onRendered, that).onSync("cleared", that._onCleared, that);
                });
                return this;
            },
            isOpen: function isOpen() {
                return this.$node.hasClass(this.classes.open);
            },
            open: function open() {
                this.$node.addClass(this.classes.open);
            },
            close: function close() {
                this.$node.removeClass(this.classes.open);
                this._removeCursor();
            },
            setLanguageDirection: function setLanguageDirection(dir) {
                this.$node.attr("dir", dir);
            },
            selectableRelativeToCursor: function selectableRelativeToCursor(delta) {
                var $selectables, $oldCursor, oldIndex, newIndex;
                $oldCursor = this.getActiveSelectable();
                $selectables = this._getSelectables();
                oldIndex = $oldCursor ? $selectables.index($oldCursor) : -1;
                newIndex = oldIndex + delta;
                newIndex = (newIndex + 1) % ($selectables.length + 1) - 1;
                newIndex = newIndex < -1 ? $selectables.length - 1 : newIndex;
                return newIndex === -1 ? null : $selectables.eq(newIndex);
            },
            setCursor: function setCursor($selectable) {
                this._removeCursor();
                if ($selectable = $selectable && $selectable.first()) {
                    $selectable.addClass(this.classes.cursor);
                    this._ensureVisible($selectable);
                }
            },
            getSelectableData: function getSelectableData($el) {
                return $el && $el.length ? Dataset.extractData($el) : null;
            },
            getActiveSelectable: function getActiveSelectable() {
                var $selectable = this._getSelectables().filter(this.selectors.cursor).first();
                return $selectable.length ? $selectable : null;
            },
            getTopSelectable: function getTopSelectable() {
                var $selectable = this._getSelectables().first();
                return $selectable.length ? $selectable : null;
            },
            update: function update(query) {
                var isValidUpdate = query !== this.query;
                if (isValidUpdate) {
                    this.query = query;
                    _.each(this.datasets, updateDataset);
                }
                return isValidUpdate;
                function updateDataset(dataset) {
                    dataset.update(query);
                }
            },
            empty: function empty() {
                _.each(this.datasets, clearDataset);
                this.query = null;
                this.$node.addClass(this.classes.empty);
                function clearDataset(dataset) {
                    dataset.clear();
                }
            },
            destroy: function destroy() {
                this.$node.off(".tt");
                this.$node = $("<div>");
                _.each(this.datasets, destroyDataset);
                function destroyDataset(dataset) {
                    dataset.destroy();
                }
            }
        });
        return Menu;
    }();
    var DefaultMenu = function() {
        "use strict";
        var s = Menu.prototype;
        function DefaultMenu() {
            Menu.apply(this, [].slice.call(arguments, 0));
        }
        _.mixin(DefaultMenu.prototype, Menu.prototype, {
            open: function open() {
                !this._allDatasetsEmpty() && this._show();
                return s.open.apply(this, [].slice.call(arguments, 0));
            },
            close: function close() {
                this._hide();
                return s.close.apply(this, [].slice.call(arguments, 0));
            },
            _onRendered: function onRendered() {
                if (this._allDatasetsEmpty()) {
                    this._hide();
                } else {
                    this.isOpen() && this._show();
                }
                return s._onRendered.apply(this, [].slice.call(arguments, 0));
            },
            _onCleared: function onCleared() {
                if (this._allDatasetsEmpty()) {
                    this._hide();
                } else {
                    this.isOpen() && this._show();
                }
                return s._onCleared.apply(this, [].slice.call(arguments, 0));
            },
            setLanguageDirection: function setLanguageDirection(dir) {
                this.$node.css(dir === "ltr" ? this.css.ltr : this.css.rtl);
                return s.setLanguageDirection.apply(this, [].slice.call(arguments, 0));
            },
            _hide: function hide() {
                this.$node.hide();
            },
            _show: function show() {
                this.$node.css("display", "block");
            }
        });
        return DefaultMenu;
    }();
    var Typeahead = function() {
        "use strict";
        function Typeahead(o, www) {
            var onFocused, onBlurred, onEnterKeyed, onTabKeyed, onEscKeyed, onUpKeyed, onDownKeyed, onLeftKeyed, onRightKeyed, onQueryChanged, onWhitespaceChanged;
            o = o || {};
            if (!o.input) {
                $.error("missing input");
            }
            if (!o.menu) {
                $.error("missing menu");
            }
            if (!o.eventBus) {
                $.error("missing event bus");
            }
            www.mixin(this);
            this.eventBus = o.eventBus;
            this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;
            this.input = o.input;
            this.menu = o.menu;
            this.enabled = true;
            this.active = false;
            this.input.hasFocus() && this.activate();
            this.dir = this.input.getLangDir();
            this._hacks();
            this.menu.bind().onSync("selectableClicked", this._onSelectableClicked, this).onSync("asyncRequested", this._onAsyncRequested, this).onSync("asyncCanceled", this._onAsyncCanceled, this).onSync("asyncReceived", this._onAsyncReceived, this).onSync("datasetRendered", this._onDatasetRendered, this).onSync("datasetCleared", this._onDatasetCleared, this);
            onFocused = c(this, "activate", "open", "_onFocused");
            onBlurred = c(this, "deactivate", "_onBlurred");
            onEnterKeyed = c(this, "isActive", "isOpen", "_onEnterKeyed");
            onTabKeyed = c(this, "isActive", "isOpen", "_onTabKeyed");
            onEscKeyed = c(this, "isActive", "_onEscKeyed");
            onUpKeyed = c(this, "isActive", "open", "_onUpKeyed");
            onDownKeyed = c(this, "isActive", "open", "_onDownKeyed");
            onLeftKeyed = c(this, "isActive", "isOpen", "_onLeftKeyed");
            onRightKeyed = c(this, "isActive", "isOpen", "_onRightKeyed");
            onQueryChanged = c(this, "_openIfActive", "_onQueryChanged");
            onWhitespaceChanged = c(this, "_openIfActive", "_onWhitespaceChanged");
            this.input.bind().onSync("focused", onFocused, this).onSync("blurred", onBlurred, this).onSync("enterKeyed", onEnterKeyed, this).onSync("tabKeyed", onTabKeyed, this).onSync("escKeyed", onEscKeyed, this).onSync("upKeyed", onUpKeyed, this).onSync("downKeyed", onDownKeyed, this).onSync("leftKeyed", onLeftKeyed, this).onSync("rightKeyed", onRightKeyed, this).onSync("queryChanged", onQueryChanged, this).onSync("whitespaceChanged", onWhitespaceChanged, this).onSync("langDirChanged", this._onLangDirChanged, this);
        }
        _.mixin(Typeahead.prototype, {
            _hacks: function hacks() {
                var $input, $menu;
                $input = this.input.$input || $("<div>");
                $menu = this.menu.$node || $("<div>");
                $input.on("blur.tt", function($e) {
                    var active, isActive, hasActive;
                    active = document.activeElement;
                    isActive = $menu.is(active);
                    hasActive = $menu.has(active).length > 0;
                    if (_.isMsie() && (isActive || hasActive)) {
                        $e.preventDefault();
                        $e.stopImmediatePropagation();
                        _.defer(function() {
                            $input.focus();
                        });
                    }
                });
                $menu.on("mousedown.tt", function($e) {
                    $e.preventDefault();
                });
            },
            _onSelectableClicked: function onSelectableClicked(type, $el) {
                this.select($el);
            },
            _onDatasetCleared: function onDatasetCleared() {
                this._updateHint();
            },
            _onDatasetRendered: function onDatasetRendered(type, dataset, suggestions, async) {
                this._updateHint();
                this.eventBus.trigger("render", suggestions, async, dataset);
            },
            _onAsyncRequested: function onAsyncRequested(type, dataset, query) {
                this.eventBus.trigger("asyncrequest", query, dataset);
            },
            _onAsyncCanceled: function onAsyncCanceled(type, dataset, query) {
                this.eventBus.trigger("asynccancel", query, dataset);
            },
            _onAsyncReceived: function onAsyncReceived(type, dataset, query) {
                this.eventBus.trigger("asyncreceive", query, dataset);
            },
            _onFocused: function onFocused() {
                this._minLengthMet() && this.menu.update(this.input.getQuery());
            },
            _onBlurred: function onBlurred() {
                if (this.input.hasQueryChangedSinceLastFocus()) {
                    this.eventBus.trigger("change", this.input.getQuery());
                }
            },
            _onEnterKeyed: function onEnterKeyed(type, $e) {
                var $selectable;
                if ($selectable = this.menu.getActiveSelectable()) {
                    this.select($selectable) && $e.preventDefault();
                }
            },
            _onTabKeyed: function onTabKeyed(type, $e) {
                var $selectable;
                if ($selectable = this.menu.getActiveSelectable()) {
                    this.select($selectable) && $e.preventDefault();
                } else if ($selectable = this.menu.getTopSelectable()) {
                    this.autocomplete($selectable) && $e.preventDefault();
                }
            },
            _onEscKeyed: function onEscKeyed() {
                this.close();
            },
            _onUpKeyed: function onUpKeyed() {
                this.moveCursor(-1);
            },
            _onDownKeyed: function onDownKeyed() {
                this.moveCursor(+1);
            },
            _onLeftKeyed: function onLeftKeyed() {
                if (this.dir === "rtl" && this.input.isCursorAtEnd()) {
                    this.autocomplete(this.menu.getTopSelectable());
                }
            },
            _onRightKeyed: function onRightKeyed() {
                if (this.dir === "ltr" && this.input.isCursorAtEnd()) {
                    this.autocomplete(this.menu.getTopSelectable());
                }
            },
            _onQueryChanged: function onQueryChanged(e, query) {
                this._minLengthMet(query) ? this.menu.update(query) : this.menu.empty();
            },
            _onWhitespaceChanged: function onWhitespaceChanged() {
                this._updateHint();
            },
            _onLangDirChanged: function onLangDirChanged(e, dir) {
                if (this.dir !== dir) {
                    this.dir = dir;
                    this.menu.setLanguageDirection(dir);
                }
            },
            _openIfActive: function openIfActive() {
                this.isActive() && this.open();
            },
            _minLengthMet: function minLengthMet(query) {
                query = _.isString(query) ? query : this.input.getQuery() || "";
                return query.length >= this.minLength;
            },
            _updateHint: function updateHint() {
                var $selectable, data, val, query, escapedQuery, frontMatchRegEx, match;
                $selectable = this.menu.getTopSelectable();
                data = this.menu.getSelectableData($selectable);
                val = this.input.getInputValue();
                if (data && !_.isBlankString(val) && !this.input.hasOverflow()) {
                    query = Input.normalizeQuery(val);
                    escapedQuery = _.escapeRegExChars(query);
                    frontMatchRegEx = new RegExp("^(?:" + escapedQuery + ")(.+$)", "i");
                    match = frontMatchRegEx.exec(data.val);
                    match && this.input.setHint(val + match[1]);
                } else {
                    this.input.clearHint();
                }
            },
            isEnabled: function isEnabled() {
                return this.enabled;
            },
            enable: function enable() {
                this.enabled = true;
            },
            disable: function disable() {
                this.enabled = false;
            },
            isActive: function isActive() {
                return this.active;
            },
            activate: function activate() {
                if (this.isActive()) {
                    return true;
                } else if (!this.isEnabled() || this.eventBus.before("active")) {
                    return false;
                } else {
                    this.active = true;
                    this.eventBus.trigger("active");
                    return true;
                }
            },
            deactivate: function deactivate() {
                if (!this.isActive()) {
                    return true;
                } else if (this.eventBus.before("idle")) {
                    return false;
                } else {
                    this.active = false;
                    this.close();
                    this.eventBus.trigger("idle");
                    return true;
                }
            },
            isOpen: function isOpen() {
                return this.menu.isOpen();
            },
            open: function open() {
                if (!this.isOpen() && !this.eventBus.before("open")) {
                    this.menu.open();
                    this._updateHint();
                    this.eventBus.trigger("open");
                }
                return this.isOpen();
            },
            close: function close() {
                if (this.isOpen() && !this.eventBus.before("close")) {
                    this.menu.close();
                    this.input.clearHint();
                    this.input.resetInputValue();
                    this.eventBus.trigger("close");
                }
                return !this.isOpen();
            },
            setVal: function setVal(val) {
                this.input.setQuery(_.toStr(val));
            },
            getVal: function getVal() {
                return this.input.getQuery();
            },
            select: function select($selectable) {
                var data = this.menu.getSelectableData($selectable);
                if (data && !this.eventBus.before("select", data.obj)) {
                    this.input.setQuery(data.val, true);
                    this.eventBus.trigger("select", data.obj);
                    this.close();
                    return true;
                }
                return false;
            },
            autocomplete: function autocomplete($selectable) {
                var query, data, isValid;
                query = this.input.getQuery();
                data = this.menu.getSelectableData($selectable);
                isValid = data && query !== data.val;
                if (isValid && !this.eventBus.before("autocomplete", data.obj)) {
                    this.input.setQuery(data.val);
                    this.eventBus.trigger("autocomplete", data.obj);
                    return true;
                }
                return false;
            },
            moveCursor: function moveCursor(delta) {
                var query, $candidate, data, payload, cancelMove;
                query = this.input.getQuery();
                $candidate = this.menu.selectableRelativeToCursor(delta);
                data = this.menu.getSelectableData($candidate);
                payload = data ? data.obj : null;
                cancelMove = this._minLengthMet() && this.menu.update(query);
                if (!cancelMove && !this.eventBus.before("cursorchange", payload)) {
                    this.menu.setCursor($candidate);
                    if (data) {
                        this.input.setInputValue(data.val);
                    } else {
                        this.input.resetInputValue();
                        this._updateHint();
                    }
                    this.eventBus.trigger("cursorchange", payload);
                    return true;
                }
                return false;
            },
            destroy: function destroy() {
                this.input.destroy();
                this.menu.destroy();
            }
        });
        return Typeahead;
        function c(ctx) {
            var methods = [].slice.call(arguments, 1);
            return function() {
                var args = [].slice.call(arguments);
                _.each(methods, function(method) {
                    return ctx[method].apply(ctx, args);
                });
            };
        }
    }();
    (function() {
        "use strict";
        var old, keys, methods;
        old = $.fn.typeahead;
        keys = {
            www: "tt-www",
            attrs: "tt-attrs",
            typeahead: "tt-typeahead"
        };
        methods = {
            initialize: function initialize(o, datasets) {
                var www;
                datasets = _.isArray(datasets) ? datasets : [].slice.call(arguments, 1);
                o = o || {};
                www = WWW(o.classNames);
                return this.each(attach);
                function attach() {
                    var $input, $wrapper, $hint, $menu, defaultHint, defaultMenu, eventBus, input, menu, typeahead, MenuConstructor;
                    _.each(datasets, function(d) {
                        d.highlight = !!o.highlight;
                    });
                    $input = $(this);
                    $wrapper = $(www.html.wrapper);
                    $hint = $elOrNull(o.hint);
                    $menu = $elOrNull(o.menu);
                    defaultHint = o.hint !== false && !$hint;
                    defaultMenu = o.menu !== false && !$menu;
                    defaultHint && ($hint = buildHintFromInput($input, www));
                    defaultMenu && ($menu = $(www.html.menu).css(www.css.menu));
                    $hint && $hint.val("");
                    $input = prepInput($input, www);
                    if (defaultHint || defaultMenu) {
                        $wrapper.css(www.css.wrapper);
                        $input.css(defaultHint ? www.css.input : www.css.inputWithNoHint);
                        $input.wrap($wrapper).parent().prepend(defaultHint ? $hint : null).append(defaultMenu ? $menu : null);
                    }
                    MenuConstructor = defaultMenu ? DefaultMenu : Menu;
                    eventBus = new EventBus({
                        el: $input
                    });
                    input = new Input({
                        hint: $hint,
                        input: $input
                    }, www);
                    menu = new MenuConstructor({
                        node: $menu,
                        datasets: datasets
                    }, www);
                    typeahead = new Typeahead({
                        input: input,
                        menu: menu,
                        eventBus: eventBus,
                        minLength: o.minLength
                    }, www);
                    $input.data(keys.www, www);
                    $input.data(keys.typeahead, typeahead);
                }
            },
            isEnabled: function isEnabled() {
                var enabled;
                ttEach(this.first(), function(t) {
                    enabled = t.isEnabled();
                });
                return enabled;
            },
            enable: function enable() {
                ttEach(this, function(t) {
                    t.enable();
                });
                return this;
            },
            disable: function disable() {
                ttEach(this, function(t) {
                    t.disable();
                });
                return this;
            },
            isActive: function isActive() {
                var active;
                ttEach(this.first(), function(t) {
                    active = t.isActive();
                });
                return active;
            },
            activate: function activate() {
                ttEach(this, function(t) {
                    t.activate();
                });
                return this;
            },
            deactivate: function deactivate() {
                ttEach(this, function(t) {
                    t.deactivate();
                });
                return this;
            },
            isOpen: function isOpen() {
                var open;
                ttEach(this.first(), function(t) {
                    open = t.isOpen();
                });
                return open;
            },
            open: function open() {
                ttEach(this, function(t) {
                    t.open();
                });
                return this;
            },
            close: function close() {
                ttEach(this, function(t) {
                    t.close();
                });
                return this;
            },
            select: function select(el) {
                var success = false, $el = $(el);
                ttEach(this.first(), function(t) {
                    success = t.select($el);
                });
                return success;
            },
            autocomplete: function autocomplete(el) {
                var success = false, $el = $(el);
                ttEach(this.first(), function(t) {
                    success = t.autocomplete($el);
                });
                return success;
            },
            moveCursor: function moveCursoe(delta) {
                var success = false;
                ttEach(this.first(), function(t) {
                    success = t.moveCursor(delta);
                });
                return success;
            },
            val: function val(newVal) {
                var query;
                if (!arguments.length) {
                    ttEach(this.first(), function(t) {
                        query = t.getVal();
                    });
                    return query;
                } else {
                    ttEach(this, function(t) {
                        t.setVal(newVal);
                    });
                    return this;
                }
            },
            destroy: function destroy() {
                ttEach(this, function(typeahead, $input) {
                    revert($input);
                    typeahead.destroy();
                });
                return this;
            }
        };
        $.fn.typeahead = function(method) {
            if (methods[method]) {
                return methods[method].apply(this, [].slice.call(arguments, 1));
            } else {
                return methods.initialize.apply(this, arguments);
            }
        };
        $.fn.typeahead.noConflict = function noConflict() {
            $.fn.typeahead = old;
            return this;
        };
        function ttEach($els, fn) {
            $els.each(function() {
                var $input = $(this), typeahead;
                (typeahead = $input.data(keys.typeahead)) && fn(typeahead, $input);
            });
        }
        function buildHintFromInput($input, www) {
            return $input.clone().addClass(www.classes.hint).removeData().css(www.css.hint).css(getBackgroundStyles($input)).prop("readonly", true).removeAttr("id name placeholder required").attr({
                autocomplete: "off",
                spellcheck: "false",
                tabindex: -1
            });
        }
        function prepInput($input, www) {
            $input.data(keys.attrs, {
                dir: $input.attr("dir"),
                autocomplete: $input.attr("autocomplete"),
                spellcheck: $input.attr("spellcheck"),
                style: $input.attr("style")
            });
            $input.addClass(www.classes.input).attr({
                autocomplete: "off",
                spellcheck: false
            });
            try {
                !$input.attr("dir") && $input.attr("dir", "auto");
            } catch (e) {}
            return $input;
        }
        function getBackgroundStyles($el) {
            return {
                backgroundAttachment: $el.css("background-attachment"),
                backgroundClip: $el.css("background-clip"),
                backgroundColor: $el.css("background-color"),
                backgroundImage: $el.css("background-image"),
                backgroundOrigin: $el.css("background-origin"),
                backgroundPosition: $el.css("background-position"),
                backgroundRepeat: $el.css("background-repeat"),
                backgroundSize: $el.css("background-size")
            };
        }
        function revert($input) {
            var www, $wrapper;
            www = $input.data(keys.www);
            $wrapper = $input.parent().filter(www.selectors.wrapper);
            _.each($input.data(keys.attrs), function(val, key) {
                _.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
            });
            $input.removeData(keys.typeahead).removeData(keys.www).removeData(keys.attr).removeClass(www.classes.input);
            if ($wrapper.length) {
                $input.detach().insertAfter($wrapper);
                $wrapper.remove();
            }
        }
        function $elOrNull(obj) {
            var isValid, $el;
            isValid = _.isJQuery(obj) || _.isElement(obj);
            $el = isValid ? $(obj).first() : [];
            return $el.length ? $el : null;
        }
    })();
});
var what3words = new function (language) {

	this.API_KEY = 'JY9EU40P'; 		// Change to your what3words API key
	this.language = language || 'en'; 	// Change to your default language

	// --

	this.postRequest = function (url, data, callback) {
		data.key = this.API_KEY;
		data.lang = this.language;
		$.post('http://api.what3words.com/' + url, data, callback, 'JSON');
	};

	/**
	 * Sets the language in which to return words
	 */

	this.setLanguage = function (language) {
		if (language !== undefined)
			this.language = language;
	};

	/**
	 * Convert 3 words into position
	 * Takes words either as string, or array of words
	 * Returns array of [lat, long]
	 */

	this.wordsToPosition = function (words, callback) {
		if (typeof words === 'undefined')
			throw 'No valid words passed';
		else if (typeof words === 'object')
			words = words.join('.');
		else if (typeof words !== 'string')
			throw 'Invalid words passed';

		var data = { string: words };
		this.postRequest('w3w', data, function (ret) { callback(ret.position); });
	};

	/**
	 * Convert a position into 3 words
	 * Takes position either as string, or array of [lat, lng]
	 * Returns array of [word1, word2, word3]
	 */

	this.positionToWords = function (position, callback) {
		if (typeof position === 'undefined')
			throw 'No valid position passed';
		else if (typeof position === 'object')
			position = position.join(',');
		else if (typeof position !== 'string')
			throw 'Invalid position passed';

		var data = { position: position };
		this.postRequest('position', data, function (ret) { callback(ret.words); });
	};
};
// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//

function fillInPlaceData(data){
  // `data` is a string that looks like "name##lat##lon##geonameid##bbox##source##confidence"
  var array = data.split("##");
  $.each(['#inputName', '#inputLat', '#inputLon', '#inputGeonameid', '#inputBbox', '#inputSource', '#inputConfidence'], function( index, value ){
    $(value).val(
      array[index]
    );
  });
  what3words.positionToWords([array[1], array[2]], function(words){
    var dotWords = words.join(".");
    $('#inputW3W').val(dotWords);
  });
}

function recenterMap(latLng){
  marker.setLatLng(latLng);
  map.panTo(latLng);
};

var washingtonSquare = L.latLng(40.7308, -73.9975);

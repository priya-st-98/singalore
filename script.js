function initMap() {
    console.log("Initializing map...");
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 1.3521, lng: 103.8198}, // Centered on Singapore
        zoom: 12
    });
}

    /* Fetch the GeoJSON data and add it to the map
    fetch('StreetandPlaces.geojson')
        .then(response => response.json())
        .then(data => {
            map.data.addGeoJson(data);
            map.data.setStyle({
                fillColor: 'blue',
                strokeWeight: 1
            });
            map.data.addListener('click', function(event) {
                var content = event.feature.getProperty('name');
                var infowindow = new google.maps.InfoWindow({
                    content: content,
                    position: event.latLng
                });
                infowindow.open(map);
            });
        });
}

*/
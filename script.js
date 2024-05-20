// Define the initMap() function
function initMap() {
    console.log("Initializing map...");
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 1.3521, lng: 103.8198 }, // Centered on Singapore
        zoom: 12
    });

    // Create a marker to test if the map is working
    new google.maps.Marker({
        position: { lat: 1.3638110160374226, lng: 103.84343265043638 },
        map: map,
        label: "A",
        title: "Test"
    });

// Load and parse the KML file
fetch('StreetandPlacesKML.kml') // Replace with the correct path to your KML file
.then(response => response.text())
.then(kmlText => {
    var parser = new DOMParser();
    var kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    var placemarks = kmlDoc.getElementsByTagName('Placemark');

    for (var i = 0; i < placemarks.length; i++) {
        var placemark = placemarks[i];
        var name = placemark.getElementsByTagName('name')[0].textContent;
        var description = placemark.getElementsByTagName('description')[0].textContent;
        var coordinates = placemark.getElementsByTagName('coordinates')[0].textContent.trim().split(',');

        var lng = parseFloat(coordinates[0]);
        var lat = parseFloat(coordinates[1]);

        // Create a marker for each place
        var marker = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map,
            title: name
        });

        // Add click event listener to show info window
        google.maps.event.addListener(marker, 'click', (function(marker, name, description) {
            return function() {
                var content = '<div>' +
                    '<h2>' + name + '</h2>' +
                    '<p>' + description + '</p>' +
                    '</div>';

                var infoWindow = new google.maps.InfoWindow({
                    content: content
                });

                infoWindow.open(map, marker);
            };
        })(marker, name, description));
    }
})
.catch(error => console.error('Error loading KML file:', error));
}

// Load the Google Maps API asynchronously
function loadGoogleMaps() {
    var script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAo5tn_gD9gYTz-DKsNBvc5AGCjXHWifZo&callback=initMap';
    document.head.appendChild(script);
}

loadGoogleMaps(); // Call the function to load the API

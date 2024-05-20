// Define global variables
let map;
let currentInfoWindow; // Global variable to hold the currently open info window

// Define the initMap() function
function initMap() {
    console.log("Initializing map...");
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 1.3521, lng: 103.8198 }, // Centered on Singapore
        zoom: 12
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
            var name = placemark.getElementsByTagName('name')[0]?.textContent || 'No Name';
            var descriptionNode = placemark.getElementsByTagName('description')[0];
            var description = descriptionNode ? extractDescription(descriptionNode.textContent) : 'No Description';
            var photoUrl = placemark.getElementsByTagName('PHOTOURL')[0]?.textContent || '';
            var hyperlink = placemark.getElementsByTagName('HYPERLINK')[0]?.textContent || '';

            // Create custom content for the info window
            var contentHtml = `
                <div>
                    <h1>${name}</h1>
                    <p>${description}</p>
                    ${photoUrl ? `<img src="${photoUrl}" alt="Photo" />` : ''}
                    ${hyperlink ? `<a href="${hyperlink}" target="_blank">Read more here</a>` : ''}
                </div>
            `;

            // Log the content to verify
            console.log('Info window content:', contentHtml);

            // Create a marker for each place
            var coordinates = placemark.getElementsByTagName('coordinates')[0].textContent.trim().split(',');
            var lng = parseFloat(coordinates[0]);
            var lat = parseFloat(coordinates[1]);

            var marker = new google.maps.Marker({
                position: { lat: lat, lng: lng },
                map: map,
                title: name // Set the title of the marker to the name of the place
            });

            // Add click event listener to show info window
            google.maps.event.addListener(marker, 'click', (function(marker, contentHtml) {
                return function() {
                    // Close any previously opened info window
                    if (currentInfoWindow) {
                        currentInfoWindow.close();
                    }

                    // Create a new info window with the custom content
                    var infoWindow = new google.maps.InfoWindow({
                        content: contentHtml
                    });

                    // Open the info window
                    infoWindow.open(map, marker);
                    currentInfoWindow = infoWindow;
                };
            })(marker, contentHtml));
        }
    })
    .catch(error => console.error('Error loading KML file:', error));
}

// Helper function to extract description content
function extractDescription(html) {
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;

    // Extract relevant description content
    var description = '';
    var rows = tmp.querySelectorAll('tr');
    rows.forEach(row => {
        var th = row.querySelector('th');
        var td = row.querySelector('td');
        if (th && td && th.textContent === 'DESCRIPTION') {
            description = td.textContent;
        }
    });
    return description;
}

// Load the Google Maps API asynchronously
function loadGoogleMaps() {
    var script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAo5tn_gD9gYTz-DKsNBvc5AGCjXHWifZo&callback=initMap';
    document.head.appendChild(script);
}

loadGoogleMaps(); // Call the function to load the API

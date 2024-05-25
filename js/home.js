// Define global variables (variables that apply to whole page)
let map;
let currentInfoWindow; // Global variable to hold the currently open info window
let userLocation; // Variable to hold the user's current location
let places = []; // Array to hold all places of interest
let nearbyPlaces = []; // Array to hold nearby places of interest
let placeIndex = 0; // Index to track the current place being shown

// Define the initMap() function (initialise the map)
function initMap() {
    console.log("Initializing map...");
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 1.3521, lng: 103.8198 }, // Centered on Singapore
        zoom: 12
    });

// Custom marker icon with a different hue
    const redIcon = {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png', // URL to the default red marker icon
    };

// Load and parse the KML file
    fetch('StreetandPlacesKML.kml') // Replace with the correct path to your KML file
    .then(response => response.text())
    .then(kmlText => {
        var parser = new DOMParser();
        var kmlDoc = parser.parseFromString(kmlText, 'text/xml');
        var placemarks = kmlDoc.getElementsByTagName('Placemark');

        for (var i = 0; i < placemarks.length; i++) {
            var placemark = placemarks[i];
            var name = placemark.getElementsByTagName('SimpleData')[0]?.textContent || 'No Name';
            var simpleDataElements = placemark.getElementsByTagName('SimpleData');
            for (var j = 0; j < simpleDataElements.length; j++) {
                var simpleData = simpleDataElements[j];
                var nameAttribute = simpleData.getAttribute('name');
                if (nameAttribute === 'NAME') {
                    name = simpleData.textContent;
                }
            }
            var descriptionNode = placemark.getElementsByTagName('description')[0];
            var description = descriptionNode ? extractDescription(descriptionNode.textContent) : 'No Description';
            var photoUrl = placemark.getElementsByTagName('PHOTOURL')[0]?.textContent || '';
            var hyperlink = placemark.getElementsByTagName('HYPERLINK')[0]?.textContent || '';

// Create custom content for the info window
    var contentHtml = `
        <div class="info-window-content">
            <h4>${name}</h4>
            <p>${description}</p>
            ${photoUrl ? `<img src="${photoUrl}" alt="Photo" />` : ''}
            ${hyperlink ? `<a href="${hyperlink}" target="_blank">Read more here</a>` : ''}
            <div class="custom-close-button">X</div>
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
        title: name, // Set the title of the marker to the name of the place
        icon: redIcon // Use the custom red marker icon
    });

// Store place data
    places.push({
        name: name,
        description: description,
        photoUrl: photoUrl,
        hyperlink: hyperlink,
        lat: lat,
        lng: lng
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
                content: contentHtml,
                pixelOffset: new google.maps.Size(0, -30) // Adjust to remove the default arrow
            });

// Open the info window
        infoWindow.open(map, marker);
        currentInfoWindow = infoWindow;

        // Add custom close button event
        google.maps.event.addListenerOnce(infoWindow, 'domready', function() {
            const customCloseButton = document.querySelector('.custom-close-button');
            if (customCloseButton) {
                customCloseButton.addEventListener('click', function() {
                    infoWindow.close();
                });
            }
        });
    };
})(marker, contentHtml));
}

// Log places array to verify
        console.log('Places:', places);

// Get the user's current location
        getUserLocation();
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

// Function to get the user's current location
function getUserLocation() {
    if (navigator.geolocation) {
        console.log("Requesting user location...");
        navigator.geolocation.getCurrentPosition(position => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            console.log('User location:', userLocation);
            findNearbyPlaces();
        }, error => {
            console.error('Error getting location:', error);
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Function to find the nearest places within 1 km
function findNearbyPlaces() {
    nearbyPlaces = places.filter(place => {
        let distance = calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng);
        console.log(`Distance to ${place.name}: ${distance} km`);
        return distance < 1;
    });

    if (nearbyPlaces.length > 0) {
        placeIndex = 0; // Reset the place index
        showPlaceAlert(nearbyPlaces[placeIndex]);
    } else {
        alert('Sorry! There are no places of interest near you. Explore our interactive map below instead!');
    }
}

// Function to show an alert with place information
function showPlaceAlert(place) {
    const alertContent = `
        <div id="placeAlert">
            <h4><span class="near-text">You're near</span> <span class="place-name">${place.name}</span></h4>
            <p>${place.description}</p>
            ${place.photoUrl ? `<img src="${place.photoUrl}" alt="Photo" />` : ''}
            ${place.hyperlink ? `<a href="${place.hyperlink}" target="_blank">Read more here</a>` : ''}
            <br><br>
            <button id="nextPlaceBtn">Tell me about the history of another place nearby!</button>
            <button id="stopAlertsBtn">Close</button>
        </div>
    `;

    const alertElement = document.createElement('div');
    alertElement.id = 'alertContainer';
    alertElement.innerHTML = alertContent;
    document.body.appendChild(alertElement);

// Position the alert (near top of screen so it doesn't cover title)
    alertElement.style.position = 'fixed';
    alertElement.style.top = '20%';
    alertElement.style.left = '50%';
    alertElement.style.transform = 'translate(-50%, -50%)';
    alertElement.style.zIndex = '1000';

// Set up event listeners for the buttons
    document.getElementById('nextPlaceBtn').addEventListener('click', showNextPlace);
    document.getElementById('stopAlertsBtn').addEventListener('click', stopAlerts);
}

// Function to calculate the distance between two points in kilometers
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        0.5 - Math.cos(dLat) / 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        (1 - Math.cos(dLng)) / 2;

    return R * 2 * Math.asin(Math.sqrt(a));
}

// Function to show the next nearest place
function showNextPlace() {
    console.log("Showing next place...");
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.remove(); // Remove the current alert
    }
    placeIndex++;
    if (placeIndex >= nearbyPlaces.length) {
        placeIndex = 0;
    }
    showPlaceAlert(nearbyPlaces[placeIndex]); // Show the next nearby place
}

// Function to stop showing alerts
function stopAlerts() {
    console.log("Stopping alerts...");
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.remove(); // Remove the current alert
    }
}

// Load the Google Maps API asynchronously
function loadGoogleMaps() {
    var script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAo5tn_gD9gYTz-DKsNBvc5AGCjXHWifZo&callback=initMap';
    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', function() {
    loadGoogleMaps(); // Call the function to load
});

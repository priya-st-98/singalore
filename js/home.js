let map;
let currentInfoWindow;
let userLocation;
let places = [];
let nearbyPlaces = [];
let placeIndex = 0;
let isMobile = window.innerWidth <= 768;

document.addEventListener('DOMContentLoaded', function() {
    loadGoogleMaps();
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 768;
    });
});

function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAo5tn_gD9gYTz-DKsNBvc5AGCjXHWifZo&callback=initMap';
    document.head.appendChild(script);
}

function initMap() {
    console.log("Initializing map...");
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 1.3521, lng: 103.8198 },
        zoom: 12
    });

    const redIcon = {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    };

    fetch('StreetandPlacesKML.kml')
        .then(response => response.text())
        .then(kmlText => {
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
            const placemarks = kmlDoc.getElementsByTagName('Placemark');

            for (let i = 0; i < placemarks.length; i++) {
                const placemark = placemarks[i];
                let name = 'No Name';
                const simpleDataElements = placemark.getElementsByTagName('SimpleData');

                for (let j = 0; j < simpleDataElements.length; j++) {
                    const simpleData = simpleDataElements[j];
                    if (simpleData.getAttribute('name') === 'NAME') {
                        name = simpleData.textContent;
                    }
                }

                const descriptionNode = placemark.getElementsByTagName('description')[0];
                const description = descriptionNode ? extractDescription(descriptionNode.textContent) : 'No Description';
                const photoUrl = placemark.getElementsByTagName('PHOTOURL')[0]?.textContent || '';
                const hyperlink = placemark.getElementsByTagName('HYPERLINK')[0]?.textContent || '';

                const contentHtml = `
                    <div class="info-window-content">
                        <h4>${name}</h4>
                        <p>${description}</p>
                        ${photoUrl ? `<img src="${photoUrl}" alt="Photo" />` : ''}
                        ${hyperlink ? `<a href="${hyperlink}" target="_blank">Read more here</a>` : ''}
                        <div class="custom-close-button">X</div>
                    </div>
                `;

                console.log('Info window content:', contentHtml);

                const coordinates = placemark.getElementsByTagName('coordinates')[0].textContent.trim().split(',');
                const lng = parseFloat(coordinates[0]);
                const lat = parseFloat(coordinates[1]);

                const marker = new google.maps.Marker({
                    position: { lat: lat, lng: lng },
                    map: map,
                    title: name,
                    icon: redIcon
                });

                places.push({
                    name: name,
                    description: description,
                    photoUrl: photoUrl,
                    hyperlink: hyperlink,
                    lat: lat,
                    lng: lng
                });

                google.maps.event.addListener(marker, 'click', (function(marker, contentHtml) {
                    return function() {
                        if (currentInfoWindow) {
                            currentInfoWindow.close();
                        }

                        const infoWindow = new google.maps.InfoWindow({
                            content: contentHtml,
                            pixelOffset: new google.maps.Size(0, -30)
                        });

                        infoWindow.open(map, marker);
                        currentInfoWindow = infoWindow;

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

            console.log('Places:', places);
            getUserLocation();
        })
        .catch(error => console.error('Error loading KML file:', error));
}

function extractDescription(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;

    let description = '';
    const rows = tmp.querySelectorAll('tr');
    rows.forEach(row => {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (th && td && th.textContent === 'DESCRIPTION') {
            description = td.textContent;
        }
    });
    return description;
}

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
            alert('Error getting location. Please check your browser settings.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function findNearbyPlaces() {
    nearbyPlaces = places.filter(place => {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng);
        console.log(`Distance to ${place.name}: ${distance} km`);
        return distance < 1;
    });

    if (nearbyPlaces.length > 0) {
        placeIndex = 0;
        showPlaceAlert(nearbyPlaces[placeIndex]);
    } else {
        alert('Sorry! There are no places of interest near you. Explore our interactive map below instead!');
    }
}

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

    alertElement.style.position = 'fixed';
    alertElement.style.left = '50%';
    alertElement.style.transform = 'translate(-50%, -50%)';
    alertElement.style.zIndex = '1000';

    if (isMobile) {
        alertElement.style.top = '37%';
    } else {
        alertElement.style.top = '23%';
    }

    document.getElementById('nextPlaceBtn').addEventListener('click', showNextPlace);
    document.getElementById('stopAlertsBtn').addEventListener('click', stopAlerts);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        0.5 - Math.cos(dLat) / 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        (1 - Math.cos(dLng)) / 2;

    return R * 2 * Math.asin(Math.sqrt(a));
}

function showNextPlace() {
    console.log("Showing next place...");
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.remove();
    }
    placeIndex++;
    if (placeIndex >= nearbyPlaces.length) {
        placeIndex = 0;
    }
    showPlaceAlert(nearbyPlaces[placeIndex]);
}

function stopAlerts() {
    console.log("Stopping alerts...");
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.remove();
    }
}

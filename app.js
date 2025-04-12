// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ✅ Firebase Config (replace with your actual Firebase config)
const firebaseConfig = {
    apiKey: "AIzaSyDoxED2FohfU_8Dn4w47Kp7GlmweBz7p94",
    authDomain: "panayal-bus.firebaseapp.com",
    projectId: "panayal-bus",
    storageBucket: "panayal-bus.firebasestorage.app",
    messagingSenderId: "674587216708",
    appId: "1:674587216708:web:1f3a670bd228b91845e511"
};


// 🔥 Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🗺️ Initialize Google Map
let map, marker;
let lastPosition = null;

function initMap(lat = 37.4219983, lng = -122.084) {
    const position = { lat, lng };
    lastPosition = position;

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: position,
        disableDefaultUI: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
    });

    marker = new google.maps.Marker({
        position,
        map,
        title: "Panayal Bus",
        icon: {
            url: "https://maps.google.com/mapfiles/kml/shapes/bus.png",
            scaledSize: new google.maps.Size(40, 40)
        }
    });
}

// 📍 Smoothly move marker to new position
function animateMarker(toLat, toLng) {
    if (!lastPosition) {
        lastPosition = { lat: toLat, lng: toLng };
        marker.setPosition(lastPosition);
        map.setCenter(lastPosition);
        return;
    }

    const steps = 60;
    const delay = 10; // ms
    let i = 0;

    const deltaLat = (toLat - lastPosition.lat) / steps;
    const deltaLng = (toLng - lastPosition.lng) / steps;

    function moveStep() {
        if (i >= steps) {
            lastPosition = { lat: toLat, lng: toLng };
            return;
        }

        const nextLat = lastPosition.lat + deltaLat * i;
        const nextLng = lastPosition.lng + deltaLng * i;
        const nextPosition = { lat: nextLat, lng: nextLng };

        marker.setPosition(nextPosition);
        map.panTo(nextPosition); // smoother than setCenter

        i++;
        setTimeout(moveStep, delay);
    }

    moveStep();
}

// 🕒 Update timestamp and trigger animation
function updateMap(lat, lng, timestamp) {
    animateMarker(lat, lng);

    const time = timestamp.toDate();
    const formattedTime = time.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'long'
    });

    document.getElementById("last-updated").textContent = formattedTime;
}

// 🕒 Update footer year
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    initMap(); // Initialize map on page load
    listenForLocationUpdates(); // Start listening for updates
});

// 🔁 Realtime Firestore updates
function listenForLocationUpdates() {
    const locationDoc = doc(db, "vehicle", "location");
    onSnapshot(locationDoc, (snapshot) => {
        const data = snapshot.data();
        if (data && data.lat && data.lng && data.timestamp) {
            updateMap(data.lat, data.lng, data.timestamp);
        }
    });
}

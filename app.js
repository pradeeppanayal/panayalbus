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

function initMap(lat = 37.4219983, lng = -122.084) {
    const position = { lat, lng };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: position,
        disableDefaultUI: true, // Disables all default UI controls
        mapTypeControl: false,  // Hides the map type (satellite/terrain) control
        streetViewControl: false, // Hides Pegman
        fullscreenControl: true ,// Hides fullscreen button
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

// 📍 Update marker position and timestamp
function updateMap(lat, lng, timestamp) {
    const position = { lat, lng };
    marker.setPosition(position);
    map.setCenter(position);

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

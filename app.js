import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 *  Author : Pradeep C H
 *  Version : 1.0.0
 *  Date : 2025-04-13 
 */

// ✅ Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDoxED2FohfU_8Dn4w47Kp7GlmweBz7p94",
    authDomain: "panayal-bus.firebaseapp.com",
    projectId: "panayal-bus",
    storageBucket: "panayal-bus.appspot.com",
    messagingSenderId: "674587216708",
    appId: "1:674587216708:web:1f3a670bd228b91845e511"
};

// 🔥 Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🗺️ Map and marker
let map, marker, lastPosition = null;

// 📦 Fetch last known bus location (does NOT initialize map)
async function fetchLastKnownLocation() {
    const locationDoc = doc(db, "vehicle", "location");

    try {
        const snapshot = await getDoc(locationDoc);
        const data = snapshot.data();

        if (data && data.lat && data.lng && data.timestamp) {
            return data;
        }
    } catch (err) {
        console.error("Error fetching last known location:", err);
    }

    return null;
}

// 🗺️ Initialize Google Map
function initMap(lat = 12.424458492863547, lng = 75.05723616200689) {
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

// 📍 Smooth marker animation
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

// 🕓 Update marker + timestamp
function updateMap(lat, lng, timestamp) {
    animateMarker(lat, lng);

    const time = timestamp.toDate();
    const formattedTime = time.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'long'
    });

    document.getElementById("last-updated").textContent = formattedTime;
}

// 🔁 Realtime location updates
function listenForLocationUpdates() {
    const locationDoc = doc(db, "vehicle", "location");

    onSnapshot(locationDoc, (snapshot) => {
        const data = snapshot.data();
        if (data && data.lat && data.lng && data.timestamp) {
            updateMap(data.lat, data.lng, data.timestamp);
        }
    });
}

// 🚀 On page load
document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById('year').textContent = new Date().getFullYear();

    const lastKnown = await fetchLastKnownLocation();

    if (lastKnown) {
        initMap(lastKnown.lat, lastKnown.lng);
        updateMap(lastKnown.lat, lastKnown.lng, lastKnown.timestamp);
    } else {
        initMap(); // fallback to default
    }

    listenForLocationUpdates(); // live updates
});

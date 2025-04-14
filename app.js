

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 *  Author : Pradeep C H
 *  Version : 1.1.0
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
    const locationDoc = doc(db, "vehicle", "location2");

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

// 📐 Calculate heading in degrees
function calculateHeading(from, to) {
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    const theta = Math.atan2(y, x);
    return (theta * 180 / Math.PI + 360) % 360;
}

// 🗺️ Initialize Google Map
function initMap(lat = 12.424458492863547, lng = 75.05723616200689) {
    const position = { lat, lng };
    lastPosition = position;

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 16,
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
            /*path: "M -10,20 L -10,-16 Q -10,-22 0,-24 Q 10,-22 10,-16 L 10,20 Q 10,22 0,22 Q -10,22 -10,20 Z M -6,18 A 1.5,1.5 0 1,0 -6,21 A 1.5,1.5 0 1,0 -6,18 Z M 6,18 A 1.5,1.5 0 1,0 6,21 A 1.5,1.5 0 1,0 6,18 Z M -6,-14 A 1.5,1.5 0 1,0 -6,-11 A 1.5,1.5 0 1,0 -6,-14 Z M 6,-14 A 1.5,1.5 0 1,0 6,-11 A 1.5,1.5 0 1,0 6,-14 Z",
            scale: 1.5,
            fillColor: "#2196F3",       // cleaner blue
            fillOpacity: 1,
            strokeWeight: 1.5,
            strokeColor: "#0D47A1",     // dark border for contrast
            rotation: 0,
            anchor: new google.maps.Point(0, 0)*/
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 5,
            strokeWeight: 2,
            fillColor: "#007bff",
            fillOpacity: 1,
            rotation: 0, // initial rotation
        
        }
    });
}

// 📍 Smooth marker animation with direction rotation
function animateMarker(toLat, toLng) {
    if (!lastPosition) {
        lastPosition = { lat: toLat, lng: toLng };
        marker.setPosition(lastPosition);
        map.setCenter(lastPosition);
        return;
    }

    const steps = 10;
    const delay = 10; // ms
    let i = 0;

    const deltaLat = (toLat - lastPosition.lat) / steps;
    const deltaLng = (toLng - lastPosition.lng) / steps;

    // 🔄 Calculate rotation angle
    const newPosition = { lat: toLat, lng: toLng };
    const rotation = calculateHeading(lastPosition, newPosition);
    const icon = marker.getIcon();
    icon.rotation = rotation;
    marker.setIcon(icon);

    function moveStep() {
        if (i >= steps) {
            lastPosition = newPosition;
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

function updateLastUpdatedOn(timestamp) {
    const time = timestamp.toDate();
    const now = new Date();
    const diffMs = now - time;
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    const formattedTime = time.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    let timeAgo = "";
    if (diffSec < 60) {
        timeAgo = `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
    } else if (diffMin < 60) {
        timeAgo = `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHr < 24) {
        timeAgo = `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
    } else {
        timeAgo = `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    }

    document.getElementById("last-updated").textContent = `${timeAgo}`;
    document.getElementById("last-updated").title = `${formattedTime}`;
}


// 🕓 Update marker + timestamp
function updateMap(lat, lng, timestamp) {
    animateMarker(lat, lng);
    updateLastUpdatedOn(timestamp);

}

// 🔁 Realtime location updates
function listenForLocationUpdates() {
    const locationDoc = doc(db, "vehicle", "location2");

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
   //simulateLocationUpdates();
});
// 🧪 Simulate Firebase-like updates
function simulateLocationUpdates() {
    const testPath = [
        // ▶️ Forward Path
        { lat: 12.423900, lng: 75.056700 },
        { lat: 12.423980, lng: 75.056800 },
        { lat: 12.424070, lng: 75.056900 },
        { lat: 12.424160, lng: 75.057000 },
        { lat: 12.424250, lng: 75.057100 },
        { lat: 12.424340, lng: 75.057200 },
        { lat: 12.424430, lng: 75.057300 },
        { lat: 12.424520, lng: 75.057400 },
        { lat: 12.424610, lng: 75.057500 },
        { lat: 12.424700, lng: 75.057600 },
        { lat: 12.424790, lng: 75.057700 },
        { lat: 12.424880, lng: 75.057800 },
        { lat: 12.424970, lng: 75.057900 },
        { lat: 12.425060, lng: 75.058000 },
        { lat: 12.425150, lng: 75.058100 },
        { lat: 12.425240, lng: 75.058200 },
        { lat: 12.425330, lng: 75.058300 },
        { lat: 12.425420, lng: 75.058400 },
        { lat: 12.425510, lng: 75.058500 },
        { lat: 12.425600, lng: 75.058600 },
        { lat: 12.425690, lng: 75.058700 },
        { lat: 12.425780, lng: 75.058800 },
        { lat: 12.425870, lng: 75.058900 },
        { lat: 12.425960, lng: 75.059000 },
        { lat: 12.426050, lng: 75.059100 },
        { lat: 12.426140, lng: 75.059200 },
        { lat: 12.426230, lng: 75.059300 },
        { lat: 12.426320, lng: 75.059400 },
        { lat: 12.426410, lng: 75.059500 },
        { lat: 12.426500, lng: 75.059600 },
    
        // 🔄 Turnaround with gradual turn
        { lat: 12.426490, lng: 75.059700 },
        { lat: 12.426470, lng: 75.059800 },
        { lat: 12.426450, lng: 75.059900 },
        { lat: 12.426430, lng: 75.060000 },
        { lat: 12.426410, lng: 75.060100 },
        { lat: 12.426390, lng: 75.060200 },
        { lat: 12.426370, lng: 75.060300 },
    
        // ◀️ Return Path (mirroring the forward, slightly offset for realism)
        { lat: 12.426280, lng: 75.060200 },
        { lat: 12.426190, lng: 75.060100 },
        { lat: 12.426100, lng: 75.060000 },
        { lat: 12.426010, lng: 75.059900 },
        { lat: 12.425920, lng: 75.059800 },
        { lat: 12.425830, lng: 75.059700 },
        { lat: 12.425740, lng: 75.059600 },
        { lat: 12.425650, lng: 75.059500 },
        { lat: 12.425560, lng: 75.059400 },
        { lat: 12.425470, lng: 75.059300 },
        { lat: 12.425380, lng: 75.059200 },
        { lat: 12.425290, lng: 75.059100 },
        { lat: 12.425200, lng: 75.059000 },
        { lat: 12.425110, lng: 75.058900 },
        { lat: 12.425020, lng: 75.058800 },
        { lat: 12.424930, lng: 75.058700 },
        { lat: 12.424840, lng: 75.058600 },
        { lat: 12.424750, lng: 75.058500 },
        { lat: 12.424660, lng: 75.058400 },
        { lat: 12.424570, lng: 75.058300 },
        { lat: 12.424480, lng: 75.058200 },
        { lat: 12.424390, lng: 75.058100 },
        { lat: 12.424300, lng: 75.058000 },
        { lat: 12.424210, lng: 75.057900 },
        { lat: 12.424120, lng: 75.057800 },
        { lat: 12.424030, lng: 75.057700 },
        { lat: 12.423940, lng: 75.057600 },
        { lat: 12.423850, lng: 75.057500 },
        { lat: 12.423760, lng: 75.057400 },
        { lat: 12.423670, lng: 75.057300 },
        { lat: 12.423580, lng: 75.057200 },
        { lat: 12.423490, lng: 75.057100 },
        { lat: 12.423400, lng: 75.057000 },
        { lat: 12.423310, lng: 75.056900 },
        { lat: 12.423220, lng: 75.056800 }
    ];
    
    

    let index = 0;
    function sendNext() {
        if (index >= testPath.length) {
            index = 0; // loop for continuous simulation
        }

        const { lat, lng } = testPath[index];
        const fakeTimestamp = {
            toDate: () => new Date()
        };

        updateMap(lat, lng, fakeTimestamp);

        index++;
        setTimeout(sendNext, 1000); // simulate update every 3s
    }

    sendNext();
}

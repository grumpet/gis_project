import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import './App.css'; // Import the custom CSS

// Fix marker icons issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom red marker icon
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Function to calculate the distance between two coordinates using the Haversine formula
const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;

  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
};

// Function to calculate the midpoint between two coordinates
const midpoint = (coords1, coords2) => {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const midLat = (lat1 + lat2) / 2;
  const midLon = (lon1 + lon2) / 2;

  return [midLat, midLon];
};

// Custom component to display distance at the midpoint
const DistanceDisplay = ({ position, distance }) => {
  const map = useMap();

  useEffect(() => {
    const divIcon = L.divIcon({
      className: 'distance-display',
      html: `<div style="background-color: white; padding: 15px; border-radius: 30px; border: 2px solid black; font-size: 10px; text-align: center; display: flex; justify-content: center; align-items: center;">${distance.toFixed(2)} km</div>`,
    });

    const marker = L.marker(position, { icon: divIcon }).addTo(map);

    return () => {
      map.removeLayer(marker);
    };
  }, [map, position, distance]);

  return null;
};

function App() {
  // Default locations
  const [gpsPosition, setGpsPosition] = useState([32.0853, 34.7818]);  // Tel Aviv
  const [ipPosition, setIpPosition] = useState([32.0853, 34.7818]);  // Default fallback
  const [ipInfo, setIpInfo] = useState({ ip: '', org: '' }); // Additional IP info

  // Get GPS-based location
  useEffect(() => {
    console.log("Fetching GPS Location...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log("GPS Location:", latitude, longitude);
          setGpsPosition([latitude, longitude]);
        },
        (err) => {
          console.error("GPS Error:", err);
          alert("Could not get GPS location.");
        }
      );
    } else {
      alert("Geolocation not supported by your browser.");
    }
  }, []);

  // Get IP-based location
  useEffect(() => {
    console.log("Fetching IP Location...");
    axios.get('https://ipapi.co/json/')
      .then((response) => {
        console.log("IP API Response:", response.data); // Log the full API response
        const { latitude, longitude, ip, org } = response.data;
        console.log("IP Location:", latitude, longitude);
        setIpPosition([latitude, longitude]);
        setIpInfo({ ip, org }); // Set additional IP info
      })
      .catch((error) => {
        console.error("IP Location Error:", error);
      });
  }, []);

  // Calculate the distance between GPS and IP positions
  const distance = haversineDistance(gpsPosition, ipPosition);

  // Calculate the midpoint between GPS and IP positions
  const midPoint = midpoint(gpsPosition, ipPosition);

  // Function to show alert with website information
  const showInfo = () => {
    alert(
      "This website provides the following features:\n\n" +
      "• Displays your current location based on GPS coordinates.\n" +
      "• Shows your approximate location based on your IP address.\n" +
      "• Draws a line connecting the GPS and IP locations on the map.\n" +
      "• Provides information about your IP address and organization.\n\n" +
      "For the best experience:\n" +
      "• Use Microsoft Edge as your browser.\n" +
      "• Ensure your PC's GPS is turned on.\n" +
      "• If one of the markers is not visible, refresh your browser."
    );
  };

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      <MapContainer center={gpsPosition} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* GPS Location Marker */}
        <Marker position={gpsPosition} icon={redIcon}>
          <Popup className="custom-popup">
            GPS Location: <br />
            {gpsPosition[0].toFixed(4)}, {gpsPosition[1].toFixed(4)}
          </Popup>
        </Marker>

        {/* IP Location Marker */}
        <Marker position={ipPosition}>
          <Popup>
            IP Location: {ipPosition[0].toFixed(4)}, {ipPosition[1].toFixed(4)} <br />
            IP: {ipInfo.ip} <br />
            Organization: {ipInfo.org}
          </Popup>
        </Marker>

        {/* Polyline between GPS and IP locations */}
        <Polyline positions={[gpsPosition, ipPosition]} color="blue" />

        {/* Display the distance at the midpoint */}
        <DistanceDisplay position={midPoint} distance={distance} />
      </MapContainer>

      {/* Static Button at the Bottom Left */}
      <button
        onClick={showInfo}
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          zIndex: 10000 // Ensure the button is above other elements
        }}
      >
        About This Website
      </button>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from "react";
import { Map, Marker, GoogleApiWrapper } from "google-maps-react";
import "./Map.css";
import { apiKey } from "../config.js";


const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // Center of India

const GoogleMap = ({ google }) => {
  const [searchValue, setSearchValue] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState({});
  const [searchResults, setSearchResults] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [pincodeSearchValue, setPincodeSearchValue] = useState("");
  const [markers, setMarkers] = useState([]);

  const onSearchInputChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);

    if (value.trim() !== "") {
      // Use Google Places Autocomplete API to fetch suggestions
      const autocompleteService = new google.maps.places.AutocompleteService();
      const request = {
        input: value,
        componentRestrictions: { country: "in" },
      };

      autocompleteService.getPlacePredictions(
        request,
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            setAutocompleteResults(predictions);
          } else {
            setAutocompleteResults([]);
          }
        }
      );
    } else {
      setAutocompleteResults([]);
    }
  };
  const onPincodeSearchInputChange = (event) => {
    const value = event.target.value;
    setPincodeSearchValue(value);
  };

  // Function to fetch detailed place information using place_id
  const fetchPlaceDetails = (placeId) => {
    const service = new google.maps.places.PlacesService(
      document.createElement("div")
    );
    const request = { placeId: placeId };

    return new Promise((resolve, reject) => {
      service.getDetails(request, (placeResult, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(placeResult);
        } else {
          reject(new Error("Error fetching place details"));
        }
      });
    });
  };

  const onLocationSelect = (place) => {
    setSearchValue(place.description);
    setAutocompleteResults([]);

    // Fetch detailed place information using the place_id
    fetchPlaceDetails(place.place_id)
      .then((placeResult) => {
        setSelectedLocation(placeResult);
      })
      .catch((error) => {
        console.error(error);
        setSelectedLocation(null);
      });
  };

  const onSearchButtonClick = () => {
    if (selectedLocation && selectedLocation.place_id) {
      // Perform a Places API search based on the selected location
      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );

      // Rest of the code to handle the Places API search and display results...
    }
  };

  const onFindNearestButtonClick = (type) => {
    if (selectedLocation && selectedLocation.geometry) {
      setSelectedType(type);
    }
  };

  const findNearestPlaces = (type) => {
    if (selectedLocation && selectedLocation.geometry) {
      setSelectedType(type);

      // Get the location of the selected place
      const location = selectedLocation.geometry.location;

      // Create a PlacesService object to interact with the Places API
      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );

      // Define the request parameters to find the nearest places based on the selected type
      const request = {
        location: location,
        radius: 20000, // Set the search radius to 20 kilometers (20,000 meters)
        type: [type],
      };

      // Perform the places search to get the nearest places
      service.nearbySearch(request, handleNearestResults);
    }
  };
  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const degToRad = (degrees) => (degrees * Math.PI) / 180;
    const earthRadiusKm = 6371; // Earth's radius in kilometers

    const dLat = degToRad(lat2 - lat1);
    const dLon = degToRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(degToRad(lat1)) *
        Math.cos(degToRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusKm * c;

    return distance;
  };

  const handleNearestResults = (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      const location = selectedLocation.geometry.location;
      const nearestResultsWithDistance = results.map((result) => {
        const placeLocation = result.geometry.location;
        const distance = getDistanceInKm(
          location.lat(),
          location.lng(),
          placeLocation.lat(),
          placeLocation.lng()
        );
        // Convert distance to kilometers (rounded to two decimal places)
        const distanceInKm = distance.toFixed(2);
        return { ...result, distance: distanceInKm };
      });
      setSearchResults(nearestResultsWithDistance);
    } else {
      console.error("Error fetching nearest places: ", status);
      setSearchResults(null);
      setMarkers([]); // Clear markers if there are no search results
    }
  };

  const onSearchFromPincodeButtonClick = () => {
    if (pincodeSearchValue.trim() !== "") {
      // Use Google Geocoding API to fetch location details from the pincode
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        {
          address: pincodeSearchValue,
          componentRestrictions: { country: "IN" },
        },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
            const location = results[0].geometry.location;
            const placeResult = {
              geometry: { location: location },
              name: `Location with Pincode ${pincodeSearchValue}`,
              formatted_address: results[0].formatted_address,
            };
            setSelectedLocation(placeResult);
            setPincodeSearchValue("");
          } else {
            console.error("Error fetching location from pincode: ", status);
            setSelectedLocation(null);
          }
        }
      );
    }
  };

  return (
    <>
      <div className="search-container">
        {/* Search input with autocomplete */}
        <input
          type="text"
          value={searchValue}
          onChange={onSearchInputChange}
          placeholder="Search for a location in India..."
          className="search-input"
        />
        {autocompleteResults.length > 0 && (
          <ul className="autocomplete-list">
            {autocompleteResults.map((result) => (
              <li
                key={result.place_id}
                onClick={() => onLocationSelect(result)}
                className="autocomplete-item"
              >
                {result.description}
              </li>
            ))}
          </ul>
        )}
        <button onClick={onSearchButtonClick} className="search-button">
          Search
        </button>
        <input
          type="text"
          value={pincodeSearchValue}
          onChange={onPincodeSearchInputChange}
          placeholder="Search by Pincode..."
          className="search-input"
        />
        <button
          onClick={onSearchFromPincodeButtonClick}
          className="search-button"
        >
          Search by Pincode
        </button>
      </div>

      {/* Display the map */}
      {selectedLocation && selectedLocation.geometry ? (
        <Map
          google={google}
          initialCenter={defaultCenter}
          center={{
            lat: selectedLocation.geometry.location.lat(),
            lng: selectedLocation.geometry.location.lng(),
          }}
          zoom={14}
          className="google-map"
        >
          <Marker
            position={{
              lat: selectedLocation.geometry.location.lat(),
              lng: selectedLocation.geometry.location.lng(),
            }}
          />
          {markers.map((marker, index) => (
            <Marker key={index} position={marker.position} name={marker.name} />
          ))}
        </Map>
      ) : (
        <p>No location selected or location details not available.</p>
      )}

      {/* Nearest location buttons */}
      <div>
        {selectedLocation && selectedLocation.geometry && (
          <div className="nearest-buttons-container">
            <button onClick={() => findNearestPlaces("school")}>
              Find Nearest School
            </button>
            <button onClick={() => findNearestPlaces("hospital")}>
              Find Nearest Hospital
            </button>
            <button onClick={() => findNearestPlaces("park")}>
              Find Nearest Park
            </button>
            <button onClick={() => findNearestPlaces("shopping_mall")}>
              Find Nearest Shopping Mall
            </button>
            <button onClick={() => findNearestPlaces("subway_station")}>
              Find Nearest Metro Station
            </button>
            <button onClick={() => findNearestPlaces("train_station")}>
              Find Nearest Railway Station
            </button>
          </div>
        )}
      </div>
      {/* Display search results */}
      <div>
        {searchResults && (
          <div className="nearest-places-container">
            <h2>
              Nearest{" "}
              {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
            </h2>
            <ul>
              {searchResults.map((result) => (
                <li key={result.place_id}>
                  {result.name} - {result.distance} km away
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default GoogleApiWrapper({
  apiKey: apiKey,
})(GoogleMap);

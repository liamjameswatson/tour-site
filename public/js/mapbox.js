export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibGlhbWp3YXN0b24iLCJhIjoiY2xocnE5dmJvMHR0ODNqbzg1eDlwMmZ4MyJ9.tKOeD3S8ZqLJMwU0aa75Jg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/liamjwaston/clhs1oqry01zl01png17g3nyx',
    scrollZoom: false,
    // center: [-0.47853, 51.748834],
    // zoom: 15,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds(); //area displayed on map

  locations.forEach((location) => {
    // Create marker for map
    const el = document.createElement('div');
    el.className = 'marker';

    // Add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(location.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })

      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
      .addTo(map);

    // Extend map bounds to include the current location
    bounds.extend(location.coordinates);
  });

  // fit map to bounds object
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 100,
      left: 100,
      right: 100,
    },
  });
};

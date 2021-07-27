mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/outdoors-v11', // stylesheet location
  center: book.geometry.coordinates, // starting position [lng, lat]
  zoom: 8, // starting zoom
});

const marker = new mapboxgl.Marker()
  .setLngLat(book.geometry.coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<h5 class="mb-0">${book.title}</h5><p class="mb-0">${book.location}</p>`
    )
  )
  .addTo(map);

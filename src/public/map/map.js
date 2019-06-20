var url = "./omraader_WGS84_Geographical.geojson";
d3.json(url, function(json) {
  console.log(json);
});

function buildMap(lat, lon, zoom) {
  mymap.setView([lat, lon], zoom);
  L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 19,
      id: "mapbox.streets",
      accessToken:
        "pk.eyJ1IjoicmdlbmdlbGwiLCJhIjoiY2p3b3c1M21rMGtjMzQzcTk3ZnU0MGxlMyJ9.1ZMDlrrQn98G5QgQVObfRg",
    }
  ).addTo(mymap);
}

function createHexGrid(bbox, cellsize) {
  const area = bbox;
  const cellSize = cellsize;
  const options = { units: "kilometers" };
  const grid = turf.hexGrid(area, cellSize, options);

  grid.features.forEach((cell, i) => {
    cell.properties.id = i;
  });

  return grid;
}

function displayPoints(points) {
  let circleLayer = new L.LayerGroup();
  circleLayer.addLayer(
    L.geoJSON(points, {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 50,
    })
  );

  circleLayer.addTo(mymap);
}

function spatialJoin(points, polygons) {
  return turf.tag(points, polygons, "pop", "population");
}

const colorScale = d3.scaleSequential(d3.interpolateInferno).domain([0, 100]);

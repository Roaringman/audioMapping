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
  let grid = turf.hexGrid(area, cellSize, options);

  const addID = function(feature, i) {
    return (feature.properties = { id: i });
  };
  grid.features.map(addID);
  return grid;
}

function displayPoints(points) {
  mymap.removeLayer(circleLayer);
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
  let collected = turf.collect(polygons, points, "level", "level");

  const addColor = function(feature) {
    if (feature.properties.level.length > 0) {
      const sum = feature.properties.level.reduce(function(
        accumulator,
        currentValue
      ) {
        return accumulator + currentValue;
      });
      const average = sum / feature.properties.level.length;

      return Object.assign(feature.properties, {
        soundLevel: average,
      });
    } else {
      return Object.assign(feature.properties, {
        soundLevel: "Not measured :(",
      });
    }
  };
  collected.features.map(addColor);

  return collected;
}

const colorScale = d3.scaleSequential(d3.interpolateWarm).domain([0, 50]);

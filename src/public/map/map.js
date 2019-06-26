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
  mymap.options.minZoom = 10;
  mymap.setMaxBounds(mymap.getBounds());
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

function addHexgridLayer(joinedPointPolyData) {
  if (this.hexGridLayer != null) {
    mymap.removeLayer(this.hexGridLayer);
  }
  hexGridLayer.addLayer(
    L.geoJSON(joinedPointPolyData, {
      style: function(feature) {
        if (feature.properties.soundLevel > 0) {
          return {
            color: colorScale(feature.properties.soundLevel),
            weight: 2,
            opacity: 1,
            fillOpacity: scale(feature.properties["level"].length),
          };
        } else {
          return {
            color: "d3d3d3",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.1,
          };
        }
      },
    }).bindPopup(function(layer) {
      return `The average sound level here is: ${
        layer.feature.properties.soundLevel
      } based on ${layer.feature.properties.level.length} observations`;
    })
  );
}

const colorScale = d3.scaleSequential(d3.interpolateWarm).domain([0, 100]);

const userIcon = L.divIcon({
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [10, 0],
  shadowSize: [0, 0],
  className: "animated-icon user-icon",
});

function showUserPosition(userPosition) {
  d3.selectAll(".animated-icon").remove();

  const marker = L.marker(userPosition, {
    icon: userIcon,
    title: "look at me!",
  });

  marker.addTo(mymap);
}

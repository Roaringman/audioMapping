let dataset = [[], [], [], [], [], [], [], [], [], []];
const h = 200;
const w = 200;
let count = 0;

function bins(data) {
  data.features.forEach(feature => {
    let index;
    if (typeof feature.properties.soundLevel != "number") {
      index = 0;
      dataset[index].push(feature.properties.soundLevel);
    } else {
      index = binIndex(feature.properties.soundLevel);
      dataset[index].push(feature.properties.soundLevel);
      count += 1;
    }
  });

  let svg = d3
    .select("#barGraph")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  svg
    .selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 200)
    .attr("height", (d, i) => {
      if (i > 0) {
        return (d.length / count) * 100;
      }
    })
    .attr("y", function(d, i) {
      return i * 66;
    })
    .attr("fill", d => colorScale(d[0]));
}

function binIndex(val) {
  let index;

  if (val < 10) {
    index = 1;
  } else {
    index = 2;
  }
  return index;
}

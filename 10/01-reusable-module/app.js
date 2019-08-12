function barChart() {
  let margin = {top: 10, right: 10, bottom: 10, left: 10}
  let width = 200;
  let height = 100;
  let x = d => d[0];
  let y = d => d[1];

  function chart(selection) {
    selection.each(function (data) {
      // Standardize the data representation.
      const standardData = data.map(d => [x(d), y(d)]);

      // Scales
      const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(standardData, d => d[0])])
        .range([0, width]);

      const yScale = d3
        .scaleBand()
        .domain(standardData.map(d => d[1]))
        .range([0, height])
        .padding(0.15);

      // Build chart base.
      let svg = d3
        .select(this)
        .selectAll('svg')
        .data([standardData]);

      const svgEnter = svg.enter().append('svg');

      svgEnter.append('g').attr('class', 'bar-chart');

      svg = svg.merge(svgEnter);

      // Set chart base dimensions.
      svg
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

      const g = svg
        .select('g.bar-chart')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      // Join functions.
      function onEnter(enter) {
        const barsEnter = enter
          .append('g')
          .attr('class', 'bar')
          .attr('transform', d => `translate(0, ${yScale(d[1])})`);

        barsEnter
          .append('rect')
          .attr('width', d => xScale(d[0]))
          .attr('height', yScale.bandwidth());

        barsEnter
          .append('text')
          .text(d => d[1])
          .attr('y', yScale.bandwidth() / 2)
          .attr('dx', '0.35em');

        return barsEnter;
      }

      function onUpdate(update) {
        const barsUpdate = update.attr(
          'transform',
          d => `translate(0, ${yScale(d[1])})`
        );

        barsUpdate
          .selectAll('rect')
          .attr('width', d => xScale(d[0]))
          .attr('height', yScale.bandwidth());

        barsUpdate
          .selectAll('text')
          .text(d => d[1])
          .attr('y', yScale.bandwidth() / 2)
          .attr('dx', '0.35em');

        return barsUpdate;
      }

      // Draw visual.
      g.selectAll('.bar')
        .data(standardData, d => d[1])
        .join(onEnter, onUpdate, exit => exit.remove());
    })
  }

  // Add configuration getter and setter methods
  chart.width = function (value) {
    // these two are equivalent
    return arguments.length ? ((width = value), chart) : width;
    // if (arguments.length) {
    //   width = value
    //   return chart
    // } else {
    //   return width
    // }
  }

  chart.height = function (value) {
    return arguments.length ? ((height = value), chart) : height;
  }
    
  chart.margin = function (value) {
    return arguments.length ? ((margin = value), chart) : margin;
  }

  chart.x = function (value) {
    return arguments.length ? ((x = value), chart) : x;
  }

  chart.y = function (value) {
    return arguments.length ? ((y = value), chart) : y;
  }

  return chart;
}

// Data.
const fox = [
  {
    studio: 'fox',
    title: 'Avatar',
    titleShort: 'Avatar',
    revenue: 2787965087,
  },
  {
    studio: 'fox',
    title: 'Ice Age: Dawn of the Dinosaurs',
    titleShort: 'Ice Age 3',
    revenue: 887739201,
  },
  {
    studio: 'fox',
    title: 'Ice Age: The Meltdown',
    titleShort: 'Ice Age 2',
    revenue: 714361864,
  },
];

const disney = [
  {
    studio: 'disney',
    title: "Pirates of the Caribbean: Dead Man's Chest",
    titleShort: 'Pirates 2',
    revenue: 1134195026,
  },
  {
    studio: 'disney',
    title: "Pirates of the Caribbean: At World's End",
    titleShort: 'Pirates 3',
    revenue: 997970603,
  },
  {
    studio: 'disney',
    title: 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe',
    titleShort: 'Narnia 1',
    revenue: 821667244,
  },
];

// Configure chart.
const myBarChart = barChart()
  .x(d => d.revenue)
  .y(d => d.titleShort)

// Draw chart.
d3.select('.container')
  .datum(fox)
  .call(myBarChart)

// Toggle interaction
let toggle = false
function click () {
  if (!toggle) {
    // myBarChart.width(400)

    d3.select('.container')
      .datum(disney)
      .call(myBarChart)
  } else {
    // myBarChart.width(200)

    d3.select('.container')
      .datum(fox)
      .call(myBarChart)
  }
  toggle = !toggle
}

d3.select('button').on('click', click)
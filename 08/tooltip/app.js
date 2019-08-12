// Type conversion
const parseDate = string => d3.utcParse('%Y-%m-%d')(string);
const parseNA = string => (string === 'NA' ? undefined : string);

function type(d) {
  const date = parseDate(d.release_date);

  return {
    budget: +d.budget,
    genre: parseNA(d.genre),
    genres: JSON.parse(d.genres).map(d => d.name),
    homepage: parseNA(d.homepage),
    id: +d.id,
    imdb_id: parseNA(d.imdb_id),
    original_language: parseNA(d.original_language),
    overview: parseNA(d.overview),
    popularity: +d.popularity,
    poster_path: parseNA(d.poster_path),
    production_countries: JSON.parse(d.production_countries),
    release_date: date,
    release_year: date.getFullYear(),
    revenue: +d.revenue,
    runtime: +d.runtime,
    tagline: parseNA(d.tagline),
    title: parseNA(d.title),
    vote_average: +d.vote_average,
    vote_count: +d.vote_count,
  };
}

// Data utilities,
function filterData(data) {
  return data.filter(d => {
    return (
      d.release_year > 1999 &&
      d.release_year < 2010 &&
      d.revenue > 0 &&
      d.budget > 0 &&
      d.genre &&
      d.title
    );
  });
}

// Drawing utilities.
function formatTicks(d) {
  return d3
    .format('.2~s')(d)
    .replace('M', ' mil')
    .replace('G', ' bil')
    .replace('T', ' tril');
}

function cutText(string) {
  return string.length < 35 ? string : string.substring(0, 35) + '...';
}

// Tooltip handler
function mouseover () {

  const barData = d3.select(this).data()[0];
  const bodyData = [
    ['Budget', formatTicks(barData.budget)],
    ['Revenue', formatTicks(barData.revenue)],
    ['Profit', formatTicks(barData.revenue - barData.budget)],
    ['TMDb Popularity', Math.round(barData.popularity)],
    ['IMDB Rating', barData.vote_average],
    ['Genres', barData.genres.join(', ')],
  ]

  const tip = d3.select('.tooltip')

  tip
    .style('left', `${d3.event.clientX + 15}px`)
    .style('top', `${d3.event.clientY}px`)
    .transition()
    .style('opacity', '0.98')
  
  tip.select('h3').html(`${barData.title}, ${barData.release_year}`);
  tip.select('h4').html(`${barData.tagline}, ${barData.runtime} min.`);

  d3
    .select('.tip-body')
    .selectAll('p')
    .data(bodyData)
    .join('p')
    .attr('class', 'tip-info')
    .html(d => `${d[0]}: ${d[1]}`);
}

function mousemove () {
  d3.select('.tooltip')
    .style('left', `${d3.event.clientX + 15}px`)
    .style('top', `${d3.event.clientY}px`)
}

function mouseout () {
  d3.select('.tooltip')
    .transition()
    .style('opacity', 0)
}

// Main function.
function ready(movies) {
  let metric = 'revenue';

  // Click handler.
  function click() {
    metric = this.dataset.name;

    const updatedData = moviesClean
      .sort((a, b) => b[metric] - a[metric])
      .filter((d, i) => i < 15);

    update(updatedData);
  }

  // General Update Pattern.
  function update(data) {
    // Update scales.
    xScale.domain([0, d3.max(data, d => d[metric])]);
    yScale.domain(data.map(d => cutText(d.title)));

    // Set up transition.
    const dur = 1000;
    const t = d3.transition().duration(dur);

    // Update bars.
    bars
      .selectAll('.bar')
      .data(data, d => d.title)
      .join(
        enter => {
          enter
            .append('rect')
            .attr('class', 'bar')
            .attr('y', d => yScale(cutText(d.title)))
            .attr('height', yScale.bandwidth())
            .style('fill', 'lightcyan')
            .transition(t)
            .delay((d, i) => i * 20)
            .attr('width', d => xScale(d[metric]))
            .style('fill', 'dodgerblue');
        },

        update => {
          update
            .transition(t)
            .delay((d, i) => i * 20)
            .attr('y', d => yScale(cutText(d.title)))
            .attr('width', d => xScale(d[metric]));
        },

        exit => {
          exit
            .transition()
            .duration(dur / 2)
            .style('fill-opacity', 0)
            .remove();
        }
      );

    // Update Axes.
    xAxisDraw.transition(t).call(xAxis.scale(xScale));
    yAxisDraw.transition(t).call(yAxis.scale(yScale));

    yAxisDraw.selectAll('text').attr('dx', '-0.6em');

    // Update header.
    headline.text(
      `Total ${metric} by title ${metric === 'popularity' ? '' : 'in $US'}`
    );

    // Add tooltip
    d3
      .selectAll('.bar')
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseout', mouseout)
  }

  // Data prep.
  const moviesClean = filterData(movies);

  // Margin convention.
  const margin = { top: 80, right: 40, bottom: 40, left: 200 };
  const width = 600 - margin.right - margin.left;
  const height = 500 - margin.top - margin.bottom;

  // Scales.
  const xScale = d3.scaleLinear().range([0, width]);

  const yScale = d3
    .scaleBand()
    .rangeRound([0, height])
    .paddingInner(0.25);

  // Draw base.
  const svg = d3
    .select('.bar-chart-container')
    .append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Draw header.
  const header = svg
    .append('g')
    .attr('class', 'bar-header')
    .attr('transform', `translate(0,${-margin.top * 0.6})`)
    .append('text');

  const headline = header.append('tspan');

  header
    .append('tspan')
    .attr('x', 0)
    .attr('dy', '1.5em')
    .style('font-size', '0.8em')
    .style('fill', '#555')
    .text('Top 15 films, 2000-2009');

  // Draw Bars.
  const bars = svg.append('g').attr('class', 'bars');

  // Draw x axis.
  const xAxis = d3
    .axisTop(xScale)
    .ticks(5)
    .tickFormat(formatTicks)
    .tickSizeInner(-height)
    .tickSizeOuter(0);

  const xAxisDraw = svg.append('g').attr('class', 'x axis');

  // Draw y axis.
  const yAxis = d3.axisLeft(yScale).tickSize(0);

  const yAxisDraw = svg.append('g').attr('class', 'y axis');

  // Initial bar render.
  const revenueData = moviesClean
    .sort((a, b) => b.revenue - a.revenue)
    .filter((d, i) => i < 15);

  update(revenueData);

  // Listen to click events.
  d3.selectAll('button').on('click', click);  
}

// Load data.
d3.csv('data/movies.csv', type).then(res => {
  ready(res);
});

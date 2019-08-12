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
    .format('~s')(d)
    .replace('M', ' mil')
    .replace('G', ' bil')
    .replace('T', ' tril');
}

function cutText (string) {
  return string.length < 35 ? string : string.substring(0, 35) + '...';
}

// Main function.
function ready(movies) {
  let metric = 'revenue'

  function click () {
    metric = this.dataset.name
    
    const updatedData = moviesClean
      .sort((a, b) => b[metric] - a[metric])
      .filter((d, i) => i < 15);

    update(updatedData)
  }

  // General update pattern
  function update(data) {

    // Updated Scales
    xScale.domain([0, d3.max(data, d => d[metric])])
    yScale.domain(data.map(d => cutText(d.title)))

    // Set up transition
    const dur = 1000;
    const t = d3.transition().duration(dur)

    // Updated bars.
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
            .style('fill', 'dodgerblue')
        },

        update => update
          .transition(t)
          .delay((d, i) => i * 20)
          .attr('y', d => yScale(cutText(d.title)))
          .attr('width', d => xScale(d[metric])),

        exit => 
          exit
            .transition()
            .duration(dur / 2)
            .style('fill-opacity', 0)
            .remove()
      )

      // Updated Axis.
      xAxisDraw.transition(t).call(xAxis.scale(xScale))
      yAxisDraw.transition(t).call(yAxis.scale(yScale))

      yAxisDraw.selectAll('text').attr('dx', '-0.6em')

      headline.text(`Total ${metric} by title ${metric === 'popularity' ? '' : 'in $US'}`)
  }

  function textSize(text) {
    if (!d3) return;
    var container = d3.select('body').append('svg');
    container
      .append('text')
      .attr('x', -99999)
      .attr('y', -99999)
      .text(text)
    var size =  container.node().getBBox();
    container.remove();
    return { width: size.width, height: size.height };
  }

  // Data prep.
  const moviesClean = filterData(movies);

  const revenueData = moviesClean
    .sort((a, b) => b.revenue - a.revenue)
    .filter((d, i) => i < 15);

  // const measured = revenueData.map(movie => {
  //   return {
  //     title: movie.title,
  //     pixelLength: textSize(movie.title).width
  //   }
  // })
  // debugger;

  // Margin convention.
  const margin = { top: 80, right: 40, bottom: 40, left: 200 };
  const width = 600 - margin.right - margin.left;
  const height = 500 - margin.top - margin.bottom;

  // Scales.
  const xScale = d3
    .scaleLinear()
    .range([0, width]);

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

  const headline = header.append('tspan').text('Total revenue by genre in $US');

  header
    .append('tspan')
    .attr('x', 0)
    .attr('dy', '1.5em')
    .style('font-size', '0.8em')
    .style('fill', '#555')
    .text('Top 15 films, 2000-2009');

  // Draw Bars.
  const bars = svg
    .append('g')
    .attr('class', 'bars');
  
  // Draw x axis.
  const xAxis = d3
    .axisTop(xScale)
    .ticks(5)
    .tickFormat(formatTicks)
    .tickSizeInner(-height)
    .tickSizeOuter(0);

  const xAxisDraw = svg
    .append('g')
    .attr('class', 'x axis')

  // Draw y axis.
  const yAxis = d3.axisLeft(yScale).tickSize(0);

  const yAxisDraw = svg
    .append('g')
    .attr('class', 'y axis')

  // Initial bar chart render
  update(revenueData)

  // Listen to click events
  d3.selectAll('button').on('click', click)
}

// Load data.
d3.csv('data/movies.csv', type).then(res => {
  ready(res);
});

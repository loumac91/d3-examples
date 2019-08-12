// converts strings that are 'NA' to undefined type
const parseNA = string => (string === 'NA' ? undefined : string);
const parseDate = string => d3.timeParse('%Y-%m-%d')(string); // 2001-01-31 is string param 

// Convert data types on load.
function type(d) {
    const date = parseDate(d.release_date);
    return {
        budget: +d.budget, // the + operator converts numeric variables to numeric types
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

// Data utilities
function filterData(data) {
    return data.filter(d => {
        return (
            d.release_year > 1999 &&
            d.release_year < 2010 &&
            d.revenue > 0 &&
            d.budget > 0 &&
            d.genre &&
            d.title
        )
    });
}

// Drawing utilities
function formatTicks(d) {
    return d3
        .format('~s')(d)
        .replace(/M/g, ' mil')
        .replace(/G/g, ' bil')
        .replace(/T/g, ' tril');
}

function prepareBarChartData(data) {
    // d3.rollup
    const dataMap = d3.rollup(
        data,
        v => d3.sum(v, leaf => leaf.revenue),
        d => d.genre
    )

    // d3 likes its data in arrays of objects, not maps
    const dataArray = Array.from(dataMap, d => ({ genre: d[0], revenue: d[1]}));

    const sorted = dataArray.sort((a, b) => {
        return d3.descending(a.revenue, b.revenue);
    })

    return sorted
}

// Main function.
function ready(movies) {
    const moviesClean = filterData(movies);
    const barChartData = prepareBarChartData(moviesClean);

    // https://bl.ocks.org/mbostock/3019563

    // Margin convention
    // top is 40 without header **
    const margin = { top: 80, right: 40, bottom: 40, left: 80 };
    const width = 400 - margin.right - margin.left;
    const height = 500 - margin.top - margin.bottom;
    
    // Scales - map your data value to your screen space
    // Domain is data value
    // Range is pixel screen space

    // Min and max values [min, max]
    const xMax = d3.max(barChartData, d => d.revenue);
    const xDomain = [0, xMax];
    const xRange = [0, width];

    // scales are functions that take a value and return the pixel length
    const xScale = d3.scaleLinear(xDomain, xRange);

    const yScale = d3.scaleBand()
                     .domain(barChartData.map(d => d.genre))
                     .rangeRound([0, height])
                     .paddingInner(0.25);

    // Draw base
    const svg = d3.select('.bar-chart-container')
                  .append('svg')
                  .attr('width', width + margin.left + margin.right)
                  .attr('height', height + margin.top + margin.bottom)
                  .append('g')
                  .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Draw header - NOTE its preferrable to do this outside of the svg element if possible
    const header = svg
        .append('g')
        .attr('class', 'bar-header')
        .attr('transform', `translate(0,${-margin.top * 0.6})`)
        .append('text');

    // Headline
    header.append('tspan').text('Total revenue by genre in $US');

    // Subheadline
    header
        .append('tspan')
        .attr('x', 0) //pulls it onto new line
        .attr('dy', '1.5em')
        .style('font-size', '0.8em')
        .style('fill', '#555')
        .text('Films w/ budget and revenue figures, 2000-2009')

    // Draw bars.
    // note that .bar wont exist yet in the DOM but will be created by selectAll if they don't exist
    const bars = svg
     .selectAll('.bar')
     .data(barChartData)
     .enter()
     .append('rect')
     .attr('class', 'bar')
     .attr('y', d => yScale(d.genre))
     .attr('width', d => xScale(d.revenue))
     .attr('height', yScale.bandwidth())
     .style('fill', 'dodgerblue');

    // Draw axis.
    const xAxis = d3
     .axisTop(xScale)
     .tickFormat(formatTicks)
     .tickSizeInner(-height)
     .tickSizeOuter(0);

    const xAxisDraw = svg.append('g').attr('class', 'x axis').call(xAxis);

    const yAxis = d3.axisLeft(yScale).tickSize(0);
    const yAxisDraw = svg
        .append('g')
        .attr('class', 'y axis')
        .call(yAxis);

    // text distance to the axis
    yAxisDraw.selectAll('text').attr('dx', '-0.6em');
}

// Load data
d3.csv('data/movies.csv', type).then(res => {
    ready(res)
});

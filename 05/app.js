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

function prepareScatterData(data) {
    return data.sort((a, b) => b.budget - a.budget).filter((d, i) => i < 100);
}

// Main function.
function ready(movies) {
    // Data prep
    const moviesClean = filterData(movies);
    const scatterData = prepareScatterData(moviesClean);

    // Dimensions
    const margin = { top: 80, right: 40, bottom: 40, left: 60 };
    const width = 500 - margin.right - margin.left;
    const height = 500 - margin.top - margin.bottom;
    
    // Scales
    // decrease min value by 5% and increase max value by 5%
    // this is to ensure values are not flush with any axis
    const xExtent = 
        d3.extent(scatterData, d => d.budget)
        .map((d, i) => i === 0 ? d * 0.95 : d * 1.05);
    
    const xScale = d3
        .scaleLinear()
        .domain(xExtent)
        .range([0, width])
    
    const yExtent = 
        d3.extent(scatterData, d => d.revenue)
        .map((d, i) => i === 0 ? d * 0.1 : d * 1.1);    
    const yScale = d3
        .scaleLinear()
        .domain(yExtent)
        .range([height, 0])

    // Draw base
    const svg = d3
        .select('.scatter-plot-container')                  
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
    header.append('tspan').text('Budget vs. Revenue in $US');

    // Subheadline
    header
        .append('tspan')
        .attr('x', 0) //pulls it onto new line
        .attr('dy', '1.5em')
        .style('font-size', '0.8em')
        .style('fill', '#555')
        .text('Top 100 Films by budget, 2000-2009')

    // Draw x axis
    const xAxis = d3
        .axisBottom(xScale)
        .ticks(5)
        .tickFormat(formatTicks)
        .tickSizeInner(-height)
        .tickSizeOuter(0)

    function addLabel(axis, label, x) {
        axis
            .selectAll('.tick:last-of-type text')
            .clone()
            .text(label)
            .attr('x', x)
            .style('text-anchor', 'start')
            .style('font-weight', 'bold')
            .style('fill', '#555')
    }

    const xAxisDraw = svg
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis)
        .call(addLabel, 'Budget', 25)

    xAxisDraw.selectAll('text').attr('dy', '1em')

    // Draw y axis
    const yAxis = d3
        .axisLeft(yScale)
        .ticks(5)
        .tickFormat(formatTicks)
        .tickSizeInner(-height)
        .tickSizeOuter(0)

    const yAxisDraw = svg
        .append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .call(addLabel, 'Revenue', 5)

    // Draw scatter
    const scatter = svg
        .append('g')
        .attr('class', 'scatter-points')
        .selectAll('.scatter')
        .data(scatterData)
        .enter()
        .append('circle')
        .attr('class', 'scatter')
        .attr('cx', d => xScale(d.budget))
        .attr('cy', d => yScale(d.revenue))
        .attr('r', 3)
        .style('fill', 'dodgerblue')
        .style('fill-opacity', 0.7)
}

// Load data
d3.csv('data/movies.csv', type).then(res => {
    ready(res)
});

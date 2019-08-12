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

function prepareLineChartData(data) {
    // Group by year and extract revenue and budget.
    const groupBy = d => d.release_year;
    const reduceRevenue = values => d3.sum(values, leaf => leaf.revenue);
    const revenueMap = d3.rollup(data, reduceRevenue, groupBy);
    const reduceBudget = values => d3.sum(values, leaf => leaf.budget);
    const budgetMap = d3.rollup(data, reduceBudget, groupBy);

    // Convert rolled up maps to to arrays.
    const revenue = Array.from(revenueMap).sort((a, b) => a[0] - b[0]);
    const budget = Array.from(budgetMap).sort((a, b) => a[0] - b[0]);
  
    // Get an array of years our x scale and axis.
    const parseYear = d3.timeParse('%Y');
    const dates = revenue.map(d => parseYear(d[0]));
  
    // While we're at it, get the maximum y value for the y scale and axis.
    const yValues = [
      ...Array.from(revenueMap.values()),
      ...Array.from(budgetMap.values()),
    ];
    const yMax = d3.max(yValues);
  
    // Produce final data object.
    const lineData = {
      series: [
        {
          name: 'Revenue',
          color: 'dodgerblue',
          values: revenue.map(d => ({ date: parseYear(d[0]), value: d[1] })),
        },
        {
          name: 'Budget',
          color: 'darkorange',
          values: budget.map(d => ({ date: parseYear(d[0]), value: d[1] })),
        },
      ],
      dates: dates,
      yMax: yMax,
    };
  
    return lineData;
  }

// Main function.
function ready(movies) {
    // Data prep
    const moviesClean = filterData(movies);
    const lineChartData = prepareLineChartData(moviesClean)

    // Dimensions
    const margin = { top: 80, right: 60, bottom: 40, left: 60 };
    const width = 500 - margin.right - margin.left;
    const height = 500 - margin.top - margin.bottom;
    
    // Scales
    const xScale = d3
        .scaleTime()
        .domain(d3.extent(lineChartData.dates))
        .range([0, width])

    const yScale = d3
        .scaleLinear()
        .domain([0, lineChartData.yMax])
        .range([height, 0])

    const lineGen = d3
        .line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value))

    // Draw base
    const svg = d3
        .select('.line-chart-container')                  
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Draw x axis
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0)
    
    const xAxisDraw = svg
        .append('g')
        .attr('transform', `translate(0, ${height})`)
        .attr('class', 'x axis')
        .call(xAxis)

    // Draw y axis
    const yAxis = d3
        .axisLeft(yScale)
        .ticks(5)
        .tickFormat(formatTicks)
        .tickSizeOuter(0)
        .tickSizeInner(-width)
    
    const yAxisDraw = svg
        .append('g')
        .attr('class', 'y axis')
        .call(yAxis)

    // Draw lines
    const chartGroup = svg
        .append('g')
        .attr('class', 'line-chart')

    chartGroup
        .selectAll('.line-series')
        .data(lineChartData.series)
        .enter()
        .append('path')
        .attr('class', d => `line-series ${d.name.toLowerCase()}`)
        .attr('d', d => lineGen(d.values))
        .style('fill', 'none')
        .style('stroke', d => d.color)

    // Add series label
    chartGroup
        .append('g')
        .attr('class', 'series-labels')
        .selectAll('.series-label')
        .data(lineChartData.series) // Create as many labels as there are series i.e. 2
        .enter()
        .append('text')
        .attr('x', d => xScale(d.values[d.values.length - 1].date) + 5)
        .attr('y', d => yScale(d.values[d.values.length - 1].value))
        .text(d => d.name)
        .style('dominant-baseline', 'central')
        .style('font-size', '0.7em')
        .style('font-weight', 'bold')
        .style('fill', d => d.color);

    // Draw header
    const header = svg
        .append('g')
        .attr('class', 'line-header')
        .attr('transform', `translate(0,${-margin.top * 0.6})`)
        .append('text');

    // Headline
    header.append('tspan').text('Budget and Revenue  over time in $US');

    // Subheadline
    header
        .append('tspan')
        .attr('x', 0) //pulls it onto new line
        .attr('dy', '1.5em')
        .style('font-size', '0.8em')
        .style('fill', '#555')
        .text('Films w/ budget and revenue figures, 2000-2009')
}

// Load data
d3.csv('data/movies.csv', type).then(res => {
    ready(res)
});

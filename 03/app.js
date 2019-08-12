// d3.csv('data/harry_potter.csv').then(res => {
//     console.log('Local csv', res)
// });

// const potter = d3.csv('data/harry_potter.csv');
// const lotr = d3.csv('data/lord_of_the_rings.csv');

// Promise.all([potter, lotr]).then(res => {
//     console.log('array of arrays, ', res);
//     console.log('concatenated ', spreadArrays(res));
// })

// function spreadArrays(array) {
//     return array.reduce((r, a) => {
//         r.push(...a)
//         return r
//     }, [])
// }

// ---

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

function ready(movies) {
    const moviesClean = filterData(movies);
    const barChartData = prepareBarChartData(moviesClean);

    console.log(barChartData)
}

// converts strings that are 'NA' to undefined type
const parseNA = string => (string === 'NA' ? undefined : string);
const parseDate = string => d3.timeParse('%Y-%m-%d')(string); // 2001-01-31 is string param 

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

// Load data
d3.csv('data/movies.csv', type).then(res => {
    ready(res)
});
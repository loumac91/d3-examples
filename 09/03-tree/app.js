// Type conversion.
const parseStringNA = string => (string === 'NA' ? undefined : string);
const parseNumberNA = number => (number === 'NA' ? null : +number);

function type(d) {
  return {
    nodeID: +d.node_id,
    node: parseStringNA(d.node),
    parent: parseStringNA(d.parent),
    revenue: parseNumberNA(d.revenue),
    filmID: parseNumberNA(d.film_id),
  };
}

// Data utilities.
function getTopRevenueFilms(films, rank) {
  const topFilms = films
    .filter(d => d.filmID)
    .sort((a, b) => b.revenue - a.revenue)
    .filter((d, i) => i < rank);

  return [...films.filter(d => !d.filmID), ...topFilms];
}

// Main function.
function ready(movies) {
  // Filter top 50 films
  const topMovies = getTopRevenueFilms(movies, 50);

  // Set dimensions.
  const margin = { top: 40, right: 40, bottom: 40, left: 40 };
  const width = 700 - margin.right - margin.left;
  const height = 700 - margin.top - margin.bottom;

  // Stratify data into hierarchy.
  const stratify = d3
    .stratify()
    .id(d => d.node)
    .parentId(d => d.parent);

  const filmHierarchy = stratify(topMovies);

  // Sum and sort data.
  filmHierarchy
    .sum(d => d.revenue)
    .sort((a, b) => b.height - a.height || b.value - a.value);

  // Layout the data.
  const treeLayout = d3.tree().size([width, height]);

  treeLayout(filmHierarchy);

  // Flatten nodes and links.
  const nodeData = filmHierarchy.descendants();
  const linkData = filmHierarchy.links();

  // Draw base.
  const svg = d3
    .select('.tree-container')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const linkGenerator = d3
    .linkVertical()
    .x(d => d.x)
    .y(d => d.y)

  // Draw links.
  svg
    .selectAll('.link')
    .data(linkData)
    .join('path')
    .attr('class', 'link')
    .attr('d', d => linkGenerator(d))
    .attr('fill', 'none')
    .attr('stroke', '#bbb')

  // Draw nodes.
  svg
    .selectAll('.node')
    .data(nodeData)
    .join('circle')
    .attr('class', 'node')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', 5)
}

// Load data.
const moviesData = d3.csv('data/movies_relations.csv', type).then(res => {
  ready(res);
});

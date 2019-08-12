// Type conversion.
const parseStringNA = string => (string === 'NA' ? undefined : string);
const parseNumberNA = number => (number === 'NA' ? null : +number);
const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

function type(d) {
  return {
    nodeID: +d.node_id,
    node: parseStringNA(d.node),
    parent: parseStringNA(d.parent),
    revenue: parseNumberNA(d.revenue),
    filmID: parseNumberNA(d.film_id),
  };
}

// Drawing utilities.
function formatNumber(d) {
  return d3
    .format('.2~s')(d)
    .replace('M', ' mil')
    .replace('G', ' bil')
    .replace('T', ' tril');
}

// Main function.
function ready(movies) {
  // Set dimensions.
  const margin = { top: 40, right: 40, bottom: 40, left: 40 };
  const width = 680 - margin.right - margin.left;
  const height = 680 - margin.top - margin.bottom;

  // Stratify data into heirarchy
  const stratify = d3
    .stratify()
    .id(d => d.node)
    .parentId(d => d.parent)

  const filmHeirarchy = stratify(movies);

  // Sum up revenue and sort nodes
  filmHeirarchy
    .sum(d => d.revenue)
    .sort((a, b) => b.value - a.value)

  // Circle pack layout.
  const packLayout = d3.pack()
    .size([width, height])
    .padding(5)

  packLayout(filmHeirarchy)

  // Flatten nodes
  const nodes = filmHeirarchy.descendants();

  // Draw pack.
  const svg = d3
    .select('.circle-pack-container')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // Draw circle pack
  svg
    .selectAll('.node')
    .data(nodes)
    .join('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', d => d.r)
    .style('fill-opacity', d => {
      return d.children ? 0.05 : 0.7
    })
}

// Load data.
const moviesData = d3.csv('data/movies_relations.csv', type).then(res => {
  ready(res);
});

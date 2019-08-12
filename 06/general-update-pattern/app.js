function click () {
    const dataset = friends[this.dataset.name]
    update(dataset);
}

function update(data) {
    svg
        .selectAll('text')
        .data(data, d => d)
        .join(
            enter => enter
                .append('text')
                .text(d => d)
                .attr('x', -100)
                .attr('y', (d, i) => i * 30 + 50)
                .style('fill', 'dodgerblue')
                .call(enter =>
                    enter
                        .transition()
                        .attr('x', 30)
                ), //this block ensures that a selection is returned rather than a transition

            update => {
                // due to the braces, without an explicit return, this function returns undefined
                update
                .transition()
                .style('fill', 'gray')
                .attr('y', (d, i) => i * 30 + 50)
            },

            exit => {
                exit
                    .transition()
                    .attr('x', 150)
                    .style('fill', 'tomato')
                    .remove()
            }
        )
}

// Data
const friends = {
    biff: ['Apples', 'Oranges', 'Lemons'],
    chip: ['Apples', 'Oranges'],
    kipper: ['Apples', 'Cherries', 'Peaches', 'Oranges']
}

// Set up
const svg = d3.select('svg')

// Listen to clicks
d3.selectAll('button').on('click', click)


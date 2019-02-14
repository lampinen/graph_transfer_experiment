/**
An implementation of a few graphs and random walks over them in a javascript
framework
**/

// Python-like range runction
function range(start, end) { 
    if (end === undefined) {
        end = start;
        start = 0;
    }
    var result = [];
    for (var i = start; i < end; i++) { 
        result.push(i);
    }
    return result;
}

// Graphs /////////////////////////////////////////////////////////////////////
// Undirected graphs are represented by an adjacency list of lists, where each
// nodes list contains the higher numbered nodes it is adjacent to.


// generates a n-clique (fully-connected subgraph containing n nodes) starting
// from start_index.
function clique(n, start_index) {
    var edges = [];
    end_index = start_index + n; // end + 1, actually
    for (var i=start_index; i < end_index; i++) {
        edges.push(range(i+1, end_index));
    }
    return edges;
}


//3 almost 5-cliques (structure of Schapiro et al.)
function three_rooms() {
    var num_nodes = 15;
    this.name = "three_rooms";
    this.nodes = range(num_nodes);
    this.edges = [];
}

three_rooms.prototype.get_name = function() {
    return this.name;
}


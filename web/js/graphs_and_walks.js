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

// handles negative numbers in a better way for my use
function mod(n, m) {
  return ((n % m) + m) % m;
}

// Graphs /////////////////////////////////////////////////////////////////////
// Graphs are represented by an adjacency array of arrays, where each node's 
// array contains the nodes it is adjacent to.


// generates a n-clique (fully-connected subgraph containing n nodes) starting
// from start_index.
function clique(n, start_index) {
    var edges = [];
    var end_index = start_index + n; // end + 1, actually
    for (var i=start_index; i < end_index; i++) {
        edges.push(range(start_index, i).concat(range(i+1, end_index)));
    }
    return edges;
}


// 3 almost 5-cliques (structure of Schapiro et al.)
function three_rooms() {
    var num_nodes = 15;
    this.name = "three_rooms";
    this.nodes = range(num_nodes);
    this.edges = [];
    var this_clique;
    // rooms/almost cliques
    for (var i=0; i < 3; i++) {
        this_clique = clique(5, 5*i);
        this_clique[0].pop(); // no edge between entry nodes
        this_clique[4].shift(); // no edge between entry nodes
        this.edges = this.edges.concat(this_clique);
    }
    // room adjacencies
    this.edges[0].push(14);
    this.edges[14].push(0);
    this.edges[4].push(5);
    this.edges[5].push(4);
    this.edges[9].push(10);
    this.edges[10].push(9);
}

// Lattice (from Kahn et al. 2018) -- 5 three-cliques in a ring
function five_three_lattice() {
    var num_nodes = 15;
    this.name = "five_three_lattice";
    this.nodes = range(num_nodes);
    this.edges = [];
    var this_clique;
    var curr_index;
    for (var i=0; i < 5; i++) {
        this_clique = clique(3, 3*i);
        // now ring adjacencies
        for (var j=0; j < 3; j++){
            curr_index = i*3 + j;
            this_clique[j].push(mod(curr_index - 3, num_nodes))
            this_clique[j].push(mod(curr_index + 3, num_nodes))
        }
        this.edges = this.edges.concat(this_clique);
    }
}

// Ring (from Kahn et al. 2018) -- each node is connected to 4 nearest neighbors 
function ring() {
    var num_nodes = 15;
    this.name = "ring_15";
    this.nodes = range(num_nodes);
    this.edges = [];
    var curr_edges;
    for (var i=0; i < num_nodes; i++) {
        curr_edges = [
            mod(i - 2, num_nodes),
            mod(i - 1, num_nodes),
            mod(i + 1, num_nodes),
            mod(i + 2, num_nodes)
        ];
        this.edges.push(curr_edges);
    }
}

// Random graph generation with degree > 2 for all nodes
// Note this doesn't check num_edges for validity relative to degree constraint 
function random_graph(num_nodes, num_edges) {
    if (num_nodes === undefined) {
        num_nodes = 15;
    }
    if (num_edges === undefined) {
        num_edges = 30;
    }
    var min_deg = 2;
    this.name = "random_nodes_" + num_nodes + "_edges_" + num_edges;
    this.nodes = range(num_nodes);
    this.edges = [];
    for (var i=0; i < num_nodes; i++) {
        this.edges.push([]);
    }

    var proposed_location;
    var num_edges_here;
    var num_curr_edges = 0;
    var order = range(num_nodes); // Order of edge adding
    shuffle(order);
    var i;
    for (var ii=0; ii < num_nodes; ii++) {
        i = order[ii]; 
        num_edges_here = this.edges[i].length;
        for (var j=0; j < 2-num_edges_here; j++) {
            proposed_location = Math.floor(Math.random() * (num_nodes-1));
            if (proposed_location == i) {
                proposed_location = num_nodes - 1;
            }
            this.edges[i].push(proposed_location);
            this.edges[proposed_location].push(proposed_location);
            num_curr_edges++;
        }
    }

    while (num_curr_edges < num_edges) {
        // add a uniform random edge
        i = Math.floor(Math.random() * num_nodes);
        proposed_location = Math.floor(Math.random() * (num_nodes-1));
        if (proposed_location == i) {
            proposed_location = num_nodes - 1;
        }
        this.edges[i].push(proposed_location);
        this.edges[proposed_location].push(proposed_location);
        num_curr_edges++;
    }
}


// random walks
function random_walk(graph, length, start_location) {
    var edges = graph.edges;
    var num_nodes = edges.length;
    var walk = [];
    if (start_location === undefined) {
        // random start
        start_location = Math.floor(Math.random() * num_nodes); 
    }
    var curr_location = start_location 
    var adjacent;
    for (var t=0; t < length + 1; t++) {
        walk.push(curr_location);
        adjacent = edges[curr_location];
        curr_location = adjacent[Math.floor(Math.random() * adjacent.length)];
    }

    return walk;
}

// epsilon of the time, takes a uniform random transition
function noisy_random_walk(graph, length, epsilon, start_location) { 
    var edges = graph.edges;
    var num_nodes = edges.length;
    var walk = [];
    if (start_location === undefined) {
        // random start
        start_location = Math.floor(Math.random() * num_nodes); 
    }
    var curr_location = start_location 
    var proposed_location;
    var adjacent;
    for (var t=0; t < length + 1; t++) {
        walk.push(curr_location);
        if (Math.random() < epsilon) {
            proposed_location = Math.floor(Math.random() * (num_nodes-1));
            if (proposed_location == curr_location) {
                proposed_location = num_nodes - 1;
            }
            curr_location = proposed_location;
        } else {
            adjacent = edges[curr_location];
            curr_location = adjacent[Math.floor(Math.random() * adjacent.length)];
        }
    }

    return walk;
}

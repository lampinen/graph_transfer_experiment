# a port of my graphs_and_walks.js into python
# probably buggy and/or out of date
import numpy as np

def clique(n, start_index=0):
    edges = []
    end_index = start_index + n # end + 1, actually
    for i in range(start_index, end_index):
        edges.append(range(start_index, i) + range(i+1, end_index))
    
    return edges

# easoer than changing the code below
def mod(a, m): 
    return a % m


class graph(object):
    def __init__(self):
        self.name = "graph"
        self.nodes = []
        self.edges = []

    def get_full_dataset(self):
        num_nodes = len(self.nodes)
        x_data = []
        y_data = []
        for node_i, these_edges in enumerate(self.edges):
            for node_j in these_edges:
                this_x = np.zeros(num_nodes)
                this_x[node_i] = 1.
                x_data.append(this_x)
                this_y = np.zeros(num_nodes)
                this_y[node_j] = 1.
                y_data.append(this_y)

        return np.array(x_data), np.array(y_data)


# 3 almost 5-cliques (structure of Schapiro et al.)
class three_rooms(graph):
    def __init__(self):
        num_nodes = 15
        self.name = "three_rooms"
        self.nodes = range(num_nodes)
        self.edges = []
        # rooms/almost cliques
        for i in range(3):
            this_clique = clique(5, 5*i)
            this_clique[0].pop() # no edge between entry nodes
            this_clique[4].pop(0) # no edge between entry nodes

            self.edges.extend(this_clique)
        
        # room adjacencies
        self.edges[0].append(14)
        self.edges[14].append(0)
        self.edges[4].append(5)
        self.edges[5].append(4)
        self.edges[9].append(10)
        self.edges[10].append(9)


# Lattice (from Kahn et al. 2018) -- 5 three-cliques in a ring
class five_three_lattice(graph):
    def __init__(self):
        num_nodes = 15
        self.name = "five_three_lattice"
        self.nodes = range(num_nodes)
        self.edges = []
        for i in range(5):
            this_clique = clique(3, 3*i)
            # now ring adjacencies
            for j in range(3):
                curr_index = i*3 + j
                this_clique[j].append(mod(curr_index - 3, num_nodes))
                this_clique[j].append(mod(curr_index + 3, num_nodes))
            
            self.edges.extend(this_clique)
    


# Ring (from Kahn et al. 2018) -- each node is connected to 4 nearest neighbors 
class ring(graph):
    def __init__(self):
        num_nodes = 15
        self.name = "ring_15"
        self.nodes = range(num_nodes)
        self.edges = []
        for i in range(num_nodes): 
            curr_edges = [
                mod(i - 2, num_nodes),
                mod(i - 1, num_nodes),
                mod(i + 1, num_nodes),
                mod(i + 2, num_nodes)
            ]
            self.edges.append(curr_edges)
    

# Random graph generation with degree > 2 for all nodes
# Note self doesn't check num_edges for validity relative to degree constraint 
class random_graph(graph):
    def __init__(self, num_nodes=15, num_edges=30):
        min_deg = 2
        self.name = "random_nodes_%i_edges_%i" % (num_nodes, num_edges)
        self.nodes = range(num_nodes)
        self.edges = []
        for i in range(num_nodes):
            self.edges.append([])
        

        num_curr_edges = 0
        order = range(num_nodes) # Order of edge adding
        np.random.shuffle(order)
        for ii in range(num_nodes): 
            i = order[ii] 
            while (len(self.edges[i]) < 2):
                proposed_location = np.random.randint(num_nodes - 1)
                if (proposed_location == i):
                    proposed_location = num_nodes - 1
                
                if (not proposed_location in self.edges[i]):
                    self.edges[i].append(proposed_location)
                    self.edges[proposed_location].append(i)
                    num_curr_edges += 1
                
        while (num_curr_edges < num_edges):
            # add a uniform random edge
            i = np.random.randint(num_nodes)
            proposed_location = np.random.randint(num_nodes - 1)
            if (proposed_location == i):
                proposed_location = num_nodes - 1
            
            if (not proposed_location in self.edges[i]):
                self.edges[i].append(proposed_location)
                self.edges[proposed_location].append(i)
                num_curr_edges += 1
        

# A fixed graph generated using the above def
# so we can have consistent results across subjects
class fixed_random_graph(graph):
    def __init__(self):
        self.name = "fixed_random_graph_0"
        self.nodes = range(15)
        self.edges = [
            [3, 11, 13, 14],
            [2, 14, 5, 13],
            [3, 1, 5, 4],
            [2, 5, 0, 4],
            [6, 3, 2],
            [3, 7, 6, 1, 2, 12],
            [5, 9, 4],
            [5, 8, 12],
            [7, 10],
            [12, 10, 6, 11, 13],
            [9, 8, 13, 11],
            [0, 9, 10, 12],
            [14, 9, 7, 13, 5, 11],
            [9, 10, 0, 12, 1],
            [12, 1, 0]
        ]


# random walks
def random_walk(graph, length, start_location=None):
    edges = graph.edges
    num_nodes = len(edges)
    walk = []
    if (start_location is None):
        # random start
        start_location = np.random.randint(num_nodes)
    
    curr_location = start_location 
    for t in range(length + 1):
        walk.append(curr_location)
        adjacent = edges[curr_location]
        curr_location = adjacent[np.random.randint(len(adjacent))]
    

    return walk

# epsilon of the time, takes a uniform random transition
def noisy_random_walk(graph, length, epsilon, start_location=None):
    edges = graph.edges
    num_nodes = len(edges)
    walk = []
    if (start_location is None):
        # random start
        start_location = np.random.randint(num_nodes)
    
    curr_location = start_location 
    for t in range(length + 1):
        walk.append(curr_location)
        if (np.random.random() < epsilon):
            proposed_location = np.random.randint(num_nodes - 1)
            if (proposed_location == curr_location):
                proposed_location = num_nodes - 1
            
            curr_location = proposed_location
        else:
            adjacent = edges[curr_location]
            curr_location = adjacent[np.random.randint(len(adjacent))]

    return walk

if __name__ == "__main__":
    print(clique(5))
    print(clique(5, 2))
    tr = three_rooms()
    print(tr.name)
    print(tr.edges)
    fixrand = fixed_random_graph()
    print(fixrand.name)
    print(fixrand.edges)
    print(noisy_random_walk(tr, 50, 0.1, 0))

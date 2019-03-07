import numpy as np
from copy import deepcopy

graph_edges = [
    [2,4,14,13],
    [5,7],
    [11,0,14,3],
    [9,11,2],
    [6,0,8],
    [14,1,6],
    [4,12,5,13,14,10],
    [12,1,13,10],
    [11,10,13,4],
    [14,12,3],
    [8,12,7,6],
    [2,14,8,3],
    [6,7,9,10,13],
    [12,7,8,6,0],
    [11,5,9,0,2,6]
]

num_iterations = 1000

num_nodes = len(graph_edges)

def swap(edges, i, j):
    edges = deepcopy(edges)
    temp = edges[i]
    edges[i] = edges[j]
    edges[j] = temp
    for node_edges in edges:
        for edge_i in range(len(node_edges)):
            if node_edges[edge_i] == i:
                node_edges[edge_i] = j;
            elif node_edges[edge_i] == j:
                node_edges[edge_i] = i;
    return edges

def get_polygon_coords(n_sides, cent_x=0, cent_y=0, radius=1, offset=0):
    coords = [[cent_x+radius*np.sin(2*i*np.pi/n_sides + offset),
               cent_y-radius*np.cos(2*i*np.pi/n_sides + offset)] for i in range(n_sides)]
    return coords

these_coords = get_polygon_coords(num_nodes)

def stress(edges):
    stress = []
    for node_i, node_edges in enumerate(edges):
        this_stress = 0
        for node_j in node_edges:
            coords_i = these_coords[node_i]
            coords_j = these_coords[node_j]
            this_stress += np.sqrt((coords_i[0]-coords_j[0])**2 + (coords_i[1]-coords_j[1])**2)
        stress.append(this_stress)
    return stress

def randomize_edges(edges, curr_stress=0):
    edges = deepcopy(edges)
    for random_swap_i in range(num_nodes):
        i, j = np.random.choice(range(num_nodes), size=2, replace=False)
        edges = swap(edges, i, j)
        if sum(stress(edges)) < curr_stress:
            return edges
    return edges

for i in range(num_iterations):
    curr_stress = stress(graph_edges)
    curr_total_stress = sum(curr_stress)
    best_total_stress = curr_total_stress 
    worst_node = np.argmax(curr_stress)
    best_location = worst_node
    best_attempt_edges = graph_edges
    for new_location in range(num_nodes):
        attempt_edges = swap(graph_edges, worst_node, new_location) 
        attempt_total_stress = sum(stress(attempt_edges))
        if attempt_total_stress < best_total_stress:
            best_total_stress = attempt_total_stress
            best_location = new_location
            graph_edges = attempt_edges

    if best_total_stress == curr_total_stress:
        for i in range(10):
            attempt_edges = randomize_edges(graph_edges, curr_total_stress)
            attempt_total_stress = sum(stress(attempt_edges))
            if attempt_total_stress < curr_total_stress:
                print "Successfully randomized to break out of local minimum"
                graph_edges = attempt_edges
                break
        else:
            print "Breaking at iteration %i, stress %f" % (i, curr_total_stress)
            break
    print(curr_total_stress)
    
print graph_edges

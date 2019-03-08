import numpy as np

tr_edges = [[1,2,3,14],[0,2,3,4],[0,1,3,4],[0,1,2,4],[1,2,3,5],[6,7,8,4],[5,7,8,9],[5,6,8,9],[5,6,7,9],[6,7,8,10],[11,12,13,9],[10,12,13,14],[10,11,13,14],[10,11,12,14],[11,12,13,0]]
rand_edges = [[3,11],[5,12,11,6,4],[4,10,14],[5,0,8],[9,12,2,1],[3,1,6,14],[13,5,11,1,12],[13,8,12],[9,7,3,14],[8,14,4,10,11],[2,9],[0,6,1,14,12,9],[4,7,1,11,6,13],[6,7,12],[9,2,5,8,11]] 


def edges_to_adjacency(edges):
    num_nodes = len(edges)
    adjacency = np.zeros([num_nodes, num_nodes], dtype=np.int32)
    for node_i, node_i_edges in enumerate(edges):
        for node_j in node_i_edges:
            adjacency[node_i, node_j] = 1
    return adjacency

tr_adj = edges_to_adjacency(tr_edges)
print(tr_adj)
np.savetxt("../data_analysis/auxiliary_data/tr_adjacency.csv", tr_adj, fmt='%i', 
           delimiter=',')

rand_adj = edges_to_adjacency(rand_edges)
print(rand_adj)
np.savetxt("../data_analysis/auxiliary_data/rand_adjacency.csv", rand_adj, fmt='%i', 
           delimiter=',')

import numpy as np

tr_edges = [[1,2,3,14],[0,2,3,4],[0,1,3,4],[0,1,2,4],[1,2,3,5],[6,7,8,4],[5,7,8,9],[5,6,8,9],[5,6,7,9],[6,7,8,10],[11,12,13,9],[10,12,13,14],[10,11,13,14],[10,11,12,14],[11,12,13,0]]
rand_edges = [[3,11,13,14],[2,14,5,13],[3,1,5,4],[2,5,0,4],[6,3,2],[3,7,6,1,2,12],[5,9,4],[5,8,12],[7,10],[12,10,6,11,13],[9,8,13,11],[0,9,10,12],[14,9,7,13,5,11],[9,10,0,12,1],[12,1,0]]


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

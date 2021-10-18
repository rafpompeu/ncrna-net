import networkx as nx
from networkx.algorithms import bipartite
from model.mongodb import Mongo
from multiprocessing import Pool
from functools import partial
import itertools
import collections
import time

B = nx.Graph()


global pids

def chunks(l, n):
    """Divide a list of nodes `l` in `n` chunks"""
    l_c = iter(l)
    while 1:
        x = tuple(itertools.islice(l_c, n))
        if not x:
            return
        yield x


def _betmap(G_normalized_weight_sources_tuple):
    return nx.betweenness_centrality_source(*G_normalized_weight_sources_tuple)


def betweenness_centrality_parallel(G, processes=None):
    """Parallel betweenness centrality  function"""
    p = Pool(processes=processes)
    node_divisor = len(p._pool) * 4
    node_chunks = list(chunks(G.nodes(), int(G.order() / node_divisor)))
    num_chunks = len(node_chunks)
    bt_sc = p.map(_betmap,
                  zip([G] * num_chunks,
                      [True] * num_chunks,
                      [None] * num_chunks,
                      node_chunks))
    
    bt_c = bt_sc[0]
    for bt in bt_sc[1:]:
        for n in bt:
            bt_c[n] += bt[n]
    return bt_c




class Network():
    def __init__(self, input):
        self.input = input

    def network_creator(self):
        
        nodes = self.input['nodes']
        class_opt = self.input['classe']
        input = self.input['input']
        output = self.input['output']
        if(input!='gene'):
            f = partial(Mongo().find,class_opt,input)
            with Pool() as p:
                self.edges = p.map(f, nodes)
            for edge in self.edges:
                if (edge != None):
                    ncrna = edge[input]
                    for gene in edge['gene']:
                        B.add_node(gene, group='gene')
                        B.add_node(ncrna, group= input)
                        B.add_edge(gene,ncrna)
            nodes = [n for n, d in B.nodes(data=True) if d['group']=='gene']
            input = 'gene'
        f = partial(Mongo().find,class_opt,input)
        with Pool() as p:
            self.edges = p.map(f, nodes)
        for edge in self.edges:
            if (edge != None):
                gene = edge['gene']
                for group in edge:
                    if(group in output and edge[group]!='does not exist'):
                        for ncrna in edge[group]:
                            B.add_node(gene, group='gene')
                            B.add_node(ncrna, group= group)
                            B.add_edge(gene,ncrna)

        network = nx.node_link_data(B)
        for key in ['directed', 'multigraph', 'graph']:
            del network[key]
        return network

    def metrics_basic(self):
        number_node = nx.number_of_nodes(B)
        number_edges = nx.number_of_edges(B)
        density = round(nx.density(B),5)
        per_group = {}
        gene = len([n for n, d in B.nodes(data=True) if d['group'] == "gene"])/number_node
        mirna = len([n for n, d in B.nodes(data=True) if d['group'] == "mirna"])/number_node
        circrna = len([n for n, d in B.nodes(data=True) if d['group'] == "circrna"])/number_node
        pirna = len([n for n, d in B.nodes(data=True) if d['group'] == "pirna"])/number_node
        per_group['Gene'] = str(round(gene*100,2)) +"%"
        if(mirna!=0):
            per_group['miRNA'] = str(round(mirna*100,2))+"%"
        if(circrna!=0):
            per_group['circRNA'] = str(round(circrna*100,2))+"%"
        if(pirna!=0):
            per_group['piRNA'] = str(round(pirna*100,2))+"%"
        return {'number node':number_node, 'number edges':number_edges, 
            'density':density, 'percentage':per_group}
    
    def metrics_advanced(self):
        betweenness_gene = []
        betweenness_ncrna = []
        genes = {n for n, d in B.nodes(data=True) if d['group']=='gene'}
        betweenness = nx.bipartite.betweenness_centrality(B,genes)
        for btw in betweenness:
            if(btw in genes):
                betweenness_gene.append(round(betweenness[btw], 2))
            else:
                betweenness_ncrna.append(round(betweenness[btw], 2))
        betweenness_counter_gene = collections.Counter(betweenness_gene)
        betweenness_counter_ncrna = collections.Counter(betweenness_ncrna)
        betweenness_list_gene = []
        for btw in betweenness_counter_gene:
            betweenness_list_gene.append([btw,betweenness_counter_gene[btw]])
        
        betweenness_list_ncrna = []
        for btw in betweenness_counter_ncrna:
            betweenness_list_ncrna.append([btw,betweenness_counter_ncrna[btw]])
        

        closeness_gene = []
        closeness_ncrna = []
        closeness = nx.bipartite.closeness_centrality(B,genes)
        for clos in closeness:
            if(clos in genes):
                closeness_gene.append(round(closeness[clos], 2))
            else:
                closeness_ncrna.append(round(closeness[clos], 2))
        closeness_counter_gene = collections.Counter(closeness_gene)
        closeness_counter_ncrna = collections.Counter(closeness_ncrna)

        closeness_list_gene = []
        for clos in closeness_counter_gene:
            closeness_list_gene.append([clos,closeness_counter_gene[clos]])
        
        closeness_list_ncrna = []
        for clos in closeness_counter_ncrna:
            closeness_list_ncrna.append([clos,closeness_counter_ncrna[btw]])


        degree_gene = []
        degree_ncrna = []
        degree =  nx.bipartite.degree_centrality(B,genes)
        for deg in degree:
            if(deg in genes):
                degree_gene.append(round(degree[deg],2))
            else:
                degree_ncrna.append(round(degree[deg],2))
        degree_counter_gene = collections.Counter(degree_gene)
        degree_counter_ncrna = collections.Counter(degree_ncrna)

        degree_list_gene = []
        for deg in degree_counter_gene:
            degree_list_gene.append([deg,degree_counter_gene[deg]])
        
        degree_list_ncrna = []
        for deg in degree_counter_ncrna:
            degree_list_ncrna.append([deg,degree_counter_ncrna[deg]])
        

        clustering_gene = []
        clustering_ncrna = []
        clustering =  nx.bipartite.clustering(B)
        for redun in clustering:
            if(redun in genes):
                clustering_gene.append(round(clustering[redun],2))
            else:
                clustering_ncrna.append(round(clustering[redun],2))
        
        clustering_counter_gene = collections.Counter(clustering_gene)
        clustering_counter_ncrna = collections.Counter(clustering_ncrna)
        clustering_list_gene = []
        for redun in clustering_counter_gene:
            clustering_list_gene.append([redun,clustering_counter_gene[redun]])

        clustering_list_ncrna = []
        for redun in clustering_counter_ncrna:
            clustering_list_ncrna.append([redun,clustering_counter_ncrna[redun]])
        
        table = []
        header = [{'title': 'Node'}, {'title': 'Degree'},{'title': 'Betweenness'},{'title': 'Closeness'},{'title': 'Clustering'}]
        for node in B.nodes():
            table.append([node, round(degree[node],2), round(betweenness[node],2), 
                round(closeness[node],2), round(clustering[node],2)])
        
        return {'betweenness dist':{'gene':betweenness_list_gene, 'ncrna':betweenness_list_ncrna},
            'closeness dist':{'gene':closeness_list_gene, 'ncrna':closeness_list_ncrna},
            'degree dist':{'gene':degree_list_gene, 'ncrna':degree_list_ncrna},
            'clustering dist':{'gene':clustering_list_gene, 'ncrna':clustering_list_ncrna},
            'table':{'header':header, 'table':table}}
        
    def table(self):
        header = []
        table = []

        if (len({n for n, d in B.nodes(data=True) if d['group'] == "gene"}) != 0):
            header.append({"title": "Gene"})
        if (len({n for n, d in B.nodes(data=True) if d['group'] == "mirna"}) != 0):
            header.append({"title": "miRNA"})
        if (len({n for n, d in B.nodes(data=True) if d['group'] == "circrna"}) != 0):
            header.append({"title": "circRNA"})
        if (len({n for n, d in B.nodes(data=True) if d['group'] == "pirna"}) != 0):
            header.append({"title": "piRNA"})
        if (len({n for n, d in B.nodes(data=True) if d['group'] == "disease"}) != 0):
            header.append({"title": "Disease"})
        gene_list = {n for n, d in B.nodes(
            data=True) if d['group'] == "gene"}
        for gene in gene_list:
            aux_list = [gene]
            mi_list = []
            pi_list = []
            circ_list = []
            for node in B[gene]:
                if(B.nodes[node]['group'] == 'mirna'):
                    mi_list.append(node)
                if(B.nodes[node]['group'] == 'circrna'):
                    circ_list.append(node)
                if(B.nodes[node]['group'] == 'pirna'):
                    pi_list.append(node)
            
            if({"title": "miRNA"} in header):
                if(not mi_list):
                    aux_list.append("Not available")
                else:
                    aux_list.append(",".join(mi_list))
            if({"title": "circRNA"} in header):
                if(not circ_list):
                    aux_list.append("Not available")
                else:
                    aux_list.append(",".join(circ_list))
            if({"title": "piRNA"} in header):
                if(not pi_list):
                    aux_list.append("Not available")
                else:
                    aux_list.append(",".join(pi_list))
            table.append(aux_list)
        B.clear()
        return {'header': header, 'table': table}

        
    
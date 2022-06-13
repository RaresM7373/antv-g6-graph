import G6 from '@antv/g6';
import { DagreLayout } from '@antv/layout';
import dagre from 'dagre';
import { buildLayerMatrix } from 'dagre/lib/util';
import cloneDeep from 'lodash.clonedeep';

function getFunc(func, value, defaultValue) {
    let resultFunc;
    if (func) {
        resultFunc = func;
    }
    else if (typeof value === 'number') {
        resultFunc = () => value;
    }
    else {
        resultFunc = () => defaultValue;
    }
    return resultFunc;
}

export default class AmplifyDagreLayout extends DagreLayout {
    constructor(options) {
        super(options);

        this.dagreOptions = options.dagre;
    }

    execute() {
        const self = this;
        const { nodes, nodeSize, rankdir, combos } = self;
        if (!nodes)
            return;
        const edges = self.edges || [];
        const g = new dagre.graphlib.Graph({
            multigraph: true,
            compound: true,
        });
        let nodeSizeFunc;
        if (!nodeSize) {
            nodeSizeFunc = (d) => {
                if (d.size) {
                    if (Array.isArray(d.size)) {
                        return d.size;
                    }
                    return [d.size, d.size];
                }
                return [40, 40];
            };
        }
        else if (Array.isArray(nodeSize)) {
            nodeSizeFunc = () => nodeSize;
        }
        else {
            nodeSizeFunc = () => [nodeSize, nodeSize];
        }
        let horisep = getFunc(self.nodesepFunc, self.nodesep, 50);
        let vertisep = getFunc(self.ranksepFunc, self.ranksep, 50);
        if (rankdir === "LR" || rankdir === "RL") {
            horisep = getFunc(self.ranksepFunc, self.ranksep, 50);
            vertisep = getFunc(self.nodesepFunc, self.nodesep, 50);
        }
        g.setDefaultEdgeLabel(() => ({}));
        g.setGraph(self);
        const comboMap = {};
        nodes.forEach((node) => {
            const size = nodeSizeFunc(node);
            const verti = vertisep(node);
            const hori = horisep(node);
            const width = size[0] + 2 * hori;
            const height = size[1] + 2 * verti;
            g.setNode(node.id, { width, height });
            if (this.sortByCombo && node.comboId) {
                if (!comboMap[node.comboId]) {
                    comboMap[node.comboId] = true;
                    g.setNode(node.comboId, {});
                }
                g.setParent(node.id, node.comboId);
            }
        });
        if (this.sortByCombo && combos) {
            combos.forEach(combo => {
                if (!combo.parentId)
                    return;
                if (!comboMap[combo.parentId]) {
                    comboMap[combo.parentId] = true;
                    g.setNode(combo.parentId, {});
                }
                g.setParent(combo.id, combo.parentId);
            });
        }
        edges.forEach((edge) => {
            // dagrejs Wiki https://github.com/dagrejs/dagre/wiki#configuring-the-layout
            g.setEdge(edge.source, edge.target, {
                weight: edge.weight || 1,
            });
        });
        function assignOrder(g, layering) {
            layering.forEach(layer => {
                layer.forEach((v, i) => {
                    g.node(v).order = i;
                });
            });
        }
        dagre.layout(g, {
            customOrder(order, g) {
                const visited = {};
                const simpleNodes = g.nodes().filter(function(v) {
                    return !g.children(v).length;
                });
                const maxRank = Math.max(...simpleNodes.map(function(v) { return g.node(v).rank; }));
                const layers = [...Array(maxRank + 1).keys()].map(function() { return []; });

                function dfs(v) {
                    if (visited[v]) return;
                    visited[v] = true;
                    var node = g.node(v);
                    layers[node.rank].push(v);
                    const successors = g.successors(v).sort((a, b) => {
                        const gA = g.node(a);
                        const gB = g.node(b);
                        if (gA.dummy === 'edge' && gB.dummy === 'edge') {
                            const nodeA = nodes.find(node => node.id === gA.edgeObj.w);
                            const nodeB = nodes.find(node => node.id === gB.edgeObj.w);
                            return typeof nodeA.order === 'number' && typeof nodeB.order === 'number' ? nodeA.order - nodeB.order : -1;
                        }
                        return 0;
                    });
                    successors.forEach(dfs);
                }

                const orderedVs = simpleNodes.sort((a, b) => g.node(a).rank - g.node(b).rank);
                orderedVs.forEach(dfs);
                assignOrder(g, layers);
            },
            // adjustNodePosition(graph) {
            //     const graphNodes = g.nodes();
            //     const layers = buildLayerMatrix(graph).reverse();
            //     console.log(layers);
            //     const layerSizes = layers.map(() => ({ left: null, right: null }));

            //     layers.forEach((layer, layerIndex) => {
            //         layer.forEach(nodeId => {
            //             const node = nodes.find(item => item.id === nodeId);
            //             if (!node) return graph.node(nodeId).x;

            //             const nodeEdges = edges.filter(item => item.source === nodeId);

            //             let successorLeft = undefined;
            //             let successorRight = undefined;
            //             nodeEdges.forEach(nodeEdge => {
            //                 const targetNode = nodes.find(item => item.id === nodeEdge.target);
            //                 if (!targetNode) return;

            //                 successorLeft = successorLeft !== undefined ? Math.min(successorLeft, targetNode.x) : targetNode.x;
            //                 successorRight = successorRight !== undefined ? Math.max(successorRight, targetNode.x) : targetNode.x;
            //             });

            //             graph.node(nodeId).x = successorRight && successorLeft ? (successorRight - successorLeft) / 2 : graph.node(nodeId).x;
            //             console.log(nodeId, graph.node(nodeId).x, successorRight, successorLeft);
            //         });
            //     });
            // },
            ...this.dagreOptions,
        });
        let coord;
        g.nodes().forEach((node) => {
            coord = g.node(node);
            const i = nodes.findIndex((it) => it.id === node);
            if (!nodes[i])
                return;
            if (node === 'node_1' || node === 'btn_1') console.log(node, coord);
            nodes[i].x = coord.x;
            nodes[i].y = coord.y;
        });
        g.edges().forEach((edge) => {
            coord = g.edge(edge);
            const i = edges.findIndex((it) => it.source === edge.v && it.target === edge.w);
            if (self.controlPoints && edges[i].type !== "loop") {
                edges[i].controlPoints = coord.points.slice(1, coord.points.length - 1);
            }
        });
        if (self.onLayoutEnd)
            self.onLayoutEnd();
        return {
            nodes,
            edges,
        };
    }

    getType() {
        return 'amplifyDagre';
    }
}

G6.registerLayout('amplifyDagre', AmplifyDagreLayout);

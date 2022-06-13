<template>
    <div class="canvas-wrapper">
        <div ref="messageText" class="message-text"></div>
        <div ref="canvas" id="canvas"></div>

    </div>
</template>

<script>
import G6 from '@antv/g6';
import { mapGetters, mapActions } from 'vuex';

import registerBehaviors from './graph/behaviors';
import './graph/edges';
import registerNodes from './graph/nodes';
import registerCombos from './graph/combos';

import TextEditor from './text-editor/TextEditor';

import './graph/layouts/dagre';

import 'quill/dist/quill.core.css';
import 'quill/dist/quill.bubble.css';

export default {
    computed: {
        ...mapGetters({
            nodes: 'flow/nodes',
            connections: 'flow/connections',
            combos: 'flow/combos',
            getNodeById: 'flow/getNodeById',
        }),
    },

    methods: {
        ...mapActions({
            addNode: 'flow/addNode',
            deleteNode: 'flow/deleteNode',
            updateNodeText: 'flow/updateNodeText',
        }),

        handleWindowResize() {
            const graphCenter = this.graph.getViewPortCenterPoint();
            const viewController = this.graph.get('viewController');

            this.graph.changeSize(window.innerWidth, window.innerHeight);
            viewController.focusPoint(graphCenter);
        },

        onNodeClick(event) {
            const { item, target } = event;
            if (item.destroyed) return;

            const isAddNew = target.get('name').indexOf('add-message') === 0;
            if (isAddNew) {
                if (item.hasState('show-add')) this.handleAddNode(item);
                return;
            }

            const isAddExtra = target.get('name').indexOf('add-extra') === 0;
            if (isAddExtra) {
                if (item.hasState('show-add-extra')) this.handleAddExtraNode(item);
                return;
            }

            // If clicking on the selected node
            if (item.hasState('selected')) {
                if (item.hasState('editing')) this.onNodeClickEditing(event);
                return;
            }

            this.setEditingItem(item);
        },

        onNodeClickEditing(event) {
            const { item, target } = event;

            const isDelete = target.get('name').indexOf('delete') === 0;
            if (isDelete) {
                this.handleDeleteNode(item);
                return;
            }
        },

        onNodeMouseEnter(event) {
            const { item, target } = event;

            if (item.hasState('selected') || target.get('name').indexOf('add-message') === 0) return;

            this.graph.setItemState(item, 'hover', true);
        },

        onNodeMouseLeave(event) {
            const { item } = event;

            this.graph.setItemState(item, 'hover', false);
            this.graph.setItemState(item, 'show-add', false);
            this.graph.setItemState(item, 'show-add-extra', false);
        },

        onNodeMouseMove(event) {
            const { item, x: eventX, y: eventY } = event;
            const itemBBox = item.getBBox();

            if (item.hasState('faded') || item.hasState('highlighted')) return;

            this.graph.setItemState(item, 'show-add', eventY > itemBBox.y + (itemBBox.height / 3 * 2));

            if (item.get('currentShape') === 'amplify-button') {
                this.graph.setItemState(item, 'show-add-extra', eventX > itemBBox.x + (itemBBox.width / 3 * 2));
            }
        },

        handleAdjustEditor() {
            const { messageText } = this.$refs;
            const [editor] = messageText.getElementsByClassName('ql-editor');
            const { nodeId } = messageText.dataset;
            if (!nodeId) return;

            const node = this.graph.findById(nodeId);
            if (!node) return;

            const textGroup = node.getContainer().findById('text-group');
            if (!textGroup) return;

            const firstTextLine = textGroup.find(line => line.get('name') === 'text-line');
            const zoom = this.graph.getZoom();
            const bBox = textGroup.getCanvasBBox();
            const parentBBox = node.getKeyShape().getCanvasBBox();
            const padding = bBox.x - parentBBox.x;
            const width = parentBBox.width - padding * 2;

            messageText.style.width = `${width / zoom}px`;
            editor.style.transform = `translate3d(${bBox.x}px, ${bBox.y}px, 0) scale(${zoom}) translate(0, -${firstTextLine._getSpaceingY()}px)`;
        },

        handleAddNode(item) {
            this.addNode({
                connection: item.get('id'),
            });
        },

        handleDeleteNode(item) {
            this.deleteNode(item.get('model'));
        },

        handleAddExtraNode(item) {
            const itemId = item.get('id');
            const combo = this.graph.find('combo', node => !!node.getChildren().nodes.find(child => child.get('id') === itemId));
            const nodeItem = this.nodes.find(node => node.id === itemId);
            const nodePos = this.nodes.indexOf(nodeItem);
            const newNode = {
                connections: item.getNeighbors('source').map(nodeItem => nodeItem.get('id')),
                type: item.get('currentShape'),
            };

            if (combo) {
                newNode.comboId = combo.get('id');
                newNode.afterOrder = nodeItem.order;
            }

            this.addNode(newNode);
        },

        setEditingItem(item) {
            const nodes = this.graph.getNodes();
            const edges = this.graph.getEdges();
            let pathEdges = item.getEdges();
            const pathNodes = [];

            this.graph.setMode('editing');

            // Getting all items up the tree
            const checkNeighbor = (nTarget, nodeItem) => {
                if (pathNodes.find(pathItem => pathItem.get('id') === nodeItem.get('id'))) return;

                const nodeEdges = nodeItem[nTarget === 'source' ? 'getInEdges' : 'getOutEdges']();
                pathEdges = [].concat(pathEdges, nodeEdges);

                pathNodes.push(nodeItem);
                nodeItem.getNeighbors && nodeItem.getNeighbors(nTarget).forEach(checkNeighbor.bind(this, nTarget));
            };
            item.getNeighbors('source').forEach(checkNeighbor.bind(this, 'source'));
            item.getNeighbors('target').forEach(checkNeighbor.bind(this, 'target'));

            // De-highlighting all previous highlighted edges
            edges.forEach(edge => {
                const inPath = !!pathEdges.find(pathEdge => pathEdge.get('id') === edge.get('id'));
                this.graph.setItemState(edge, 'faded', !inPath);
                if (inPath) edge.toFront();
            });

            // De-selecting all previously selected nodes
            nodes.forEach(node => {
                if (node.get('id') === item.get('id')) return;

                const inPath = !!pathNodes.find(pathItem => pathItem.get('id') === node.get('id'));

                this.graph.setItemState(node, 'selected', false);
                this.graph.setItemState(node, 'editing', false);
                this.graph.setItemState(node, 'faded', !inPath);
                this.graph.setItemState(node, 'highlighted', inPath);
                node.toFront();
            });

            // Setting selected state on the clicked node
            this.graph.setItemState(item, 'selected', true);
            this.graph.setItemState(item, 'editing', true);
            this.graph.setItemState(item, 'hover', false);
            this.graph.setItemState(item, 'faded', false);
            this.graph.setItemState(item, 'highlighted', false);

            item.toFront();
        },
    },

    created() {
        window.addEventListener('resize', this.handleWindowResize);
    },

    destroyed() {
        window.removeEventListener('resize', this.handleWindowResize);
    },

    mounted() {
        this.editor = new TextEditor(this.$refs.messageText).instance;
        this.editor.on('text-change', () => {
            const { dataset: { nodeId } } = this.$refs.messageText;
            if (!nodeId) return;

            window.requestAnimationFrame(() => {
                this.updateNodeText({
                    id: nodeId,
                    text: this.editor.getContents().ops,
                });
            });
        });

        const baseModes = [
            {
                type: 'zoom-canvas',
                fixSelectedItems: {
                    fixState: 'selected',
                    fixLineWidth: true,
                },
            },
            {
                type: 'drag-canvas',
                allowDragOnItem: true,
                shouldBegin(event) {
                    const { item } = event;
                    if (!item) return true;
                    return !item.hasState('editing');
                },
            },
        ];

        function assignOrder(g, layering) {
            layering.forEach(layer => {
                layer.forEach((v, i) => {
                    g.node(v).order = i;
                });
            });
        }

        const layoutCfg = {
            type: 'amplifyDagre',
            rankdir: 'TB',
            nodesep: 5,
            ranksep: 30,
            sortByCombo: true,
            controlPoints: false,
            dagre: {
                disableOptimalOrderHeuristic: true,
            },
        };

        this.graph = new G6.Graph({
            container: this.$refs.canvas,
            width: window.innerWidth,
            height: window.innerHeight,
            fitCenter: true,
            groupByTypes: false,
            enableStack: true,
            modes: {
                default: [
                    ...baseModes,
                    {
                        type: 'brush-select',
                        includeEdges: false,
                        brushStyle: {
                            fill: '#A56BAE',
                            fillOpacity: '0.05',
                            stroke: 'rgba(165, 107, 174, 0.3)',
                            lineWidth: 1,
                        },
                    },
                ],
                editing: [
                    ...baseModes,
                    'node-editing',
                ],
            },
            layout: layoutCfg,

            defaultEdge: {
                type: 'amplify-edge',
            },
            defaultNode: {
                type: 'amplify-message',
                size: 264,
            },
            defaultCombo: {
                type: 'amplify-group',
                padding: 16,
                animate: false,
                style: {
                    fill: 'rgba(232, 231, 229, 0.25)',
                    stroke: '#E8E7E5',
                    lineWidth: 1,
                    radius: 8,
                },
            },
            nodeStateStyles: {
                selected: {
                    lineWidth: 1, // Needed to fix the lineWidth on zoom
                },
            },
        });

        registerBehaviors(this);
        registerNodes(this);
        registerCombos(this);

        this.graph.on('node:click', this.onNodeClick);
        this.graph.on('node:mouseenter', this.onNodeMouseEnter);
        this.graph.on('node:mouseleave', this.onNodeMouseLeave);
        this.graph.on('node:mousemove', this.onNodeMouseMove);

        this.graph.on('wheelzoom', this.handleAdjustEditor);
        this.graph.on('canvas:drag', this.handleAdjustEditor);

        this.graph.data({
            nodes: this.nodes,
            edges: this.connections,
            combos: this.combos,
        });
        this.graph.render();

        let latestNode = null;

        this.$store.subscribe((mutation) => {
            if (mutation.type.indexOf('flow/') < 0) return;

            if (mutation.type === 'flow/ADD_NODE' || mutation.type === 'flow/UPDATE_NODE_TEXT') {
                latestNode = mutation.payload;

                // const itemEdges = this.connections.filter(conc => conc.source === latestNode.id || conc.target === latestNode.id);

                // this.graph.addItem('node', latestNode, true);
                // itemEdges.forEach(edge => {
                //     this.graph.addItem('edge', edge);
                // });

                // this.graph.refreshPositions();

                // return;
            }

            this.graph.changeData({
                nodes: this.nodes,
                edges: this.connections,
                combos: this.combos,
            }, true);
            this.graph.refreshPositions();
        });

        this.graph.on('afterlayout', () => {
            this.graph.getNodes().forEach(node => {
                node.toFront();
            });

            if (!latestNode) return;
            const item = this.graph.findById(latestNode.id);
            if (!item) return;

            // this.graph.focusItem(latestNode.id, true, {
            //     duration: 300,
            //     easing: 'easeCubic',
            // });
            this.setEditingItem(item);

            latestNode = null;
        });
    }
}
</script>

<style lang="scss">
.canvas-wrapper {
    position: relative;
    user-select: none;

    background: #F8F7F5;

    foreignObject {
        overflow: visible;
    }
}

.message-text {
    display: none;
    width: 100%;

    overflow: visible;

    &.is-shown {
        display: block;
    }

    &,
    .ql-editor {
        position: absolute;
        top: 0;
        left: 0;

        height: auto;

        font-family: DM Sans;
        font-style: normal;
        font-weight: normal;
        font-size: 13px;
        line-height: 15px;
        color: #292124;

        transform-origin: 0% 0%;
    }

    .ql-editor {
        min-height: 15px;
        padding: 0;

        overflow: visible;
        background: #fff;

        ul,
        ol {
            padding: 0 0 0 25px;

            li {
                padding: 0;
            }
        }
    }
}

.amplify-message {
    position: relative;

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 17px;

    font-family: DM Sans;
    font-style: normal;
    font-weight: normal;
    font-size: 11px;
    line-height: 16px;
    letter-spacing: 0.25px;
    color: #fff;

    background-color: #292124;
    border-radius: 8px;
    box-shadow: 0px 5px 8px rgba(0, 0, 0, 0.1);

    &__header {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        padding: 0 0 8px;

        color: #CECDCC;
    }

    &__label {
        padding-left: 8px;
    }

    &__icon {
        display: flex;
        align-self: center;
    }

    &__body {
        width: 100%;
    }

    &__text,
    &__edit {
        width: 100%;
        max-width: 100%;
        min-width: 100%;

        font-family: DM Sans;
        font-style: normal;
        font-weight: normal;
        font-size: 13px;
        line-height: 16px;
        color: inherit;
        white-space: pre-wrap;

        appearance: none;
        resize: none;
    }

    &__edit {
        display: none;
        height: 16px;
        letter-spacing: 0.25px;
    }

    &__add {
        position: absolute;
        bottom: 0;
        right: 50%;

        display: block;
        width: 24px;
        height: 24px;

        color: #CE1261;

        background: #F8F7F5;
        border: 2px solid #CE1261;
        border-radius: 50px;
        opacity: 0;
        box-shadow: 0px 5px 8px rgba(0, 0, 0, 0.1);
        transform: translate3d(50%, 50%, 0);
        transition: all 0.2s ease-in-out;

        &::before {
            content: '+';
            font-size: 20px;
        }

        &:hover {
            color: #F8F7F5;

            background: #CE1261;
        }
    }

    &:hover &__add {
        opacity: 1;
    }
}
</style>
<template>
    <div class="canvas-wrapper">
        <input ref="message-input" class="message-input" />
        <div ref="canvas" id="canvas" v-on:click="canvasClick"></div>
    </div>
</template>

<script>
import G6 from '@antv/g6';
import { mapGetters, mapActions } from 'vuex';
import autosize from 'autosize';

const animatedEdges = [];
const animatedNodes = [];

G6.registerEdge('amplify-edge', {
    draw(cfg, group) {
        const { sourceNode, targetNode } = cfg;
        const sourceBox = sourceNode.getBBox();
        const targetBox = targetNode.getBBox();

        const sourceBottom = sourceBox.y + sourceBox.height ;
        const distanceVert = targetBox.y - sourceBottom;
        // const sourceBottom = sourceBox.centerY;
        // const distanceVert = targetBox.y - targetBox.height / 2 - sourceBottom;
        const distanceHoz = Math.abs(sourceBox.centerX - targetBox.centerX);
        const centerBetween = sourceBottom + distanceVert / 2;

        // Setting the arc size, either to 30 or 0.
        // It's getting set to 0 for cases where the connected node is right below,
        // and 30 for all others (to keep it the same size).
        const baseArc = 30;
        const arcSize = Math.min(baseArc, distanceHoz / 2);
        const dir = sourceBox.centerX > targetBox.centerX ? 'left' : 'right';
        const dirHoz = sourceBox.centerY > targetBox.centerY ? 'bottom' : 'top';
        const dirMult = sourceBox.centerX > targetBox.centerX ? -1 : 1;
        const dirMultHoz = sourceBox.centerY > targetBox.centerY ? -1 : 1;

        let color = sourceNode.get('currentShape') === 'amplify-button' ? '#CE1261' : '#6A6765';

        const startArrowObj = {
            path: G6.Arrow.circle(6, -3),
            fill: color,
            stroke: '#E8E7E5',
            lineWidth: 1,
        };

        const shape = group.addShape('path', {
            name: 'edge-shape',
            draggable: true,
            attrs: {
                stroke: color,
                lineWidth: 3,
                opacity: animatedEdges.indexOf(cfg.id) < 0 ? 0 : 1,
                path: distanceHoz >= 30 ? [
                    ['M', sourceBox.centerX, sourceBottom],
                    ['L', sourceBox.centerX, centerBetween - (arcSize * dirMultHoz)],
                    ['A', arcSize, arcSize, 0, 0, dir === 'left' && dirHoz !== 'bottom' ? 1 : 0, sourceBox.centerX + arcSize * dirMult, centerBetween],
                    ['L', targetBox.centerX - arcSize * dirMult, centerBetween],
                    ['A', arcSize, arcSize, 0, 0, dir === 'left' && dirHoz !== 'bottom' ? 0 : 1, targetBox.centerX, centerBetween + (arcSize * dirMultHoz)],
                    ['L', targetBox.centerX, targetBox.y],
                ] : [
                    ['M', sourceBox.centerX, sourceBottom],
                    ['L', sourceBox.centerX, centerBetween - baseArc],
                    ['C', sourceBox.centerX, centerBetween, targetBox.centerX, centerBetween, targetBox.centerX, centerBetween + baseArc],
                    ['L', targetBox.centerX, targetBox.y],
                ],
                // startArrow: startArrowObj,
                // endArrow: arrowObj,
            },
        });

        return shape;
    },

    afterDraw(cfg, group) {
        const shape = group.getFirst();
        const length = shape.getTotalLength();

        if (animatedEdges.indexOf(cfg.id) < 0) {
            shape.animate(ratio => {
                const startLength = ratio * length;
                return {
                    opacity: 1,
                    lineDash: [startLength, length - startLength],
                };
            }, {
                repeat: false,
                delay: 300,
                duration: 200,
                easing: 'easeCubic',
                callback() {
                    animatedEdges.push(cfg.id);
                },
            });
        }
    },
});

G6.registerNode('amplify-message', {
    draw(cfg, group) {
        const width = Array.isArray(cfg.size) ? cfg.size[0] : cfg.size;
        const html = `
            <div class="amplify-message" data-id="${cfg.id}" data-node='${encodeURIComponent(JSON.stringify(cfg))}' style="
                width: ${width}px;
            ">
                <div class="amplify-message__header">
                    <span class="amplify-message__icon">${this.getNodeIcon(cfg)}</span>
                    <span class="amplify-message__label">${this.getNodeLabel(cfg)}</span>
                </div>

                <div class="amplify-message__body">
                    <p class="amplify-message__text">${cfg.text}</p>
                    <textarea class="amplify-message__edit">${cfg.text}</textarea>
                </div>

                <button type="button" class="amplify-message__add"></button>
            </div>
        `;

        const wrap = document.createElement('div');
        wrap.innerHTML = html;
        document.body.appendChild(wrap);
        const messageSize = wrap.children[0].getBoundingClientRect();
        document.body.removeChild(wrap);

        const shape = group.addShape('dom', {
            name: 'message-shape',
            attrs: {
                width: width,
                height: messageSize.height,
                html,
                shadowColor: '#000',
                opacity: animatedNodes.indexOf(cfg.id) < 0 ? 0 : 1,
            },
        });

        cfg.size = [
            width,
            messageSize.height + 40,
        ];

        return shape;
    },

    drawLabel() {
        return null;
    },

    afterDraw(cfg, group) {
        const shape = group.getFirst();
        const shapeEl = shape.get('el');

        if (animatedNodes.indexOf(cfg.id) >= 0) return;

        shape.animate({ opacity: 1 }, {
            repeat: false,
            delay: 500,
            duration: 400,
            easing: 'easeCubic',
            callback() {
                animatedNodes.push(cfg.id);
                // const [textarea] = shapeEl.getElementsByClassName('amplify-message__text');
                // console.log(textarea);

                // if (textarea) autosize(textarea);
                // else console.log(textarea);
            },
        });
    },

    // Setting update to "undefined" so it triggers "draw" when the item updates
    update: undefined,

    getNodeIcon() {
        return `
            <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-top: -1px;">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.1123 9.80968C0.319401 5.6028 3.55694 1 8.30889 1H8.56526C12.1191 1 15 3.75402 15 7.15128C15 10.9337 11.7924 14 7.83568 14H1.59823C1.34439 14 1.11819 13.8468 1.03394 13.6179C0.949693 13.389 1.02574 13.1342 1.22366 12.9823L2.79612 11.7751C2.86488 11.7223 2.8892 11.6326 2.85593 11.5546L2.1123 9.80968Z" stroke="#CE1261" stroke-linejoin="round" />
            </svg>
        `;
    },

    getNodeLabel() {
        return 'Message';
    },
}, 'single-node');

G6.registerNode('amplify-button', {
    getNodeIcon() {
        return `
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="16" height="10" rx="5" fill="#CE1261" />
            </svg>
        `;
    },

    getNodeLabel() {
        return 'Button';
    },
}, 'amplify-message');

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
            updateNodeText: 'flow/updateNodeText',
        }),

        canvasClick(event) {
            const { target } = event;

            if (!target) return;

            if (target.classList.contains('amplify-message__add')) {
                this.addNodeClick(event);
                return;
            }

            if (target.closest('.amplify-message')) {
                this.nodeClick(target.closest('.amplify-message'));
                return;
            }

            this.clearEditingNode();
        },

        handleWindowResize() {
            const graphCenter = this.graph.getViewPortCenterPoint();
            const viewController = this.graph.get('viewController');

            this.graph.changeSize(window.innerWidth, window.innerHeight);
            viewController.focusPoint(graphCenter);
        },

        addNodeClick(event) {
            const message = event.target.closest('.amplify-message');
            const {
                dataset: { node },
            } = message;
            const nodeData = node ? JSON.parse(decodeURIComponent(node)) : {};

            this.addNode({
                connection: nodeData.id,
            });
        },

        nodeClick(nodeTarget) {
            const { dataset: { id: nodeId } } = nodeTarget;

            if (this.editingNode && this.editingNode === nodeId) return;

            this.graph.setMode('locked');
            this.editingNode = nodeId;

            this.focusNode(nodeId, () => {
                const node = this.graph.findById(nodeId);
                const nodeEl = node.getKeyShape().get('el');
                const [text] = nodeEl.getElementsByClassName('amplify-message__text');
                const [textarea] = nodeEl.getElementsByClassName('amplify-message__edit');
                if (text) text.style.display = 'none';
                if (textarea) textarea.style.display = 'block';

                node.toFront();

                this.startEditingMode(textarea, nodeId);
            });
        },

        focusNode(nodeId, callback = () => {}) {
            if (!nodeId) return;

            const viewController = this.graph.get('viewController');
            const node = this.graph.findById(nodeId);
            const nodeBBox = node.getBBox();
            const nodeCenter = {
                x: nodeBBox.centerX,
                y: nodeBBox.centerY,
            };
            const viewCenter = this.graph.getViewPortCenterPoint();
            const centerDistance = G6.Util.distance({
                x: Math.round(viewCenter.x),
                y: Math.round(viewCenter.y),
            }, nodeCenter);

            this.graph.set('animate', true);

            const duration = Math.min(centerDistance * 2.5, 800);

            try {
                viewController.focusPoint(nodeCenter, true, {
                    easing: 'easeCubic',
                    duration,
                    delay: duration / 10,
                    callback,
                });
            } catch (e) {
                console.error(e);
            }

            this.graph.set('animate', false);
        },

        clearEditingNode() {
            this.graph.setMode('default');

            if (!this.editingNode) return;

            const node = this.graph.findById(this.editingNode);
            const nodeEl = node.getKeyShape().get('el');
            const [text] = nodeEl.getElementsByClassName('amplify-message__text');
            const [textarea] = nodeEl.getElementsByClassName('amplify-message__edit');
            if (text) text.style.display = 'block';
            if (textarea) textarea.style.display = 'none';

            this.editingNode = null;
        },

        startEditingMode(textarea, nodeId) {
            autosize(textarea);
            this.setCaretAtEnd(textarea);

            textarea.addEventListener('change', this.textareaChange.bind(this, nodeId));
        },

        textareaChange(nodeId, event) {
            const { target: textarea } = event;
            this.updateNodeText({ id: nodeId, text: textarea.value });
        },

        setCaretAtEnd(elem) {
            const elemLen = elem.value.length;

            // For IE Only
            if (document.selection) {
                // Set focus
                elem.focus();
                // Use IE Ranges
                const oSel = document.selection.createRange();
                // Reset position to 0 & then set at end
                oSel.moveStart('character', -elemLen);
                oSel.moveStart('character', elemLen);
                oSel.moveEnd('character', 0);
                oSel.select();
            }
            else if (elem.selectionStart || elem.selectionStart == '0') {
                // Firefox/Chrome
                elem.selectionStart = elemLen;
                elem.selectionEnd = elemLen;
                elem.focus();
            }
        },
    },

    created() {
        window.addEventListener('resize', this.handleWindowResize);
    },

    destroyed() {
        window.removeEventListener('resize', this.handleWindowResize);
    },

    mounted() {
        this.graph = new G6.Graph({
            container: this.$refs.canvas,
            renderer: 'svg',
            width: window.innerWidth,
            height: window.innerHeight,
            fitCenter: true,
            groupByTypes: false,
            enableStack: true,
            modes: {
                default: [
                    {
                        type: 'drag-canvas',
                        allowDragOnItem: true,
                    },
                    'zoom-canvas',
                    'brush-select',
                ],
                editing: [],
            },
            layout: {
                type: 'dagre',
                rankdir: 'TB',
                nodesep: 5,
                ranksep: 30,
                sortByCombo: true,
                controlPoints: false,
            },

            defaultEdge: {
                type: 'amplify-edge',
            },
            defaultNode: {
                type: 'amplify-message',
                size: 264,
            },
            defaultCombo: {
                padding: 16,
                style: {
                    fill: 'rgba(106, 103, 101, 0.1)',
                    stroke: '#E8E7E5',
                    lineWidth: 1,
                    radius: 8,
                },
            },
        });

        this.graph.data({
            nodes: this.nodes,
            edges: this.connections,
            combos: this.combos,
        });
        this.graph.render();

        let latestNode = null;

        this.$store.subscribe((mutation) => {
            if (mutation.type.indexOf('flow/') < 0) return;

            if (mutation.type === 'flow/UPDATE_NODE_TEXT') {
                const nodeData = mutation.payload;
                const node = this.graph.findById(nodeData.id);
                // const nodeModel = node.getModel();

                // this.graph.updateItem(node, {
                //     text: nodeData.text,
                // });

                // setTimeout(() => {
                //     const nodeNew = this.graph.findById(nodeData.id);
                //     const nodeModel = node.getModel();
                //     console.log('node model', nodeModel);
                // }, 1000);
                // node.update({
                //     ...nodeModel,
                //     text: nodeData.text,
                // });
                // node.refresh();

                // return;
            }

            latestNode = mutation.payload;

            this.graph.changeData({
                nodes: this.nodes,
                edges: this.connections,
                combos: this.combos,
            });
        });

        this.graph.on('afterlayout', () => {
            // const textareas = this.$refs.canvas.getElementsByClassName('amplify-message__text');
            // if (textareas && textareas.length) autosize(textareas);
            // console.log(textareas);

            if (!latestNode) return;
            const node = this.graph.findById(latestNode.id);
            if (!node) return;

            const nodeEl = node.getKeyShape().get('el');
            const nodeElBox = nodeEl.getBoundingClientRect();
            const canvasWidth = this.graph.getWidth();
            const canvasHeight = this.graph.getHeight();
            const outHorizontal = nodeElBox.x < 0 || nodeElBox.x + nodeElBox.width > canvasWidth;
            const outVertical = nodeElBox.y < 0 || nodeElBox.y + nodeElBox.height > canvasHeight;

            if (outHorizontal || outVertical) {
            }

            this.focusNode(latestNode.id);

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

.message-input {
    position: absolute;

    display: none;
    padding: 0;

    font-family: DM Sans;
    font-style: normal;
    font-weight: normal;
    font-size: 13px;
    line-height: 16px;
    color: #fff;

    border: 0;
    background: #292124;
    appearance: none;
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
    // transform: translate3d(0, -50%, 0);

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
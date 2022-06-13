import G6 from '@antv/g6';
import cloneDeep from 'lodash.clonedeep';

import { translatePath } from '../utils/svg';

const animatedEdges = [];

G6.registerEdge('amplify-edge', {
    draw(cfg, group) {
        let { sourceNode, targetNode } = cfg;
        const targetModel = targetNode.get('model');
        const hasCombo = targetModel.comboId;

        // If the target is part of a combo, then we'll draw the edge directly to the combo instead
        if (hasCombo) {
            const groupParent = group.get('parent');
            const combo = groupParent.findById(targetModel.comboId);

            if (combo) {
                targetNode = combo.get('item');
            }
        }

        const sourceBox = sourceNode.getBBox();
        const targetBox = targetNode.getBBox();

        // const nodes = group.get('parent').get('children').map(child => child.get('item')).filter(child => child && child.get('type') === 'node');

        const sourceBottom = sourceBox.y + sourceBox.height + 7; // 7 is the size of the startArrow and its border
        const distanceVert = targetBox.y - sourceBottom;
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

        const color = this.getColor(cfg);

        const startArrowObj = {
            path: G6.Arrow.circle(6, -3),
            fill: color,
            stroke: '#E8E7E5',
            lineWidth: 1,
        };

        const endArrowObj = {
            path: translatePath('M9.07652 15.3234L18.2071 23.9654C18.9602 24.6782 20.1704 24.6782 20.9235 23.9654C21.6907 23.2392 21.6922 22.0508 20.9279 21.3229L13.5355 14L20.9279 6.6771C21.6922 5.94915 21.6907 4.76076 20.9235 4.03461C20.1704 3.3218 18.9602 3.3218 18.2071 4.0346L9.07652 12.6766C8.30783 13.4042 8.30783 14.5958 9.07652 15.3234Z', 0, -14),
            fill: color,
            stroke: '#E8E7E5',
            lineWidth: 1,
            d: 5,
            opacity: animatedEdges.indexOf(cfg.id) < 0 ? 0 : 1,
        };

        const shape = group.addShape('path', {
            name: 'edge-shape',
            draggable: true,
            capture: false,
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
                startArrow: startArrowObj,
                endArrow: endArrowObj,
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
                delay: 300,
                duration: 200,
                easing: 'easeCubic',
                callback() {
                    animatedEdges.push(cfg.id);

                    const endArrowShape = group.getFirst().get('endArrowShape');
                    endArrowShape.attr('opacity', 1);
                },
            });
        } else {
            shape.attr('opacity', 1);
            shape.get('endArrowShape').attr('opacity', 1);
        }
    },

    // update(cfg, item) {
    //     const clone = cloneDeep(cfg);
    //     const group = item.getContainer();

    //     window.requestAnimationFrame(() => {
    //         this.draw(clone, group);
    //     });
    // },
    update: undefined,

    getColor(cfg, faded = false) {
        const { sourceNode } = cfg;
        const sourceType = sourceNode.get('currentShape');

        let color = faded ? '#D1D0CE' : '#6A6765';
        if (sourceType === 'amplify-button') color = faded ? '#EDB9CD' : '#CE1261';

        return color;
    },

    setState(name, value, item) {
        const shape = item.getKeyShape();

        switch (name) {
            case 'faded':
                let color = this.getColor(item._cfg, !!value);

                shape.attr('stroke', color);
                shape.get('startArrowShape').attr('fill', color);
                shape.get('endArrowShape').attr('fill', color);
                shape.get('endArrowShape').attr('opacity', 1);

                break;

            default:
                break;
        }
    },
});
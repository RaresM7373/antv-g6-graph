import cloneDeep from 'lodash.clonedeep';

const generateId = (prefix = 'node') => {
    return `${prefix}_${(Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase()}`;
};

export const state = () => {
    return {
        nodes: [{
            id: 'node_1', // String, unique and required
            text: [
                { insert: 'Hello James\nI’m the ' },
                { insert: 'Amplify Bot', attributes: { bold: true } },
                { insert: '. I can ' },
                { insert: 'help', attributes: { link: 'https://google.com/' } },
                { insert: ' you with ' },
                { insert: 'questions', attributes: { underline: true } },
                { insert: ' about ' },
                { insert: 'diabetes', attributes: { italic: true } },
                { insert: ' and ' },
                { insert: 'its treatment', attributes: { bold: true} },
                { insert: '. Or something.\nTesting a longer bullet item, that goes onto two lines.' },
                { insert: '\n', attributes: { list: 'bullet' } },
                { insert: 'Numbered ' },
                { insert: 'List', attributes: { bold: true } },
                { insert: ' and ' },
                { insert: 'formatted', attributes: { italic: true } },
                { insert: '\n', attributes: { list: 'ordered' } },
                { insert: 'List' },
                { insert: '\n', attributes: { list: 'ordered' } },
                { insert: '\nTest\n' },
            ],
        }, {
            id: 'btn_1',
            text: [
                { insert: 'I need an introduction' },
            ],
            order: 1,
            comboId: 'btn_group_1',
            type: 'amplify-button',
        }, {
            id: 'btn_2',
            text: [
                { insert: 'Considering treatment' },
            ],
            order: 2,
            comboId: 'btn_group_1',
            type: 'amplify-button',
        }, {
            id: 'btn_4',
            order: 3,
            text: [
                { insert: 'More information' },
            ],
            comboId: 'btn_group_1',
            type: 'amplify-button',
        }, {
            id: 'btn_3',
            order: 4,
            text: [
                { insert: 'Skip question' },
            ],
            comboId: 'btn_group_1',
            type: 'amplify-button',
        }, {
            id: 'node_2',
            text: [
                { insert: 'Let’s start let me know if this would be helpful 😉' },
            ],
        }, {
            id: 'node_3',
            text: [
                { insert: 'Psst, if you don’t find this relevant 😉' },
            ],
        }, {
            id: 'node_4',
            text: [
                { insert: 'Goodbye...' },
            ],
        }, {
            id: 'node_5-1',
            text: [
                { insert: 'Alright, let me find some information for you.' },
            ],
        }, {
            id: 'node_5',
            text: [
                { insert: 'Here\'s some more relevant information for you to look at:' },
            ],
        }, {
            id: 'btn_11',
            text: [
                { insert: 'Efficacy' },
            ],
            order: 2,
            comboId: 'btn_group_2',
            type: 'amplify-button',
        }, {
            id: 'btn_12',
            text: [
                { insert: 'Patients' },
            ],
            order: 1,
            comboId: 'btn_group_2',
            type: 'amplify-button',
        }, {
            id: 'btn_13',
            order: 3,
            text: [
                { insert: 'Other options' },
            ],
            comboId: 'btn_group_2',
            type: 'amplify-button',
        }],
        connections: [{
            id: 'edge_1',
            source: 'node_1',
            target: 'btn_1',
        }, {
            id: 'edge_2',
            source: 'node_1',
            target: 'btn_2',
        }, {
            id: 'edge_3',
            source: 'node_1',
            target: 'btn_3',
        }, {
            id: 'edge_31',
            source: 'node_1',
            target: 'btn_4',
        }, {
            id: 'edge_4',
            source: 'btn_1',
            target: 'node_2',
        }, {
            id: 'edge_5',
            source: 'btn_2',
            target: 'node_3',
        }, {
            id: 'edge_6',
            source: 'btn_3',
            target: 'node_3',
        }, {
            id: 'edge_7',
            source: 'node_2',
            target: 'node_4',
        }, {
            id: 'edge_8',
            source: 'node_3',
            target: 'node_4',
        }, {
            id: 'edge_9',
            source: 'btn_4',
            target: 'node_5-1',
        }, {
            id: 'edge_10-1',
            source: 'node_5-1',
            target: 'node_5',
        }, {
            id: 'edge_10',
            source: 'node_5',
            target: 'btn_11',
        }, {
            id: 'edge_11',
            source: 'node_5',
            target: 'btn_12',
        }, {
            id: 'edge_12',
            source: 'node_5',
            target: 'btn_13',
        }],
        combos: [{
            id: 'btn_group_1',
            type: 'rect',
        }, {
            id: 'btn_group_2',
            type: 'rect',
        }],
    };
};

export const mutations = {
    ADD_NODE(localState, data) {
        const {
            connection,
            connections,
            indexPosition = -1,
            afterOrder,
            ...nodeData
        } = data;

        if (connection || connections) {
            const nodeConnections = connections || [connection];
            /* const previousConnections = localState.connections.filter((conc) => {
                return conc.source === connection;
            });

            if (previousConnections && previousConnections.length > 0) {
                const previousConnection = localState.nodes.find((node) => {
                    return node.id === previousConnections[0].target;
                });
                const previousConnectionType = previousConnection && previousConnection.type || 'amplify-message';
                nodeData.type = previousConnectionType;

                if (previousConnection && previousConnection.comboId) {
                    nodeData.comboId = previousConnection.comboId;
                }
            } */

            localState.connections = [
                ...localState.connections.map(conc => {
                    if (connection && conc.source === connection) {
                        conc.source = nodeData.id;
                    }
                    return conc;
                }),
                ...nodeConnections.map(conc => ({
                    id: generateId('edge'),
                    source: conc,
                    target: nodeData.id,
                })),
            ];
        }

        if (typeof afterOrder === 'number') {
            nodeData.order = afterOrder + 1;
        }

        localState.nodes = [
            ...localState.nodes.filter(node => !afterOrder || node.comboId !== nodeData.comboId),
            ...localState.nodes.filter(node => afterOrder && node.comboId === nodeData.comboId).map(node => {
                node.order = node.order > afterOrder ? node.order + 1 : node.order;
                return node;
            }),
            nodeData,
        ];
        // localState.nodes.splice(indexPosition, 0, nodeData);
    },

    DELETE_NODE(localState, data) {
        const item = localState.nodes.find(node => node.id === data.id);
        if (!item) return;

        localState.nodes = [
            ...localState.nodes.filter(node => node.id !== data.id),
        ];

        // Getting all connections without relations to the item
        const newConnections = localState.connections.filter(conc => conc.source !== data.id && conc.target !== data.id);

        // Getting all connections where the node was the source, and where the target node doesn't have any other connections
        const sourceConnections = localState.connections.filter(conc => {
            if (conc.source !== data.id) return false;
            const otherSources = item.type === 'amplify-button' ? newConnections.find(newConc => newConc.target === conc.target) : false;
            return !otherSources;
        });

        // Getting all connections where the deleted node was the target
        const targetConnections = localState.connections.filter(conc => conc.target === data.id);

        // Create new connections between other source and target nodes
        if (sourceConnections && sourceConnections.length > 0) {
            targetConnections.forEach(target => {
                sourceConnections.forEach(source => {
                    newConnections.push({
                        id: generateId('edge'),
                        source: target.source,
                        target: source.target,
                    });
                });
            });
        }

        if (item.comboId) {
            const comboHasItem = !!localState.nodes.find(node => node.id !== item.id && node.comboId && node.comboId === item.comboId);

            if (!comboHasItem) {
                localState.combos = localState.combos.filter(combo => combo.id !== item.comboId);
            }
        }

        localState.connections = [...newConnections];
    },

    UPDATE_NODE_TEXT(localState, data) {
        localState.nodes = [
            ...localState.nodes.map(node => {
                if (node.id === data.id) {
                    node.text = data.text;
                }

                return node;
            }),
        ];
    },
};

export const actions = {
    generateId() {
        return generateId('node');
    },

    async addNode({ commit, dispatch }, nodeData = {}) {
        const nodeId = await dispatch('generateId');
        commit('ADD_NODE', { id: nodeId, ...nodeData });
        return nodeId;
    },

    deleteNode({ commit }, nodeData) {
        commit('DELETE_NODE', nodeData);
        return nodeData.id;
    },

    updateNodeText({ commit }, nodeData) {
        commit('UPDATE_NODE_TEXT', nodeData);
        return nodeData.id;
    },
};

export const getters = {
    treeNodes(localState) {
        return cloneDeep(localState.treeNodes);
    },

    nodes(localState, getters) {
        return cloneDeep(localState.nodes);
    },

    connections(localState) {
        return cloneDeep(localState.connections);
    },

    combos(localState) {
        return cloneDeep(localState.combos);
    },

    getNodeById: (localState, getters) => (id, withConnections = false, withGroups = false) => {
        const node = getters.nodes.find(node => node.id === id);
        if (withConnections) node.connections = getters.connections.filter(conc => conc.target === node.id);
        if (withGroups) node.combos = node.comboId && getters.combos.filter(combo => combo.id === node.comboId);
        return node;
    },
};

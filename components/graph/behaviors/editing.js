import G6 from '@antv/g6';

export default ({ $refs, graph, editor }) => {
    G6.registerBehavior('node-editing', {
        getEvents() {
            return {
                'canvas:click': 'onCanvasClick',
                'edge:click': 'onCanvasClick',

                'node:dblclick': 'onNodeDblClick',
                'node:click': 'onNodeClick',
            };
        },

        onCanvasClick() {
            this.disableEditing();
        },

        onNodeDblClick(event) {
            const { item, target } = event;
            const targetGroup = target.getParent();

            // Stop if the clicked item is not the editing item
            if (!item.hasState('editing')) return;
            if (targetGroup.get('id') !== 'text-group') return;

            item.setState('text-editing', true);

            const [qlEditor] = $refs.messageText.getElementsByClassName('ql-editor');
            const zoom = graph.getZoom();
            const textItem = targetGroup.find(child => child.get('name') === 'text-line');
            const { text } = item.get('model');
            const bBox = targetGroup.getCanvasBBox();
            const parentBBox = item.getKeyShape().getCanvasBBox();
            const padding = bBox.x - parentBBox.x;
            const width = parentBBox.width - padding * 2;

            $refs.messageText.classList.add('is-shown');

            qlEditor.style.width = `${width / zoom}px`;
            qlEditor.style.transform = `translate3d(${bBox.x}px, ${bBox.y}px, 0) scale(${zoom}) translate(0, -${textItem._getSpaceingY()}px)`;

            $refs.messageText.dataset.nodeId = item.get('id');
            editor.setContents(text);
            editor.focus();

            // let focusCharIndex = text.map(textLine => textLine.insert).join('').length;
            // editor.setSelection(focusCharIndex);
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

        onNodeClick(event) {
            const { item } = event;
            if (item.destroyed) return;

            // Stop if the clicked item is the editing item
            if (item.hasState('editing')) return;

            this.disableEditing();
        },

        disableEditing() {
            const nodes = this.graph.getNodes();
            const edges = this.graph.getEdges();

            $refs.messageText.classList.remove('is-shown');
            $refs.messageText.dataset.nodeId = null;

            // De-selecting all previously selected nodes
            nodes.forEach(node => {
                this.graph.setItemState(node, 'selected', false);
                this.graph.setItemState(node, 'editing', false);
                this.graph.setItemState(node, 'faded', false);
                this.graph.setItemState(node, 'highlighted', false);
            });

            edges.forEach(edge => {
                this.graph.setItemState(edge, 'faded', false);
            });

            this.graph.setMode('default');
        },
    });
};

import Quill from 'quill';

import getQuillConfig from './QuillConf';

const Icons = Quill.import('ui/icons');
Icons.align.left = Icons.align[''];

const getTextNode = (HTMLNode) => {
    const query = HTMLNode.constructor.options && HTMLNode.constructor.options.quillContent;
    return query ? HTMLNode.querySelector(query) : HTMLNode;
};

class TextEditor {
    constructor(HTMLNode) {
        const textNode = getTextNode(HTMLNode);
        this.instance = new Quill(textNode, getQuillConfig(HTMLNode));
    }
}

export default TextEditor;

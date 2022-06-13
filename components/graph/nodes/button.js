import G6 from '@antv/g6';

import { translatePath } from '../utils/svg';

import { getOptions as getMessageOptions } from './message';

export default (...args) => {
    const messageOptions = getMessageOptions(args);

    G6.registerNode('amplify-button', {
        drawExtras(cfg, group, keyShape) {
            const shapeBBox = keyShape.getBBox();
            const addMessageGroup = this.drawAddGroup(cfg, group, 'add-extra-button');
            addMessageGroup.attr('opacity', 0);
            addMessageGroup.translate(shapeBBox.width / 2, 0);
        },

        getIconPath() {
            return translatePath('M0 5.5C0 2.73858 2.23858 0.5 5 0.5H11C13.7614 0.5 16 2.73858 16 5.5C16 8.26142 13.7614 10.5 11 10.5H5C2.23858 10.5 0 8.26142 0 5.5Z', 0, 1.5);
        },

        getNodeLabel() {
            return 'Button';
        },

        getTextPlaceholder() {
            return 'Write the button label here';
        },

        setState(name, value, item) {
            messageOptions.setState.call(this, name, value, item);
            const group = item.get('group');

            switch (name) {
                case 'show-add-extra':
                    group.findById('add-extra-button').attr('opacity', value ? 1 : 0);

                default:
                    break;
            }
        },
    }, 'amplify-message');
};

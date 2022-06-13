import G6 from '@antv/g6';
import { assembleFont, getTextHeight, getTextWidth } from '@antv/g-base/esm/util/text';

import { translatePath } from '../utils/svg';

const animated = [];

export const getOptions = () => {
    return {
        draw(cfg, group) {
            // Hiding the group initially so we can animate it in on render
            group.attr('opacity', 0);

            this._width = 264,
            this._padding = 16;
            this._textWidth = this._width - this._padding * 2;

            const fontStyling = this.getFontStyling();
            const messageText = cfg.text && cfg.text.length ? cfg.text.map(line => line.insert).join('') : this.getTextPlaceholder();
            const text = this.getText(messageText, 232);

            const box = {
                width: this._width,
                height: this.getMessageHeight(cfg, text),
                get x() { return this.width / 2 * -1; },
                get y() { return this.height / 2 * -1; },
            };

            cfg.size = [
                box.width,
                box.height,
            ];

            const messageShapeBase = {
                x: box.x,
                y: box.y,
                fill: '#fff',
                width: box.width,
                height: box.height,
                radius: 8,
            };

            // Message background element
            group.addShape('rect', {
                name: 'message',
                attrs: {
                    ...messageShapeBase,
                    shadowBlur: 8,
                    shadowColor: 'rgba(0, 0, 0, 0.1)',
                    shadowOffsetY: 5,
                },
            });

            // Message background element
            const shape = group.addShape('rect', {
                name: 'message',
                attrs: {
                    ...messageShapeBase,
                    lineWidth: 1,
                    stroke: '#E8E7E5',
                    cursor: 'pointer',
                },
            });

            const headerGroup = group.addGroup({ id: 'header-group' });
            headerGroup.translate(box.x + this._padding, box.y + this._padding);

            // Adding the icon in the top of the message card
            headerGroup.addShape('path', {
                name: 'icon',
                draggable: true,
                attrs: {
                    path: this.getIconPath(cfg),
                    fill: '#CE1261',
                    cursor: 'pointer',
                },
            });

            // Setting headline label text
            headerGroup.addShape('text', {
                name: 'headline',
                draggable: true,
                attrs: {
                    ...fontStyling,
                    x: 16 + 8, // place it next to icon
                    y: (16 - 11) / 2, // offsetting the line-height
                    width: this._textWidth - 16 - 8,
                    fontSize: 11,
                    lineHeight: 16,
                    fill: '#6A6765',
                    text: this.getNodeLabel(cfg),
                    cursor: 'pointer',
                },
            });

            // Adding trash/delete icon
            const deleteGroup = group.addGroup({ id: 'delete-group', visible: false });
            const deleteGroupSize = 16;
            deleteGroup.addShape('rect', {
                name: 'delete-hitarea',
                draggable: true,
                attrs: {
                    width: deleteGroupSize,
                    height: deleteGroupSize,
                    fill: 'transparent',
                    cursor: 'pointer',
                },
            });
            deleteGroup.addShape('path', {
                name: 'delete',
                draggable: true,
                attrs: {
                    path: translatePath(`
                        M4.5 6C4.77614 6 5 6.22386 5 6.5V8.5C5 8.77614 4.77614 9 4.5 9C4.22386 9 4 8.77614 4 8.5V6.5C4 6.22386 4.22386 6 4.5 6Z
                        M7 6.5C7 6.22386 6.77614 6 6.5 6C6.22386 6 6 6.22386 6 6.5V8.5C6 8.77614 6.22386 9 6.5 9C6.77614 9 7 8.77614 7 8.5V6.5Z
                        M2.71429 1.6C2.71429 1.16935 2.8922 0.760395 3.20229 0.461939C3.51172 0.164109 3.92747 0 4.35714 0H6.64286C7.07254 0 7.48828 0.164109 7.79771 0.461939C8.1078 0.760395 8.28572 1.16935 8.28572 1.6V3H10.5C10.7761 3 11 3.22386 11 3.5C11 3.77614 10.7761 4 10.5 4H10V10.4C10 10.8306 9.82208 11.2396 9.512 11.5381C9.20257 11.8359 8.78682 12 8.35714 12H2.64286C2.21318 12 1.79743 11.8359 1.488 11.5381C1.17792 11.2396 1 10.8306 1 10.4V4H0.5C0.223858 4 0 3.77614 0 3.5C0 3.22386 0.223858 3 0.5 3H2.71429V1.6ZM2 10.4C2 10.5528 2.0629 10.7034 2.18147 10.8176C2.30069 10.9323 2.46633 11 2.64286 11H8.35714C8.53367 11 8.69931 10.9323 8.81853 10.8176C8.9371 10.7034 9 10.5528 9 10.4V4H2V10.4ZM4.35714 1C4.18061 1 4.01498 1.06768 3.89576 1.18243C3.77718 1.29655 3.71429 1.44717 3.71429 1.6V3H7.28571V1.6C7.28571 1.44717 7.22282 1.29655 7.10425 1.18243C6.98502 1.06768 6.81939 1 6.64286 1H4.35714Z
                    `, 2.5, 1.5),
                    fill: '#292124',
                    cursor: 'pointer',
                },
            });
            deleteGroup.translate(box.width / 2 - deleteGroupSize - this._padding, box.height / 2 * -1 + this._padding);

            // Adding the basic text element
            const textGroup = this.drawText(cfg, group);
            textGroup.translate(box.x + this._padding, box.y + this._padding + 16 + 8);

            const addMessageGroup = this.drawAddGroup(cfg, group, 'add-message');
            addMessageGroup.attr('opacity', 0);
            addMessageGroup.translate(0, box.height / 2 + 12 + 2);

            if (this.drawExtras && typeof this.drawExtras === 'function') {
                this.drawExtras(cfg, group, shape);
            }

            return shape;
        },

        drawAddGroup(cfg, group, groupId = 'add-message') {
            const addMessageGroup = group.addGroup({ id: groupId });

            addMessageGroup.addShape('circle', {
                name: `${groupId}-circle`,
                attrs: {
                    fill: '#CE1261',
                    r: 12,
                    cursor: 'pointer',
                },
            });

            const addMessagePlusShape = addMessageGroup.addShape('path', {
                name: `${groupId}-plus`,
                attrs: {
                    path: 'M4.44444 0H3.55556V3.55556H0V4.44444H3.55556V8H4.44444V4.44444H8V3.55556H4.44444V0Z',
                    fill: '#fff',
                    lineWidth: 0.5,
                    stroke: '#fff',
                    cursor: 'pointer',
                },
            });
            addMessagePlusShape.translate(-4, -4);

            return addMessageGroup;
        },

        drawText(cfg, group, groupShape = null) {
            const { text: cfgText = [{ insert: this.getTextPlaceholder(), isPlaceholder: true }] } = cfg;
            const fontStyling = this.getFontStyling();
            const boldStyling = { ...fontStyling, fontWeight: 700 };
            const italicStyling = { ...fontStyling, fontStyle: 'italic' };
            const boldItalicStyling = { ...fontStyling, fontWeight: 700, fontStyle: 'italic' };
            const fontAssembled = assembleFont(fontStyling);
            const boldAssembled = assembleFont(boldStyling);
            const italicAssembled = assembleFont(italicStyling);
            const boldItalicAssembled = assembleFont(boldItalicStyling);
            const listOffset = 25; // list left padding

            const textGroup = groupShape || group.addGroup({ id: 'text-group' });
            const maxWidth = this._textWidth;
            const text = cfgText.map(line => line.insert).join('');

            textGroup._text = text;

            let numberOfLines = 0;
            let lastLine = null;
            let lastLineWidth = 0;
            let listIndex = 0;

            const renderTextLine = (textLine, countUpLine = true, pieceIndex) => {
                const { insert, attributes } = textLine;
                const isList = attributes && attributes.list;

                let font = fontStyling;
                if (attributes) {
                    if (attributes.bold && attributes.italic) {
                        font = boldItalicStyling;
                    } else if (attributes.bold) {
                        font = boldStyling;
                    } else if (attributes.italic) {
                        font = italicStyling;
                    }
                }

                if (listIndex > 0 && isList && !attributes.list === 'ordered') {
                    listIndex = 0;
                }

                // Rendering the dot (for ul) or number (for ol) on the first line of each list item
                if (isList && pieceIndex === 0) {
                    lastLineWidth = listOffset; // list left padding

                    if (attributes.listLineIndex === 0 && attributes.list === 'bullet') {
                        textGroup.addShape('circle', {
                            attrs: {
                                r: 1.5,
                                fill: fontStyling.fill,
                                x: lastLineWidth - 5 - 3,
                                y: fontStyling.lineHeight * numberOfLines + fontStyling.lineHeight / 2 - 1.5,
                            },
                        });
                    } else if (attributes.listLineIndex === 0 && attributes.list === 'ordered') {
                        textGroup.addShape('text', {
                            attrs: {
                                ...fontStyling,
                                text: `${listIndex + 1}.`,
                                textAlign: 'right',
                                textBaseline: 'top',
                                x: lastLineWidth - 5,
                                y: fontStyling.lineHeight * numberOfLines,
                            },
                        });

                        listIndex += 1;
                    }
                }

                // Don't render inserts that only contain a newline
                if (insert.match(/^\r?\n$/gm)) return;

                if (attributes && attributes.link) {
                    font = {
                        ...font,
                        fill: 'blue',
                    };
                }

                lastLine = textGroup.addShape('text', {
                    name: 'text-line',
                    draggable: true,
                    attrs: {
                        ...font,
                        fill: textLine.isPlaceholder ? '#6A6765' : font.fill,
                        x: lastLineWidth,
                        y: font.lineHeight * numberOfLines,
                        width: maxWidth,
                        text: insert,
                        cursor: 'pointer',
                        lineWidth: 1,
                        stroke: 'white',
                    },
                });

                const lastBBox = lastLine.getBBox();
                lastLineWidth = lastBBox.x + lastBBox.width;

                if (attributes && (attributes.underline || attributes.link)) {
                    const underline = textGroup.addShape('rect', {
                        name: 'text-underline',
                        draggable: true,
                        attrs: {
                            x: lastBBox.x,
                            y: lastBBox.y + font.fontSize - 1.5,
                            width: lastBBox.width,
                            height: 0.5,
                            fill: font.fill,
                        },
                    });
                    underline.toBack();
                }

                if (countUpLine) {
                    lastLineWidth = 0;
                    numberOfLines += 1;
                }
            };

            const textLines = [[]];
            let currentTextLine = '';
            let textLineWidth = 0;

            const findNextUnless = (arr, startIndex, fn, unlessFn) => {
                let currentIndex = startIndex;
                let nextItem = arr[currentIndex];
                let match = null;
                let unlessMatch = null;

                while (!unlessMatch && !match && currentIndex < arr.length) {
                    if (fn(nextItem)) {
                        match = nextItem;
                    } else if (unlessFn(nextItem)) {
                        unlessMatch = nextItem;
                    } else {
                        currentIndex += 1;
                        nextItem = arr[currentIndex];
                    }
                }

                return match;
            };

            cfgText.forEach((textPiece, pieceIndex) => {
                const { insert, ...rest } = textPiece;
                const { attributes } = rest;
                const isLast = cfgText.length - 1 === pieceIndex;
                let lastLine = textLines[textLines.length - 1];

                if (cfgText.length - 1 === pieceIndex && insert.match(/^\r?\n$/)) return;

                const listPiece = findNextUnless(cfgText, pieceIndex + 1, textItem => {
                    return textItem.attributes && textItem.attributes.list;
                }, textItem => {
                    return textItem.insert.match(/\r?\n/gm);
                });

                let font = fontAssembled;
                if (attributes) {
                    if (attributes.bold && attributes.italic) {
                        font = boldItalicAssembled;
                    } else if (attributes.bold) {
                        font = boldAssembled;
                    } else if (attributes.italic) {
                        font = italicAssembled;
                    }
                }

                const lines = insert.match(/^\r?\n$/gm) ? [''] : insert.split(/\r?\n/);
                lines.forEach((line, index) => {
                    if (isLast && lines.length - 1 === index && line === '') return;

                    // New line
                    if (line === '') {
                        textLines.push(!(rest && rest.attributes && rest.attributes.list) ? [{ insert: '' }] : []);
                        lastLine = textLines[textLines.length - 1];
                        currentTextLine = '';
                        textLineWidth = 0;

                        return;
                    }

                    if (index > 0) {
                        textLines.push([]);
                        lastLine = textLines[textLines.length - 1];
                        currentTextLine = '';
                        textLineWidth = 0;
                    }

                    const isInList = listPiece && (lines.length === 1 || lines.length > 1 && index > 0);
                    let lineInsert = '';
                    lastLine = textLines[textLines.length - 1];
                    const words = line.split(/(\ )/gm);

                    let restObj = isInList ? {
                        ...rest,
                        attributes: {
                            ...rest.attributes,
                            isList: true,
                            list: listPiece.attributes.list,
                            listLineIndex: 0,
                        },
                    } : { ...rest };

                    words.forEach(word => {
                        const wordWidth = getTextWidth(word, font);

                        if (textLineWidth + wordWidth <= (isInList ? maxWidth - listOffset : maxWidth)) {
                            textLineWidth += wordWidth;
                            lineInsert += word;
                            currentTextLine += word;
                        } else {
                            lastLine.push({ insert: lineInsert, ...restObj });
                            textLines.push([]);
                            lastLine = textLines[textLines.length - 1];

                            if (isInList) {
                                restObj = {
                                    ...restObj,
                                    attributes: {
                                        ...restObj.attributes,
                                        listLineIndex: restObj.attributes.listLineIndex + 1,
                                    },
                                };
                            }

                            // Resetting variables with the word (without initial space)
                            textLineWidth = getTextWidth(word.replace(/^\ /, ''), font);
                            lineInsert = word.replace(/^\ /, '');
                            currentTextLine = word.replace(/^\ /, '');
                        }
                    });

                    lastLine.push({ insert: lineInsert, ...restObj });
                });
            });

            textLines.forEach((textLine) => {
                textLine.forEach((textPiece, index) => {
                    renderTextLine(textPiece, textLine.length - 1 === index, index);
                });
            });

            const textHeight = textGroup.getBBox().height;

            const hitArea = textGroup.addShape('rect', {
                name: 'text-group-hitarea',
                attrs: {
                    width: maxWidth,
                    height: textHeight,
                    fill: 'transparent',
                    cursor: 'pointer',
                },
            });
            hitArea.toBack();

            return textGroup;
        },

        afterDraw(cfg, group) {
            const wasShown = animated.indexOf(cfg.id) >= 0;
            if (wasShown) {
                group.attr('opacity', 1);
            } else {
                group.animate({
                    opacity: 1,
                }, {
                    easing: 'easeCubic',
                    duration: 300,
                    callback() {
                        animated.push(cfg.id);
                    },
                });
            }
        },

        // Setting "update" to "undefined" makes it trigger the "draw" method on any changes to the element
        update: undefined,

        /* update(cfg, item) {
            const text = this.getText(cfg.text, this._textWidth);
            const group = item.get('group');
            const textGroup = group.findById('text-group');

            const bBox = item.getKeyShape().getBBox();
            const boxHeight = this.getMessageHeight(cfg, text);
            const prevHeight = cfg.size[1];
            const newY = boxHeight / 2 * -1;

            const isEditing = item.hasState('text-editing');
            const doneEditing = boxHeight !== prevHeight && !isEditing;

            // Setting new text
            if (text !== textGroup._text) {
                textGroup.clear();

                this.drawText(cfg, group, textGroup);
                // textNode.attr('text', text);
            }

            if (boxHeight + 1 !== bBox.height || doneEditing) { // the bBox height is always 1 off
                const headerGroup = group.findById('header-group');
                const deleteGroup = group.findById('delete-group');
                const addMessageGroup = group.findById('add-message');
                const textGroup = group.findById('text-group');
                const messageNodes = group.findAll(child => child.get('name') === 'message');

                if (doneEditing) {
                    cfg.size = [
                        cfg.size[0],
                        boxHeight,
                    ];
                }

                messageNodes.forEach(child => {
                    child.attr('height', boxHeight);
                    if (doneEditing) child.attr('y', newY);
                });

                if (doneEditing) {
                    addMessageGroup.resetMatrix();
                    addMessageGroup.translate(0, boxHeight / 2 + 12 + 2);
                } else {
                    addMessageGroup.translate(0, boxHeight + 1 - bBox.height);
                }

                if (doneEditing) {
                    [headerGroup, deleteGroup, textGroup].forEach(group => group.translate(0, (prevHeight - boxHeight) / 2));
                }
            }

            if (this.updateExtras && typeof this.updateExtras === 'function') {
                this.updateExtras(cfg, item);
            }
        }, */

        getIconPath() {
            return 'M1.2712 8.80968C-0.777827 4.6028 2.92222 0 8.35301 0H8.64601C12.7075 0 16 2.75402 16 6.15128C16 9.93372 12.3342 13 7.81221 13H0.683695C0.39359 13 0.135074 12.8468 0.0387901 12.6179C-0.0574938 12.389 0.0294219 12.1342 0.255615 11.9823L2.05271 10.7751C2.13129 10.7223 2.15909 10.6326 2.12106 10.5546L1.2712 8.80968Z';
        },

        getFontStyling() {
            return {
                fill: '#292124',
                fontFamily: 'DM Sans',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: 13,
                lineHeight: 15,
                textAlign: 'left',
                textBaseline: 'top',
            };
        },

        getText(text, maxWidth = 264) {
            let lines = text.replace(/\r?\n$/m, '').split('\n');
            lines = lines.map(line => this.getTextLines(line, maxWidth)).flat();
            return lines.join('\n');
        },

        getTextLines(text, maxWidth = 264) {
            const fontStyling = assembleFont(this.getFontStyling());
            const words = text.split(' ');
            const lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = getTextWidth(`${currentLine} ${word}`, fontStyling);
                if (width < maxWidth) {
                    currentLine += " " + word;
                } else if (getTextWidth(word, fontStyling) > maxWidth) {
                    lines.push(currentLine);

                    const letters = word.split('');
                    let wordLine = letters[0];
                    for (let j = 1; j < letters.length; j++) {
                        const letter = letters[j];
                        const wordWidth = getTextWidth(wordLine + letter, fontStyling);
                        if (wordWidth < maxWidth) {
                            wordLine += letter;
                        } else {
                            lines.push(wordLine);
                            wordLine = letter;
                        }
                    }
                    currentLine = wordLine;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);

            return lines;
        },

        getMessageHeight(cfg, text) {
            const fontStyling = this.getFontStyling();
            const textHeight = getTextHeight(text, fontStyling.fontSize, fontStyling.lineHeight);

            return textHeight
                + 32 // the top and bottom padding
                + 16 + 8 // for the top header bar
                ;
        },

        getNodeLabel() {
            return 'Message';
        },

        getTextPlaceholder() {
            return 'Write the message here';
        },

        setState(name, value, item) {
            const shape = item.getKeyShape();
            const group = item.get('group');
            const groupParent = group.get('parent');

            const addMessageGroup = group.findById('add-message');
            const deleteGroup = group.findById('delete-group');

            const animateOptions = {
                duration: 100,
                easing: 'easeCubic',
            };

            switch (name) {
                case 'selected':
                    shape.animate({
                        stroke: value ? '#4182EF' : '#E8E7E5',
                        lineWidth: 1,
                    }, animateOptions);
                    break;

                case 'editing':
                    deleteGroup[value ? 'show' : 'hide']();
                    break;

                case 'hover':
                    shape.animate({
                        fill: value ? '#F8F7F5' : '#fff',
                    }, animateOptions);
                    break;

                case 'faded':
                case 'highlighted':
                    let opacity = 1;
                    if (item.hasState('faded')) opacity = 0.3;
                    if (item.hasState('highlighted')) opacity = 0.7;
                    group.animate({
                        opacity,
                    }, animateOptions);
                    break;

                case 'show-add':
                    if (item.hasState('faded')) break;
                    addMessageGroup.attr('opacity', value ? 1 : 0);
                    break;

                case 'text-editing':
                    // const editingChild = groupParent.get('children').find(child => child.get('item') && child.get('item').hasState('text-editing'));
                    // console.log(editingChild);
                    break;

                default:
                    break;
            }
        },
    };
};

export default (...args) => {
    G6.registerNode('amplify-message', getOptions(args), 'single-node');
};

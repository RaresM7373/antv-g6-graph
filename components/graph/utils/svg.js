export const getPathArray = (path) => {
    let pathArr = path;

    if (typeof path === 'string') {
        const pathSplit = path.split(/([a-zA-Z])/gmi);
        pathArr = [];

        pathSplit.forEach(splitString => {
            // Don't include empty strings
            if (!splitString) return;

            if (splitString.match(/[a-zA-Z]/gmi)) {
                pathArr.push(splitString);
            } else {
                pathArr[pathArr.length - 1] += ` ${splitString}`;
            }
        });

        pathArr = pathArr.map(pathItem => pathItem.split(' '));
    }

    return pathArr;
};

export const fixPath = (path) => {
    let pathArr = Array.isArray(path) ? path : getPathArray(path);

    // Converting "H" and "V" values to "L"
    // As the "path2Absolute" util function in @antv doesn't work 100% with them
    let preX = 0;
    let preY = 0;
    let startX = 0;
    let startY = 0;
    const [firstItem] = pathArr;

    // Getting the initial X and Y values
    if (firstItem[0] === 'M' || firstItem[0] === 'm') {
        preX = firstItem[1];
        preY = firstItem[2];
        startX = preX;
        startY = preY;
    }

    pathArr = pathArr.map(item => {
        switch (typeof item[0] === 'string' ? item[0].toUpperCase() : item[0]) {
            case 'Z':
                preX = startX;
                preY = startY;
                return ['Z'];

            case 'H':
                preX = item[1];
                return ['L', preX, preY];

            case 'V':
                preY = item[1];
                return ['L', preX, preY];

            case 'M':
                preX = item[item.length - 2];
                preY = item[item.length - 1];
            default:
                preX = item[item.length - 2];
                preY = item[item.length - 1];
                return item;
        }
    });

    return pathArr;
};

export const translatePath = (path, offsetX = 0, offsetY = 0) => {
    let pathArr = getPathArray(path);
    pathArr = fixPath(pathArr);

    const n = (val, offsetDirection = 'x') => {
        const offset = offsetDirection === 'x' ? offsetX : offsetY;
        return val + offset;
    };

    pathArr = pathArr.map(pathItem => {
        return pathItem.map((value, index) => {
            if (typeof value === 'string' && value.match(/[a-zA-Z]/gmi)) return value;

            const offsetDirection = index % 2 === 0 ? 'y' : 'x';
            return n(parseFloat(value), offsetDirection);
        });
    });

    return typeof path === 'string' ? pathArr.map(pathItem => pathItem.join(' ')).join() : pathArr;
};

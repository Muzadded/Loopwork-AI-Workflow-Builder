"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValueFromPath = getValueFromPath;
exports.interpolateTemplate = interpolateTemplate;
function getValueFromPath(path, context) {
    const parts = path.trim().split('.');
    const root = parts[0];
    let current;
    if (root === 'input') {
        current = context.initialInput;
    }
    else if (context.nodeOutputs[root]) {
        current = context.nodeOutputs[root];
    }
    else {
        return undefined;
    }
    for (let i = 1; i < parts.length; i++) {
        if (current === undefined || current === null)
            return undefined;
        current = current[parts[i]];
    }
    return current;
}
function interpolateTemplate(template, context) {
    if (!template)
        return '';
    return template.replace(/\{\{\s*([\w\.-]+)\s*\}\}/g, (match, path) => {
        const val = getValueFromPath(path, context);
        if (val === undefined || val === null)
            return '';
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
    });
}
//# sourceMappingURL=template-interpolator.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ConditionNodeExecutor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionNodeExecutor = void 0;
const common_1 = require("@nestjs/common");
const template_interpolator_1 = require("../utils/template-interpolator");
let ConditionNodeExecutor = ConditionNodeExecutor_1 = class ConditionNodeExecutor {
    logger = new common_1.Logger(ConditionNodeExecutor_1.name);
    async execute(node, context) {
        const startTime = Date.now();
        const config = node.config;
        const actualValue = (0, template_interpolator_1.getValueFromPath)(config.field || '', context);
        const targetValue = config.value;
        const operator = config.operator || 'equals';
        let conditionMet = false;
        switch (operator) {
            case 'equals':
                conditionMet = String(actualValue) === String(targetValue);
                break;
            case 'not_equals':
                conditionMet = String(actualValue) !== String(targetValue);
                break;
            case 'greater_than':
                conditionMet = Number(actualValue) > Number(targetValue);
                break;
            case 'less_than':
                conditionMet = Number(actualValue) < Number(targetValue);
                break;
            case 'contains':
                conditionMet = String(actualValue).toLowerCase().includes(String(targetValue).toLowerCase());
                break;
            case 'truthy':
                conditionMet = Boolean(actualValue);
                break;
            default:
                conditionMet = Boolean(actualValue);
        }
        const branch = conditionMet ? 'true' : 'false';
        this.logger.log(`Condition Node [${node.id}] evaluated (${config.field} ${operator} ${targetValue}) => ${conditionMet} (Branch: ${branch})`);
        return {
            nodeId: node.id,
            nodeType: 'condition',
            input: { field: config.field, operator, targetValue, actualValue },
            output: {
                conditionMet,
                branch,
                actualValue,
            },
            status: 'success',
            latencyMs: Date.now() - startTime,
        };
    }
};
exports.ConditionNodeExecutor = ConditionNodeExecutor;
exports.ConditionNodeExecutor = ConditionNodeExecutor = ConditionNodeExecutor_1 = __decorate([
    (0, common_1.Injectable)()
], ConditionNodeExecutor);
//# sourceMappingURL=condition-node.executor.js.map
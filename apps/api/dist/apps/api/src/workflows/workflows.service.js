"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkflowsService = WorkflowsService_1 = class WorkflowsService {
    prisma;
    logger = new common_1.Logger(WorkflowsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const definitionString = JSON.stringify(dto.definition);
        const created = await this.prisma.workflow.create({
            data: {
                name: dto.name,
                definition: definitionString,
            },
        });
        this.logger.log(`Created Workflow [${created.id}] - "${created.name}"`);
        return {
            ...created,
            definition: dto.definition,
        };
    }
    async findAll() {
        const workflows = await this.prisma.workflow.findMany({
            orderBy: { updatedAt: 'desc' },
        });
        return workflows.map((w) => ({
            id: w.id,
            name: w.name,
            createdAt: w.createdAt.toISOString(),
            updatedAt: w.updatedAt.toISOString(),
        }));
    }
    async findOne(id) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id },
        });
        if (!workflow) {
            throw new common_1.NotFoundException(`Workflow with ID ${id} not found`);
        }
        let parsedDefinition;
        try {
            parsedDefinition = JSON.parse(workflow.definition);
        }
        catch {
            parsedDefinition = { id: workflow.id, name: workflow.name, nodes: [], edges: [] };
        }
        return {
            id: workflow.id,
            name: workflow.name,
            definition: parsedDefinition,
            createdAt: workflow.createdAt.toISOString(),
            updatedAt: workflow.updatedAt.toISOString(),
        };
    }
    async update(id, dto) {
        await this.findOne(id);
        const updated = await this.prisma.workflow.update({
            where: { id },
            data: {
                name: dto.name,
                definition: dto.definition ? JSON.stringify(dto.definition) : undefined,
            },
        });
        this.logger.log(`Updated Workflow [${id}]`);
        return this.findOne(id);
    }
    async delete(id) {
        await this.findOne(id);
        await this.prisma.workflow.delete({ where: { id } });
        this.logger.log(`Deleted Workflow [${id}]`);
        return { success: true, id };
    }
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = WorkflowsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map
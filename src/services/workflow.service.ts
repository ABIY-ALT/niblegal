import { prisma } from '@/lib/prisma';
import { WorkflowModule, WorkflowStatus } from '@prisma/client';

export const WorkflowService = {
  async createDefinition(opts: {
    name: string;
    description?: string;
    module: WorkflowModule;
    createdById: string;
    initialFlowData?: any;
    initialConfigData?: any;
  }) {
    return prisma.$transaction(async (tx) => {
      const def = await tx.workflowDefinition.create({
        data: {
          name: opts.name,
          description: opts.description,
          module: opts.module,
          createdById: opts.createdById,
        }
      });
      
      const version = await tx.workflowVersion.create({
        data: {
          versionNumber: 1,
          flowData: opts.initialFlowData ?? { nodes: [], edges: [] },
          configData: opts.initialConfigData ?? {},
          definitionId: def.id,
        }
      });
      
      return { ...def, versions: [version] };
    });
  },

  async updateVersionFlow(versionId: string, flowData: any) {
    return prisma.workflowVersion.update({
      where: { id: versionId },
      data: { flowData }
    });
  },

  async publishVersion(definitionId: string, versionId: string) {
    return prisma.$transaction(async (tx) => {
      // Unpublish others
      await tx.workflowVersion.updateMany({
        where: { definitionId },
        data: { isPublished: false }
      });
      
      // Publish new one
      await tx.workflowVersion.update({
        where: { id: versionId },
        data: { isPublished: true }
      });
      
      // Update definition status
      await tx.workflowDefinition.update({
        where: { id: definitionId },
        data: { status: 'PUBLISHED' }
      });
    });
  },

  async getAllDefinitions() {
    return prisma.workflowDefinition.findMany({
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    });
  },
  
  async getDefinition(id: string) {
    return prisma.workflowDefinition.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } }
      }
    });
  },

  async createNewVersion(definitionId: string, baseVersionId: string) {
    const baseVersion = await prisma.workflowVersion.findUnique({ where: { id: baseVersionId } });
    if (!baseVersion) throw new Error('Base version not found');
    
    const latestVersion = await prisma.workflowVersion.findFirst({
      where: { definitionId },
      orderBy: { versionNumber: 'desc' }
    });
    
    return prisma.workflowVersion.create({
      data: {
        versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
        flowData: baseVersion.flowData ?? { nodes: [], edges: [] },
        configData: baseVersion.configData ?? {},
        definitionId,
      }
    });
  }
};

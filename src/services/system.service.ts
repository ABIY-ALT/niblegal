import { prisma } from '@/lib/prisma';

export const SystemService = {
  // ─── Settings ───────────────────────────────────────────────────────────
  
  async getSystemSettings() {
    return prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' }
    });
  },

  async updateSystemSettings(data: any) {
    return prisma.systemSettings.update({
      where: { id: 'default' },
      data
    });
  },

  async getSecuritySettings() {
    return prisma.securitySettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' }
    });
  },

  async updateSecuritySettings(data: any) {
    return prisma.securitySettings.update({
      where: { id: 'default' },
      data
    });
  },

  async getSmtpSettings() {
    return prisma.smtpSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' }
    });
  },

  async updateSmtpSettings(data: any) {
    return prisma.smtpSettings.update({
      where: { id: 'default' },
      data
    });
  },

  async getNumberingSettings() {
    return prisma.numberingSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' }
    });
  },

  async updateNumberingSettings(data: any) {
    return prisma.numberingSettings.update({
      where: { id: 'default' },
      data
    });
  },

  // ─── Feature Flags ──────────────────────────────────────────────────────
  
  async getFeatureFlags() {
    return prisma.featureFlag.findMany({ orderBy: { name: 'asc' } });
  },

  async toggleFeatureFlag(id: string, isEnabled: boolean) {
    return prisma.featureFlag.update({
      where: { id },
      data: { isEnabled }
    });
  },

  // ─── API Keys ───────────────────────────────────────────────────────────
  
  async getApiKeys() {
    return prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
  },

  async createApiKey(name: string, scopes: string[]) {
    // Generate secure key in real app
    const key = 'nib_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    return prisma.apiKey.create({
      data: { name, key, scopes }
    });
  },

  async revokeApiKey(id: string) {
    return prisma.apiKey.update({
      where: { id },
      data: { isActive: false }
    });
  },

  // ─── System Health / Logs ─────────────────────────────────────────────────
  
  async getApplicationLogs(limit: number = 50) {
    return prisma.applicationLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  },

  async logEvent(level: 'INFO'|'WARN'|'ERROR', source: string, message: string, meta?: any) {
    return prisma.applicationLog.create({
      data: { level, source, message, meta }
    });
  }
};

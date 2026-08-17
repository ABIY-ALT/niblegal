import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Mirrors src/data/store.ts `defaultUsers` so the mock-store-authenticated
// session (JWT payload.email) resolves to a real DB user for FK relations.
const ROLES = ['Admin', 'Legal Officer', 'Manager', 'Requesting Organ'];

const DEPARTMENTS = [
  { name: 'Legal', code: 'LEGAL' },
  { name: 'Operations', code: 'OPS' },
  { name: 'Finance', code: 'FIN' },
  { name: 'IT', code: 'IT' },
  { name: 'Credit', code: 'CRED' },
  { name: 'Compliance', code: 'COMP' },
  { name: 'Human Resources', code: 'HR' },
  { name: 'Treasury', code: 'TRSY' },
];

const USERS = [
  { name: 'Hana Tesfaye', role: 'Admin', department: 'Legal', email: 'h.tesfaye@nibbank.et' },
  { name: 'Yonas Bekele', role: 'Legal Officer', department: 'Legal', email: 'y.bekele@nibbank.et' },
  { name: 'Meron Alemu', role: 'Legal Officer', department: 'Legal', email: 'm.alemu@nibbank.et' },
  { name: 'Dr. Tadesse Girma', role: 'Manager', department: 'Legal', email: 't.girma@nibbank.et' },
  { name: 'Selamawit Wolde', role: 'Requesting Organ', department: 'Operations', email: 's.wolde@nibbank.et' },
  { name: 'Biruk Haile', role: 'Requesting Organ', department: 'Finance', email: 'b.haile@nibbank.et' },
  { name: 'Tigist Abebe', role: 'Requesting Organ', department: 'IT', email: 't.abebe@nibbank.et' },
  { name: 'Admin System', role: 'Admin', department: 'Legal', email: 'system@nibbank.et' },
];

const LEGAL_CATEGORIES = [
  { name: 'Contract Review', code: 'CONTRACT_REVIEW', defaultSlaHours: 72 },
  { name: 'Employment Law', code: 'EMPLOYMENT_LAW', defaultSlaHours: 72 },
  { name: 'Litigation', code: 'LITIGATION', defaultSlaHours: 48 },
  { name: 'Regulatory Compliance', code: 'REGULATORY_COMPLIANCE', defaultSlaHours: 48 },
  { name: 'Procurement', code: 'PROCUREMENT', defaultSlaHours: 72 },
  { name: 'Banking Operations', code: 'BANKING_OPERATIONS', defaultSlaHours: 48 },
  { name: 'Risk Management', code: 'RISK_MANAGEMENT', defaultSlaHours: 48 },
  { name: 'Corporate Governance', code: 'CORPORATE_GOVERNANCE', defaultSlaHours: 72 },
  { name: 'Customer Dispute', code: 'CUSTOMER_DISPUTE', defaultSlaHours: 48 },
  { name: 'Recovery', code: 'RECOVERY', defaultSlaHours: 48 },
  { name: 'AML/KYC', code: 'AML_KYC', defaultSlaHours: 24 },
  { name: 'NBE Directives', code: 'NBE_DIRECTIVES', defaultSlaHours: 48 },
  { name: 'Intellectual Property', code: 'INTELLECTUAL_PROPERTY', defaultSlaHours: 72 },
  { name: 'Other', code: 'OTHER', defaultSlaHours: 72 },
];

const SLA_RULES = [
  { priority: 'CRITICAL', slaHours: 24, isBusinessHours: false },
  { priority: 'URGENT', slaHours: 36, isBusinessHours: false },
  { priority: 'HIGH', slaHours: 48, isBusinessHours: false },
  { priority: 'MEDIUM', slaHours: 72, isBusinessHours: false },
  { priority: 'LOW', slaHours: 120, isBusinessHours: true }, // ~5 business days
];

const KNOWLEDGE_CATEGORIES = [
  { name: 'Contract Templates', code: 'CONTRACT_TEMPLATES', icon: 'FileText' },
  { name: 'Legal Opinion Templates', code: 'LEGAL_OPINION_TEMPLATES', icon: 'Gavel' },
  { name: 'Standard Clauses', code: 'STANDARD_CLAUSES', icon: 'BookOpen' },
  { name: 'Policies', code: 'POLICIES', icon: 'ShieldCheck' },
  { name: 'Procedures', code: 'PROCEDURES', icon: 'ListChecks' },
  { name: 'NBE Directives', code: 'NBE_DIRECTIVES', icon: 'Landmark' },
  { name: 'Laws & Regulations', code: 'LAWS_REGULATIONS', icon: 'Scale' },
  { name: 'Internal Circulars', code: 'INTERNAL_CIRCULARS', icon: 'FileSpreadsheet' },
  { name: 'Legal Research', code: 'LEGAL_RESEARCH', icon: 'Search' },
  { name: 'Articles', code: 'ARTICLES', icon: 'Newspaper' },
  { name: 'Court Decisions', code: 'COURT_DECISIONS', icon: 'Building2' },
  { name: 'FAQ', code: 'FAQ', icon: 'HelpCircle' },
  { name: 'Training Materials', code: 'TRAINING_MATERIALS', icon: 'GraduationCap' },
];

async function main() {
  console.log('Seeding roles...');
  const roleByName = {};
  for (const name of ROLES) {
    roleByName[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Seeding departments...');
  const deptByName = {};
  for (const d of DEPARTMENTS) {
    deptByName[d.name] = await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
  }

  console.log('Seeding users...');
  const defaultPasswordHash = await bcrypt.hash('ChangeMe123!', 12);
  const userByEmail = {};
  for (const u of USERS) {
    const [firstName, ...rest] = u.name.split(' ');
    userByEmail[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: defaultPasswordHash,
        firstName,
        lastName: rest.join(' ') || firstName,
        roleId: roleByName[u.role].id,
        departmentId: deptByName[u.department].id,
      },
    });
  }

  console.log('Seeding legal request categories...');
  for (const c of LEGAL_CATEGORIES) {
    await prisma.legalRequestCategory.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  console.log('Seeding SLA rules...');
  for (const r of SLA_RULES) {
    const existing = await prisma.slaRule.findFirst({
      where: { categoryId: null, priority: r.priority },
    });
    if (!existing) {
      await prisma.slaRule.create({ data: r });
    }
  }

  console.log('Seeding knowledge categories...');
  for (const c of KNOWLEDGE_CATEGORIES) {
    await prisma.knowledgeCategory.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // LAHD's archive action upserts this category by name only (code-less) —
  // pre-seed it here so its code stays populated if created via this script.
  await prisma.knowledgeCategory.upsert({
    where: { name: 'Legal Opinions' },
    update: {},
    create: { name: 'Legal Opinions', code: 'LEGAL_OPINIONS', description: 'Archived legal opinions from the Legal Advisory Help Desk', icon: 'Gavel' },
  });

  console.log('Seeding litigation cases...');
  const manager = userByEmail['t.girma@nibbank.et'];
  const officer1 = userByEmail['y.bekele@nibbank.et'];
  const officer2 = userByEmail['m.alemu@nibbank.et'];
  const LITIGATION_CASES = [
    {
      caseNumber: 'LIT-2026-000041', title: 'Nib Bank vs. Global Tech', category: 'BREACH_OF_CONTRACT',
      status: 'ACTIVE', riskLevel: 'HIGH', bankRole: 'PLAINTIFF', opposingParty: 'Global Tech PLC',
      court: 'Federal High Court', exposureAmount: 4200000, filedDate: new Date('2026-03-10'),
      description: 'Breach of the IT services agreement resulting in undelivered infrastructure.',
      officer: officer1, hearing: { type: 'HEARING', daysFromNow: 0, location: 'Federal High Court' },
    },
    {
      caseNumber: 'LIT-2026-000038', title: 'Abebe T. vs Nib Bank', category: 'LABOR_DISPUTE',
      status: 'ACTIVE', riskLevel: 'MEDIUM', bankRole: 'DEFENDANT', opposingParty: 'Abebe Tesfaye',
      court: 'Supreme Court', exposureAmount: 850000, filedDate: new Date('2026-01-22'),
      description: 'Wrongful termination claim filed by a former branch employee.',
      officer: officer2, hearing: { type: 'VERDICT', daysFromNow: 1, location: 'Supreme Court' },
    },
    {
      caseNumber: 'LIT-2026-000045', title: 'Nib Bank vs. Zeta PLC', category: 'DEBT_RECOVERY',
      status: 'ACTIVE', riskLevel: 'HIGH', bankRole: 'PLAINTIFF', opposingParty: 'Zeta PLC',
      court: 'First Instance Court', exposureAmount: 6100000, filedDate: new Date('2026-04-02'),
      description: 'Recovery action on a defaulted commercial loan facility.',
      officer: officer1, hearing: { type: 'FILING', daysFromNow: 4, location: 'First Instance Court' },
    },
    {
      caseNumber: 'LIT-2026-000029', title: 'Nib Bank vs. Kebede Family Trust', category: 'PROPERTY_CLAIM',
      status: 'ON_HOLD', riskLevel: 'LOW', bankRole: 'DEFENDANT', opposingParty: 'Kebede Family Trust',
      court: 'First Instance Court', exposureAmount: 320000, filedDate: new Date('2025-11-05'),
      description: 'Dispute over collateral property title pending mediation.',
      officer: officer2,
    },
    {
      caseNumber: 'LIT-2026-000052', title: 'National Bank of Ethiopia Compliance Review', category: 'REGULATORY',
      status: 'PENDING', riskLevel: 'CRITICAL', bankRole: 'DEFENDANT', opposingParty: 'National Bank of Ethiopia',
      court: 'Administrative Tribunal', exposureAmount: 1500000, filedDate: new Date('2026-05-18'),
      description: 'Regulatory inquiry into AML/KYC control gaps flagged during audit.',
      officer: manager,
    },
    {
      caseNumber: 'LIT-2026-000012', title: 'Nib Bank vs. Solomon Retail Traders', category: 'DEBT_RECOVERY',
      status: 'SETTLED', riskLevel: 'LOW', bankRole: 'PLAINTIFF', opposingParty: 'Solomon Retail Traders',
      court: 'First Instance Court', exposureAmount: 210000, filedDate: new Date('2025-08-14'),
      closedDate: new Date('2026-02-01'), outcome: 'Settled for full outstanding balance plus costs.',
      officer: officer1,
    },
    {
      caseNumber: 'LIT-2026-000005', title: 'Mekdes A. vs Nib Bank', category: 'CUSTOMER_DISPUTE',
      status: 'WON', riskLevel: 'MEDIUM', bankRole: 'DEFENDANT', opposingParty: 'Mekdes Alemu',
      court: 'Supreme Court', exposureAmount: 95000, filedDate: new Date('2025-06-20'),
      closedDate: new Date('2025-12-10'), outcome: 'Claim dismissed in favor of the bank.',
      officer: officer2,
    },
  ];

  for (const c of LITIGATION_CASES) {
    const { hearing, officer, ...rest } = c;
    const existing = await prisma.litigationCase.findUnique({ where: { caseNumber: c.caseNumber } });
    if (existing) continue;
    const created = await prisma.litigationCase.create({
      data: {
        ...rest,
        assignedOfficerId: officer?.id,
        createdById: manager.id,
      },
    });
    if (hearing) {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + hearing.daysFromNow);
      scheduledAt.setHours(10, 0, 0, 0);
      await prisma.litigationHearing.create({
        data: {
          caseId: created.id,
          type: hearing.type,
          scheduledAt,
          location: hearing.location,
        },
      });
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
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
  for (const u of USERS) {
    const [firstName, ...rest] = u.name.split(' ');
    await prisma.user.upsert({
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

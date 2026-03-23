import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema/users';
import { workspaces } from './schema/workspaces';
import { workspaceMembers } from './schema/workspace-members';
import { channels } from './schema/channels';
import { channelMembers } from './schema/channel-members';
import { messages } from './schema/messages';
import { reactions } from './schema/reactions';
import { notifications } from './schema/notifications';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

const PASSWORD = 'password123';
const AV = (s: string): string => `https://api.dicebear.com/9.x/avataaars/svg?seed=${s}`;

const SEED_USERS = [
  { email: 'alice@flowchat.dev', username: 'alice', displayName: 'Alice Chen', avatarUrl: AV('alice') },
  { email: 'bob@flowchat.dev', username: 'bob', displayName: 'Bob Martinez', avatarUrl: AV('bob') },
  { email: 'charlie@flowchat.dev', username: 'charlie', displayName: 'Charlie Davis', avatarUrl: AV('charlie') },
  { email: 'diana@flowchat.dev', username: 'diana', displayName: 'Diana Park', avatarUrl: AV('diana') },
  { email: 'eve@flowchat.dev', username: 'eve', displayName: 'Eve Thompson', avatarUrl: AV('eve') },
  { email: 'frank@flowchat.dev', username: 'frank', displayName: 'Frank Wilson', avatarUrl: AV('frank') },
  { email: 'grace@flowchat.dev', username: 'grace', displayName: 'Grace Lee', avatarUrl: AV('grace') },
  { email: 'henry@flowchat.dev', username: 'henry', displayName: 'Henry Brown', avatarUrl: AV('henry') },
  { email: 'iris@flowchat.dev', username: 'iris', displayName: 'Iris Rodriguez', avatarUrl: AV('iris') },
  { email: 'jack@flowchat.dev', username: 'jack', displayName: 'Jack Taylor', avatarUrl: AV('jack') },
  { email: 'kate@flowchat.dev', username: 'kate', displayName: 'Kate Anderson', avatarUrl: AV('kate') },
  { email: 'liam@flowchat.dev', username: 'liam', displayName: 'Liam Johnson', avatarUrl: AV('liam') },
  { email: 'maya@flowchat.dev', username: 'maya', displayName: 'Maya Singh', avatarUrl: AV('maya') },
  { email: 'noah@flowchat.dev', username: 'noah', displayName: 'Noah Kim', avatarUrl: AV('noah') },
  { email: 'olivia@flowchat.dev', username: 'olivia', displayName: 'Olivia White', avatarUrl: AV('olivia') },
  { email: 'peter@flowchat.dev', username: 'peter', displayName: 'Peter Jones', avatarUrl: AV('peter') },
  { email: 'quinn@flowchat.dev', username: 'quinn', displayName: 'Quinn Davis', avatarUrl: AV('quinn') },
  { email: 'ryan@flowchat.dev', username: 'ryan', displayName: 'Ryan Miller', avatarUrl: AV('ryan') },
  { email: 'sara@flowchat.dev', username: 'sara', displayName: 'Sara Wilson', avatarUrl: AV('sara') },
  { email: 'tom@flowchat.dev', username: 'tom', displayName: 'Tom Harris', avatarUrl: AV('tom') },
];

type InsertedUser = { id: string; email: string; username: string };
type Db = NodePgDatabase<Record<string, never>>;

function ago(days: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function mins(base: Date, m: number): Date {
  return new Date(base.getTime() + m * 60_000);
}

type MsgEntry = {
  channelId: string;
  userId: string;
  content: string;
  createdAt: Date;
  editedAt?: Date;
};

async function msgs(db: Db, entries: MsgEntry[]): Promise<Array<{ id: string }>> {
  if (entries.length === 0) return [];
  return db
    .insert(messages)
    .values(entries.map(e => ({ ...e, editedAt: e.editedAt ?? null })))
    .returning({ id: messages.id });
}

async function react(db: Db, msgId: string, userId: string, emoji: string): Promise<void> {
  await db.insert(reactions).values({ messageId: msgId, userId, emoji }).onConflictDoNothing();
}

async function makeChannel(
  db: Db,
  workspaceId: string,
  name: string,
  createdById: string,
  opts: { description?: string; isPrivate?: boolean; isDirectMessage?: boolean } = {},
): Promise<{ id: string; name: string }> {
  const [ch] = await db
    .insert(channels)
    .values({ workspaceId, name, createdById, ...opts })
    .returning();
  if (!ch) throw new Error(`Failed to create channel #${name}`);
  return ch;
}

async function joinChannel(db: Db, channelId: string, userIds: string[]): Promise<void> {
  await db.insert(channelMembers).values(userIds.map(userId => ({ channelId, userId })));
}

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool) as Db;

  logger.info('Starting comprehensive seed...');

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ── Users ──────────────────────────────────────────────────────────────────
  const insertedUsers: InsertedUser[] = [];
  for (const u of SEED_USERS) {
    const rows = await db
      .insert(users)
      .values({ ...u, passwordHash })
      .onConflictDoNothing()
      .returning({ id: users.id, email: users.email, username: users.username });
    if (rows[0]) insertedUsers.push(rows[0]);
  }

  if (insertedUsers.length === 0) {
    logger.warn('Already seeded — run db:reset first to reseed');
    await pool.end();
    return;
  }

  const [alice, bob, charlie, diana, eve, frank, grace, henry, iris, jack,
    kate, liam, maya, noah, olivia, peter, quinn, ryan, sara, tom] =
    insertedUsers as [InsertedUser, InsertedUser, InsertedUser, InsertedUser,
      InsertedUser, InsertedUser, InsertedUser, InsertedUser, InsertedUser,
      InsertedUser, InsertedUser, InsertedUser, InsertedUser, InsertedUser,
      InsertedUser, InsertedUser, InsertedUser, InsertedUser, InsertedUser,
      InsertedUser];

  logger.info(`Seeded ${insertedUsers.length} users`);

  // ── Workspace 1: Acme Corp ─────────────────────────────────────────────────
  const [acme] = await db
    .insert(workspaces)
    .values({ name: 'Acme Corp', slug: 'acme-corp', ownerId: alice.id })
    .returning();
  if (!acme) throw new Error('Failed to create Acme Corp');

  const acmeAll = [alice, bob, charlie, diana, eve, frank, grace, henry, iris, jack, kate, liam, maya, noah, olivia];
  const acmeEngineers = [alice, bob, charlie, frank, henry, iris, jack, liam, noah];
  const acmeDesigners = [alice, charlie, diana, grace, kate, maya];

  await db.insert(workspaceMembers).values([
    { workspaceId: acme.id, userId: alice.id, role: 'owner' },
    { workspaceId: acme.id, userId: bob.id, role: 'admin' },
    { workspaceId: acme.id, userId: charlie.id, role: 'admin' },
    ...acmeAll.slice(3).map(u => ({ workspaceId: acme.id, userId: u.id, role: 'member' as const })),
  ]);

  const acmeGeneral = await makeChannel(db, acme.id, 'general', alice.id, { description: 'Company-wide chat' });
  const acmeAnnounce = await makeChannel(db, acme.id, 'announcements', alice.id, { description: 'Official announcements only' });
  const acmeEng = await makeChannel(db, acme.id, 'engineering', bob.id, { description: 'Code, PRs, and deployments' });
  const acmeDesign = await makeChannel(db, acme.id, 'design', charlie.id, { description: 'Design system and Figma reviews' });
  const acmeProduct = await makeChannel(db, acme.id, 'product', diana.id, { description: 'Roadmap and feature planning' });
  const acmeRandom = await makeChannel(db, acme.id, 'random', alice.id, { description: 'Anything goes' });
  const acmeLeadership = await makeChannel(db, acme.id, 'leadership', alice.id, { isPrivate: true, description: 'Leadership team only' });

  await joinChannel(db, acmeGeneral.id, acmeAll.map(u => u.id));
  await joinChannel(db, acmeAnnounce.id, acmeAll.map(u => u.id));
  await joinChannel(db, acmeRandom.id, acmeAll.map(u => u.id));
  await joinChannel(db, acmeEng.id, acmeEngineers.map(u => u.id));
  await joinChannel(db, acmeDesign.id, acmeDesigners.map(u => u.id));
  await joinChannel(db, acmeProduct.id, [alice, bob, diana, eve, frank, grace].map(u => u.id));
  await joinChannel(db, acmeLeadership.id, [alice, bob, charlie].map(u => u.id));

  // Acme DMs
  const dmAliceBob = await makeChannel(db, acme.id, 'dm-alice-bob', alice.id, { isDirectMessage: true });
  const dmBobCharlie = await makeChannel(db, acme.id, 'dm-bob-charlie', bob.id, { isDirectMessage: true });
  const dmCharlieDiana = await makeChannel(db, acme.id, 'dm-charlie-diana', charlie.id, { isDirectMessage: true });
  await joinChannel(db, dmAliceBob.id, [alice.id, bob.id]);
  await joinChannel(db, dmBobCharlie.id, [bob.id, charlie.id]);
  await joinChannel(db, dmCharlieDiana.id, [charlie.id, diana.id]);

  // ── Workspace 2: Side Project ──────────────────────────────────────────────
  const [sp] = await db
    .insert(workspaces)
    .values({ name: 'Side Project', slug: 'side-project', ownerId: bob.id })
    .returning();
  if (!sp) throw new Error('Failed to create Side Project');

  await db.insert(workspaceMembers).values([
    { workspaceId: sp.id, userId: bob.id, role: 'owner' },
    { workspaceId: sp.id, userId: diana.id, role: 'admin' },
    { workspaceId: sp.id, userId: alice.id, role: 'member' },
    { workspaceId: sp.id, userId: charlie.id, role: 'member' },
    { workspaceId: sp.id, userId: eve.id, role: 'member' },
  ]);

  const spGeneral = await makeChannel(db, sp.id, 'general', bob.id);
  const spBackend = await makeChannel(db, sp.id, 'backend', bob.id, { description: 'API design and DB discussions' });
  const spFrontend = await makeChannel(db, sp.id, 'frontend', diana.id, { description: 'UI components and styling' });

  await joinChannel(db, spGeneral.id, [bob, diana, alice, charlie, eve].map(u => u.id));
  await joinChannel(db, spBackend.id, [bob, alice, charlie].map(u => u.id));
  await joinChannel(db, spFrontend.id, [diana, eve, bob].map(u => u.id));

  // ── Workspace 3: Empty Startup ─────────────────────────────────────────────
  const [emptyStartup] = await db
    .insert(workspaces)
    .values({ name: 'Empty Startup', slug: 'empty-startup', ownerId: eve.id })
    .returning();
  if (!emptyStartup) throw new Error('Failed to create Empty Startup');
  await db.insert(workspaceMembers).values({ workspaceId: emptyStartup.id, userId: eve.id, role: 'owner' });
  const esGeneral = await makeChannel(db, emptyStartup.id, 'general', eve.id);
  await joinChannel(db, esGeneral.id, [eve.id]);

  // ── Workspace 4: Big Team ──────────────────────────────────────────────────
  const [bigTeam] = await db
    .insert(workspaces)
    .values({ name: 'Big Team', slug: 'big-team', ownerId: diana.id })
    .returning();
  if (!bigTeam) throw new Error('Failed to create Big Team');

  await db.insert(workspaceMembers).values(
    insertedUsers.map(u => ({
      workspaceId: bigTeam.id,
      userId: u.id,
      role: (u.id === diana.id ? 'owner' : 'member') as 'owner' | 'member',
    })),
  );

  const btGeneral = await makeChannel(db, bigTeam.id, 'general', diana.id, { description: 'Everyone' });
  const btAnnounce = await makeChannel(db, bigTeam.id, 'announcements', diana.id);
  await joinChannel(db, btGeneral.id, insertedUsers.map(u => u.id));
  await joinChannel(db, btAnnounce.id, [diana.id]);

  logger.info('Workspaces, channels, and memberships seeded');

  // ══════════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ══════════════════════════════════════════════════════════════════════════

  // ── Acme #general ─────────────────────────────────────────────────────────
  const gBase = ago(28);
  const gMsgs = await msgs(db, [
    { channelId: acmeGeneral.id, userId: alice.id, content: "Welcome everyone to Acme Corp's workspace! Excited to have the whole team here 🎉", createdAt: gBase },
    { channelId: acmeGeneral.id, userId: bob.id, content: 'This is going to make cross-team communication so much easier.', createdAt: mins(gBase, 3) },
    { channelId: acmeGeneral.id, userId: charlie.id, content: 'Finally — no more 200-reply email threads 🙌', createdAt: mins(gBase, 7) },
    { channelId: acmeGeneral.id, userId: diana.id, content: "I've set up #product — join us if you want to stay in the loop on the roadmap.", createdAt: mins(gBase, 12) },
    { channelId: acmeGeneral.id, userId: eve.id, content: 'Marketing is in the house 🎤 Check out #marketing for campaign updates!', createdAt: mins(gBase, 18) },
    { channelId: acmeGeneral.id, userId: frank.id, content: 'Heads up — the office coffee machine is broken. ETA on repair is tomorrow 😢', createdAt: ago(25, 8) },
    { channelId: acmeGeneral.id, userId: grace.id, content: 'This is a code red situation, Frank', createdAt: mins(ago(25, 8), 5) },
    { channelId: acmeGeneral.id, userId: henry.id, content: 'I hit three different cafes this morning. The struggle is real.', createdAt: mins(ago(25, 8), 12) },
    { channelId: acmeGeneral.id, userId: alice.id, content: 'Just got word the repair is happening today at noon. Hang in there team!', createdAt: mins(ago(25, 8), 45) },
    { channelId: acmeGeneral.id, userId: iris.id, content: '👏👏👏', createdAt: mins(ago(25, 8), 47) },
    { channelId: acmeGeneral.id, userId: alice.id, content: '🎂 Happy birthday @kate! Hope your day is amazing!', createdAt: ago(20, 10) },
    { channelId: acmeGeneral.id, userId: bob.id, content: 'Happy birthday Kate!! 🎉🎉', createdAt: mins(ago(20, 10), 2) },
    { channelId: acmeGeneral.id, userId: charlie.id, content: 'HBD! 🎂', createdAt: mins(ago(20, 10), 4) },
    { channelId: acmeGeneral.id, userId: diana.id, content: 'Happy birthday!! Cake in the kitchen at 3pm 🍰', createdAt: mins(ago(20, 10), 6) },
    { channelId: acmeGeneral.id, userId: kate.id, content: 'Aww thank you all!! See you at 3 🥰', createdAt: mins(ago(20, 10), 20) },
    { channelId: acmeGeneral.id, userId: alice.id, content: 'Reminder: Q3 all-hands is tomorrow at 2pm in the main conference room. Dial-in link is in your calendar.', createdAt: ago(14, 9) },
    { channelId: acmeGeneral.id, userId: noah.id, content: 'Will there be a recording for remote folks?', createdAt: mins(ago(14, 9), 15) },
    { channelId: acmeGeneral.id, userId: alice.id, content: "Yes! We'll post it here within 24 hours.", createdAt: mins(ago(14, 9), 20) },
    { channelId: acmeGeneral.id, userId: alice.id, content: "Recording from yesterday's all-hands is now up — great meeting everyone!", createdAt: ago(7, 11) },
    { channelId: acmeGeneral.id, userId: bob.id, content: 'Really excited about the new product direction!', createdAt: mins(ago(7, 11), 10) },
    { channelId: acmeGeneral.id, userId: maya.id, content: 'The roadmap presentation was super clear. Thanks Alice and Diana!', createdAt: mins(ago(7, 11), 18) },
    { channelId: acmeGeneral.id, userId: frank.id, content: 'Anyone up for lunch at the Thai place today? 12:30pm?', createdAt: ago(3, 11) },
    { channelId: acmeGeneral.id, userId: henry.id, content: "I'm in!", createdAt: mins(ago(3, 11), 3) },
    { channelId: acmeGeneral.id, userId: iris.id, content: 'Count me in 🍜', createdAt: mins(ago(3, 11), 5) },
    { channelId: acmeGeneral.id, userId: jack.id, content: 'Sorry, got a call at 12:30. Next time!', createdAt: mins(ago(3, 11), 8) },
    { channelId: acmeGeneral.id, userId: alice.id, content: 'Friendly reminder: performance reviews open next Monday. Please complete self-assessments by Friday.', createdAt: ago(1, 10) },
    { channelId: acmeGeneral.id, userId: liam.id, content: 'Got it, thanks for the heads up!', createdAt: mins(ago(1, 10), 30) },
  ]);
  if (gMsgs[0]) {
    await react(db, gMsgs[0].id, bob.id, '🎉');
    await react(db, gMsgs[0].id, charlie.id, '🎉');
    await react(db, gMsgs[0].id, diana.id, '🎉');
    await react(db, gMsgs[0].id, frank.id, '🎉');
    await react(db, gMsgs[0].id, eve.id, '🚀');
  }
  if (gMsgs[2]) await react(db, gMsgs[2].id, alice.id, '😂');
  if (gMsgs[10]) {
    for (const u of [bob, charlie, diana, eve, frank, grace]) {
      await react(db, gMsgs[10].id, u.id, '🎂');
    }
  }
  if (gMsgs[20]) {
    await react(db, gMsgs[20].id, alice.id, '❤️');
    await react(db, gMsgs[20].id, bob.id, '👏');
  }

  // ── Acme #engineering ─────────────────────────────────────────────────────
  const eBase = ago(26, 10);
  const eMsgs = await msgs(db, [
    { channelId: acmeEng.id, userId: bob.id, content: 'Just opened PR #142: migrate auth middleware to JWT RS256. Please review when you get a chance — @charlie @frank', createdAt: eBase },
    { channelId: acmeEng.id, userId: charlie.id, content: 'On it. Quick question — are we rotating key pairs automatically or is that a separate ticket?', createdAt: mins(eBase, 15) },
    { channelId: acmeEng.id, userId: bob.id, content: 'Separate ticket (#147). For now just the algorithm migration. Key rotation is phase 2.', createdAt: mins(eBase, 20) },
    { channelId: acmeEng.id, userId: frank.id, content: 'LGTM on the middleware changes. Left a few comments on test coverage though.', createdAt: mins(eBase, 90) },
    { channelId: acmeEng.id, userId: bob.id, content: 'Good catch, added tests for token expiry edge cases. PR updated.', createdAt: mins(eBase, 110) },
    { channelId: acmeEng.id, userId: charlie.id, content: 'Approved ✅ Nice work Bob!', createdAt: mins(eBase, 125) },
    { channelId: acmeEng.id, userId: henry.id, content: '🚨 Prod alert: elevated 5xx on /api/messages (~12% error rate). Investigating now.', createdAt: ago(22, 14) },
    { channelId: acmeEng.id, userId: alice.id, content: "On it. What's the error rate at right now?", createdAt: mins(ago(22, 14), 1) },
    { channelId: acmeEng.id, userId: henry.id, content: "Down to 3%. Root cause looks like a slow DB query after this morning's migration.", createdAt: mins(ago(22, 14), 4) },
    { channelId: acmeEng.id, userId: bob.id, content: "Found it — the messages.created_at index wasn't being used for the pagination query. Fix coming.", createdAt: mins(ago(22, 14), 7) },
    { channelId: acmeEng.id, userId: henry.id, content: 'Error rate back to baseline. Great catch Bob!', createdAt: mins(ago(22, 14), 22) },
    { channelId: acmeEng.id, userId: bob.id, content: 'Fix deployed ✅ Added index hint + a latency monitor alert so we catch this earlier next time.', createdAt: mins(ago(22, 14), 30) },
    { channelId: acmeEng.id, userId: iris.id, content: 'Proposing we adopt Zod for API response validation on the client side too, not just the server. Thoughts?', createdAt: ago(18, 11) },
    { channelId: acmeEng.id, userId: charlie.id, content: 'Strong +1. We already have the schemas in packages/types — just need to wire them up in the query hooks.', createdAt: mins(ago(18, 11), 20) },
    { channelId: acmeEng.id, userId: jack.id, content: 'One concern: runtime validation on every API response could add overhead. Have you benchmarked it?', createdAt: mins(ago(18, 11), 35) },
    { channelId: acmeEng.id, userId: iris.id, content: 'Ran some numbers — negligible on our payload sizes (<1ms). Worth it for the type safety.', createdAt: mins(ago(18, 11), 50) },
    { channelId: acmeEng.id, userId: bob.id, content: "Agreed. Let's do it. Iris, can you open a ticket and take the first pass?", createdAt: mins(ago(18, 11), 55) },
    { channelId: acmeEng.id, userId: iris.id, content: 'On it! 💪', createdAt: mins(ago(18, 11), 57) },
    { channelId: acmeEng.id, userId: liam.id, content: "Heads up: I'm doing the Redis 6→7 upgrade this Friday at 6am. Estimated downtime: <5 min. Will announce in #general before starting.", createdAt: ago(12, 15) },
    { channelId: acmeEng.id, userId: alice.id, content: 'Approved. Make sure the rollback plan is in the runbook first.', createdAt: mins(ago(12, 15), 10) },
    { channelId: acmeEng.id, userId: liam.id, content: 'Already added at https://internal.acme/runbooks/redis-upgrade — reviewed by Noah ✅', createdAt: mins(ago(12, 15), 15) },
    { channelId: acmeEng.id, userId: frank.id, content: 'Redis upgrade went smooth! Zero issues during the window. Monitoring is clean 🟢', createdAt: ago(8, 7) },
    { channelId: acmeEng.id, userId: charlie.id, content: "Anyone else seeing slow CI? My last 3 runs averaged 14 minutes — we're usually under 8.", createdAt: ago(5, 13) },
    { channelId: acmeEng.id, userId: bob.id, content: "Same here. Think it's the new integration test suite Noah added last week.", createdAt: mins(ago(5, 13), 8) },
    { channelId: acmeEng.id, userId: noah.id, content: "Fair point — I'll look into sharding the Playwright suite across workers.", createdAt: mins(ago(5, 13), 20) },
    { channelId: acmeEng.id, userId: charlie.id, content: 'Also worth running unit and integration tests as parallel CI jobs rather than sequential.', createdAt: mins(ago(5, 13), 25) },
    { channelId: acmeEng.id, userId: noah.id, content: 'CI sharding update: unit/integration now parallel, Playwright sharded across 3 workers. Average build time: 6m 40s 🎉', createdAt: ago(2, 11) },
    { channelId: acmeEng.id, userId: charlie.id, content: "That's incredible! Great work Noah 👏", createdAt: mins(ago(2, 11), 5) },
    { channelId: acmeEng.id, userId: bob.id, content: '🔥🔥🔥', createdAt: mins(ago(2, 11), 7) },
    { channelId: acmeEng.id, userId: alice.id, content: 'Beautiful. This is the kind of improvement that compounds over time.', createdAt: mins(ago(2, 11), 15) },
  ]);
  if (eMsgs[5]) await react(db, eMsgs[5].id, bob.id, '🎉');
  if (eMsgs[11]) {
    await react(db, eMsgs[11].id, alice.id, '👍');
    await react(db, eMsgs[11].id, charlie.id, '👍');
    await react(db, eMsgs[11].id, henry.id, '💪');
  }
  if (eMsgs[26]) {
    await react(db, eMsgs[26].id, alice.id, '🚀');
    await react(db, eMsgs[26].id, bob.id, '🔥');
    await react(db, eMsgs[26].id, charlie.id, '🎉');
    await react(db, eMsgs[26].id, iris.id, '👏');
    await react(db, eMsgs[26].id, frank.id, '😍');
  }

  // ── Acme #design ──────────────────────────────────────────────────────────
  const dBase = ago(24, 11);
  const dMsgs = await msgs(db, [
    { channelId: acmeDesign.id, userId: charlie.id, content: 'Sharing updated design system tokens for Q3. Primary palette has shifted — cooler blues, warmer neutrals. Figma: https://figma.com/file/acme-design-system-v4', createdAt: dBase },
    { channelId: acmeDesign.id, userId: grace.id, content: 'Love the new primary blue! The warmer neutrals feel much more approachable.', createdAt: mins(dBase, 15) },
    { channelId: acmeDesign.id, userId: diana.id, content: 'I agree. Did you check text-on-background contrast ratios for accessibility?', createdAt: mins(dBase, 25) },
    { channelId: acmeDesign.id, userId: charlie.id, content: 'Yes — all combinations pass WCAG AA. Darkest text on lightest background passes AAA too.', createdAt: mins(dBase, 40) },
    { channelId: acmeDesign.id, userId: diana.id, content: 'Perfect ✅', createdAt: mins(dBase, 45) },
    { channelId: acmeDesign.id, userId: kate.id, content: 'Sharing new onboarding flow designs. 3 changes: (1) skip button on step 2, (2) inline validation instead of a toast, (3) progress indicator at top. Figma: https://figma.com/file/onboarding-v2', createdAt: ago(19, 10) },
    { channelId: acmeDesign.id, userId: grace.id, content: 'The inline validation is a great call. The toast felt disconnected from the field with the error.', createdAt: mins(ago(19, 10), 20) },
    { channelId: acmeDesign.id, userId: alice.id, content: 'Love the progress indicator. Step 3 has a lot of text though — could we use a visual aid to break it up?', createdAt: mins(ago(19, 10), 35) },
    { channelId: acmeDesign.id, userId: maya.id, content: "The skip button placement merges with the CTA on small screens. Worth checking at 375px in Figma.", createdAt: mins(ago(19, 10), 65) },
    { channelId: acmeDesign.id, userId: kate.id, content: 'Nice catch Maya! Will fix and share an updated frame. Also adding an illustration to step 3, Alice.', createdAt: mins(ago(19, 10), 72) },
    { channelId: acmeDesign.id, userId: charlie.id, content: 'Quick poll for dashboard empty states — (A) illustration + CTA, (B) simple text + CTA, (C) animated micro-interaction?', createdAt: ago(13, 14) },
    { channelId: acmeDesign.id, userId: grace.id, content: 'Vote: A — illustrations make empty states feel less abandoned', createdAt: mins(ago(13, 14), 10) },
    { channelId: acmeDesign.id, userId: maya.id, content: 'Vote: A — but keep them lightweight SVGs', createdAt: mins(ago(13, 14), 12) },
    { channelId: acmeDesign.id, userId: diana.id, content: 'Vote: B — crisp copy is underrated. Illustrations can feel generic.', createdAt: mins(ago(13, 14), 20) },
    { channelId: acmeDesign.id, userId: alice.id, content: 'Vote: A — agreed on SVG only though', createdAt: mins(ago(13, 14), 25) },
    { channelId: acmeDesign.id, userId: charlie.id, content: 'Result: A wins (3 votes). Illustrations must be SVG and match the design system style. Creating a library next sprint.', createdAt: mins(ago(13, 14), 60) },
    { channelId: acmeDesign.id, userId: kate.id, content: 'Updated onboarding designs are live — all feedback addressed: simplified step 3 with an illustration, fixed mobile skip button. Ready for dev handoff!', createdAt: ago(6, 10) },
    { channelId: acmeDesign.id, userId: grace.id, content: 'Looks great Kate! The step 3 illustration really helps.', createdAt: mins(ago(6, 10), 15) },
    { channelId: acmeDesign.id, userId: alice.id, content: 'Approved for dev handoff ✅ Tagging @bob to pick this up next sprint.', createdAt: mins(ago(6, 10), 30) },
  ]);
  if (dMsgs[0]) {
    await react(db, dMsgs[0].id, grace.id, '❤️');
    await react(db, dMsgs[0].id, maya.id, '🔥');
    await react(db, dMsgs[0].id, kate.id, '👍');
  }
  if (dMsgs[16]) {
    await react(db, dMsgs[16].id, alice.id, '🎉');
    await react(db, dMsgs[16].id, grace.id, '👏');
    await react(db, dMsgs[16].id, charlie.id, '🚀');
  }

  // ── Acme #random ──────────────────────────────────────────────────────────
  const rBase = ago(21, 17);
  const rMsgs = await msgs(db, [
    { channelId: acmeRandom.id, userId: henry.id, content: "Reminder that the vending machine on floor 2 now has sparkling water. Best news I've had all week.", createdAt: rBase },
    { channelId: acmeRandom.id, userId: iris.id, content: "I've already been there twice. Zero regrets.", createdAt: mins(rBase, 5) },
    { channelId: acmeRandom.id, userId: jack.id, content: 'Does it have lime flavor??? 🙏', createdAt: mins(rBase, 8) },
    { channelId: acmeRandom.id, userId: henry.id, content: 'Grapefruit AND lime. We are living in the future.', createdAt: mins(rBase, 12) },
    { channelId: acmeRandom.id, userId: jack.id, content: "I'm sprinting to the vending machine rn", createdAt: mins(rBase, 14) },
    { channelId: acmeRandom.id, userId: grace.id, content: 'Anyone catch the game last night? That 4th quarter comeback was insane 🏀', createdAt: ago(17, 20) },
    { channelId: acmeRandom.id, userId: frank.id, content: 'Watched every second! Nearly knocked my laptop off the desk when they tied it up.', createdAt: mins(ago(17, 20), 10) },
    { channelId: acmeRandom.id, userId: bob.id, content: "I forgot it was on. Someone tell me there's a good highlight reel.", createdAt: mins(ago(17, 20), 15) },
    { channelId: acmeRandom.id, userId: grace.id, content: 'Check sports_highlights.com — the last 3 minutes alone are worth it.', createdAt: mins(ago(17, 20), 20) },
    { channelId: acmeRandom.id, userId: maya.id, content: "Does anyone have a book recommendation? I've been in a reading slump.", createdAt: ago(15, 19) },
    { channelId: acmeRandom.id, userId: olivia.id, content: '"Project Hail Mary" by Andy Weir. I read it in 2 days — one of the best sci-fi books I\'ve ever read.', createdAt: mins(ago(15, 19), 15) },
    { channelId: acmeRandom.id, userId: liam.id, content: 'Second "Project Hail Mary"! The middle act completely blindsided me.', createdAt: mins(ago(15, 19), 20) },
    { channelId: acmeRandom.id, userId: noah.id, content: '"Tomorrow, and Tomorrow, and Tomorrow" if you want something literary. Different vibe but equally unputdownable.', createdAt: mins(ago(15, 19), 25) },
    { channelId: acmeRandom.id, userId: maya.id, content: 'OK "Project Hail Mary" it is. Will report back!', createdAt: mins(ago(15, 19), 40) },
    { channelId: acmeRandom.id, userId: peter.id, content: "Remote workers: what's everyone's desk setup? Trying to justify a monitor arm to my partner 😅", createdAt: ago(10, 12) },
    { channelId: acmeRandom.id, userId: quinn.id, content: '27" ultrawide + portrait monitor for docs. Game changer for writing long reports.', createdAt: mins(ago(10, 12), 15) },
    { channelId: acmeRandom.id, userId: sara.id, content: 'Standing desk + ergonomic chair was the best investment. My back stopped hurting after a week.', createdAt: mins(ago(10, 12), 20) },
    { channelId: acmeRandom.id, userId: tom.id, content: 'I use a kitchen table and a $30 mousepad. Am I doing this wrong?', createdAt: mins(ago(10, 12), 25) },
    { channelId: acmeRandom.id, userId: henry.id, content: 'Tom working out here with the authentic "this is fine" setup 🔥🐕', createdAt: mins(ago(10, 12), 27) },
    { channelId: acmeRandom.id, userId: tom.id, content: '😂😂', createdAt: mins(ago(10, 12), 30) },
    { channelId: acmeRandom.id, userId: ryan.id, content: "I just discovered our office building has a rooftop. Why has nobody told me about this!??", createdAt: ago(4, 13) },
    { channelId: acmeRandom.id, userId: kate.id, content: "Rooftop meetings in summer are elite. It's kind of a secret so... shhh 🤫", createdAt: mins(ago(4, 13), 5) },
    { channelId: acmeRandom.id, userId: grace.id, content: 'Wait until you see the view at sunset. You\'re welcome in advance.', createdAt: mins(ago(4, 13), 8) },
    { channelId: acmeRandom.id, userId: ryan.id, content: "I'm going up RIGHT NOW", createdAt: mins(ago(4, 13), 10) },
  ]);
  if (rMsgs[0]) {
    await react(db, rMsgs[0].id, iris.id, '😂');
    await react(db, rMsgs[0].id, jack.id, '❤️');
  }
  if (rMsgs[17]) await react(db, rMsgs[17].id, henry.id, '😂');
  if (rMsgs[20]) {
    await react(db, rMsgs[20].id, kate.id, '😱');
    await react(db, rMsgs[20].id, grace.id, '👀');
    await react(db, rMsgs[20].id, frank.id, '🤣');
  }

  // ── Acme #announcements ───────────────────────────────────────────────────
  await msgs(db, [
    { channelId: acmeAnnounce.id, userId: alice.id, content: '📢 Welcome to #announcements — official company updates only. Discussion belongs in #general.', createdAt: ago(30) },
    { channelId: acmeAnnounce.id, userId: alice.id, content: "🚀 Thrilled to announce our Series A funding of $12M! This allows us to double the team and accelerate the roadmap. Full details: https://acmecorp.com/press/series-a", createdAt: ago(21, 10) },
    { channelId: acmeAnnounce.id, userId: alice.id, content: '👋 Please welcome Grace Lee, our new Head of Design, joining from Stripe! Say hi in #general!', createdAt: ago(16, 9) },
    { channelId: acmeAnnounce.id, userId: bob.id, content: '🔧 Scheduled maintenance this Saturday 2am–4am UTC. The app will be read-only. All teams have been notified.', createdAt: ago(10, 15) },
    { channelId: acmeAnnounce.id, userId: alice.id, content: '🎯 Q3 OKRs are published in Notion. Review your team objectives and flag concerns to your manager by EOW.', createdAt: ago(6, 9) },
    { channelId: acmeAnnounce.id, userId: alice.id, content: '🏖️ Company retreat is scheduled for Oct 14–16 in Asheville, NC. Travel info and booking instructions coming to your email today.', createdAt: ago(2, 10), editedAt: ago(2, 11) },
  ]);

  // ── Acme #leadership (private) ────────────────────────────────────────────
  await msgs(db, [
    { channelId: acmeLeadership.id, userId: alice.id, content: "Series A term sheet is signed. Keeping quiet until the PR goes out next week. Bob and Charlie — please don't discuss outside this channel yet.", createdAt: ago(22, 10) },
    { channelId: acmeLeadership.id, userId: bob.id, content: 'Understood. Excited! Will stay buttoned up.', createdAt: mins(ago(22, 10), 5) },
    { channelId: acmeLeadership.id, userId: charlie.id, content: 'Same. Will the blog post be ready in time?', createdAt: mins(ago(22, 10), 10) },
    { channelId: acmeLeadership.id, userId: alice.id, content: "Yes — Eve's team is working on it now. They just don't know the full amount yet.", createdAt: mins(ago(22, 10), 15) },
    { channelId: acmeLeadership.id, userId: alice.id, content: 'Headcount plan for next 6 months: 3 senior engineers, 1 designer, 1 PM, 1 data analyst. Bob and Charlie — please draft JDs for the engineering roles by next Friday.', createdAt: ago(15, 9) },
    { channelId: acmeLeadership.id, userId: bob.id, content: 'On it. Should we go through a recruiter or try direct outreach first?', createdAt: mins(ago(15, 9), 20) },
    { channelId: acmeLeadership.id, userId: alice.id, content: "Start with direct outreach — our network first. Recruiters if we're stuck after 4 weeks.", createdAt: mins(ago(15, 9), 30) },
    { channelId: acmeLeadership.id, userId: charlie.id, content: 'Makes sense. I have solid contacts from my last company I can reach out to.', createdAt: mins(ago(15, 9), 35) },
    { channelId: acmeLeadership.id, userId: bob.id, content: 'JDs are drafted. Sharing the Google Doc with both of you. Please review by Thursday so we can post Friday.', createdAt: ago(5, 11) },
    { channelId: acmeLeadership.id, userId: alice.id, content: 'Reviewed. Two notes: (1) bump the Staff role requirement to 5+ years, (2) add "distributed systems experience" to requirements.', createdAt: mins(ago(5, 11), 60) },
    { channelId: acmeLeadership.id, userId: bob.id, content: 'Updated both. Will post to LinkedIn and Greenhouse tomorrow morning.', createdAt: mins(ago(5, 11), 75) },
  ]);

  // ── Acme DMs ──────────────────────────────────────────────────────────────
  await msgs(db, [
    { channelId: dmAliceBob.id, userId: alice.id, content: "Hey Bob — quick sync on the Series A announcement. Are you planning to say anything to your team before it goes live?", createdAt: ago(9, 14) },
    { channelId: dmAliceBob.id, userId: bob.id, content: "No, staying quiet as discussed. Did get a few questions from Frank and Henry about 'exciting news' though... the grapevine is fast 😅", createdAt: mins(ago(9, 14), 5) },
    { channelId: dmAliceBob.id, userId: alice.id, content: 'Haha it always is. Just 48 more hours. Thanks for keeping it under wraps!', createdAt: mins(ago(9, 14), 10) },
    { channelId: dmAliceBob.id, userId: bob.id, content: "You got it. Also — Charlie's draft for the Staff Engineer JD is really strong.", createdAt: mins(ago(9, 14), 15) },
    { channelId: dmAliceBob.id, userId: alice.id, content: 'Agreed! I left some comments. Can you make sure he sees them today?', createdAt: mins(ago(9, 14), 18) },
    { channelId: dmAliceBob.id, userId: bob.id, content: 'Will do ✅', createdAt: mins(ago(9, 14), 20) },
  ]);

  await msgs(db, [
    { channelId: dmBobCharlie.id, userId: bob.id, content: "Charlie — saw Alice's comments on the JD. Can you update today? She wants to post by Friday.", createdAt: ago(6, 16) },
    { channelId: dmBobCharlie.id, userId: charlie.id, content: "Yep, on it right after the design review. Done by 5pm.", createdAt: mins(ago(6, 16), 8) },
    { channelId: dmBobCharlie.id, userId: bob.id, content: "Perfect. Also — do you have capacity to take the CI sharding work? Noah shipped the spike but we need someone to productionize it.", createdAt: mins(ago(6, 16), 12) },
    { channelId: dmBobCharlie.id, userId: charlie.id, content: "I'll pick it up next week once the JD is posted.", createdAt: mins(ago(6, 16), 20) },
    { channelId: dmBobCharlie.id, userId: bob.id, content: "Sounds good. Assigning the ticket to you.", createdAt: mins(ago(6, 16), 22) },
  ]);

  await msgs(db, [
    { channelId: dmCharlieDiana.id, userId: diana.id, content: "Charlie — for the onboarding designs Kate shipped, any concerns from an engineering perspective before I mark them as dev-ready?", createdAt: ago(5, 15) },
    { channelId: dmCharlieDiana.id, userId: charlie.id, content: "Looks good overall! One thing: the illustration on step 3 — make sure we get it as an SVG, not PNG. I'll flag it in the Figma comments.", createdAt: mins(ago(5, 15), 15) },
    { channelId: dmCharlieDiana.id, userId: diana.id, content: "Good catch, I'll let Kate know now.", createdAt: mins(ago(5, 15), 18) },
    { channelId: dmCharlieDiana.id, userId: charlie.id, content: "Also the inline validation — are we doing that client-side only, or does the API need to return field-level errors too?", createdAt: mins(ago(5, 15), 25) },
    { channelId: dmCharlieDiana.id, userId: diana.id, content: "API already returns field-level errors in the error shape. Should wire up nicely with React Hook Form's setError.", createdAt: mins(ago(5, 15), 30) },
    { channelId: dmCharlieDiana.id, userId: charlie.id, content: "Perfect. OK, I'll mark it ready. Will start the implementation next sprint.", createdAt: mins(ago(5, 15), 35) },
  ]);

  // ── Side Project #general ─────────────────────────────────────────────────
  const spgBase = ago(15, 10);
  const spgMsgs = await msgs(db, [
    { channelId: spGeneral.id, userId: bob.id, content: "Alright team — project kickoff! Goal: habit tracker app in 8 weeks. Backend Node.js, frontend React. Let's go 💪", createdAt: spgBase },
    { channelId: spGeneral.id, userId: alice.id, content: "Love it. I'll take auth flow and user profile. @charlie you want habits CRUD?", createdAt: mins(spgBase, 10) },
    { channelId: spGeneral.id, userId: charlie.id, content: 'Yep, claiming habits CRUD! Starting with schema design tonight.', createdAt: mins(spgBase, 15) },
    { channelId: spGeneral.id, userId: diana.id, content: 'Frontend: landing page, dashboard with streak visualization, settings. Thoughts?', createdAt: mins(spgBase, 20) },
    { channelId: spGeneral.id, userId: eve.id, content: "Love the streak visualization — that's the dopamine hit that keeps people coming back.", createdAt: mins(spgBase, 25) },
    { channelId: spGeneral.id, userId: bob.id, content: "Week 2 update: auth is live in staging, habits CRUD has basic endpoints. Diana's dashboard mockups are looking 🔥", createdAt: ago(8, 9) },
    { channelId: spGeneral.id, userId: charlie.id, content: 'Good progress! Added streak calculation logic today — timezone edge cases were surprisingly tricky.', createdAt: mins(ago(8, 9), 30) },
    { channelId: spGeneral.id, userId: alice.id, content: 'Timezone bugs are the worst 😅 Good that we tackled it early though.', createdAt: mins(ago(8, 9), 40) },
    { channelId: spGeneral.id, userId: diana.id, content: 'Dashboard is interactive in Figma — feedback welcome! figma.com/side-project-dashboard', createdAt: mins(ago(8, 9), 60) },
    { channelId: spGeneral.id, userId: eve.id, content: 'The empty state is adorable!! So motivating.', createdAt: mins(ago(8, 9), 75) },
    { channelId: spGeneral.id, userId: bob.id, content: 'Standup: Auth ✅, Habits API 80%, Dashboard scaffolded. Next: notifications and streak recovery.', createdAt: ago(3, 9) },
    { channelId: spGeneral.id, userId: diana.id, content: 'Also need to decide on the color scheme — warm/motivating or clean/minimal?', createdAt: mins(ago(3, 9), 20) },
    { channelId: spGeneral.id, userId: eve.id, content: "Warm! It should feel like a reward, not a spreadsheet 😂", createdAt: mins(ago(3, 9), 25) },
    { channelId: spGeneral.id, userId: charlie.id, content: '+1 warm. Orange/amber? Associated with motivation and achievement in color theory.', createdAt: mins(ago(3, 9), 30) },
    { channelId: spGeneral.id, userId: diana.id, content: "On it — will mock up two warm palettes and share tomorrow.", createdAt: mins(ago(3, 9), 35) },
  ]);
  if (spgMsgs[0]) {
    await react(db, spgMsgs[0].id, alice.id, '🚀');
    await react(db, spgMsgs[0].id, charlie.id, '💪');
    await react(db, spgMsgs[0].id, diana.id, '🎉');
    await react(db, spgMsgs[0].id, eve.id, '🔥');
  }

  // ── Side Project #backend ─────────────────────────────────────────────────
  await msgs(db, [
    { channelId: spBackend.id, userId: charlie.id, content: "Draft schema for habits:\n```sql\nhabits: id, user_id, name, description, schedule (jsonb), target_count, color, icon, archived, created_at\nhabit_logs: id, habit_id, user_id, completed_at, notes\n```", createdAt: ago(14, 11) },
    { channelId: spBackend.id, userId: bob.id, content: 'Looks solid. I like the JSONB schedule approach — much more flexible than an enum for weekly day configs.', createdAt: mins(ago(14, 11), 20) },
    { channelId: spBackend.id, userId: alice.id, content: "JSONB is fine, but we should validate the structure strictly with a Zod schema in the API layer.", createdAt: mins(ago(14, 11), 45) },
    { channelId: spBackend.id, userId: charlie.id, content: "Already planned! I'll define `scheduleSchema` in Zod and run it through the validation middleware.", createdAt: mins(ago(14, 11), 50) },
    { channelId: spBackend.id, userId: bob.id, content: 'For streak calculation — app layer or DB (materialized view)?', createdAt: ago(11, 14) },
    { channelId: spBackend.id, userId: charlie.id, content: "App layer for now. streak.service.ts fetches 90 days of logs and computes it. Fast enough at this scale.", createdAt: mins(ago(11, 14), 15) },
    { channelId: spBackend.id, userId: bob.id, content: "Makes sense. Easy to move to a DB function later if needed.", createdAt: mins(ago(11, 14), 20) },
    { channelId: spBackend.id, userId: alice.id, content: 'Pagination for habit logs — cursor-based? We might have users with 1000+ logs.', createdAt: ago(9, 10) },
    { channelId: spBackend.id, userId: charlie.id, content: 'Yes, cursor-based on completed_at DESC. Modeled it after the FlowChat approach — same pattern we all know.', createdAt: mins(ago(9, 10), 15) },
    { channelId: spBackend.id, userId: alice.id, content: 'Perfect. Consistent and correct. LGTM.', createdAt: mins(ago(9, 10), 20) },
  ]);

  // ── Side Project #frontend ────────────────────────────────────────────────
  await msgs(db, [
    { channelId: spFrontend.id, userId: diana.id, content: 'Starting frontend: Vite + React + TypeScript + Tailwind. TanStack Query for server state, Zustand for UI state. Same stack as FlowChat since we all know it.', createdAt: ago(13, 14) },
    { channelId: spFrontend.id, userId: eve.id, content: "Smart call. Does that mean shadcn/ui too?", createdAt: mins(ago(13, 14), 10) },
    { channelId: spFrontend.id, userId: diana.id, content: "Yes! I'll extend it with our brand colors.", createdAt: mins(ago(13, 14), 15) },
    { channelId: spFrontend.id, userId: bob.id, content: 'Streak visualization — library or custom? Thinking something like a GitHub contribution grid.', createdAt: ago(10, 11) },
    { channelId: spFrontend.id, userId: diana.id, content: "Custom. Charting libraries are overkill for a heatmap grid — it's just a 7×13 table with color coding.", createdAt: mins(ago(10, 11), 20) },
    { channelId: spFrontend.id, userId: eve.id, content: "I can help with the streak component! I've built similar calendar heatmaps before.", createdAt: mins(ago(10, 11), 25) },
    { channelId: spFrontend.id, userId: diana.id, content: "That would be amazing Eve! I'll share the Figma spec tomorrow.", createdAt: mins(ago(10, 11), 30) },
    { channelId: spFrontend.id, userId: eve.id, content: "Streak heatmap is done! 🎉 CSS grid, fully responsive, keyboard accessible. PR up for review.", createdAt: ago(5, 15) },
    { channelId: spFrontend.id, userId: diana.id, content: 'Reviewed — this is incredible Eve! Merged! 🚀', createdAt: mins(ago(5, 15), 60) },
    { channelId: spFrontend.id, userId: bob.id, content: 'Wow, that was fast! Great work 🙌', createdAt: mins(ago(5, 15), 65) },
  ]);

  // ── Big Team #general ─────────────────────────────────────────────────────
  const btBase = ago(5, 9);
  const btMsgs = await msgs(db, [
    { channelId: btGeneral.id, userId: diana.id, content: "Welcome to Big Team! Bringing all 20 of us together for better cross-functional visibility. Excited to work with everyone!", createdAt: btBase },
    { channelId: btGeneral.id, userId: alice.id, content: 'Great initiative Diana! This will really help with coordination.', createdAt: mins(btBase, 5) },
    { channelId: btGeneral.id, userId: bob.id, content: 'Welcome all! Drop an intro below 👋', createdAt: mins(btBase, 8) },
    { channelId: btGeneral.id, userId: frank.id, content: "Hey everyone — Frank here, DevOps lead. Happy to be here!", createdAt: mins(btBase, 15) },
    { channelId: btGeneral.id, userId: grace.id, content: "Grace — Head of Design. Really excited about the talent in this workspace!", createdAt: mins(btBase, 18) },
    { channelId: btGeneral.id, userId: henry.id, content: "Henry, backend engineering. Let's build amazing things together!", createdAt: mins(btBase, 22) },
    { channelId: btGeneral.id, userId: iris.id, content: 'Iris here — frontend + design systems. 🙌', createdAt: mins(btBase, 27) },
    { channelId: btGeneral.id, userId: jack.id, content: 'Jack — full-stack. Stoked to be in this group!', createdAt: mins(btBase, 30) },
    { channelId: btGeneral.id, userId: kate.id, content: 'Kate — product design. Love seeing this many talented people in one place!', createdAt: mins(btBase, 33) },
    { channelId: btGeneral.id, userId: liam.id, content: 'Liam — infra/platform engineering. If the servers are on fire, that\'s my problem 😅', createdAt: mins(btBase, 36) },
    { channelId: btGeneral.id, userId: peter.id, content: "Peter — QA Engineering. I'll be the one poking holes in everyone's code 🐛", createdAt: mins(btBase, 40) },
    { channelId: btGeneral.id, userId: quinn.id, content: "Quinn — Data Analytics. If you need a metric, I've probably got it!", createdAt: mins(btBase, 45) },
    { channelId: btGeneral.id, userId: ryan.id, content: "Ryan — Mobile (iOS). Looking forward to working with everyone!", createdAt: mins(btBase, 50) },
    { channelId: btGeneral.id, userId: sara.id, content: "Sara — Product Marketing. Let's make something people love!", createdAt: mins(btBase, 55) },
    { channelId: btGeneral.id, userId: tom.id, content: "Tom — Security Engineering. Here to make sure y'all write safe code 😄", createdAt: mins(btBase, 60) },
    { channelId: btGeneral.id, userId: diana.id, content: 'First team standup is Monday at 10am — joining link in your calendar. Async folks: written notes posted here immediately after.', createdAt: ago(2, 9) },
    { channelId: btGeneral.id, userId: noah.id, content: 'Will the standup be recorded?', createdAt: mins(ago(2, 9), 15) },
    { channelId: btGeneral.id, userId: diana.id, content: "No recording, but detailed written notes will be posted right after. Fully async-friendly!", createdAt: mins(ago(2, 9), 20) },
    { channelId: btGeneral.id, userId: olivia.id, content: "Perfect — I'm in a different timezone so written notes are really helpful. Thank you!", createdAt: mins(ago(2, 9), 25) },
  ]);
  if (btMsgs[0]) {
    for (const u of [alice, bob, charlie, frank, grace, henry]) {
      await react(db, btMsgs[0].id, u.id, '🎉');
    }
  }
  if (btMsgs[9]) await react(db, btMsgs[9].id, frank.id, '😂');

  // ── Notifications ──────────────────────────────────────────────────────────
  await db.insert(notifications).values([
    { userId: frank.id, workspaceId: acme.id, type: 'workspace_invited', title: 'You were added to Acme Corp', body: 'Alice Chen added you to the Acme Corp workspace.', actionUrl: `/workspaces/${acme.id}`, isRead: true, createdAt: ago(28, 9) },
    { userId: henry.id, workspaceId: acme.id, type: 'channel_invited', title: 'You were added to #engineering', body: 'Bob Martinez added you to the engineering channel.', actionUrl: `/workspaces/${acme.id}/channels/${acmeEng.id}`, isRead: true, createdAt: ago(27, 10) },
    { userId: kate.id, workspaceId: acme.id, type: 'channel_invited', title: 'You were added to #design', body: 'Charlie Davis added you to the design channel.', actionUrl: `/workspaces/${acme.id}/channels/${acmeDesign.id}`, isRead: false, createdAt: ago(3, 14) },
    { userId: olivia.id, workspaceId: bigTeam.id, type: 'workspace_invited', title: 'You were added to Big Team', body: 'Diana Park added you to the Big Team workspace.', actionUrl: `/workspaces/${bigTeam.id}`, isRead: false, createdAt: ago(5, 9) },
    { userId: peter.id, workspaceId: bigTeam.id, type: 'workspace_invited', title: 'You were added to Big Team', body: 'Diana Park added you to the Big Team workspace.', actionUrl: `/workspaces/${bigTeam.id}`, isRead: true, createdAt: ago(5, 9) },
    { userId: ryan.id, workspaceId: bigTeam.id, type: 'workspace_invited', title: 'You were added to Big Team', body: 'Diana Park added you to the Big Team workspace.', actionUrl: `/workspaces/${bigTeam.id}`, isRead: false, createdAt: ago(5, 9) },
    { userId: tom.id, workspaceId: sp.id, type: 'workspace_invited', title: 'You were added to Big Team', body: 'Diana Park added you to the Big Team workspace.', actionUrl: `/workspaces/${bigTeam.id}`, isRead: false, createdAt: ago(5, 9) },
  ]);

  logger.info('Messages, reactions, and notifications seeded');

  // ── Summary ────────────────────────────────────────────────────────────────
  logger.info('');
  logger.info('═══════════════════════════════════════════════════');
  logger.info('  Seed complete!');
  logger.info('═══════════════════════════════════════════════════');
  logger.info(`  Password for all accounts: "${PASSWORD}"`);
  logger.info('');
  logger.info('  Workspaces:');
  logger.info('    Acme Corp     — alice(owner), bob+charlie(admin), 15 members, 7 channels + 3 DMs');
  logger.info('    Side Project  — bob(owner), diana(admin), 5 members, 3 channels');
  logger.info('    Empty Startup — eve(owner), solo, no messages (empty-state testing)');
  logger.info('    Big Team      — diana(owner), all 20 users, 2 channels');
  logger.info('');
  logger.info('  Suggested test logins:');
  logger.info('    alice@flowchat.dev — owner of Acme, access to #leadership (private)');
  logger.info('    bob@flowchat.dev   — admin, engineering-focused, Side Project owner');
  logger.info('    diana@flowchat.dev — product, Side Project, Big Team owner');
  logger.info('    eve@flowchat.dev   — marketing, Empty Startup owner (empty-state)');
  logger.info('    noah@flowchat.dev  — engineering, Big Team only from Acme perspective');
  logger.info('═══════════════════════════════════════════════════');

  await pool.end();
}

seed().catch((err: unknown) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});

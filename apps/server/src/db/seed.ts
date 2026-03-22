import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema/users';
import { workspaces } from './schema/workspaces';
import { workspaceMembers } from './schema/workspace-members';
import { channels } from './schema/channels';
import { channelMembers } from './schema/channel-members';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

const PASSWORD = 'password123';

const SEED_USERS = Array.from({ length: 20 }, (_, i) => {
  const num = i + 1;
  const name = `user${String(num).padStart(2, '0')}`;
  return {
    email: `${name}@flowchat.dev`,
    username: name,
    displayName: `User ${num}`,
  };
});

SEED_USERS[0] = { email: 'alice@flowchat.dev', username: 'alice', displayName: 'Alice' };
SEED_USERS[1] = { email: 'bob@flowchat.dev', username: 'bob', displayName: 'Bob' };
SEED_USERS[2] = { email: 'charlie@flowchat.dev', username: 'charlie', displayName: 'Charlie' };
SEED_USERS[3] = { email: 'diana@flowchat.dev', username: 'diana', displayName: 'Diana' };
SEED_USERS[4] = { email: 'eve@flowchat.dev', username: 'eve', displayName: 'Eve' };

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);

  logger.info('Seeding database...');

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ── Insert 20 users ──────────────────────────────────────────────────────
  const insertedUsers: Array<{ id: string; email: string; username: string }> = [];

  for (const user of SEED_USERS) {
    const result = await db
      .insert(users)
      .values({
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        passwordHash,
        avatarUrl: null,
      })
      .onConflictDoNothing()
      .returning({ id: users.id, email: users.email, username: users.username });

    if (result[0]) {
      insertedUsers.push(result[0]);
      logger.info(`Seeded user: ${user.email}`);
    }
  }

  if (insertedUsers.length === 0) {
    logger.info('Users already exist, skipping workspace/channel seeding');
    await pool.end();
    return;
  }

  const alice = insertedUsers[0];
  const bob = insertedUsers[1];
  const charlie = insertedUsers[2];
  const diana = insertedUsers[3];
  const eve = insertedUsers[4];

  if (!alice || !bob || !charlie || !diana || !eve) {
    throw new Error('Expected at least 5 seeded users (alice, bob, charlie, diana, eve)');
  }

  // ── Workspace 1: "Acme Corp" — owned by Alice, 10 members ───────────────
  const [acme] = await db
    .insert(workspaces)
    .values({ name: 'Acme Corp', slug: 'acme-corp', ownerId: alice.id })
    .returning();

  if (!acme) throw new Error('Failed to create Acme workspace');

  await db.insert(workspaceMembers).values({ workspaceId: acme.id, userId: alice.id, role: 'owner' });
  await db.insert(workspaceMembers).values({ workspaceId: acme.id, userId: bob.id, role: 'admin' });
  for (let i = 2; i < 10; i++) {
    const member = insertedUsers[i];
    if (!member) throw new Error(`Expected inserted user at index ${i}`);
    await db.insert(workspaceMembers).values({
      workspaceId: acme.id,
      userId: member.id,
      role: 'member',
    });
  }
  logger.info('Seeded workspace: Acme Corp (alice=owner, bob=admin, 8 members)');

  // Acme channels
  const [acmeGeneral] = await db
    .insert(channels)
    .values({ workspaceId: acme.id, name: 'general', createdById: alice.id })
    .returning();
  const [acmeRandom] = await db
    .insert(channels)
    .values({ workspaceId: acme.id, name: 'random', createdById: alice.id })
    .returning();
  const [acmeEngineering] = await db
    .insert(channels)
    .values({ workspaceId: acme.id, name: 'engineering', createdById: bob.id })
    .returning();
  const [acmeDesign] = await db
    .insert(channels)
    .values({ workspaceId: acme.id, name: 'design', createdById: charlie.id })
    .returning();
  const [acmePrivate] = await db
    .insert(channels)
    .values({ workspaceId: acme.id, name: 'leadership', isPrivate: true, createdById: alice.id })
    .returning();

  if (!acmeGeneral || !acmeRandom || !acmeEngineering || !acmeDesign || !acmePrivate) {
    throw new Error('Failed to create Acme channels');
  }

  // All 10 Acme members join #general
  for (let i = 0; i < 10; i++) {
    const member = insertedUsers[i];
    if (!member) throw new Error(`Expected inserted user at index ${i}`);
    await db.insert(channelMembers).values({ channelId: acmeGeneral.id, userId: member.id });
  }

  // 8 members in #random (all except user09, user10-index)
  for (let i = 0; i < 8; i++) {
    const member = insertedUsers[i];
    if (!member) throw new Error(`Expected inserted user at index ${i}`);
    await db.insert(channelMembers).values({ channelId: acmeRandom.id, userId: member.id });
  }

  // #engineering: alice, bob, charlie, diana
  for (const u of [alice, bob, charlie, diana]) {
    await db.insert(channelMembers).values({ channelId: acmeEngineering.id, userId: u.id });
  }

  // #design: alice, charlie, eve
  for (const u of [alice, charlie, eve]) {
    await db.insert(channelMembers).values({ channelId: acmeDesign.id, userId: u.id });
  }

  // #leadership (private): alice, bob only
  for (const u of [alice, bob]) {
    await db.insert(channelMembers).values({ channelId: acmePrivate.id, userId: u.id });
  }

  logger.info('Seeded Acme channels: general, random, engineering, design, leadership(private)');

  // ── Workspace 2: "Side Project" — owned by Bob, 5 members ───────────────
  const [sideProject] = await db
    .insert(workspaces)
    .values({ name: 'Side Project', slug: 'side-project', ownerId: bob.id })
    .returning();

  if (!sideProject) throw new Error('Failed to create Side Project workspace');

  await db.insert(workspaceMembers).values({ workspaceId: sideProject.id, userId: bob.id, role: 'owner' });
  await db.insert(workspaceMembers).values({ workspaceId: sideProject.id, userId: alice.id, role: 'member' });
  await db.insert(workspaceMembers).values({ workspaceId: sideProject.id, userId: charlie.id, role: 'member' });
  await db.insert(workspaceMembers).values({ workspaceId: sideProject.id, userId: diana.id, role: 'admin' });
  await db.insert(workspaceMembers).values({ workspaceId: sideProject.id, userId: eve.id, role: 'member' });
  logger.info('Seeded workspace: Side Project (bob=owner, diana=admin, 3 members)');

  const [spGeneral] = await db
    .insert(channels)
    .values({ workspaceId: sideProject.id, name: 'general', createdById: bob.id })
    .returning();
  const [spBackend] = await db
    .insert(channels)
    .values({ workspaceId: sideProject.id, name: 'backend', createdById: bob.id })
    .returning();
  const [spFrontend] = await db
    .insert(channels)
    .values({ workspaceId: sideProject.id, name: 'frontend', createdById: diana.id })
    .returning();

  if (!spGeneral || !spBackend || !spFrontend) {
    throw new Error('Failed to create Side Project channels');
  }

  // All 5 members in #general
  for (const u of [bob, alice, charlie, diana, eve]) {
    await db.insert(channelMembers).values({ channelId: spGeneral.id, userId: u.id });
  }

  // #backend: bob, alice, charlie
  for (const u of [bob, alice, charlie]) {
    await db.insert(channelMembers).values({ channelId: spBackend.id, userId: u.id });
  }

  // #frontend: diana, eve, bob
  for (const u of [diana, eve, bob]) {
    await db.insert(channelMembers).values({ channelId: spFrontend.id, userId: u.id });
  }

  logger.info('Seeded Side Project channels: general, backend, frontend');

  // ── Workspace 3: "Empty Startup" — owned by Eve, only Eve ───────────────
  // Tests: workspace with only the owner, just #general
  const [emptyStartup] = await db
    .insert(workspaces)
    .values({ name: 'Empty Startup', slug: 'empty-startup', ownerId: eve.id })
    .returning();

  if (!emptyStartup) throw new Error('Failed to create Empty Startup workspace');

  await db.insert(workspaceMembers).values({ workspaceId: emptyStartup.id, userId: eve.id, role: 'owner' });

  const [esGeneral] = await db
    .insert(channels)
    .values({ workspaceId: emptyStartup.id, name: 'general', createdById: eve.id })
    .returning();

  if (!esGeneral) throw new Error('Failed to create Empty Startup general channel');

  await db.insert(channelMembers).values({ channelId: esGeneral.id, userId: eve.id });
  logger.info('Seeded workspace: Empty Startup (eve=owner, only member)');

  // ── Workspace 4: "Big Team" — owned by Diana, all 20 users ──────────────
  const [bigTeam] = await db
    .insert(workspaces)
    .values({ name: 'Big Team', slug: 'big-team', ownerId: diana.id })
    .returning();

  if (!bigTeam) throw new Error('Failed to create Big Team workspace');

  await db.insert(workspaceMembers).values({ workspaceId: bigTeam.id, userId: diana.id, role: 'owner' });
  for (let i = 0; i < 20; i++) {
    const member = insertedUsers[i];
    if (!member) throw new Error(`Expected inserted user at index ${i}`);
    if (member.id === diana.id) continue;
    await db.insert(workspaceMembers).values({
      workspaceId: bigTeam.id,
      userId: member.id,
      role: 'member',
    });
  }

  const [btGeneral] = await db
    .insert(channels)
    .values({ workspaceId: bigTeam.id, name: 'general', createdById: diana.id })
    .returning();

  if (!btGeneral) throw new Error('Failed to create Big Team general channel');

  // All 20 in #general
  for (const u of insertedUsers) {
    await db.insert(channelMembers).values({ channelId: btGeneral.id, userId: u.id });
  }

  // #announcements — diana only (others can test /join)
  const [btAnnouncements] = await db
    .insert(channels)
    .values({ workspaceId: bigTeam.id, name: 'announcements', createdById: diana.id })
    .returning();

  if (!btAnnouncements) throw new Error('Failed to create Big Team announcements channel');

  await db.insert(channelMembers).values({ channelId: btAnnouncements.id, userId: diana.id });

  logger.info('Seeded workspace: Big Team (diana=owner, all 20 users, #announcements for join testing)');

  // ── Summary ──────────────────────────────────────────────────────────────
  logger.info('');
  logger.info('═══ Seed Summary ═══');
  logger.info(`Users: 20 (password for all: "${PASSWORD}")`);
  logger.info('');
  logger.info('Workspaces:');
  logger.info('  1. Acme Corp      — alice(owner), bob(admin), 8 members, 5 channels');
  logger.info('  2. Side Project   — bob(owner), diana(admin), 3 members, 3 channels');
  logger.info('  3. Empty Startup  — eve(owner), solo, 1 channel');
  logger.info('  4. Big Team       — diana(owner), all 20 users, 2 channels');
  logger.info('');
  logger.info('Test scenarios:');
  logger.info('  • Login as alice → sees Acme Corp, Side Project, Big Team');
  logger.info('  • Login as bob → sees Acme Corp, Side Project, Big Team');
  logger.info('  • Login as eve → sees Acme Corp, Side Project, Empty Startup, Big Team');
  logger.info('  • Login as user06 → sees Acme Corp, Big Team (not Side Project)');
  logger.info('  • user06 GET /api/workspaces/:sideProject → 403 FORBIDDEN');
  logger.info('  • alice invite user11@flowchat.dev to Side Project → adds member');
  logger.info('  • alice invite bob@flowchat.dev to Acme Corp → 409 ALREADY_A_MEMBER');
  logger.info('  • bob list Acme channels → general, random, engineering, leadership');
  logger.info('  • eve list Acme channels → general, random, design');
  logger.info('  • alice join Big Team #announcements → success');
  logger.info('  • diana join Big Team #announcements → 409 ALREADY_A_MEMBER');
  logger.info('  • user10 list Big Team channels → only general (not in announcements)');
  logger.info('═══════════════════');

  await pool.end();
}

seed().catch((err: unknown) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});

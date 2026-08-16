import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_FILE = path.join(process.cwd(), 'buildx.sqlite');

let db: Database | null = null;

// Initialize SQLite database
export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      if (fileBuffer.length > 0) {
        db = new SQL.Database(fileBuffer);
      } else {
        console.log('[SQLite] Empty or 0-byte database file found, initializing fresh database...');
        db = new SQL.Database();
      }
    } catch (e) {
      console.error('Error reading existing sqlite file, creating fresh DB:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Initialize schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'free',
      uploads_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      attachments_json TEXT,
      artifact_json TEXT
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Safe migration: Add uploads_count and attachments_json if missing in existing database
  try {
    const tableInfo = db.exec(`PRAGMA table_info(users);`);
    if (tableInfo.length > 0 && tableInfo[0].values) {
      const cols = tableInfo[0].values.map((v: any) => v[1]);
      if (!cols.includes('uploads_count')) {
        db.run(`ALTER TABLE users ADD COLUMN uploads_count INTEGER DEFAULT 0;`);
      }
    }
  } catch (err) {
    // Column already exists or table freshly created
  }

  try {
    const msgInfo = db.exec(`PRAGMA table_info(messages);`);
    if (msgInfo.length > 0 && msgInfo[0].values) {
      const cols = msgInfo[0].values.map((v: any) => v[1]);
      if (!cols.includes('attachments_json')) {
        db.run(`ALTER TABLE messages ADD COLUMN attachments_json TEXT;`);
      }
    }
  } catch (err) {
    // Column already exists
  }

  // Ensure default owner accounts are upgraded to 'owner' role in the database
  try {
    for (const ownerEmail of DEFAULT_OWNER_EMAILS) {
      db.run(`UPDATE users SET role = 'owner' WHERE LOWER(email) = ?`, [ownerEmail.toLowerCase().trim()]);
    }
  } catch (err) {
    // Ignore if table empty
  }

  persistDb();
  return db;
}

// Write in-memory SQLite state to the .sqlite file
export function persistDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database:', err);
  }
}

// Password hashing helper using built-in crypto
function hashPassword(password: string): string {
  const salt = 'buildx_salt_secure_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export const DEFAULT_OWNER_EMAILS = [
  'shoaib03018550911@gmail.com',
  'abdullah8865584@gmail.com'
];

export function isDefaultOwnerEmail(email?: string): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return DEFAULT_OWNER_EMAILS.includes(normalized);
}

// Format user role safely (maps legacy 'user' to 'free')
function normalizeRole(role?: string, email?: string): 'free' | 'premium' | 'owner' | 'developer' {
  if (isDefaultOwnerEmail(email)) return 'owner';
  if (role === 'owner') return 'owner';
  if (role === 'premium') return 'premium';
  if (role === 'developer') return 'developer';
  return 'free';
}

// Check if an email is already registered
export async function checkEmailExists(email: string): Promise<boolean> {
  if (!email || !email.trim()) return false;
  const database = await getDb();
  const normalized = email.toLowerCase().trim();
  const stmt = database.prepare(`SELECT id FROM users WHERE email = :email LIMIT 1`);
  stmt.bind({ ':email': normalized });
  const hasRow = stmt.step();
  stmt.free();
  return hasRow;
}

// User methods
export async function createUser(email: string, password: string, name: string) {
  const normalized = email.toLowerCase().trim();
  const emailInUse = await checkEmailExists(normalized);
  if (emailInUse) {
    throw new Error('An account with this email already exists. Please log in or use a different email.');
  }

  const database = await getDb();
  const id = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const password_hash = hashPassword(password);
  const created_at = new Date().toISOString();
  const initialRole = isDefaultOwnerEmail(normalized) ? 'owner' : 'free';

  database.run(
    `INSERT INTO users (id, email, password_hash, name, role, uploads_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, normalized, password_hash, name.trim(), initialRole, 0, created_at]
  );
  persistDb();

  return {
    id,
    email: normalized,
    name: name.trim(),
    role: initialRole,
    uploadsCount: 0,
    maxUploads: initialRole === 'owner' ? 999999 : 10,
    createdAt: created_at
  };
}

export async function verifyUser(email: string, password: string) {
  const database = await getDb();
  const normalized = email.toLowerCase().trim();
  const password_hash = hashPassword(password);
  
  const stmt = database.prepare(`SELECT id, email, name, role, uploads_count, created_at FROM users WHERE email = :email AND password_hash = :hash`);
  stmt.bind({ ':email': normalized, ':hash': password_hash });

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    const userEmail = (row.email as string || '').toLowerCase().trim();
    let role = normalizeRole(row.role as string, userEmail);

    // If this is a default owner email, ensure DB record stays owner
    if (isDefaultOwnerEmail(userEmail) && row.role !== 'owner') {
      database.run(`UPDATE users SET role = 'owner' WHERE id = ?`, [row.id as string]);
      persistDb();
      role = 'owner';
    }

    const uploadsCount = Number(row.uploads_count || 0);
    return {
      id: row.id as string,
      email: userEmail,
      name: row.name as string,
      role,
      uploadsCount,
      maxUploads: role === 'owner' || role === 'premium' ? 999999 : 10,
      createdAt: row.created_at as string
    };
  }
  stmt.free();
  return null;
}

export async function getUserById(id: string) {
  const database = await getDb();
  const stmt = database.prepare(`SELECT id, email, name, role, uploads_count, created_at FROM users WHERE id = :id`);
  stmt.bind({ ':id': id });

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    const userEmail = (row.email as string || '').toLowerCase().trim();
    let role = normalizeRole(row.role as string, userEmail);

    if (isDefaultOwnerEmail(userEmail) && row.role !== 'owner') {
      database.run(`UPDATE users SET role = 'owner' WHERE id = ?`, [row.id as string]);
      persistDb();
      role = 'owner';
    }

    const uploadsCount = Number(row.uploads_count || 0);
    return {
      id: row.id as string,
      email: userEmail,
      name: row.name as string,
      role,
      uploadsCount,
      maxUploads: role === 'owner' || role === 'premium' ? 999999 : 10,
      createdAt: row.created_at as string
    };
  }
  stmt.free();
  return null;
}

// Admin: Get all users
export async function getAllUsers() {
  const database = await getDb();
  const res = database.exec(`SELECT id, email, name, role, uploads_count, created_at FROM users ORDER BY created_at DESC`);
  if (!res || res.length === 0) return [];

  const cols = res[0].columns;
  return res[0].values.map((row: any[]) => {
    const obj: any = {};
    cols.forEach((c, idx) => {
      obj[c] = row[idx];
    });
    const email = (obj.email || '').toLowerCase().trim();
    const role = normalizeRole(obj.role, email);
    return {
      id: obj.id,
      email,
      name: obj.name,
      role,
      uploadsCount: Number(obj.uploads_count || 0),
      createdAt: obj.created_at
    };
  });
}

// Admin: Update user role by id or email
export async function updateUserRole(identifier: string, newRole: 'free' | 'premium' | 'owner' | 'developer') {
  const database = await getDb();
  const normalized = identifier.toLowerCase().trim();
  const validRole = normalizeRole(newRole);

  database.run(
    `UPDATE users SET role = ? WHERE id = ? OR LOWER(email) = ?`,
    [validRole, identifier, normalized]
  );
  persistDb();

  const stmt = database.prepare(`SELECT id, email, name, role, uploads_count, created_at FROM users WHERE id = :id OR LOWER(email) = :email LIMIT 1`);
  stmt.bind({ ':id': identifier, ':email': normalized });
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as string,
      email: row.email as string,
      name: row.name as string,
      role: normalizeRole(row.role as string, row.email as string),
      uploadsCount: Number(row.uploads_count || 0),
      createdAt: row.created_at as string
    };
  }
  stmt.free();
  return null;
}

// Increment user uploads count
export async function incrementUserUploads(userId: string, count: number = 1): Promise<number> {
  const database = await getDb();
  database.run(`UPDATE users SET uploads_count = COALESCE(uploads_count, 0) + ? WHERE id = ?`, [count, userId]);
  persistDb();

  const user = await getUserById(userId);
  return user?.uploadsCount || 0;
}

// Session methods
export async function getSessions(userId?: string | null) {
  const database = await getDb();
  let query = `SELECT id, user_id, title, mode, created_at, updated_at FROM sessions`;
  let params: any[] = [];

  if (userId) {
    query += ` WHERE user_id = ? OR user_id IS NULL ORDER BY updated_at DESC`;
    params = [userId];
  } else {
    query += ` ORDER BY updated_at DESC`;
  }

  const res = database.exec(query, params);
  if (!res || res.length === 0) return [];

  const columns = res[0].columns;
  const values = res[0].values;

  const sessions = [];
  for (const row of values) {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });

    // Fetch messages for this session
    const msgRes = database.exec(`SELECT id, sender, content, timestamp, attachments_json, artifact_json FROM messages WHERE session_id = ? ORDER BY timestamp ASC`, [obj.id]);
    const messages = [];
    if (msgRes && msgRes.length > 0) {
      const msgCols = msgRes[0].columns;
      for (const mRow of msgRes[0].values) {
        const mObj: any = {};
        msgCols.forEach((col, j) => {
          mObj[col] = mRow[j];
        });
        messages.push({
          id: mObj.id,
          sender: mObj.sender,
          content: mObj.content,
          timestamp: mObj.timestamp,
          attachments: mObj.attachments_json ? JSON.parse(mObj.attachments_json) : undefined,
          artifact: mObj.artifact_json ? JSON.parse(mObj.artifact_json) : undefined
        });
      }
    }

    sessions.push({
      id: obj.id,
      userId: obj.user_id,
      title: obj.title,
      mode: obj.mode,
      createdAt: obj.created_at,
      updatedAt: obj.updated_at,
      messages
    });
  }

  return sessions;
}

export async function upsertSession(id: string, userId: string | null, title: string, mode: string) {
  const database = await getDb();
  const existing = database.exec(`SELECT id FROM sessions WHERE id = ?`, [id]);
  const now = new Date().toISOString();

  if (existing.length > 0 && existing[0].values.length > 0) {
    database.run(`UPDATE sessions SET title = ?, mode = ?, updated_at = ? WHERE id = ?`, [title, mode, now, id]);
  } else {
    database.run(`INSERT INTO sessions (id, user_id, title, mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, [id, userId, title, mode, now, now]);
  }
  persistDb();
}

export async function deleteSession(id: string) {
  const database = await getDb();
  database.run(`DELETE FROM messages WHERE session_id = ?`, [id]);
  database.run(`DELETE FROM artifacts WHERE session_id = ?`, [id]);
  database.run(`DELETE FROM sessions WHERE id = ?`, [id]);
  persistDb();
}

export async function deleteAllSessions(userId?: string | null) {
  const database = await getDb();
  if (userId) {
    database.run(`DELETE FROM messages WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ? OR user_id IS NULL)`, [userId]);
    database.run(`DELETE FROM artifacts WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ? OR user_id IS NULL)`, [userId]);
    database.run(`DELETE FROM sessions WHERE user_id = ? OR user_id IS NULL`, [userId]);
  } else {
    database.run(`DELETE FROM messages`);
    database.run(`DELETE FROM artifacts`);
    database.run(`DELETE FROM sessions`);
  }
  persistDb();
}

export async function saveMessage(
  id: string, 
  sessionId: string, 
  sender: string, 
  content: string, 
  timestamp: string, 
  artifact?: any,
  attachments?: any[]
) {
  const database = await getDb();
  const artifactJson = artifact ? JSON.stringify(artifact) : null;
  const attachmentsJson = attachments && attachments.length > 0 ? JSON.stringify(attachments) : null;

  database.run(
    `INSERT INTO messages (id, session_id, sender, content, timestamp, attachments_json, artifact_json) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, sessionId, sender, content, timestamp, attachmentsJson, artifactJson]
  );
  database.run(`UPDATE sessions SET updated_at = ? WHERE id = ?`, [new Date().toISOString(), sessionId]);
  persistDb();
}

// Storage optimization & cleanup helper
export async function getStorageStats() {
  const database = await getDb();
  let dbSize = 0;
  if (fs.existsSync(DB_FILE)) {
    dbSize = fs.statSync(DB_FILE).size;
  }

  const userCountRes = database.exec(`SELECT COUNT(*) as count FROM users`);
  const sessionCountRes = database.exec(`SELECT COUNT(*) as count FROM sessions`);
  const msgCountRes = database.exec(`SELECT COUNT(*) as count FROM messages`);

  const userCount = userCountRes[0]?.values[0]?.[0] || 0;
  const sessionCount = sessionCountRes[0]?.values[0]?.[0] || 0;
  const msgCount = msgCountRes[0]?.values[0]?.[0] || 0;

  return {
    dbSizeBytes: dbSize,
    dbSizeFormatted: `${(dbSize / (1024 * 1024)).toFixed(2)} MB`,
    userCount,
    sessionCount,
    messageCount: msgCount
  };
}

// Prune oversized old message caches to optimize storage and prevent disk exhaustion
export async function pruneStorage() {
  const database = await getDb();
  // Keep latest 250 messages per session or delete orphan artifacts
  database.run(`DELETE FROM artifacts WHERE session_id NOT IN (SELECT id FROM sessions)`);
  database.run(`DELETE FROM messages WHERE session_id NOT IN (SELECT id FROM sessions)`);
  persistDb();
  return await getStorageStats();
}

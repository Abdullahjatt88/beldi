import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export interface GitHubSyncStatus {
  configured: boolean;
  repo: string;
  branch: string;
  hasToken: boolean;
  lastPushedAt: string | null;
  lastCommitMessage: string | null;
  isSyncing: boolean;
  lastError: string | null;
  pendingChangesCount: number;
}

let syncState: GitHubSyncStatus = {
  configured: false,
  repo: process.env.GITHUB_REPO || 'Abdullahjatt88/beldi-ai',
  branch: process.env.GITHUB_BRANCH || 'main',
  hasToken: !!process.env.GITHUB_TOKEN,
  lastPushedAt: null,
  lastCommitMessage: null,
  isSyncing: false,
  lastError: null,
  pendingChangesCount: 0
};

let autoPushIntervalTimer: NodeJS.Timeout | null = null;

/**
 * Clean URL and escape token from logs for security
 */
function sanitizeOutput(str: string): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return str;
  return str.replace(new RegExp(token, 'g'), '***REDACTED_GITHUB_TOKEN***');
}

/**
 * Execute shell command with safety inside the workspace
 */
async function runGit(cmd: string, cwd = process.cwd()): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execPromise(cmd, {
      cwd,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0'
      }
    });
    return { stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err: any) {
    const sanitizedMsg = sanitizeOutput(err.message || String(err));
    throw new Error(sanitizedMsg);
  }
}

/**
 * Initialize git if not already initialized
 */
async function ensureGitRepo(): Promise<void> {
  const cwd = process.cwd();
  const repo = process.env.GITHUB_REPO || 'Abdullahjatt88/beldi-ai';
  const branch = process.env.GITHUB_BRANCH || 'main';
  const userName = process.env.GITHUB_USERNAME || 'Abdullahjatt88';
  const userEmail = process.env.GITHUB_EMAIL || 'abdullahjatt@users.noreply.github.com';

  try {
    await runGit('git config --global --add safe.directory "*"');
  } catch (e) {
    // ignore
  }

  // Check if .git exists
  let isRepo = false;
  try {
    const res = await runGit('git rev-parse --is-inside-work-tree');
    if (res.stdout === 'true') {
      isRepo = true;
    }
  } catch {
    isRepo = false;
  }

  if (!isRepo) {
    console.log('[GitHub Sync] Initializing git repository...');
    await runGit(`git init -b ${branch}`);
  }

  // Configure author identity
  await runGit(`git config user.name "${userName}"`);
  await runGit(`git config user.email "${userEmail}"`);

  // Configure remote if token is provided
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    // Normalized repo target
    let repoSlug = repo;
    if (repoSlug.startsWith('https://github.com/')) {
      repoSlug = repoSlug.replace('https://github.com/', '').replace(/\.git$/, '');
    } else if (repoSlug.startsWith('git@github.com:')) {
      repoSlug = repoSlug.replace('git@github.com:', '').replace(/\.git$/, '');
    }

    const authRemote = `https://x-access-token:${token}@github.com/${repoSlug}.git`;

    try {
      await runGit('git remote remove origin');
    } catch {
      // ignore
    }

    await runGit(`git remote add origin "${authRemote}"`);
  }
}

/**
 * Get count of uncommitted / modified files
 */
export async function getPendingChanges(): Promise<number> {
  try {
    await ensureGitRepo();
    const { stdout } = await runGit('git status --porcelain');
    if (!stdout) return 0;
    return stdout.split('\n').filter(line => line.trim().length > 0).length;
  } catch (e) {
    return 0;
  }
}

/**
 * Perform a push to GitHub repository
 */
export async function pushToGitHub(customMessage?: string): Promise<{
  success: boolean;
  message: string;
  commitHash?: string;
  filesChanged?: number;
}> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const repo = process.env.GITHUB_REPO || 'Abdullahjatt88/beldi-ai';
  const branch = process.env.GITHUB_BRANCH || 'main';

  syncState.hasToken = !!token;
  syncState.repo = repo;
  syncState.branch = branch;
  syncState.configured = !!token;

  if (!token) {
    const errorMsg = 'GITHUB_TOKEN is not set in environment variables. Please add GITHUB_TOKEN in your environment or settings.';
    syncState.lastError = errorMsg;
    return {
      success: false,
      message: errorMsg
    };
  }

  if (syncState.isSyncing) {
    return {
      success: false,
      message: 'A GitHub push operation is already in progress.'
    };
  }

  syncState.isSyncing = true;
  syncState.lastError = null;

  try {
    await ensureGitRepo();

    // Stage changes
    await runGit('git add -A');

    // Check status
    const statusRes = await runGit('git status --porcelain');
    const pendingLines = statusRes.stdout.split('\n').filter(l => l.trim().length > 0);
    const filesChanged = pendingLines.length;

    if (filesChanged === 0) {
      syncState.isSyncing = false;
      syncState.pendingChangesCount = 0;
      return {
        success: true,
        message: 'Everything is up to date. No new changes to push.',
        filesChanged: 0
      };
    }

    // Commit
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const commitMsg = customMessage || `Auto-sync: update codebase from Beldi AI / Build X (${dateStr} UTC)`;
    await runGit(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);

    let commitHash = '';
    try {
      const revRes = await runGit('git rev-parse --short HEAD');
      commitHash = revRes.stdout;
    } catch {
      // ignore
    }

    // Push
    console.log(`[GitHub Sync] Pushing changes to ${repo}:${branch}...`);
    try {
      await runGit(`git push -u origin ${branch}`);
    } catch (pushErr: any) {
      // If rejected due to non-fast-forward on first push, try pull with rebase or push with force-with-lease
      if (pushErr.message && (pushErr.message.includes('fetch first') || pushErr.message.includes('non-fast-forward'))) {
        console.log('[GitHub Sync] Remote has separate commits, pulling before retry...');
        try {
          await runGit(`git pull --rebase origin ${branch}`);
          await runGit(`git push origin ${branch}`);
        } catch {
          // Retry push
          await runGit(`git push origin ${branch}`);
        }
      } else {
        throw pushErr;
      }
    }

    syncState.lastPushedAt = new Date().toISOString();
    syncState.lastCommitMessage = commitMsg;
    syncState.isSyncing = false;
    syncState.pendingChangesCount = 0;
    syncState.lastError = null;

    console.log(`[GitHub Sync] Successfully pushed commit ${commitHash} to GitHub!`);
    return {
      success: true,
      message: `Successfully pushed ${filesChanged} file(s) to GitHub (${branch}).`,
      commitHash,
      filesChanged
    };
  } catch (err: any) {
    const errorMsg = sanitizeOutput(err.message || 'Failed to push to GitHub');
    console.error('[GitHub Sync Error]', errorMsg);
    syncState.isSyncing = false;
    syncState.lastError = errorMsg;
    return {
      success: false,
      message: errorMsg
    };
  }
}

/**
 * Get current sync state
 */
export async function getGitHubSyncStatus(): Promise<GitHubSyncStatus> {
  const token = process.env.GITHUB_TOKEN?.trim();
  syncState.hasToken = !!token;
  syncState.configured = !!token;
  syncState.repo = process.env.GITHUB_REPO || 'Abdullahjatt88/beldi-ai';
  syncState.branch = process.env.GITHUB_BRANCH || 'main';

  try {
    syncState.pendingChangesCount = await getPendingChanges();
  } catch {
    // ignore
  }

  return { ...syncState };
}

/**
 * Start background watcher to auto-push when token is provided
 */
export function startAutoPushWatcher(intervalMs = 45000): void {
  if (autoPushIntervalTimer) {
    clearInterval(autoPushIntervalTimer);
  }

  console.log(`[GitHub Sync] Background auto-pusher active (checking every ${Math.round(intervalMs / 1000)}s)...`);

  // Run initial check after 5 seconds
  setTimeout(async () => {
    if (process.env.GITHUB_TOKEN) {
      try {
        const pending = await getPendingChanges();
        if (pending > 0) {
          console.log(`[GitHub Sync] Detected ${pending} pending changes on startup. Pushing to GitHub...`);
          await pushToGitHub();
        }
      } catch (e: any) {
        console.error('[GitHub Sync Startup Push Error]', e.message);
      }
    } else {
      console.log('[GitHub Sync] GITHUB_TOKEN not yet detected. Ready to auto-push once added to environment variables.');
    }
  }, 5000);

  autoPushIntervalTimer = setInterval(async () => {
    if (process.env.GITHUB_TOKEN && !syncState.isSyncing) {
      try {
        const pending = await getPendingChanges();
        if (pending > 0) {
          console.log(`[GitHub Sync] Detected ${pending} changed files. Auto-pushing to GitHub...`);
          await pushToGitHub();
        }
      } catch (err: any) {
        console.error('[GitHub Sync Auto-Push Error]', err.message);
      }
    }
  }, intervalMs);
}

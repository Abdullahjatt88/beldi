import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { streamAIChat, getCustomApiKey, getGeminiClient } from './server/ai';
import { 
  getDb, createUser, verifyUser, getUserById, checkEmailExists,
  getSessions, upsertSession, deleteSession, deleteAllSessions, saveMessage,
  incrementUserUploads, getStorageStats, pruneStorage,
  getAllUsers, updateUserRole, DEFAULT_OWNER_EMAILS, isDefaultOwnerEmail
} from './server/db';
import { 
  pushToGitHub, getGitHubSyncStatus, startAutoPushWatcher 
} from './server/githubSync';
import JSZip from 'jszip';

const app = express();
const PORT = 3000;

// Rate limiting tracker for ZIP exports (Anti-Abuse / Anti-ZIP Bomb)
const zipDownloadRateLimits: Map<string, number[]> = new Map();
const MAX_ZIP_PER_MINUTE = 5;

app.use(express.json({ limit: '25mb' }));

// Static logo handler supporting /logo.png, /download.png from root, public/, assets/
app.get(['/logo.png', '/download.png'], (req: Request, res: Response, next) => {
  const candidatePaths = [
    path.join(process.cwd(), 'public', req.path),
    path.join(process.cwd(), req.path.slice(1)),
    path.join(process.cwd(), 'assets', req.path.slice(1)),
    path.join(process.cwd(), 'src', 'assets', req.path.slice(1)),
    path.join(process.cwd(), 'logo.png'),
    path.join(process.cwd(), 'download.png')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return res.sendFile(p);
    }
  }
  next();
});

// Initialize SQLite database
getDb().then(() => {
  console.log('[Build X SQLite] SQLite database loaded from buildx.sqlite');
}).catch(err => {
  console.error('[Build X SQLite] Failed to initialize SQLite database:', err);
});

// Helper: Extract runnable HTML/CSS/JS artifacts from AI response text
function extractArtifact(text: string): { title: string; code: string; type: 'website' | 'game' | 'app' | 'component' } | null {
  const htmlMatch = text.match(/```html([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 50) {
    const rawCode = htmlMatch[1].trim();
    let title = 'Interactive Application';
    let type: 'website' | 'game' | 'app' | 'component' = 'app';

    if (rawCode.toLowerCase().includes('<canvas') || rawCode.toLowerCase().includes('game') || text.toLowerCase().includes('game')) {
      title = 'Playable Game';
      type = 'game';
    } else if (rawCode.toLowerCase().includes('landing') || rawCode.toLowerCase().includes('portfolio') || rawCode.toLowerCase().includes('website')) {
      title = 'Live Website';
      type = 'website';
    } else if (rawCode.toLowerCase().includes('dashboard') || rawCode.toLowerCase().includes('analytics')) {
      title = 'Live Dashboard';
      type = 'app';
    }

    return { title, code: rawCode, type };
  }
  return null;
}

// -------------------------------------------------------------
// 1. Health & Status
// -------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  const isOnline = !!getCustomApiKey() || !!getGeminiClient();
  res.json({
    status: 'healthy',
    aiName: 'Beldi AI',
    parentCompany: 'Build X',
    instagram: 'build_x_official',
    version: '3.1.0',
    aiOnline: true,
    hasApiKey: isOnline,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// -------------------------------------------------------------
// 2. Authentication API (Sign Up, Login, Check Email, Current User)
// -------------------------------------------------------------
app.get('/api/auth/check-email', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required', exists: false, validFormat: false });
    }

    // RFC standard email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const validFormat = emailRegex.test(email);

    if (!validFormat) {
      return res.json({ exists: false, validFormat: false, message: 'Invalid email address format' });
    }

    const exists = await checkEmailExists(email);
    res.json({ exists, validFormat: true, message: exists ? 'Email is already registered' : 'Email is available' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error checking email' });
  }
});

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@domain.com)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await createUser(email, password, name);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await verifyUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.json({ user: null });
  }

  try {
    const user = await getUserById(userId);
    res.json({ user });
  } catch (err) {
    res.json({ user: null });
  }
});

// -------------------------------------------------------------
// 3. Storage Optimization & Diagnostic APIs
// -------------------------------------------------------------
app.get('/api/storage/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getStorageStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch storage stats' });
  }
});

app.post('/api/storage/clean', async (req: Request, res: Response) => {
  try {
    const stats = await pruneStorage();
    res.json({ success: true, message: 'Storage cleaned successfully', stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clean storage' });
  }
});

// -------------------------------------------------------------
// 4. Chat Sessions & History stored in SQLite
// -------------------------------------------------------------
app.get('/api/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string | undefined;
    const sessions = await getSessions(userId);
    res.json({ sessions });
  } catch (err: any) {
    console.error('Failed to load sessions from SQLite:', err);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

app.post('/api/sessions', async (req: Request, res: Response) => {
  try {
    const { id, title = 'New Chat & Build', mode = 'chat' } = req.body;
    const userId = req.headers['x-user-id'] as string || null;
    const sessionId = id || `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await upsertSession(sessionId, userId, title, mode);
    res.json({ session: { id: sessionId, title, mode, messages: [] } });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.delete('/api/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string | undefined;
    await deleteAllSessions(userId);
    res.json({ success: true, message: 'All conversations cleared successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to clear conversations' });
  }
});

app.delete('/api/sessions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteSession(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// -------------------------------------------------------------
// 5. AI Streaming Chat & Universal App Builder
// -------------------------------------------------------------
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { messages, sessionId, attachments = [], customApiKey, customBaseUrl, customModel } = req.body;
  const userHeaderApiKey = (req.headers['x-custom-api-key'] as string) || customApiKey;
  const userHeaderBaseUrl = (req.headers['x-custom-base-url'] as string) || customBaseUrl;
  const userHeaderModel = (req.headers['x-custom-model'] as string) || customModel;
  const userId = req.headers['x-user-id'] as string || null;

  // STRICT AUTHENTICATION GATE
  if (!userId) {
    return res.status(401).json({ 
      error: 'Authentication required. Please sign in or create an account to chat with Beldi AI.' 
    });
  }

  const user = await getUserById(userId);
  if (!user) {
    return res.status(401).json({ 
      error: 'Invalid or expired user session. Please sign in again.' 
    });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Valid messages array is required' });
  }

  // TIER ENFORCEMENT: Upload limits
  const isOwner = user.role === 'owner';
  const isPremium = user.role === 'premium';
  const attachmentCount = Array.isArray(attachments) ? attachments.length : 0;

  if (attachmentCount > 0) {
    if (!isOwner && !isPremium) {
      const currentUploads = user.uploadsCount || 0;
      if (currentUploads + attachmentCount > 10) {
        return res.status(403).json({
          error: `Free Plan limit reached (${currentUploads}/10 uploads used). Upgrade to Premium for unlimited uploads by messaging @build_x_official on Instagram.`,
          upgradeRequired: true,
          instagram: 'build_x_official'
        });
      }
      // Increment user uploads count
      await incrementUserUploads(userId, attachmentCount);
    }
  }

  const latestMessage = messages[messages.length - 1];
  const userText = latestMessage.content || '';
  const currentSessionId = sessionId || `session_${Date.now()}`;

  // Ensure session exists in SQLite
  try {
    const firstTitle = userText.slice(0, 32) + (userText.length > 32 ? '...' : '');
    await upsertSession(currentSessionId, userId, firstTitle || 'New Conversation', 'chat');
    
    // Save user message to SQLite with attachments if any
    const userMsgId = latestMessage.id || `msg_user_${Date.now()}`;
    await saveMessage(
      userMsgId,
      currentSessionId,
      'user',
      userText,
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      undefined,
      attachments
    );
  } catch (e) {
    console.error('Failed to save user message to SQLite:', e);
  }

  // Set SSE Headers for real-time streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('start', { isOwner, isPremium });

    let fullOutput = '';
    
    await streamAIChat({
      messages: messages.map(m => ({
        role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
        content: m.content || ''
      })),
      userText,
      isOwner,
      isPremium,
      customApiKey: userHeaderApiKey,
      customBaseUrl: userHeaderBaseUrl,
      customModel: userHeaderModel,
      onChunk: (text: string) => {
        fullOutput += text;
        sendEvent('chunk', { text });
      }
    });

    if (!fullOutput.trim()) {
      fullOutput = 'I am Beldi AI by Build X. How can I assist you with building websites, apps, code, or reasoning today?';
      sendEvent('chunk', { text: fullOutput });
    }

    // Check if the AI generated a runnable website/app artifact
    const artifact = extractArtifact(fullOutput);
    if (artifact) {
      const artifactObj = {
        id: `art_${Date.now()}`,
        title: artifact.title,
        type: artifact.type,
        code: artifact.code,
        language: 'html'
      };
      sendEvent('artifact', artifactObj);

      // Save assistant response with artifact to SQLite
      await saveMessage(
        `msg_ast_${Date.now()}`,
        currentSessionId,
        'assistant',
        fullOutput,
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        artifactObj
      );
    } else {
      // Save assistant response to SQLite
      await saveMessage(
        `msg_ast_${Date.now()}`,
        currentSessionId,
        'assistant',
        fullOutput,
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }

    sendEvent('done', {});
    res.end();
  } catch (error: any) {
    console.error('Beldi AI Chat Error:', error);
    const fallbackResponse = 'I am ready to help you build whatever you need. Please ask me a question or describe an app you would like to create!';
    sendEvent('chunk', { text: fallbackResponse });
    await saveMessage(
      `msg_ast_${Date.now()}`,
      currentSessionId,
      'assistant',
      fallbackResponse,
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    sendEvent('done', {});
    res.end();
  }
});

// -------------------------------------------------------------
// 6. Starter Blueprint Templates API
// -------------------------------------------------------------
app.get('/api/templates', (req: Request, res: Response) => {
  res.json({
    templates: [
      {
        id: 'tmpl_saas_landing',
        title: 'Modern SaaS Landing Page',
        category: 'Websites',
        description: 'High-conversion dark aesthetic landing page with sticky navbar, pricing tiers, and interactive feature cards.',
        prompt: 'Build a modern dark-mode SaaS landing page for an AI productivity tool with hero section, feature cards, pricing tiers, FAQ accordion, and interactive newsletter signup.'
      },
      {
        id: 'tmpl_snake_arcade',
        title: 'Cyber Snake 2D Arcade Game',
        category: 'Games',
        description: 'Playable retro-arcade Snake game with particle effects, score history, and mobile touch controls.',
        prompt: 'Create a playable Cyber Snake arcade game with custom glowing neon canvas graphics, speed difficulty levels, high score tracker, and sound effect toggles.'
      },
      {
        id: 'tmpl_crypto_dashboard',
        title: 'Crypto Market Intelligence Hub',
        category: 'Dashboards',
        description: 'Real-time cryptocurrency analytics tracker with interactive price charts, portfolio calculator, and dark mode.',
        prompt: 'Build a real-time cryptocurrency tracker dashboard with live price simulation charts, currency converter, portfolio allocation pie chart, and watchlist.'
      },
      {
        id: 'tmpl_kanban_board',
        title: 'Kanban Task Manager',
        category: 'Apps',
        description: 'Drag-and-drop productivity board with column states (To Do, In Progress, Review, Done), tags, and search.',
        prompt: 'Create a fully functional Kanban board application with drag-and-drop cards, priority badges, subtasks checklist, local storage persistence, and export to JSON.'
      }
    ]
  });
});

// -------------------------------------------------------------
// 7. GitHub Auto-Sync & Push API
// -------------------------------------------------------------
app.get('/api/github/status', async (req: Request, res: Response) => {
  try {
    const status = await getGitHubSyncStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/github/push', async (req: Request, res: Response) => {
  try {
    const { message } = req.body || {};
    const result = await pushToGitHub(message);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 8. Owner Admin Management APIs (Restricted to Owner role)
// -------------------------------------------------------------
app.get('/api/admin/users', async (req: Request, res: Response) => {
  try {
    const callerId = req.headers['x-user-id'] as string;
    if (!callerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const caller = await getUserById(callerId);
    if (!caller || caller.role !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Owner privilege required.' });
    }

    const users = await getAllUsers();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users list' });
  }
});

app.post('/api/admin/update-role', async (req: Request, res: Response) => {
  try {
    const callerId = req.headers['x-user-id'] as string;
    if (!callerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const caller = await getUserById(callerId);
    if (!caller || caller.role !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Owner privilege required.' });
    }

    const { identifier, role } = req.body;
    if (!identifier || !role) {
      return res.status(400).json({ error: 'Identifier (user ID or email) and role are required' });
    }

    const validRoles = ['free', 'premium', 'owner', 'developer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const updatedUser = await updateUserRole(identifier, role);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: `Successfully updated ${updatedUser.email} role to ${role}`, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user role' });
  }
});

app.post('/api/admin/grant-premium', async (req: Request, res: Response) => {
  try {
    const callerId = req.headers['x-user-id'] as string;
    if (!callerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const caller = await getUserById(callerId);
    if (!caller || caller.role !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Owner privilege required.' });
    }

    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const updatedUser = await updateUserRole(email.trim(), 'premium');
    if (!updatedUser) {
      return res.status(404).json({ error: `No registered user found with email ${email}` });
    }

    res.json({ success: true, message: `Premium successfully granted to ${updatedUser.email}!`, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to grant premium' });
  }
});

// -------------------------------------------------------------
// 9. Premium Multi-File ZIP Archive Export API (Gated + Rate-Limited + Anti-Zip Bomb)
// -------------------------------------------------------------
app.post('/api/export/zip', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to export ZIP archives.' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User session expired or invalid.' });
    }

    // Role check: Only Premium or Owner can export ZIP archives
    const isPrivileged = user.role === 'premium' || user.role === 'owner' || user.role === 'developer';
    if (!isPrivileged) {
      return res.status(403).json({ 
        error: 'ZIP export is a Premium feature. Upgrade to Premium to download complete project ZIP archives.',
        upgradeRequired: true,
        instagram: 'build_x_official'
      });
    }

    // Rate Limiting Check (Anti-Abuse / Anti-DoS)
    const now = Date.now();
    const clientKey = userId || (req.ip || 'anonymous');
    const existingTimestamps = zipDownloadRateLimits.get(clientKey) || [];
    const recentTimestamps = existingTimestamps.filter(t => now - t < 60000);

    if (recentTimestamps.length >= MAX_ZIP_PER_MINUTE) {
      return res.status(429).json({ 
        error: `Rate limit exceeded: Maximum ${MAX_ZIP_PER_MINUTE} ZIP downloads per minute allowed. Please wait a moment.` 
      });
    }

    recentTimestamps.push(now);
    zipDownloadRateLimits.set(clientKey, recentTimestamps);

    const { title = 'Beldi AI Project', type = 'website', code = '' } = req.body || {};

    // Anti-Zip Bomb: Limit input code size to 5MB
    if (typeof code !== 'string' || code.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Code content exceeds maximum allowed size (5MB).' });
    }

    const sanitizedTitle = (title as string).replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Beldi-AI-Project';
    const folderSlug = sanitizedTitle.toLowerCase().replace(/\s+/g, '-');

    const zip = new JSZip();

    // Prepare full HTML document
    let fullHtml = code;
    if (!fullHtml.includes('<!DOCTYPE html>')) {
      fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sanitizedTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-black text-white min-h-screen">
  ${code}
  <script src="app.js"></script>
</body>
</html>`;
    }

    zip.file('index.html', fullHtml);
    zip.file('style.css', `/* Built with Beldi AI by Build X */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

*, *:before, *:after {
  box-sizing: inherit;
}
`);
    zip.file('app.js', `// Interactive logic generated by Beldi AI
console.log('Beldi AI Applet "${sanitizedTitle}" initialized successfully.');
`);
    zip.file('README.md', `# ${sanitizedTitle}

> Generated by **Beldi AI** (Crafted by **Build X** &bull; [@build_x_official](https://instagram.com/build_x_official))

## 🚀 Overview
- **Project Name:** ${sanitizedTitle}
- **Artifact Type:** ${String(type).toUpperCase()}
- **Generated For:** ${user.name} (${user.email})
- **Generated On:** ${new Date().toUTCString()}

## 🛠️ Quick Start & Running Locally
1. Unzip this package to any folder.
2. Open \`index.html\` directly in any web browser (Chrome, Safari, Firefox, Edge, Brave).
3. Alternatively, launch a local web server:
   \`\`\`bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js npx
   npx serve .
   \`\`\`
4. Navigate to \`http://localhost:8000\`.

## 📦 Deployment
You can deploy this site in seconds to:
- **Vercel**: \`npx vercel\`
- **Netlify**: Drag and drop the unzipped folder into Netlify Drop.
- **GitHub Pages**: Push this repository to GitHub and enable Pages in Settings.

---
*Beldi AI &copy; 2026 Build X. All rights reserved.*
`);
    zip.file('metadata.json', JSON.stringify({
      name: sanitizedTitle,
      type,
      author: user.name,
      userRole: user.role,
      generator: 'Beldi AI v3.1 (Build X)',
      createdAt: new Date().toISOString(),
      framework: 'HTML5 + Tailwind CSS'
    }, null, 2));

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folderSlug}.zip"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);

  } catch (err: any) {
    console.error('Failed to generate server ZIP bundle:', err);
    res.status(500).json({ error: 'Failed to generate ZIP archive' });
  }
});

// -------------------------------------------------------------
// 9. Vite Middleware Setup & Server Initialization
// -------------------------------------------------------------
async function startServer() {
  // Initialize and persist database state immediately
  try {
    await getDb();
    console.log('[Database] SQLite database initialized and ready.');
  } catch (dbErr) {
    console.error('[Database] Error during initial database setup:', dbErr);
  }

  // Start background auto-push watcher (checks periodically)
  startAutoPushWatcher(30000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Beldi AI Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

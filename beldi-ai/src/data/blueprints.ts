import { StarterBlueprint } from '../types';

export const STARTER_BLUEPRINTS: StarterBlueprint[] = [
  {
    id: 'saas_landing',
    title: 'Modern AI SaaS Landing Page',
    description: 'High-conversion dark theme landing page with glassmorphism header, interactive pricing tiers, and testimonials.',
    category: 'Websites',
    prompt: 'Build a modern dark-mode SaaS landing page for an AI developer platform with a sticky navigation bar, animated hero section, feature cards, pricing tiers, FAQ accordion, and interactive newsletter signup.',
    iconName: 'Layout',
    accentColor: 'from-indigo-600 to-indigo-400'
  },
  {
    id: 'cyber_snake',
    title: 'Playable Cyber Snake 2D Arcade Game',
    description: 'Retro neon canvas game with smooth collision physics, score tracking, high score memory, and mobile touch controls.',
    category: 'Games',
    prompt: 'Create a playable Cyber Snake arcade game with glowing neon canvas graphics, score tracking, local storage high scores, sound effect synthesizers, and on-screen mobile controls.',
    iconName: 'Gamepad2',
    accentColor: 'from-emerald-600 to-emerald-400'
  },
  {
    id: 'crypto_dashboard',
    title: 'Crypto Market Intelligence Hub',
    description: 'Real-time cryptocurrency analytics tracker with interactive price simulation charts, currency converter, and portfolio pie chart.',
    category: 'Dashboards',
    prompt: 'Build a real-time cryptocurrency tracker dashboard with interactive price charts, portfolio allocation breakdown, currency converter calculator, and live market watchlist.',
    iconName: 'BarChart3',
    accentColor: 'from-amber-600 to-amber-400'
  },
  {
    id: 'kanban_board',
    title: 'Interactive Kanban Project Board',
    description: 'Drag-and-drop task workflow manager with column filters, priority badges, checklist progress, and local persistence.',
    category: 'Apps',
    prompt: 'Create a fully functional Kanban board application with drag-and-drop cards across columns (To Do, In Progress, Done), priority tags, search filters, and local storage state persistence.',
    iconName: 'Kanban',
    accentColor: 'from-purple-600 to-purple-400'
  },
  {
    id: 'portfolio_terminal',
    title: 'Developer Terminal Portfolio',
    description: 'Minimalist software engineer portfolio featuring an interactive CLI command prompt and filterable project grid.',
    category: 'Websites',
    prompt: 'Build a minimalist full-stack software engineer portfolio featuring an interactive terminal command prompt, project filtering grid, skill matrix, and working contact form.',
    iconName: 'Terminal',
    accentColor: 'from-cyan-600 to-cyan-400'
  },
  {
    id: 'markdown_editor',
    title: 'Live Markdown Notes & Documentation Studio',
    description: 'Split-pane real-time markdown editor with syntax highlighting, word count, document export, and dark mode.',
    category: 'Tools',
    prompt: 'Build a live split-pane Markdown editor and previewer with syntax formatting buttons, real-time HTML rendering, word and reading time counter, and export to markdown/HTML.',
    iconName: 'FileText',
    accentColor: 'from-rose-600 to-rose-400'
  }
];

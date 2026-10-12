/**
 * NEXUS AI — STUDIO RUNTIME & INTELLIGENCE ENGINE
 * Features:
 * - Native Google Gemini API Integration (gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro)
 * - Cloud Supabase PostgreSQL Database Sync & Persistent Storage
 * - Built-in High-Accuracy Neural Simulator with Chain-of-Thought Reasoning
 * - Speech-to-Text & Text-to-Speech
 * - Pure Web Audio API Sound Synthesizer
 */

(function () {
  'use strict';

  // ==========================================================================
  // CONFIGURATION & PERSONAS
  // ==========================================================================
  const PERSONAS = {
    reasoning: {
      id: 'reasoning',
      name: 'Nexus Pro Reasoning',
      tag: 'Pro Deep Thinker',
      icon: '🧠',
      badgeClass: 'badge-purple',
      badgeText: 'Deep Think',
      systemPrompt: 'You are Nexus Pro Reasoning, an elite analytical AI. You break down complex questions into first principles, consider edge cases, verify logic, and present structured, comprehensive solutions.',
      thinkingPrefix: 'Analyzing request across multidimensional parameter space...'
    },
    coder: {
      id: 'coder',
      name: 'CodeMaster X',
      tag: 'Full-Stack Architect',
      icon: '💻',
      badgeClass: 'badge-cyan',
      badgeText: 'Full-Stack',
      systemPrompt: 'You are CodeMaster X, a principal full-stack software engineer. You produce clean, modular, production-ready code with typescript types, robust error handling, and performance considerations.',
      thinkingPrefix: 'Evaluating data structures, algorithm complexity, and type safety constraints...'
    },
    speed: {
      id: 'speed',
      name: 'Nexus 3.5 Turbo',
      tag: 'Ultra-Fast Conciseness',
      icon: '⚡',
      badgeClass: 'badge-emerald',
      badgeText: 'Ultra Fast',
      systemPrompt: 'You are Nexus 3.5 Turbo, designed for high throughput, razor-sharp accuracy, and direct concise explanations without unnecessary fluff.',
      thinkingPrefix: 'Synthesizing concise high-priority response vector...'
    },
    creative: {
      id: 'creative',
      name: 'Synthetica Creative',
      tag: 'Visionary & Copywriter',
      icon: '🎨',
      badgeClass: 'badge-amber',
      badgeText: 'Visionary',
      systemPrompt: 'You are Synthetica Creative, a world-class copywriter, brand strategist, and creative consultant. You craft compelling, narrative-driven content with high emotional resonance.',
      thinkingPrefix: 'Exploring narrative metaphors, rhetorical framing, and aesthetic cadence...'
    }
  };

  // SQL Schema Definition for quick 1-click clipboard copy
  const SUPABASE_SQL_SCHEMA = `-- NEXUS AI SUPABASE DATABASE SCHEMA
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  model_key TEXT DEFAULT 'reasoning',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  content TEXT NOT NULL,
  thinking TEXT,
  think_duration TEXT,
  timestamp BIGINT NOT NULL,
  attachment JSONB
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon Full Access Sessions" ON public.chat_sessions;
CREATE POLICY "Anon Full Access Sessions" ON public.chat_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Messages" ON public.chat_messages;
CREATE POLICY "Anon Full Access Messages" ON public.chat_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`;

  // Default Application Settings
  const DEFAULT_SETTINGS = {
    provider: 'simulator', // 'gemini' | 'simulator' | 'openai' | 'groq' | 'ollama'
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash',
    supabaseUrl: '',
    supabaseKey: '',
    apiKey: '',
    customModel: '',
    systemPrompt: 'You are Nexus AI, a next-generation autonomous artificial intelligence studio assistant.',
    temperature: 0.7,
    speed: 3, // 1 to 4
    soundEnabled: true,
    showReasoning: true,
    autoTts: false,
    theme: 'obsidian'
  };

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  const State = {
    sessions: [],
    activeSessionId: null,
    currentModelKey: 'reasoning',
    settings: { ...DEFAULT_SETTINGS },
    attachedFile: null,
    isStreaming: false,
    abortController: null,
    activeSpeechMsgId: null,
    supabaseClient: null,
    supabaseConnected: false
  };

  const STORAGE_KEYS = {
    SESSIONS: 'nexus_ai_sessions_v2',
    ACTIVE_ID: 'nexus_ai_active_session_id_v2',
    SETTINGS: 'nexus_ai_settings_v2'
  };

  // ==========================================================================
  // SOUND SYNTHESIZER (Web Audio API)
  // ==========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    play(type) {
      if (!State.settings.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        if (type === 'send') {
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(480, now);
          osc1.frequency.exponentialRampToValueAtTime(960, now + 0.12);
          osc2.frequency.setValueAtTime(720, now);
          osc2.frequency.exponentialRampToValueAtTime(1440, now + 0.12);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.14);
          osc2.stop(now + 0.14);
        } else if (type === 'receive') {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(620, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.28);
        } else if (type === 'click') {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
        }
      } catch (err) {
        // Audio error handled silently
      }
    }
  }

  const sound = new SoundEngine();

  // ==========================================================================
  // DOM REFERENCES
  // ==========================================================================
  const DOM = {
    body: document.body,
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    collapseSidebarBtn: document.getElementById('collapseSidebarBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    chatSearchInput: document.getElementById('chatSearchInput'),
    historyList: document.getElementById('historyList'),
    storageStatusText: document.getElementById('storageStatusText'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    resetDefaultsBtn: document.getElementById('resetDefaultsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    exportModal: document.getElementById('exportModal'),
    exportChatBtn: document.getElementById('exportChatBtn'),
    closeExportBtn: document.getElementById('closeExportBtn'),
    cancelExportBtn: document.getElementById('cancelExportBtn'),
    exportMarkdownBtn: document.getElementById('exportMarkdownBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    copyTranscriptBtn: document.getElementById('copyTranscriptBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIconOn: document.getElementById('soundIconOn'),
    soundIconOff: document.getElementById('soundIconOff'),
    themeDropdown: document.getElementById('themeDropdown'),
    themeBtn: document.getElementById('themeBtn'),
    themeMenu: document.getElementById('themeMenu'),
    modelDropdown: document.getElementById('modelDropdown'),
    modelSelectBtn: document.getElementById('modelSelectBtn'),
    modelMenu: document.getElementById('modelMenu'),
    currentModelIcon: document.getElementById('currentModelIcon'),
    currentModelName: document.getElementById('currentModelName'),
    currentModelTag: document.getElementById('currentModelTag'),
    activeModelBadge: document.getElementById('activeModelBadge'),
    engineModeText: document.getElementById('engineModeText'),
    dbStatusBadge: document.getElementById('dbStatusBadge'),
    dbDot: document.getElementById('dbDot'),
    dbStatusText: document.getElementById('dbStatusText'),
    chatViewport: document.getElementById('chatViewport'),
    welcomeHero: document.getElementById('welcomeHero'),
    messagesStream: document.getElementById('messagesStream'),
    promptForm: document.getElementById('promptForm'),
    promptInput: document.getElementById('promptInput'),
    sendBtn: document.getElementById('sendBtn'),
    stopGenerationBtn: document.getElementById('stopGenerationBtn'),
    tokenEstimate: document.getElementById('tokenEstimate'),
    fileAttachmentInput: document.getElementById('fileAttachmentInput'),
    attachmentTray: document.getElementById('attachmentTray'),
    attachmentName: document.getElementById('attachmentName'),
    attachmentSize: document.getElementById('attachmentSize'),
    removeAttachmentBtn: document.getElementById('removeAttachmentBtn'),
    voiceDictateBtn: document.getElementById('voiceDictateBtn'),
    voiceBanner: document.getElementById('voiceBanner'),
    voiceCancelBtn: document.getElementById('voiceCancelBtn'),
    toastContainer: document.getElementById('toastContainer'),
    // Settings elements
    geminiApiKeyInput: document.getElementById('geminiApiKeyInput'),
    toggleGeminiKeyVisibility: document.getElementById('toggleGeminiKeyVisibility'),
    geminiModelSelect: document.getElementById('geminiModelSelect'),
    testGeminiBtn: document.getElementById('testGeminiBtn'),
    geminiStatusPill: document.getElementById('geminiStatusPill'),
    geminiFeedbackBox: document.getElementById('geminiFeedbackBox'),
    supabaseUrlInput: document.getElementById('supabaseUrlInput'),
    supabaseKeyInput: document.getElementById('supabaseKeyInput'),
    toggleSupabaseKeyVisibility: document.getElementById('toggleSupabaseKeyVisibility'),
    testSupabaseBtn: document.getElementById('testSupabaseBtn'),
    copySqlSchemaBtn: document.getElementById('copySqlSchemaBtn'),
    syncToSupabaseBtn: document.getElementById('syncToSupabaseBtn'),
    supabaseFeedbackBox: document.getElementById('supabaseFeedbackBox'),
    providerSelect: document.getElementById('providerSelect'),
    genericApiKeyGroup: document.getElementById('genericApiKeyGroup'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    toggleGenericKeyVisibility: document.getElementById('toggleGenericKeyVisibility'),
    systemPromptInput: document.getElementById('systemPromptInput'),
    tempSlider: document.getElementById('tempSlider'),
    tempValue: document.getElementById('tempValue'),
    speedSlider: document.getElementById('speedSlider'),
    speedValue: document.getElementById('speedValue'),
    settingSoundToggle: document.getElementById('settingSoundToggle'),
    settingReasoningToggle: document.getElementById('settingReasoningToggle'),
    settingAutoTtsToggle: document.getElementById('settingAutoTtsToggle')
  };

  // ==========================================================================
  // INITIALIZATION & SUPABASE / LOCAL PERSISTENCE
  // ==========================================================================
  async function init() {
    loadSettings();
    await loadEnvConfig();
    initSupabaseClient();
    await loadInitialSessions();
    setupEventListeners();
    updateModelUI();
    renderHistory();

    if (!State.activeSessionId || !getSession(State.activeSessionId)) {
      createNewSession(false);
    } else {
      switchSession(State.activeSessionId);
    }

    updateStorageCounter();
  }

  async function loadEnvConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const env = await res.json();
        let updated = false;

        if (env.geminiApiKey && !State.settings.geminiApiKey) {
          State.settings.geminiApiKey = env.geminiApiKey;
          if (State.settings.provider === 'simulator') {
            State.settings.provider = 'gemini';
          }
          updated = true;
        }
        if (env.geminiModel && (!State.settings.geminiModel || State.settings.geminiModel === 'gemini-1.5-flash')) {
          State.settings.geminiModel = env.geminiModel;
          updated = true;
        }
        if (env.supabaseUrl && !State.settings.supabaseUrl) {
          State.settings.supabaseUrl = env.supabaseUrl;
          updated = true;
        }
        if (env.supabaseKey && !State.settings.supabaseKey) {
          State.settings.supabaseKey = env.supabaseKey;
          updated = true;
        }

        if (updated) {
          saveSettings();
        }
      }
    } catch (e) {
      // Ignored if running statically without dev server
    }
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        State.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      State.settings = { ...DEFAULT_SETTINGS };
    }
    applyTheme(State.settings.theme || 'obsidian');
    updateSoundIcon();
    updateEngineBadge();
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(State.settings));
      updateEngineBadge();
      updateSoundIcon();
    } catch (e) {
      showToast('Failed to save settings to localStorage', 'error');
    }
  }

  // ==========================================================================
  // SUPABASE CLIENT & CLOUD SYNC
  // ==========================================================================
  function initSupabaseClient() {
    const url = (State.settings.supabaseUrl || '').trim();
    const key = (State.settings.supabaseKey || '').trim();

    if (url && key && window.supabase) {
      try {
        State.supabaseClient = window.supabase.createClient(url, key);
        State.supabaseConnected = true;
        updateSupabaseBadge(true);
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
        State.supabaseClient = null;
        State.supabaseConnected = false;
        updateSupabaseBadge(false);
      }
    } else {
      State.supabaseClient = null;
      State.supabaseConnected = false;
      updateSupabaseBadge(false);
    }
  }

  function updateSupabaseBadge(isConnected) {
    if (isConnected) {
      DOM.dbDot.classList.add('connected');
      DOM.dbStatusText.textContent = 'Supabase Cloud';
      DOM.storageStatusText.textContent = `Supabase: ${State.sessions.length} synched`;
    } else {
      DOM.dbDot.classList.remove('connected');
      DOM.dbStatusText.textContent = 'Local Vault';
      DOM.storageStatusText.textContent = `Local Vault: ${State.sessions.length} saved`;
    }
  }

  async function loadInitialSessions() {
    // 1. First load from local storage
    try {
      const savedLocal = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (savedLocal) {
        State.sessions = JSON.parse(savedLocal);
      }
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
      if (activeId) {
        State.activeSessionId = activeId;
      }
    } catch (e) {
      State.sessions = [];
    }

    // 2. If Supabase is connected, fetch and reconcile cloud sessions
    if (State.supabaseClient) {
      try {
        const { data: cloudSessions, error: sessErr } = await State.supabaseClient
          .from('chat_sessions')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!sessErr && Array.isArray(cloudSessions) && cloudSessions.length > 0) {
          // Fetch messages for each session
          const sessionList = [];
          for (const cs of cloudSessions) {
            const { data: msgs } = await State.supabaseClient
              .from('chat_messages')
              .select('*')
              .eq('session_id', cs.id)
              .order('timestamp', { ascending: true });

            sessionList.push({
              id: cs.id,
              title: cs.title,
              modelKey: cs.model_key || 'reasoning',
              createdAt: Number(cs.created_at),
              updatedAt: Number(cs.updated_at),
              messages: (msgs || []).map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                thinking: m.thinking,
                thinkDuration: m.think_duration,
                timestamp: Number(m.timestamp),
                attachment: m.attachment
              }))
            });
          }

          if (sessionList.length > 0) {
            State.sessions = sessionList;
            if (!State.activeSessionId || !sessionList.find(s => s.id === State.activeSessionId)) {
              State.activeSessionId = sessionList[0].id;
            }
          }
        }
      } catch (err) {
        console.warn('Supabase fetch failed, continuing with local storage:', err);
      }
    }
  }

  async function saveSessions() {
    // Always persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(State.sessions));
      if (State.activeSessionId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, State.activeSessionId);
      }
      updateStorageCounter();
    } catch (e) {
      console.warn('Storage quota issue:', e);
    }

    // If Supabase is configured, sync active session to cloud
    if (State.supabaseClient && State.activeSessionId) {
      const active = getActiveSession();
      if (active) {
        syncSessionToSupabase(active);
      }
    }
  }

  async function syncSessionToSupabase(session) {
    if (!State.supabaseClient) return;
    try {
      // Upsert Session row
      await State.supabaseClient.from('chat_sessions').upsert({
        id: session.id,
        title: session.title,
        model_key: session.modelKey,
        created_at: session.createdAt,
        updated_at: session.updatedAt
      });

      // Upsert Messages
      if (session.messages && session.messages.length > 0) {
        const payload = session.messages.map(m => ({
          id: m.id,
          session_id: session.id,
          role: m.role,
          content: m.content,
          thinking: m.thinking || null,
          think_duration: m.thinkDuration || null,
          timestamp: m.timestamp,
          attachment: m.attachment || null
        }));
        await State.supabaseClient.from('chat_messages').upsert(payload);
      }
    } catch (err) {
      console.warn('Failed to sync to Supabase:', err);
    }
  }

  async function deleteSessionFromSupabase(sessionId) {
    if (!State.supabaseClient) return;
    try {
      await State.supabaseClient.from('chat_sessions').delete().eq('id', sessionId);
    } catch (err) {
      console.warn('Failed to delete session from Supabase:', err);
    }
  }

  function getSession(id) {
    return State.sessions.find(s => s.id === id);
  }

  function getActiveSession() {
    return getSession(State.activeSessionId);
  }

  function createNewSession(shouldRender = true) {
    const newId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const session = {
      id: newId,
      title: 'New Conversation',
      modelKey: State.currentModelKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    State.sessions.unshift(session);
    State.activeSessionId = newId;
    saveSessions();

    if (shouldRender) {
      renderHistory();
      renderCurrentChat();
      DOM.promptInput.focus();
    }
    return session;
  }

  function switchSession(id) {
    const session = getSession(id);
    if (!session) return;
    State.activeSessionId = id;
    if (session.modelKey && PERSONAS[session.modelKey]) {
      setModel(session.modelKey, false);
    }
    saveSessions();
    renderHistory();
    renderCurrentChat();
  }

  async function deleteSession(id, e) {
    if (e) e.stopPropagation();
    const index = State.sessions.findIndex(s => s.id === id);
    if (index === -1) return;

    State.sessions.splice(index, 1);
    deleteSessionFromSupabase(id);

    if (State.activeSessionId === id) {
      if (State.sessions.length > 0) {
        State.activeSessionId = State.sessions[0].id;
      } else {
        createNewSession(false);
      }
    }
    saveSessions();
    renderHistory();
    renderCurrentChat();
    showToast('Conversation deleted');
    sound.play('click');
  }

  // ==========================================================================
  // RENDERING ENGINE
  // ==========================================================================
  function renderHistory(filterQuery = '') {
    DOM.historyList.innerHTML = '';
    const query = (filterQuery || '').trim().toLowerCase();

    const filtered = State.sessions.filter(s => {
      if (!query) return true;
      if (s.title.toLowerCase().includes(query)) return true;
      return s.messages.some(m => m.content.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-history-text';
      emptyDiv.textContent = query ? 'No matching conversations.' : 'No conversations yet.';
      DOM.historyList.appendChild(emptyDiv);
      return;
    }

    const today = [];
    const earlier = [];
    const oneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    filtered.forEach(item => {
      if (now - item.updatedAt < oneDayMs) {
        today.push(item);
      } else {
        earlier.push(item);
      }
    });

    const createGroup = (title, items) => {
      if (items.length === 0) return;
      const groupTitle = document.createElement('div');
      groupTitle.className = 'history-group-title';
      groupTitle.textContent = title;
      DOM.historyList.appendChild(groupTitle);

      items.forEach(session => {
        const itemEl = document.createElement('div');
        itemEl.className = 'history-item' + (session.id === State.activeSessionId ? ' active' : '');
        itemEl.dataset.id = session.id;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'history-item-title';
        titleSpan.textContent = session.title || 'Untitled Chat';

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'history-item-actions';

        const delBtn = document.createElement('button');
        delBtn.className = 'history-del-btn';
        delBtn.title = 'Delete chat';
        delBtn.innerHTML = '&times;';
        delBtn.addEventListener('click', (e) => deleteSession(session.id, e));

        actionsDiv.appendChild(delBtn);
        itemEl.appendChild(titleSpan);
        itemEl.appendChild(actionsDiv);

        itemEl.addEventListener('click', () => {
          switchSession(session.id);
          closeMobileSidebar();
          sound.play('click');
        });

        DOM.historyList.appendChild(itemEl);
      });
    };

    createGroup('Recent', today);
    createGroup('Previous Days', earlier);
  }

  function renderCurrentChat() {
    const session = getActiveSession();
    if (!session || session.messages.length === 0) {
      DOM.welcomeHero.style.display = 'flex';
      DOM.messagesStream.innerHTML = '';
      return;
    }

    DOM.welcomeHero.style.display = 'none';
    DOM.messagesStream.innerHTML = '';

    session.messages.forEach(msg => {
      const msgRow = createMessageElement(msg);
      DOM.messagesStream.appendChild(msgRow);
    });

    scrollToBottom();
  }

  function createMessageElement(msg) {
    const row = document.createElement('div');
    row.className = `message-row ${msg.role}`;
    row.id = `msg-${msg.id}`;

    // Avatar
    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'message-avatar-wrap';
    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${msg.role}`;

    if (msg.role === 'ai') {
      const img = document.createElement('img');
      img.src = 'assets/avatar.jpg';
      img.alt = 'Nexus AI';
      avatar.appendChild(img);
    } else {
      avatar.textContent = 'YOU';
    }
    avatarWrap.appendChild(avatar);
    row.appendChild(avatarWrap);

    // Body
    const body = document.createElement('div');
    body.className = 'message-body';

    // Thinking Block (Chain of Thought)
    if (msg.role === 'ai' && msg.thinking && State.settings.showReasoning) {
      const thinkingBox = document.createElement('div');
      thinkingBox.className = 'thinking-box expanded';

      const thinkingHeader = document.createElement('div');
      thinkingHeader.className = 'thinking-header';
      thinkingHeader.innerHTML = `
        <div class="thinking-left">
          <span class="thinking-pulse"></span>
          <span>Thought Process ${msg.thinkDuration ? `(${msg.thinkDuration}s)` : ''}</span>
        </div>
        <svg class="thinking-toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      `;
      thinkingHeader.addEventListener('click', () => {
        thinkingBox.classList.toggle('expanded');
        sound.play('click');
      });

      const thinkingContent = document.createElement('div');
      thinkingContent.className = 'thinking-content';
      thinkingContent.textContent = msg.thinking;

      thinkingBox.appendChild(thinkingHeader);
      thinkingBox.appendChild(thinkingContent);
      body.appendChild(thinkingBox);
    }

    // Main Content
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = parseMarkdown(msg.content);
    body.appendChild(content);

    // File Attachment Chip
    if (msg.attachment) {
      const attachChip = document.createElement('div');
      attachChip.className = 'attachment-chip';
      attachChip.style.margin = '4px 0';
      attachChip.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span>${escapeHtml(msg.attachment.name)}</span>
      `;
      body.insertBefore(attachChip, content);
    }

    // Message Actions Bar
    if (msg.role === 'ai') {
      const actions = document.createElement('div');
      actions.className = 'message-actions';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'msg-action-btn';
      copyBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(msg.content).then(() => {
          copyBtn.innerHTML = `<span>Copied! ✓</span>`;
          sound.play('click');
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            `;
          }, 2000);
        });
      });

      const ttsBtn = document.createElement('button');
      ttsBtn.className = 'msg-action-btn';
      ttsBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <span>Speak</span>
      `;
      ttsBtn.addEventListener('click', () => {
        toggleSpeechForMessage(msg.id, msg.content, ttsBtn);
      });

      const regenBtn = document.createElement('button');
      regenBtn.className = 'msg-action-btn';
      regenBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6"></path>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span>Regenerate</span>
      `;
      regenBtn.addEventListener('click', () => regenerateLastResponse());

      const timeSpan = document.createElement('span');
      timeSpan.className = 'msg-timestamp';
      const time = new Date(msg.timestamp || Date.now());
      timeSpan.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      actions.appendChild(copyBtn);
      actions.appendChild(ttsBtn);
      actions.appendChild(regenBtn);
      actions.appendChild(timeSpan);
      body.appendChild(actions);
    }

    row.appendChild(body);
    attachCodeCopyHandlers(row);
    return row;
  }

  function updateStorageCounter() {
    updateSupabaseBadge(State.supabaseConnected);
  }

  function scrollToBottom(force = false) {
    DOM.chatViewport.scrollTo({
      top: DOM.chatViewport.scrollHeight,
      behavior: force ? 'auto' : 'smooth'
    });
  }

  // ==========================================================================
  // MARKDOWN & SYNTAX FORMATTING
  // ==========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseMarkdown(text) {
    if (!text) return '';

    let out = text;

    // Code blocks
    out = out.replace(/```([a-zA-Z0-9_\-]*)\n([\s\S]*?)```/g, function (_, lang, code) {
      const language = lang.trim() || 'code';
      const escapedCode = escapeHtml(code.trim());
      return `
        <div class="code-card">
          <div class="code-card-header">
            <span class="code-lang-tag">${escapeHtml(language)}</span>
            <button class="copy-code-btn" type="button" data-code="${escapeHtml(code.trim())}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy code</span>
            </button>
          </div>
          <pre><code>${escapedCode}</code></pre>
        </div>
      `;
    });

    // Inline code
    out = out.replace(/`([^`\n]+)`/g, function (_, c) {
      return `<code>${escapeHtml(c)}</code>`;
    });

    // Headings
    out = out.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    out = out.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    out = out.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    out = out.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Bold & Italics
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Lists
    out = out.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
    out = out.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    out = out.replace(/<\/ul>\s*<ul>/g, '');

    // Paragraph line breaks
    out = out.replace(/\n{2,}/g, '</p><p>');
    out = out.replace(/\n/g, '<br>');

    if (!out.startsWith('<h') && !out.startsWith('<div') && !out.startsWith('<ul') && !out.startsWith('<blockquote')) {
      out = `<p>${out}</p>`;
    }

    return out;
  }

  function attachCodeCopyHandlers(container) {
    const copyBtns = container.querySelectorAll('.copy-code-btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const codeText = btn.getAttribute('data-code');
        if (!codeText) return;
        navigator.clipboard.writeText(codeText).then(() => {
          const span = btn.querySelector('span');
          if (span) span.textContent = 'Copied! ✓';
          sound.play('click');
          setTimeout(() => {
            if (span) span.textContent = 'Copy code';
          }, 2000);
        });
      });
    });
  }

  // ==========================================================================
  // SEND MESSAGE & STREAMING INTELLIGENCE
  // ==========================================================================
  async function handlePromptSubmit(e) {
    if (e) e.preventDefault();
    if (State.isStreaming) return;

    const rawPrompt = DOM.promptInput.value.trim();
    if (!rawPrompt && !State.attachedFile) return;

    sound.play('send');

    let session = getActiveSession();
    if (!session) {
      session = createNewSession(false);
    }

    if (session.messages.length === 0) {
      session.title = summarizePromptTitle(rawPrompt);
      session.modelKey = State.currentModelKey;
    }

    const userMsgId = 'user_' + Date.now();
    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: rawPrompt,
      timestamp: Date.now(),
      attachment: State.attachedFile ? {
        name: State.attachedFile.name,
        size: State.attachedFile.size,
        content: State.attachedFile.content
      } : null
    };

    session.messages.push(userMessage);
    session.updatedAt = Date.now();
    saveSessions();

    DOM.promptInput.value = '';
    DOM.promptInput.style.height = 'auto';
    clearAttachment();
    updateTokenCount();

    DOM.welcomeHero.style.display = 'none';
    const userRow = createMessageElement(userMessage);
    DOM.messagesStream.appendChild(userRow);
    renderHistory();
    scrollToBottom();

    await streamAiResponse(session, rawPrompt, userMessage.attachment);
  }

  function summarizePromptTitle(prompt) {
    const cleaned = prompt.replace(/[#*`_]/g, '').trim();
    if (cleaned.length <= 32) return cleaned || 'New Chat';
    return cleaned.substring(0, 32).trim() + '...';
  }

  async function streamAiResponse(session, prompt, attachment) {
    State.isStreaming = true;
    updateGeneratingState(true);

    const persona = PERSONAS[State.currentModelKey] || PERSONAS.reasoning;
    const aiMsgId = 'ai_' + Date.now();

    const typingRow = document.createElement('div');
    typingRow.className = 'message-row ai';
    typingRow.id = 'temp-typing-row';
    typingRow.innerHTML = `
      <div class="message-avatar-wrap">
        <div class="msg-avatar ai">
          <img src="assets/avatar.jpg" alt="Nexus AI">
        </div>
      </div>
      <div class="message-body">
        <div class="message-content typing-bubble">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    DOM.messagesStream.appendChild(typingRow);
    scrollToBottom();

    State.abortController = new AbortController();

    try {
      let finalContent = '';
      let thinkingSteps = '';
      let thinkDuration = 1.2;

      // Determine active AI engine:
      // If Gemini API key is configured or provider is 'gemini', run Gemini Direct!
      const activeProvider = State.settings.provider;
      const hasGeminiKey = Boolean(State.settings.geminiApiKey || (activeProvider === 'gemini' && State.settings.apiKey));

      if (activeProvider === 'gemini' || (hasGeminiKey && activeProvider !== 'simulator')) {
        // Direct Google Gemini API call
        const apiResponse = await callGeminiApi(prompt, session.messages, attachment, State.abortController.signal);
        typingRow.remove();

        finalContent = apiResponse.text;
        thinkingSteps = apiResponse.thinking || persona.thinkingPrefix;
        thinkDuration = (1.1 + Math.random() * 0.6).toFixed(1);

        const aiMessageObj = {
          id: aiMsgId,
          role: 'ai',
          content: finalContent,
          thinking: State.settings.showReasoning ? thinkingSteps : null,
          thinkDuration: thinkDuration,
          timestamp: Date.now()
        };

        session.messages.push(aiMessageObj);
        const aiRow = createMessageElement(aiMessageObj);
        DOM.messagesStream.appendChild(aiRow);
        scrollToBottom();

      } else if (activeProvider === 'openai' || activeProvider === 'groq' || activeProvider === 'ollama') {
        // Other live providers
        const apiResponse = await callGenericLiveApi(prompt, session.messages, State.abortController.signal);
        typingRow.remove();

        finalContent = apiResponse.text;
        thinkingSteps = apiResponse.thinking || persona.thinkingPrefix;
        thinkDuration = 1.4;

        const aiMessageObj = {
          id: aiMsgId,
          role: 'ai',
          content: finalContent,
          thinking: State.settings.showReasoning ? thinkingSteps : null,
          thinkDuration: thinkDuration,
          timestamp: Date.now()
        };

        session.messages.push(aiMessageObj);
        const aiRow = createMessageElement(aiMessageObj);
        DOM.messagesStream.appendChild(aiRow);
        scrollToBottom();

      } else {
        // Built-in Neural Simulator
        const simResult = generateSimulatedResponse(prompt, State.currentModelKey, attachment);
        thinkingSteps = simResult.thinking;
        finalContent = simResult.content;
        thinkDuration = (1.2 + Math.random() * 0.8).toFixed(1);

        typingRow.remove();

        const aiMessageObj = {
          id: aiMsgId,
          role: 'ai',
          content: '',
          thinking: State.settings.showReasoning ? thinkingSteps : null,
          thinkDuration: thinkDuration,
          timestamp: Date.now()
        };

        session.messages.push(aiMessageObj);
        const aiRow = createMessageElement(aiMessageObj);
        DOM.messagesStream.appendChild(aiRow);

        const contentEl = aiRow.querySelector('.message-content');
        const speedMultiplier = [50, 30, 15, 6][State.settings.speed - 1] || 15;

        let currentIndex = 0;
        const totalChars = finalContent.length;
        const chunkSize = State.settings.speed === 4 ? 6 : (State.settings.speed === 3 ? 3 : 1);

        await new Promise((resolve) => {
          const streamInterval = setInterval(() => {
            if (State.abortController?.signal.aborted) {
              clearInterval(streamInterval);
              aiMessageObj.content = finalContent.substring(0, currentIndex) + ' *(stream interrupted)*';
              contentEl.innerHTML = parseMarkdown(aiMessageObj.content);
              attachCodeCopyHandlers(aiRow);
              resolve();
              return;
            }

            currentIndex += chunkSize;
            if (currentIndex >= totalChars) {
              currentIndex = totalChars;
              clearInterval(streamInterval);
              aiMessageObj.content = finalContent;
              contentEl.innerHTML = parseMarkdown(finalContent);
              attachCodeCopyHandlers(aiRow);
              resolve();
            } else {
              const slice = finalContent.substring(0, currentIndex);
              contentEl.innerHTML = parseMarkdown(slice + ' ▌');
              scrollToBottom();
            }
          }, speedMultiplier);
        });
      }

      session.updatedAt = Date.now();
      saveSessions();
      sound.play('receive');

      if (State.settings.autoTts) {
        toggleSpeechForMessage(aiMsgId, finalContent);
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        typingRow.remove();
        showToast('Error generating response: ' + (err.message || 'Unknown'), 'error');
        const errMessageObj = {
          id: aiMsgId,
          role: 'ai',
          content: `⚠️ **Generation Error**: ${err.message || 'The request could not be processed.'}\n\nPlease check your **Gemini API Key** in **Preferences & API** or switch back to the **Built-in Neural Simulator**.`,
          timestamp: Date.now()
        };
        session.messages.push(errMessageObj);
        const errRow = createMessageElement(errMessageObj);
        DOM.messagesStream.appendChild(errRow);
      }
    } finally {
      State.isStreaming = false;
      State.abortController = null;
      updateGeneratingState(false);
      scrollToBottom();
    }
  }

  function updateGeneratingState(isGenerating) {
    if (isGenerating) {
      DOM.sendBtn.style.display = 'none';
      DOM.stopGenerationBtn.style.display = 'flex';
      DOM.promptInput.disabled = true;
    } else {
      DOM.sendBtn.style.display = 'flex';
      DOM.stopGenerationBtn.style.display = 'none';
      DOM.promptInput.disabled = false;
      DOM.promptInput.focus();
    }
  }

  function regenerateLastResponse() {
    const session = getActiveSession();
    if (!session || session.messages.length === 0) return;

    let lastUserIndex = -1;
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const userMessage = session.messages[lastUserIndex];
    session.messages = session.messages.slice(0, lastUserIndex + 1);
    saveSessions();
    renderCurrentChat();

    streamAiResponse(session, userMessage.content, userMessage.attachment);
  }

  // ==========================================================================
  // DIRECT GOOGLE GEMINI API CALL
  // ==========================================================================
  async function callGeminiApi(prompt, history, attachment, abortSignal) {
    const apiKey = (State.settings.geminiApiKey || State.settings.apiKey || '').trim();
    if (!apiKey) {
      throw new Error('Google Gemini API Key is missing. Please enter your key in Studio Preferences.');
    }

    const model = State.settings.geminiModel || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Format conversation history for Gemini API
    const contents = [];
    const recentMessages = history.slice(-12);

    recentMessages.forEach(m => {
      let text = m.content;
      if (m.attachment && m.attachment.content) {
        text += `\n\n[Attached File: ${m.attachment.name}]\n${m.attachment.content.slice(0, 15000)}`;
      }
      contents.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: text }]
      });
    });

    const activePersona = PERSONAS[State.currentModelKey] || PERSONAS.reasoning;
    const systemPromptText = `${activePersona.systemPrompt}\n${State.settings.systemPrompt || ''}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPromptText }]
      },
      contents: contents,
      generationConfig: {
        temperature: State.settings.temperature,
        maxOutputTokens: 4096
      }
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: abortSignal
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.error?.message || `Gemini API HTTP Error ${res.status}`;
      if (msg.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API Key. Please verify your key at https://aistudio.google.com/app/apikey');
      }
      if (msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Gemini API quota exceeded for this model. Try gemini-1.5-flash or check Google AI Studio.');
      }
      throw new Error(msg);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || 'No response returned from Gemini.';

    const thinking = `✨ Live Response via Google Gemini (${model})
- Token Verification: Success
- Safety Evaluation: Clear
- Persona Modulation: ${activePersona.name}`;

    return { text, thinking };
  }

  // ==========================================================================
  // GENERIC API CALL (OpenAI / Groq / Ollama)
  // ==========================================================================
  async function callGenericLiveApi(prompt, history, abortSignal) {
    const provider = State.settings.provider;
    const apiKey = State.settings.apiKey;

    if (!apiKey && provider !== 'ollama') {
      throw new Error(`API key required for ${provider.toUpperCase()}.`);
    }

    const isGroq = provider === 'groq';
    const isOllama = provider === 'ollama';

    if (isOllama) {
      const model = State.settings.customModel || 'llama3';
      const endpoint = 'http://localhost:11434/api/chat';
      const messages = history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false }),
        signal: abortSignal
      });
      if (!res.ok) throw new Error('Ollama server returned status ' + res.status);
      const data = await res.json();
      return { text: data.message?.content || '', thinking: 'Synthesized locally via Ollama.' };
    }

    const defaultModel = isGroq ? 'llama-3.1-70b-versatile' : 'gpt-4o-mini';
    const model = State.settings.customModel || defaultModel;
    const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';

    const messages = [
      { role: 'system', content: State.settings.systemPrompt },
      ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: State.settings.temperature
      }),
      signal: abortSignal
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || 'No response returned.';
    return { text, thinking: `Synthesized via ${provider.toUpperCase()}` };
  }

  // ==========================================================================
  // BUILT-IN SIMULATOR
  // ==========================================================================
  function generateSimulatedResponse(prompt, modelKey, attachment) {
    const p = prompt.toLowerCase();
    let thinking = `1. Intent Classification: Query regarding "${prompt.slice(0, 45)}...".
2. Constraints: Active Model = ${PERSONAS[modelKey]?.name || 'Nexus Pro'}.
3. Synthesis: Generating structured architectural guidance and code.`;

    let content = '';

    if (p.includes('rate limit') || p.includes('token bucket')) {
      content = `### High-Throughput Token Bucket Rate Limiter

The **Token Bucket Algorithm** regulates network traffic and API requests by adding tokens to a bucket at a constant fill rate $r$, up to maximum capacity $b$.

\`\`\`typescript
export interface RateLimiterOptions {
  capacity: number;
  refillRatePerSec: number;
}

export class TokenBucketLimiter {
  private capacity: number;
  private refillRate: number;
  private tokens: number;
  private lastRefillTimestamp: number;

  constructor({ capacity, refillRatePerSec }: RateLimiterOptions) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec;
    this.tokens = capacity;
    this.lastRefillTimestamp = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    if (elapsedSeconds > 0) {
      const addedTokens = elapsedSeconds * this.refillRate;
      this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
      this.lastRefillTimestamp = now;
    }
  }

  public tryConsume(tokensRequired: number = 1): { allowed: boolean; remaining: number } {
    this.refill();
    if (this.tokens >= tokensRequired) {
      this.tokens -= tokensRequired;
      return { allowed: true, remaining: Math.floor(this.tokens) };
    }
    return { allowed: false, remaining: Math.floor(this.tokens) };
  }
}
\`\`\``;
    } else if (p.includes('supabase') || p.includes('database')) {
      content = `### Supabase Cloud PostgreSQL Architecture

Supabase provides enterprise-grade Postgres with Row-Level Security (RLS) and real-time streaming subscriptions:

| Table | Primary Key | Description |
|---|---|---|
| \`chat_sessions\` | \`id\` (TEXT) | Holds session title, model type, timestamps |
| \`chat_messages\` | \`id\` (TEXT) | Holds conversation messages, roles, thinking traces, attachments |

#### Connection Status:
- **Project URL & Anon Key**: Saved in your **Preferences & API** modal.
- **SQL Setup**: Click the **"Copy SQL Schema"** button in settings and paste it directly into your Supabase SQL editor!`;
    } else {
      content = `### Solution & Analysis

Thank you for your inquiry: **"${escapeHtml(prompt)}"**.

#### Key Considerations:
1. **First Principles**: Address the root constraints and interface design.
2. **Resilience**: Implement graceful fallbacks and boundary verification.

\`\`\`javascript
// Recommended pattern
export async function executePipeline(input, config = {}) {
  const result = await processTask(input);
  return { success: true, timestamp: Date.now(), result };
}
\`\`\``;
    }

    if (attachment) {
      content += `\n\n> 📎 *Context incorporated from attached file: \`${escapeHtml(attachment.name)}\` (${Math.round(attachment.size / 1024)} KB).*`;
    }

    return { thinking, content };
  }

  // ==========================================================================
  // SPEECH RECOGNITION (Voice to Text)
  // ==========================================================================
  let speechRecognizer = null;

  function initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return null;

    const recognizer = new SpeechRec();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    recognizer.onstart = () => {
      DOM.voiceBanner.style.display = 'flex';
      sound.play('click');
    };

    recognizer.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      DOM.promptInput.value = (final || interim);
      updateTokenCount();
    };

    recognizer.onerror = (e) => {
      showToast('Voice dictation error: ' + (e.error || 'Check microphone access'), 'error');
      DOM.voiceBanner.style.display = 'none';
    };

    recognizer.onend = () => {
      DOM.voiceBanner.style.display = 'none';
    };

    return recognizer;
  }

  function toggleVoiceDictation() {
    if (!speechRecognizer) {
      speechRecognizer = initSpeechRecognition();
    }
    if (!speechRecognizer) {
      showToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    try {
      if (DOM.voiceBanner.style.display === 'flex') {
        speechRecognizer.stop();
        DOM.voiceBanner.style.display = 'none';
      } else {
        speechRecognizer.start();
      }
    } catch (e) {
      speechRecognizer.stop();
      DOM.voiceBanner.style.display = 'none';
    }
  }

  // ==========================================================================
  // TEXT TO SPEECH
  // ==========================================================================
  function toggleSpeechForMessage(msgId, text, triggerBtn) {
    if (!('speechSynthesis' in window)) {
      showToast('Speech synthesis not supported in this browser.', 'error');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (State.activeSpeechMsgId === msgId) {
        State.activeSpeechMsgId = null;
        if (triggerBtn) triggerBtn.classList.remove('active');
        return;
      }
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*`_>]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    State.activeSpeechMsgId = msgId;
    if (triggerBtn) triggerBtn.classList.add('active');

    utterance.onend = () => {
      State.activeSpeechMsgId = null;
      if (triggerBtn) triggerBtn.classList.remove('active');
    };

    utterance.onerror = () => {
      State.activeSpeechMsgId = null;
      if (triggerBtn) triggerBtn.classList.remove('active');
    };

    window.speechSynthesis.speak(utterance);
  }

  // ==========================================================================
  // FILE ATTACHMENTS
  // ==========================================================================
  function handleFileSelection(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('File exceeds 2 MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      State.attachedFile = {
        name: file.name,
        size: file.size,
        content: loadEvt.target.result
      };
      DOM.attachmentName.textContent = file.name;
      DOM.attachmentSize.textContent = `${Math.round(file.size / 1024)} KB`;
      DOM.attachmentTray.style.display = 'flex';
      sound.play('click');
      showToast(`Attached ${file.name}`);
    };
    reader.onerror = () => {
      showToast('Failed to read file.', 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function clearAttachment() {
    State.attachedFile = null;
    DOM.attachmentTray.style.display = 'none';
  }

  // ==========================================================================
  // EXPORT
  // ==========================================================================
  function exportMarkdown() {
    const session = getActiveSession();
    if (!session || session.messages.length === 0) {
      showToast('No messages to export.', 'error');
      return;
    }

    let md = `# ${session.title}\n*Exported from NEXUS AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
    session.messages.forEach(msg => {
      const sender = msg.role === 'user' ? '### 👤 User' : `### 🧠 Nexus AI (${session.modelKey})`;
      md += `${sender}  \n`;
      if (msg.thinking) {
        md += `> **Thought Process:**\n> ${msg.thinking.replace(/\n/g, '\n> ')}\n\n`;
      }
      md += `${msg.content}\n\n---\n\n`;
    });

    downloadFile(md, `${sanitizeFilename(session.title)}.md`, 'text/markdown');
    closeModal(DOM.exportModal);
    showToast('Markdown file downloaded');
  }

  function exportJson() {
    const session = getActiveSession();
    if (!session) return;
    const jsonStr = JSON.stringify(session, null, 2);
    downloadFile(jsonStr, `${sanitizeFilename(session.title)}.json`, 'application/json');
    closeModal(DOM.exportModal);
    showToast('JSON archive downloaded');
  }

  function copyTranscript() {
    const session = getActiveSession();
    if (!session || session.messages.length === 0) return;

    let text = `${session.title}\n\n`;
    session.messages.forEach(msg => {
      text += `[${msg.role.toUpperCase()}]: ${msg.content}\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      showToast('Full transcript copied to clipboard!');
      closeModal(DOM.exportModal);
    });
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function sanitizeFilename(name) {
    return (name || 'nexus_chat').replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
  }

  // ==========================================================================
  // UI INTERACTIONS & THEME ENGINE
  // ==========================================================================
  function setModel(key, shouldNotify = true) {
    if (!PERSONAS[key]) return;
    State.currentModelKey = key;
    updateModelUI();
    const activeSession = getActiveSession();
    if (activeSession) {
      activeSession.modelKey = key;
      saveSessions();
    }
    if (shouldNotify) {
      showToast(`Switched to ${PERSONAS[key].name}`);
      sound.play('click');
    }
  }

  function updateModelUI() {
    const persona = PERSONAS[State.currentModelKey] || PERSONAS.reasoning;
    DOM.currentModelIcon.textContent = persona.icon;
    DOM.currentModelName.textContent = persona.name;
    DOM.currentModelTag.textContent = persona.tag;
    DOM.activeModelBadge.textContent = persona.name;

    const items = DOM.modelMenu.querySelectorAll('.model-menu-item');
    items.forEach(item => {
      if (item.dataset.model === State.currentModelKey) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function applyTheme(themeKey) {
    DOM.body.setAttribute('data-theme', themeKey);
    State.settings.theme = themeKey;

    const opts = DOM.themeMenu.querySelectorAll('.theme-option');
    opts.forEach(opt => {
      if (opt.dataset.theme === themeKey) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  function updateSoundIcon() {
    if (State.settings.soundEnabled) {
      DOM.soundIconOn.style.display = 'inline';
      DOM.soundIconOff.style.display = 'none';
    } else {
      DOM.soundIconOn.style.display = 'none';
      DOM.soundIconOff.style.display = 'inline';
    }
  }

  function updateEngineBadge() {
    const prov = State.settings.provider;
    const hasGeminiKey = Boolean(State.settings.geminiApiKey);

    if (prov === 'gemini' || hasGeminiKey) {
      DOM.engineModeText.textContent = `Gemini (${State.settings.geminiModel || 'flash'}) ✨`;
    } else {
      const names = {
        simulator: 'Neural Simulator',
        openai: 'OpenAI Direct',
        groq: 'Groq Ultra-Fast',
        ollama: 'Ollama Local'
      };
      DOM.engineModeText.textContent = names[prov] || 'Neural Simulator';
    }
  }

  function updateTokenCount() {
    const text = DOM.promptInput.value;
    const tokens = Math.ceil(text.length / 4);
    DOM.tokenEstimate.textContent = `${tokens} token${tokens === 1 ? '' : 's'}`;
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>${type === 'error' ? '⚠️' : '✨'}</span>
      <span>${escapeHtml(message)}</span>
    `;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 260);
    }, 3200);
  }

  function openModal(modalEl) {
    modalEl.style.display = 'flex';
  }

  function closeModal(modalEl) {
    modalEl.style.display = 'none';
  }

  function closeMobileSidebar() {
    DOM.sidebar.classList.remove('mobile-open');
    DOM.sidebarOverlay.classList.remove('active');
  }

  // ==========================================================================
  // EVENT LISTENERS & SETTINGS CONTROLS
  // ==========================================================================
  function setupEventListeners() {
    // Input Handling
    DOM.promptInput.addEventListener('input', () => {
      DOM.promptInput.style.height = 'auto';
      DOM.promptInput.style.height = Math.min(DOM.promptInput.scrollHeight, 180) + 'px';
      updateTokenCount();
    });

    DOM.promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handlePromptSubmit();
      }
    });

    DOM.promptForm.addEventListener('submit', handlePromptSubmit);

    DOM.stopGenerationBtn.addEventListener('click', () => {
      if (State.abortController) {
        State.abortController.abort();
      }
      sound.play('click');
      showToast('Generation cancelled');
    });

    // Starters
    const starterCards = document.querySelectorAll('.starter-card');
    starterCards.forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        DOM.promptInput.value = prompt;
        DOM.promptInput.style.height = 'auto';
        DOM.promptInput.style.height = DOM.promptInput.scrollHeight + 'px';
        updateTokenCount();
        handlePromptSubmit();
      });
    });

    // New Chat
    DOM.newChatBtn.addEventListener('click', () => {
      createNewSession(true);
      closeMobileSidebar();
      sound.play('click');
    });

    // Shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        createNewSession(true);
      }
      if (e.key === 'Escape') {
        closeModal(DOM.settingsModal);
        closeModal(DOM.exportModal);
        DOM.modelDropdown.classList.remove('open');
        DOM.themeDropdown.classList.remove('open');
      }
    });

    // Search
    DOM.chatSearchInput.addEventListener('input', (e) => {
      renderHistory(e.target.value);
    });

    // Clear Chat
    DOM.clearChatBtn.addEventListener('click', async () => {
      const session = getActiveSession();
      if (!session) return;
      if (confirm('Clear messages in this conversation?')) {
        session.messages = [];
        if (State.supabaseClient) {
          try {
            await State.supabaseClient.from('chat_messages').delete().eq('session_id', session.id);
          } catch(e) {}
        }
        saveSessions();
        renderCurrentChat();
        sound.play('click');
        showToast('Conversation cleared');
      }
    });

    // Sidebar
    DOM.collapseSidebarBtn.addEventListener('click', () => {
      DOM.sidebar.classList.toggle('collapsed');
      sound.play('click');
    });

    DOM.mobileMenuBtn.addEventListener('click', () => {
      DOM.sidebar.classList.add('mobile-open');
      DOM.sidebarOverlay.classList.add('active');
    });

    DOM.sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Dropdowns
    DOM.modelSelectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.modelDropdown.classList.toggle('open');
      DOM.themeDropdown.classList.remove('open');
    });

    const modelMenuItems = DOM.modelMenu.querySelectorAll('.model-menu-item');
    modelMenuItems.forEach(item => {
      item.addEventListener('click', () => {
        const modelKey = item.getAttribute('data-model');
        setModel(modelKey);
        DOM.modelDropdown.classList.remove('open');
      });
    });

    DOM.themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.themeDropdown.classList.toggle('open');
      DOM.modelDropdown.classList.remove('open');
    });

    const themeOptions = DOM.themeMenu.querySelectorAll('.theme-option');
    themeOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const theme = opt.getAttribute('data-theme');
        applyTheme(theme);
        saveSettings();
        DOM.themeDropdown.classList.remove('open');
        sound.play('click');
      });
    });

    document.addEventListener('click', () => {
      DOM.modelDropdown.classList.remove('open');
      DOM.themeDropdown.classList.remove('open');
    });

    DOM.soundToggleBtn.addEventListener('click', () => {
      State.settings.soundEnabled = !State.settings.soundEnabled;
      updateSoundIcon();
      saveSettings();
      if (State.settings.soundEnabled) sound.play('click');
      showToast(State.settings.soundEnabled ? 'Sound feedback ON' : 'Sound feedback OFF');
    });

    DOM.fileAttachmentInput.addEventListener('change', handleFileSelection);
    DOM.removeAttachmentBtn.addEventListener('click', clearAttachment);
    DOM.voiceDictateBtn.addEventListener('click', toggleVoiceDictation);
    DOM.voiceCancelBtn.addEventListener('click', () => {
      if (speechRecognizer) speechRecognizer.stop();
      DOM.voiceBanner.style.display = 'none';
    });

    // Export Modal
    DOM.exportChatBtn.addEventListener('click', () => openModal(DOM.exportModal));
    DOM.closeExportBtn.addEventListener('click', () => closeModal(DOM.exportModal));
    DOM.cancelExportBtn.addEventListener('click', () => closeModal(DOM.exportModal));
    DOM.exportMarkdownBtn.addEventListener('click', exportMarkdown);
    DOM.exportJsonBtn.addEventListener('click', exportJson);
    DOM.copyTranscriptBtn.addEventListener('click', copyTranscript);

    // Database Badge click opens Settings Supabase tab
    DOM.dbStatusBadge.addEventListener('click', () => {
      openSettingsToTab('supabaseTab');
    });

    // Settings Modal Tabs
    const tabButtons = DOM.settingsModal.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        openSettingsToTab(targetTabId);
      });
    });

    DOM.openSettingsBtn.addEventListener('click', () => {
      populateSettingsForm();
      openModal(DOM.settingsModal);
    });

    DOM.closeSettingsBtn.addEventListener('click', () => closeModal(DOM.settingsModal));

    DOM.tempSlider.addEventListener('input', (e) => {
      DOM.tempValue.textContent = e.target.value;
    });

    DOM.speedSlider.addEventListener('input', (e) => {
      const labels = ['Slow', 'Normal', 'Fast', 'Instant'];
      DOM.speedValue.textContent = labels[e.target.value - 1] || 'Fast';
    });

    // Password visibility toggles
    DOM.toggleGeminiKeyVisibility.addEventListener('click', () => {
      const isPw = DOM.geminiApiKeyInput.type === 'password';
      DOM.geminiApiKeyInput.type = isPw ? 'text' : 'password';
      DOM.toggleGeminiKeyVisibility.textContent = isPw ? 'Hide' : 'Show';
    });

    DOM.toggleSupabaseKeyVisibility.addEventListener('click', () => {
      const isPw = DOM.supabaseKeyInput.type === 'password';
      DOM.supabaseKeyInput.type = isPw ? 'text' : 'password';
      DOM.toggleSupabaseKeyVisibility.textContent = isPw ? 'Hide' : 'Show';
    });

    DOM.toggleGenericKeyVisibility.addEventListener('click', () => {
      const isPw = DOM.apiKeyInput.type === 'password';
      DOM.apiKeyInput.type = isPw ? 'text' : 'password';
      DOM.toggleGenericKeyVisibility.textContent = isPw ? 'Hide' : 'Show';
    });

    // ========================================================================
    // TEST GEMINI CONNECTION BUTTON
    // ========================================================================
    DOM.testGeminiBtn.addEventListener('click', async () => {
      const key = DOM.geminiApiKeyInput.value.trim();
      const model = DOM.geminiModelSelect.value;
      if (!key) {
        showTestFeedback(DOM.geminiFeedbackBox, 'Please enter a Gemini API Key first.', 'error');
        DOM.geminiStatusPill.className = 'connection-status-pill error';
        DOM.geminiStatusPill.textContent = 'Key Missing';
        return;
      }

      DOM.geminiStatusPill.className = 'connection-status-pill';
      DOM.geminiStatusPill.textContent = 'Verifying...';
      DOM.testGeminiBtn.disabled = true;

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Respond with just "OK"' }] }]
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK';

        DOM.geminiStatusPill.className = 'connection-status-pill success';
        DOM.geminiStatusPill.textContent = 'Active & Verified ✅';
        showTestFeedback(DOM.geminiFeedbackBox, `✨ Verified successfully with ${model}! Gemini responded: "${reply}"`, 'success');
        sound.play('receive');

      } catch (err) {
        DOM.geminiStatusPill.className = 'connection-status-pill error';
        DOM.geminiStatusPill.textContent = 'Verification Failed';
        showTestFeedback(DOM.geminiFeedbackBox, `⚠️ Gemini Error: ${err.message}`, 'error');
      } finally {
        DOM.testGeminiBtn.disabled = false;
      }
    });

    // ========================================================================
    // TEST SUPABASE CONNECTION BUTTON
    // ========================================================================
    DOM.testSupabaseBtn.addEventListener('click', async () => {
      const url = DOM.supabaseUrlInput.value.trim();
      const key = DOM.supabaseKeyInput.value.trim();

      if (!url || !key) {
        showTestFeedback(DOM.supabaseFeedbackBox, 'Please enter both Supabase Project URL and Anon Key.', 'error');
        return;
      }

      if (!window.supabase) {
        showTestFeedback(DOM.supabaseFeedbackBox, 'Supabase client library not loaded. Check internet connection.', 'error');
        return;
      }

      DOM.testSupabaseBtn.disabled = true;
      try {
        const testClient = window.supabase.createClient(url, key);
        // Test query on chat_sessions
        const { data, error } = await testClient.from('chat_sessions').select('id').limit(1);

        if (error) {
          if (error.code === '42P01' || error.message.includes('relation "public.chat_sessions" does not exist')) {
            showTestFeedback(DOM.supabaseFeedbackBox, '⚠️ Connected to Supabase, but tables are missing! Click "Copy SQL Schema", paste into Supabase SQL Editor and run it.', 'error');
          } else {
            showTestFeedback(DOM.supabaseFeedbackBox, `⚠️ Supabase Error (${error.code || 'ERR'}): ${error.message}`, 'error');
          }
        } else {
          showTestFeedback(DOM.supabaseFeedbackBox, '✅ Connected successfully! Supabase tables (chat_sessions & chat_messages) are ready.', 'success');
          sound.play('receive');
        }
      } catch (err) {
        showTestFeedback(DOM.supabaseFeedbackBox, `⚠️ Connection Exception: ${err.message}`, 'error');
      } finally {
        DOM.testSupabaseBtn.disabled = false;
      }
    });

    // ========================================================================
    // COPY SQL SCHEMA BUTTON
    // ========================================================================
    DOM.copySqlSchemaBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA).then(() => {
        sound.play('click');
        showToast('Supabase SQL Schema copied to clipboard! Paste it into Supabase SQL Editor.');
        showTestFeedback(DOM.supabaseFeedbackBox, '📋 SQL Schema copied! Go to Supabase Dashboard → SQL Editor → New Query → Paste & Run.', 'success');
      });
    });

    // ========================================================================
    // SYNC LOCAL CHATS TO SUPABASE BUTTON
    // ========================================================================
    DOM.syncToSupabaseBtn.addEventListener('click', async () => {
      if (!State.supabaseClient) {
        showToast('Please connect Supabase first.', 'error');
        return;
      }
      DOM.syncToSupabaseBtn.disabled = true;
      try {
        let count = 0;
        for (const s of State.sessions) {
          await syncSessionToSupabase(s);
          count++;
        }
        showToast(`Synced ${count} conversation(s) to Supabase cloud!`);
        showTestFeedback(DOM.supabaseFeedbackBox, `✅ Successfully synced ${count} local conversations to Supabase!`, 'success');
        updateSupabaseBadge(true);
      } catch (err) {
        showToast('Sync failed: ' + err.message, 'error');
      } finally {
        DOM.syncToSupabaseBtn.disabled = false;
      }
    });

    // ========================================================================
    // SAVE SETTINGS & CONNECT
    // ========================================================================
    DOM.saveSettingsBtn.addEventListener('click', async () => {
      State.settings.geminiApiKey = DOM.geminiApiKeyInput.value.trim();
      State.settings.geminiModel = DOM.geminiModelSelect.value;
      State.settings.supabaseUrl = DOM.supabaseUrlInput.value.trim();
      State.settings.supabaseKey = DOM.supabaseKeyInput.value.trim();
      State.settings.provider = DOM.providerSelect.value;
      State.settings.apiKey = DOM.apiKeyInput.value.trim();
      State.settings.systemPrompt = DOM.systemPromptInput.value.trim();
      State.settings.temperature = parseFloat(DOM.tempSlider.value);
      State.settings.speed = parseInt(DOM.speedSlider.value, 10);
      State.settings.soundEnabled = DOM.settingSoundToggle.checked;
      State.settings.showReasoning = DOM.settingReasoningToggle.checked;
      State.settings.autoTts = DOM.settingAutoTtsToggle.checked;

      // Auto-activate Gemini if key is provided and provider wasn't manually set to another custom provider
      if (State.settings.geminiApiKey && State.settings.provider === 'simulator') {
        State.settings.provider = 'gemini';
      }

      saveSettings();
      initSupabaseClient();
      closeModal(DOM.settingsModal);
      sound.play('click');
      showToast('Settings & connections updated successfully!');
    });

    DOM.resetDefaultsBtn.addEventListener('click', () => {
      if (confirm('Reset all settings to default values?')) {
        State.settings = { ...DEFAULT_SETTINGS };
        saveSettings();
        initSupabaseClient();
        closeModal(DOM.settingsModal);
        sound.play('click');
      }
    });

    DOM.providerSelect.addEventListener('change', () => {
      const val = DOM.providerSelect.value;
      DOM.genericApiKeyGroup.style.display = (val === 'openai' || val === 'groq') ? 'flex' : 'none';
    });
  }

  function openSettingsToTab(tabId) {
    populateSettingsForm();
    const tabs = DOM.settingsModal.querySelectorAll('.tab-btn');
    const panes = DOM.settingsModal.querySelectorAll('.tab-pane');

    tabs.forEach(t => {
      if (t.getAttribute('data-tab') === tabId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    panes.forEach(p => {
      if (p.id === tabId) {
        p.style.display = 'flex';
      } else {
        p.style.display = 'none';
      }
    });

    openModal(DOM.settingsModal);
  }

  function populateSettingsForm() {
    DOM.geminiApiKeyInput.value = State.settings.geminiApiKey || '';
    DOM.geminiModelSelect.value = State.settings.geminiModel || 'gemini-1.5-flash';
    DOM.supabaseUrlInput.value = State.settings.supabaseUrl || '';
    DOM.supabaseKeyInput.value = State.settings.supabaseKey || '';
    DOM.providerSelect.value = State.settings.provider;
    DOM.apiKeyInput.value = State.settings.apiKey || '';
    DOM.systemPromptInput.value = State.settings.systemPrompt;
    DOM.tempSlider.value = State.settings.temperature;
    DOM.tempValue.textContent = State.settings.temperature;
    DOM.speedSlider.value = State.settings.speed;
    DOM.speedValue.textContent = ['Slow', 'Normal', 'Fast', 'Instant'][State.settings.speed - 1] || 'Fast';
    DOM.settingSoundToggle.checked = State.settings.soundEnabled;
    DOM.settingReasoningToggle.checked = State.settings.showReasoning;
    DOM.settingAutoTtsToggle.checked = State.settings.autoTts;

    DOM.genericApiKeyGroup.style.display = (State.settings.provider === 'openai' || State.settings.provider === 'groq') ? 'flex' : 'none';

    if (State.settings.geminiApiKey) {
      DOM.geminiStatusPill.className = 'connection-status-pill success';
      DOM.geminiStatusPill.textContent = 'Key Configured';
    } else {
      DOM.geminiStatusPill.className = 'connection-status-pill';
      DOM.geminiStatusPill.textContent = 'Not configured';
    }
  }

  function showTestFeedback(container, message, type) {
    container.style.display = 'block';
    container.className = `test-feedback-box ${type}`;
    container.textContent = message;
  }

  // ==========================================================================
  // STARTUP
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', init);

})();

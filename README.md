# 🚀 NEXUS AI — Studio with Supabase & Google Gemini

Welcome to **NEXUS AI Studio**, now equipped with native **Google Gemini API** integration and **Supabase Cloud PostgreSQL Database** persistence.

![Nexus AI Core](myapp/assets/avatar.jpg)

---

## 🔑 How to Connect Google Gemini & Supabase

### 1. Connect Your Google Gemini API Key
1. Open the app in your browser: **[http://localhost:3000](http://localhost:3000)**.
2. Click **Preferences & API** (bottom-left sidebar or the top-nav gear icon).
3. In the **✨ Google Gemini** tab:
   - Paste your **Gemini API Key** (Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey)).
   - Choose your model:
     - `gemini-2.0-flash` (Latest, ultra-fast & reasoning)
     - `gemini-1.5-flash` (Recommended, balanced & generous free quota)
     - `gemini-1.5-pro` (Deep reasoning & 2M token context)
   - Click **⚡ Test Gemini Connection** to verify immediately.
   - Click **Save Preferences & Connect**.

---

### 2. Connect Your Supabase Database
1. In the **Preferences & API** modal, click the **🗄️ Supabase DB** tab.
2. Open your [Supabase Dashboard](https://supabase.com/dashboard) and go to your project.
3. In Supabase, go to **SQL Editor** → **New Query**:
   - In NEXUS AI, click **📋 Copy SQL Schema** (or copy from [`myapp/supabase_schema.sql`](myapp/supabase_schema.sql)).
   - Paste into Supabase and click **Run**.
4. In Supabase, go to **Project Settings** → **API**:
   - Copy **Project URL** → Paste into **Supabase Project URL**.
   - Copy **anon / public key** → Paste into **Supabase Anon / Public API Key**.
5. Click **🔗 Test Supabase Connection** (you will see a green confirmation).
6. Click **Save Preferences & Connect**.
7. *(Optional)* Click **☁️ Sync Local Chats to Cloud** to upload any existing chats to Supabase.

---

## 🏃‍♂️ Running the Studio

```bash
cd myapp
node server.js
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

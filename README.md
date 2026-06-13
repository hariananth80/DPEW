# Month Stayz Thailand — Project Hub

**A ClickUp-style project management tool, branded for Month Stayz Thailand.**

---

## What's included

| File | Purpose |
|------|---------|
| `index.html` | App entry point — login + main shell |
| `styles.css` | Brand-matched styling (sunset orange, teal, deep brown) |
| `app.js` | Data, team members, helper utilities |
| `views.js` | Board (Kanban), List, and Dashboard rendering |
| `taskDetail.js` | Task panel: subtasks, comments, watchers, activity log |
| `assets/logo_small.png` | Compressed logo (200×200px) for app display |

---

## Step-by-step: How to give your team access

### Option A — Simplest: share the folder on Google Drive

1. Upload the entire `monthstayz-pm/` folder to Google Drive
2. Right-click the folder → **Share** → set to "Anyone with the link can view"
3. Team members open `index.html` directly from Drive
   - Note: some browsers block local JS from Drive — use Option B for reliability

### Option B — Recommended: host on Netlify (free, 2 minutes)

1. Go to **[netlify.com](https://netlify.com)** and sign up free
2. Drag the entire `monthstayz-pm/` folder onto the Netlify dashboard
3. You get a live URL like `https://monthstayz-hub.netlify.app`
4. Share that URL with your team — works on phone & desktop

### Option C — GitHub Pages (free, slightly more technical)

1. Create a free [GitHub](https://github.com) account
2. Create a new repo called `monthstayz-hub`
3. Upload all files
4. Go to Settings → Pages → set source to `main` branch
5. Your URL: `https://yourusername.github.io/monthstayz-hub`

---

## How team members log in

1. Open the app URL
2. Click your name on the login screen (or type it)
3. You're in — all views, tasks, and comments are shared

> **Note on data persistence:** This version stores everything in browser memory.
> To persist data across sessions and team members, the next step is connecting a backend
> (Firebase Firestore is the easiest free option — ask your developer to add it).

---

## Adding more team members

Open `app.js` and find the `MEMBERS` array. Add a new entry:

```js
{ id: 'TM6', name: 'New Person', initials: 'NP', color: '#E8631A', bg: '#FDF0E8', role: 'Role' },
```

---

## Features

- **Kanban board** with drag-and-drop across status columns
- **List view** with sortable task rows
- **Dashboard** with progress, stats, and team workload
- **Task detail panel** — click any task to open:
  - Edit title, status, priority, assignee, due date inline
  - **Subtasks** with per-subtask assignee and open/close state
  - **Comments** with threaded replies, @mentions, and likes
  - **Watchers** — add/remove team members who follow the task
  - **Activity log** — every change recorded automatically
- **Quick filters** — My tasks / Urgent / Due soon
- **Multi-project** workspace — switch projects from the sidebar
- **Branded** with Month Stayz Thailand palette (orange, teal, warm brown)

---

## Next steps (optional upgrades)

| Feature | Effort | Service |
|---------|--------|---------|
| Persistent data (survives refresh) | Medium | Firebase Firestore (free tier) |
| Real-time sync across team | Medium | Firebase Realtime Database |
| Email notifications on @mention | Medium | EmailJS or Resend |
| File attachments on tasks | Medium | Firebase Storage |
| User authentication | Medium | Firebase Auth |
| Mobile app wrapper | Low | PWA (add manifest.json) |

---

*Built for Month Stayz Thailand by Gold Star Empire*

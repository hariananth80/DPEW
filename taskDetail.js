/* ============================================================
   taskDetail.js — Task detail panel: subtasks, comments,
                   watchers, activity, field editing
   ============================================================ */

// ── Open task panel ──────────────────────────────────────────
function openTask(id) {
  STATE.openTaskId = id;
  STATE.replyingTo = null;
  renderDetailPanel();
}

function closeDetail() {
  const ov = document.getElementById('detail-overlay');
  if (ov) ov.remove();
  STATE.openTaskId = null;
  STATE.replyingTo = null;
  render();
}

// ── Render full detail panel ─────────────────────────────────
function renderDetailPanel() {
  const t = getTask(STATE.openTaskId);
  if (!t) return;

  const subDone = t.subtasks.filter(s => s.done).length;
  const totalComments = t.comments.reduce((a, c) => a + 1 + c.replies.length, 0);

  // Remove existing overlay if any
  const existing = document.getElementById('detail-overlay');
  if (existing) existing.remove();

  const ov = document.createElement('div');
  ov.id = 'detail-overlay';
  ov.className = 'detail-overlay';
  ov.onclick = e => { if (e.target === ov) closeDetail(); };

  ov.innerHTML = `
  <div class="detail-panel" id="detail-panel">

    <!-- Header -->
    <div class="dp-topbar">
      <div style="flex:1;min-width:0">
        <input class="dp-title-input" id="dp-title-input" value="${t.title.replace(/"/g,'&quot;')}"
               onblur="updateTaskField(${t.id},'title',this.value)"
               onkeydown="if(event.key==='Enter')this.blur()">
        <div style="display:flex;align-items:center;gap:6px;margin-top:5px">
          ${statusPill(t.status)}
          ${priorityBadge(t.priority)}
          <span style="font-size:12px;color:var(--text-muted)">
            <i class="ti ti-calendar" style="font-size:12px;margin-right:2px"></i>${t.due}
          </span>
          ${t.tags.map(tg => `<span class="tag">${tg}</span>`).join('')}
        </div>
      </div>
      <button class="btn btn-icon" onclick="closeDetail()" title="Close">
        <i class="ti ti-x"></i>
      </button>
    </div>

    <!-- Scrollable body -->
    <div class="dp-body" id="dp-body">

      <!-- Details section -->
      <div class="dp-section">
        <div class="dp-section-title"><i class="ti ti-info-circle"></i> Details</div>
        <div class="dp-field-row">
          <span class="dp-field-label"><i class="ti ti-user" style="font-size:12px;margin-right:3px"></i>Assignee</span>
          <select class="dp-select" onchange="updateTaskField(${t.id},'assignee',this.value)">
            ${MEMBERS.map(m => `<option value="${m.id}"${m.id === t.assignee ? ' selected' : ''}>${m.name}</option>`).join('')}
          </select>
          ${avatarHtml(t.assignee, 22)}
        </div>
        <div class="dp-field-row">
          <span class="dp-field-label"><i class="ti ti-flag" style="font-size:12px;margin-right:3px"></i>Status</span>
          <select class="dp-select" onchange="updateTaskField(${t.id},'status',this.value)">
            ${STATUSES.map(s => `<option${s === t.status ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="dp-field-row">
          <span class="dp-field-label"><i class="ti ti-bolt" style="font-size:12px;margin-right:3px"></i>Priority</span>
          <select class="dp-select" onchange="updateTaskField(${t.id},'priority',this.value)">
            ${PRIORITIES.map(p => `<option${p === t.priority ? ' selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="dp-field-row">
          <span class="dp-field-label"><i class="ti ti-calendar" style="font-size:12px;margin-right:3px"></i>Due date</span>
          <input class="dp-select" value="${t.due}" style="width:120px"
                 onblur="updateTaskField(${t.id},'due',this.value)">
        </div>
        ${t.description ? `
        <div class="dp-field-row" style="align-items:flex-start">
          <span class="dp-field-label" style="margin-top:3px"><i class="ti ti-notes" style="font-size:12px;margin-right:3px"></i>Notes</span>
          <div style="flex:1;font-size:13px;color:var(--text-secondary);line-height:1.5">${t.description}</div>
        </div>` : ''}
      </div>

      <!-- Watchers -->
      <div class="dp-section">
        <div class="dp-section-title" style="justify-content:space-between">
          <span><i class="ti ti-eye"></i> Watchers (${t.watchers.length})</span>
          <button class="btn btn-xs" onclick="openAddWatcher(${t.id})"><i class="ti ti-plus"></i> Add watcher</button>
        </div>
        <div class="watchers-row" id="watchers-row-${t.id}">
          ${t.watchers.map(wid => {
            const m = getMember(wid);
            return `
            <div class="watcher-chip">
              ${avatarHtml(wid, 20)}
              <span style="font-size:12px;font-weight:500">${m.name}</span>
              <span class="watcher-remove" onclick="removeWatcher(${t.id},'${wid}')" title="Remove">
                <i class="ti ti-x" style="font-size:11px"></i>
              </span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Subtasks -->
      <div class="dp-section">
        <div class="dp-section-title" style="justify-content:space-between">
          <span><i class="ti ti-checkbox"></i> Subtasks (${subDone}/${t.subtasks.length} done)</span>
          <button class="btn btn-xs" onclick="showAddSubtask(${t.id})"><i class="ti ti-plus"></i> Add subtask</button>
        </div>
        <div id="subtask-list-${t.id}">
          ${t.subtasks.map(s => subtaskRowHtml(t.id, s)).join('')}
        </div>
        <div id="add-subtask-form-${t.id}" style="display:none">
          <div class="subtask-input-row">
            <input class="subtask-input" id="sub-title-${t.id}" placeholder="Subtask title…"
                   onkeydown="if(event.key==='Enter')saveSubtask(${t.id})">
            <select class="dp-select" id="sub-assignee-${t.id}">
              ${MEMBERS.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
            <button class="btn btn-sm btn-teal" onclick="saveSubtask(${t.id})">Add</button>
            <button class="btn btn-sm" onclick="hideAddSubtask(${t.id})">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div class="dp-section" style="flex:1">
        <div class="dp-section-title">
          <i class="ti ti-messages"></i> Comments (${totalComments})
        </div>
        <div class="comment-thread" id="comment-thread-${t.id}">
          ${t.comments.length
            ? t.comments.map(c => commentHtml(t.id, c)).join('')
            : `<div style="font-size:13px;color:var(--text-muted);padding:4px 0">No comments yet — be the first!</div>`
          }
        </div>
      </div>

      <!-- Activity -->
      <div class="dp-section">
        <div class="dp-section-title"><i class="ti ti-activity"></i> Activity</div>
        ${t.activity.map(a => `
        <div class="activity-item">
          <div class="activity-dot"></div>
          <span>${a.text} <span class="activity-time">· ${a.time}</span></span>
        </div>`).join('')}
      </div>

    </div><!-- end dp-body -->

    <!-- Compose area -->
    <div class="compose-wrap">
      ${STATE.replyingTo !== null ? `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:12px;color:var(--text-muted)">
        <i class="ti ti-corner-down-right" style="color:var(--brand-orange)"></i>
        Replying to comment
        <span style="font-weight:600;color:var(--text-secondary)">#${STATE.replyingTo}</span>
        <span style="cursor:pointer;color:var(--text-muted);margin-left:4px" onclick="cancelReply()">
          <i class="ti ti-x" style="font-size:12px"></i> Cancel
        </span>
      </div>` : ''}
      <div class="compose-box">
        <div class="compose-header">
          ${avatarHtml(STATE.composerMember, 22)}
          <span class="compose-as">Commenting as</span>
          <select class="compose-select" onchange="STATE.composerMember=this.value;renderDetailPanel()">
            ${MEMBERS.map(m => `<option value="${m.id}"${m.id === STATE.composerMember ? ' selected' : ''}>${m.name}</option>`).join('')}
          </select>
        </div>
        <textarea class="compose-textarea" id="compose-text-${t.id}"
                  placeholder="Write a comment… use @ to mention teammates"
                  oninput="handleMentionTyping(event,${t.id})"></textarea>
        <div class="compose-footer">
          <span class="compose-hint"><i class="ti ti-at" style="font-size:12px"></i> @ to mention · Enter to send</span>
          <div class="compose-toolbar">
            <button class="toolbar-btn" title="Attach file"><i class="ti ti-paperclip"></i></button>
            <button class="toolbar-btn" title="Emoji"><i class="ti ti-mood-smile"></i></button>
          </div>
          <button class="btn btn-sm" onclick="closeDetail()">Cancel</button>
          <button class="btn btn-sm btn-primary" onclick="postComment(${t.id})">
            <i class="ti ti-send"></i> Post
          </button>
        </div>
      </div>
    </div>
  </div>`;

  document.body.appendChild(ov);

  // Focus compose area
  const ta = document.getElementById(`compose-text-${t.id}`);
  if (ta) ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postComment(t.id);
  });
}

function subtaskRowHtml(tid, s) {
  return `
  <div class="subtask-row" id="subtask-${s.id}">
    <div class="subtask-check${s.done ? ' checked' : ''}" onclick="toggleSubtask(${tid},${s.id})">
      ${s.done ? '<i class="ti ti-check" style="font-size:11px"></i>' : ''}
    </div>
    <span class="subtask-label${s.done ? ' done' : ''}">${s.title}</span>
    <span style="font-size:11px;color:var(--text-muted);margin-right:4px">${getMember(s.assignee).name.split(' ')[0]}</span>
    ${avatarHtml(s.assignee, 18)}
    <span class="subtask-open" onclick="openSubtaskModal(${tid},${s.id})" title="Open subtask">
      <i class="ti ti-external-link" style="font-size:12px"></i>
    </span>
  </div>`;
}

function commentHtml(tid, c) {
  const m = getMember(c.author);
  const totalLikes = c.likes || 0;
  return `
  <div class="comment-item" id="cmt-${c.id}">
    ${avatarHtml(c.author, 32)}
    <div class="comment-body">
      <div class="comment-meta">
        <span class="comment-author">${m.name}</span>
        <span class="comment-time">${c.time}</span>
      </div>
      <div class="comment-text">${highlightMentions(c.text)}</div>
      <div class="comment-actions">
        <span class="cmt-action" onclick="startReply(${tid},${c.id})">
          <i class="ti ti-corner-down-right"></i> Reply
        </span>
        <span class="cmt-action${totalLikes > 0 ? ' liked' : ''}" onclick="likeComment(${tid},${c.id})">
          <i class="ti ti-thumb-up"></i>${totalLikes > 0 ? ` ${totalLikes}` : ' Like'}
        </span>
      </div>
      ${c.replies && c.replies.length ? `
      <div class="replies">
        ${c.replies.map(r => {
          const rm = getMember(r.author);
          return `
          <div class="comment-item" id="cmt-${r.id}">
            ${avatarHtml(r.author, 26)}
            <div class="comment-body">
              <div class="comment-meta">
                <span class="comment-author" style="font-size:12px">${rm.name}</span>
                <span class="comment-time">${r.time}</span>
              </div>
              <div class="comment-text" style="font-size:12px">${highlightMentions(r.text)}</div>
              <div class="comment-actions">
                <span class="cmt-action${(r.likes||0) > 0 ? ' liked' : ''}" onclick="likeReply(${tid},${c.id},${r.id})">
                  <i class="ti ti-thumb-up"></i>${(r.likes||0) > 0 ? ` ${r.likes}` : ' Like'}
                </span>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>` : ''}
    </div>
  </div>`;
}

// ── Comment actions ──────────────────────────────────────────
function postComment(tid) {
  const t = getTask(tid);
  const ta = document.getElementById(`compose-text-${tid}`);
  const text = ta ? ta.value.trim() : '';
  if (!text) { toast('Please write a comment first', 'warn'); return; }
  const author = STATE.composerMember;

  if (STATE.replyingTo !== null) {
    const parent = t.comments.find(c => c.id === STATE.replyingTo);
    if (parent) {
      if (!parent.replies) parent.replies = [];
      parent.replies.push({ id: STATE.nextCommentId++, author, text, time: fmtNow(), likes: 0 });
    }
  } else {
    t.comments.push({ id: STATE.nextCommentId++, author, text, time: fmtNow(), likes: 0, replies: [] });
  }

  // Notify watchers (visual only)
  const authorName = getMember(author).name;
  t.activity.push({ text: `${authorName} commented`, time: fmtNow() });
  STATE.replyingTo = null;
  renderDetailPanel();
  render();
  toast('Comment posted');
  // Re-scroll to bottom of comments
  setTimeout(() => {
    const body = document.getElementById('dp-body');
    if (body) body.scrollTop = body.scrollHeight;
  }, 50);
}

function startReply(tid, cid) {
  STATE.replyingTo = cid;
  renderDetailPanel();
  const ta = document.getElementById(`compose-text-${tid}`);
  if (ta) ta.focus();
}

function cancelReply() {
  STATE.replyingTo = null;
  const t = getTask(STATE.openTaskId);
  if (t) renderDetailPanel();
}

function likeComment(tid, cid) {
  const t = getTask(tid);
  const c = t.comments.find(c => c.id === cid);
  if (c) { c.likes = (c.likes || 0) + 1; renderDetailPanel(); }
}

function likeReply(tid, cid, rid) {
  const t = getTask(tid);
  const c = t.comments.find(c => c.id === cid);
  if (c) {
    const r = c.replies.find(r => r.id === rid);
    if (r) { r.likes = (r.likes || 0) + 1; renderDetailPanel(); }
  }
}

// ── @mention autocomplete ────────────────────────────────────
function handleMentionTyping(e, tid) {
  const ta = e.target;
  const val = ta.value;
  const atIdx = val.lastIndexOf('@');
  if (atIdx !== -1 && atIdx === val.length - 1) {
    showMentionDropdown(ta, tid);
  } else {
    hideMentionDropdown();
  }
}

function showMentionDropdown(textarea, tid) {
  hideMentionDropdown();
  const panel = document.getElementById('detail-panel');
  if (!panel) return;
  const dd = document.createElement('div');
  dd.className = 'mention-dd';
  dd.id = 'mention-dd';
  dd.style.cssText = 'position:absolute;bottom:170px;left:80px;';
  dd.innerHTML = MEMBERS.map(m => `
  <div class="mention-opt" onclick="insertMention('${m.name}',${tid})">
    ${avatarHtml(m.id, 24)}
    <div>
      <div style="font-size:13px;font-weight:500">${m.name}</div>
      <div style="font-size:11px;color:var(--text-muted)">${m.role}</div>
    </div>
  </div>`).join('');
  panel.appendChild(dd);
}

function hideMentionDropdown() {
  const dd = document.getElementById('mention-dd');
  if (dd) dd.remove();
}

function insertMention(name, tid) {
  hideMentionDropdown();
  const ta = document.getElementById(`compose-text-${tid}`);
  if (ta) {
    ta.value = ta.value.replace(/@$/, `@${name} `);
    ta.focus();
  }
}

// ── Subtask management ───────────────────────────────────────
function showAddSubtask(tid) {
  const f = document.getElementById(`add-subtask-form-${tid}`);
  if (f) { f.style.display = 'block'; document.getElementById(`sub-title-${tid}`)?.focus(); }
}

function hideAddSubtask(tid) {
  const f = document.getElementById(`add-subtask-form-${tid}`);
  if (f) f.style.display = 'none';
}

function saveSubtask(tid) {
  const t = getTask(tid);
  const titleEl = document.getElementById(`sub-title-${tid}`);
  const assignEl = document.getElementById(`sub-assignee-${tid}`);
  const title = titleEl ? titleEl.value.trim() : '';
  if (!title) return;
  const assignee = assignEl ? assignEl.value : 'TM1';
  t.subtasks.push({ id: STATE.nextSubId++, title, done: false, assignee });
  t.activity.push({ text: `Subtask "${title}" added`, time: fmtNow() });
  renderDetailPanel();
  render();
}

function toggleSubtask(tid, sid) {
  const t = getTask(tid);
  const s = t.subtasks.find(s => s.id === sid);
  if (s) {
    s.done = !s.done;
    t.activity.push({ text: `Subtask "${s.title}" marked ${s.done ? 'done' : 'incomplete'}`, time: fmtNow() });
    renderDetailPanel();
    render();
  }
}

function openSubtaskModal(tid, sid) {
  const t = getTask(tid);
  const s = t.subtasks.find(s => s.id === sid);
  if (!s) return;
  const m = getMember(s.assignee);
  showModal(`
  <div class="modal-header">
    <h3><i class="ti ti-checkbox" style="color:var(--brand-teal);margin-right:6px"></i>Subtask</h3>
    <button class="btn btn-icon btn-sm" onclick="closeModal()"><i class="ti ti-x"></i></button>
  </div>
  <div class="modal-body">
    <div class="subtask-modal-detail">
      <div style="font-size:15px;font-weight:700;margin-bottom:14px">${s.title}</div>
      <div class="detail-row"><span class="detail-lbl">Part of</span><span>${t.title}</span></div>
      <div class="detail-row"><span class="detail-lbl">Assignee</span>${avatarHtml(s.assignee, 24, true)}</div>
      <div class="detail-row"><span class="detail-lbl">Status</span>
        <span style="font-weight:600;color:${s.done ? '#2D6A2D' : 'var(--brand-orange)'}">
          ${s.done ? '✓ Completed' : '○ Pending'}
        </span>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px">
      <button class="btn" onclick="toggleSubtask(${tid},${sid});closeModal()">
        <i class="ti ti-checkbox"></i> Mark ${s.done ? 'incomplete' : 'done'}
      </button>
      <button class="btn btn-primary" onclick="closeModal()">Close</button>
    </div>
  </div>`);
}

// ── Watcher management ───────────────────────────────────────
function openAddWatcher(tid) {
  const t = getTask(tid);
  const avail = MEMBERS.filter(m => !t.watchers.includes(m.id));
  if (!avail.length) { toast('All team members are already watching this task.'); return; }
  showModal(`
  <div class="modal-header">
    <h3><i class="ti ti-eye" style="color:var(--brand-teal);margin-right:6px"></i>Add watcher</h3>
    <button class="btn btn-icon btn-sm" onclick="closeModal()"><i class="ti ti-x"></i></button>
  </div>
  <div class="modal-body">
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Watchers receive notifications when this task is updated or commented on.</p>
    ${avail.map(m => `
    <div style="display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:var(--r-md);cursor:pointer;margin-bottom:4px;border:1px solid var(--border)"
         onmouseover="this.style.background='var(--brand-orange-lt)'"
         onmouseout="this.style.background=''"
         onclick="addWatcher(${tid},'${m.id}');closeModal()">
      ${avatarHtml(m.id, 30)}
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600">${m.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${m.role}</div>
      </div>
      <button class="btn btn-sm btn-teal">Watch</button>
    </div>`).join('')}
  </div>`);
}

function addWatcher(tid, mid) {
  const t = getTask(tid);
  if (t && !t.watchers.includes(mid)) {
    t.watchers.push(mid);
    t.activity.push({ text: `${getMember(mid).name} added as watcher`, time: fmtNow() });
    toast(`${getMember(mid).name} is now watching this task`);
    if (STATE.openTaskId === tid) renderDetailPanel();
  }
}

function removeWatcher(tid, mid) {
  const t = getTask(tid);
  if (t) {
    t.watchers = t.watchers.filter(w => w !== mid);
    t.activity.push({ text: `${getMember(mid).name} removed from watchers`, time: fmtNow() });
    if (STATE.openTaskId === tid) renderDetailPanel();
  }
}

// ── Field updates ────────────────────────────────────────────
function updateTaskField(tid, field, value) {
  const t = getTask(tid);
  if (!t) return;
  const old = t[field];
  if (old === value) return;
  t[field] = value;
  t.activity.push({ text: `${field.charAt(0).toUpperCase() + field.slice(1)} changed from "${old}" to "${value}"`, time: fmtNow() });
  render();
  // Refresh pills in header
  const headerMeta = document.querySelector('.dp-topbar .dp-title');
  if (STATE.openTaskId === tid && field !== 'title') renderDetailPanel();
}

// ── Add new task ─────────────────────────────────────────────
function openAddTask(status) {
  status = status || 'To Do';
  showModal(`
  <div class="modal-header">
    <h3><i class="ti ti-plus" style="color:var(--brand-orange);margin-right:6px"></i>New task</h3>
    <button class="btn btn-icon btn-sm" onclick="closeModal()"><i class="ti ti-x"></i></button>
  </div>
  <div class="modal-body">
    <div class="form-row">
      <label class="form-label">Task title *</label>
      <input id="nt-title" class="form-input" placeholder="What needs to be done?">
    </div>
    <div class="form-row">
      <label class="form-label">Description</label>
      <textarea id="nt-desc" class="form-input" rows="2" placeholder="Optional details…" style="resize:vertical"></textarea>
    </div>
    <div class="form-row-2">
      <div>
        <label class="form-label">Status</label>
        <select id="nt-status" class="form-input">${STATUSES.map(s => `<option${s === status ? ' selected' : ''}>${s}</option>`).join('')}</select>
      </div>
      <div>
        <label class="form-label">Priority</label>
        <select id="nt-priority" class="form-input">${PRIORITIES.map(p => `<option>${p}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-row-2">
      <div>
        <label class="form-label">Assignee</label>
        <select id="nt-assignee" class="form-input">${MEMBERS.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}</select>
      </div>
      <div>
        <label class="form-label">Due date</label>
        <input id="nt-due" class="form-input" placeholder="e.g. Jun 25">
      </div>
    </div>
    <div class="form-row">
      <label class="form-label">Tags (comma-separated)</label>
      <input id="nt-tags" class="form-input" placeholder="e.g. housekeeping, guests">
    </div>
    <div class="form-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewTask()"><i class="ti ti-plus"></i> Create task</button>
    </div>
  </div>`);
  setTimeout(() => document.getElementById('nt-title')?.focus(), 80);
}

function saveNewTask() {
  const title = document.getElementById('nt-title').value.trim();
  if (!title) { toast('Please enter a task title'); return; }
  const assignee = document.getElementById('nt-assignee').value;
  const newTask = {
    id: STATE.nextId++,
    project: STATE.currentProject,
    title,
    description: document.getElementById('nt-desc').value.trim(),
    status: document.getElementById('nt-status').value,
    priority: document.getElementById('nt-priority').value,
    assignee,
    due: document.getElementById('nt-due').value || 'TBD',
    tags: document.getElementById('nt-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    watchers: [assignee, 'YOU'],
    subtasks: [],
    comments: [],
    activity: [{ text: `${getMember(STATE.composerMember).name} created this task`, time: fmtNow() }],
  };
  tasks.push(newTask);
  closeModal();
  render();
  toast('Task created!');
}

// ── Add new project ──────────────────────────────────────────
function openAddProject() {
  showModal(`
  <div class="modal-header">
    <h3><i class="ti ti-folder-plus" style="color:var(--brand-orange);margin-right:6px"></i>New project</h3>
    <button class="btn btn-icon btn-sm" onclick="closeModal()"><i class="ti ti-x"></i></button>
  </div>
  <div class="modal-body">
    <div class="form-row">
      <label class="form-label">Project name *</label>
      <input id="np-name" class="form-input" placeholder="e.g. High Season Prep">
    </div>
    <div class="form-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewProject()">Create project</button>
    </div>
  </div>`);
  setTimeout(() => document.getElementById('np-name')?.focus(), 80);
}

function saveNewProject() {
  const name = document.getElementById('np-name').value.trim();
  if (!name) return;
  PROJECTS.push({ id: 'p' + Date.now(), name, color: '#E8631A', icon: 'ti-folder' });
  STATE.currentProject = name;
  closeModal();
  renderSidebar();
  render();
  toast('Project created!');
}

// Make everything global
window.openTask = openTask;
window.closeDetail = closeDetail;
window.renderDetailPanel = renderDetailPanel;
window.postComment = postComment;
window.startReply = startReply;
window.cancelReply = cancelReply;
window.likeComment = likeComment;
window.likeReply = likeReply;
window.handleMentionTyping = handleMentionTyping;
window.insertMention = insertMention;
window.hideMentionDropdown = hideMentionDropdown;
window.showAddSubtask = showAddSubtask;
window.hideAddSubtask = hideAddSubtask;
window.saveSubtask = saveSubtask;
window.toggleSubtask = toggleSubtask;
window.openSubtaskModal = openSubtaskModal;
window.openAddWatcher = openAddWatcher;
window.addWatcher = addWatcher;
window.removeWatcher = removeWatcher;
window.updateTaskField = updateTaskField;
window.openAddTask = openAddTask;
window.saveNewTask = saveNewTask;
window.openAddProject = openAddProject;
window.saveNewProject = saveNewProject;

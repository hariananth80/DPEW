/* ============================================================
   views.js — Board / List / Dashboard rendering
   ============================================================ */

// ── Board view ───────────────────────────────────────────────
function renderBoard() {
  const pt = getProjTasks();
  let html = '<div class="board">';
  STATUSES.forEach(status => {
    const st = pt.filter(t => t.status === status);
    const meta = STATUS_META[status];
    html += `
    <div class="board-col" id="col-${status.replace(/\s/g,'_')}"
         ondragover="handleDragOver(event, this)"
         ondragleave="handleDragLeave(this)"
         ondrop="handleDrop(event,'${status}')">
      <div class="col-header">
        <div class="col-dot" style="background:${meta.dot}"></div>
        <span class="col-title">${status}</span>
        <span class="col-count">${st.length}</span>
        <span class="col-add-btn" onclick="openAddTask('${status}')" title="Add task">
          <i class="ti ti-plus"></i>
        </span>
      </div>
      <div class="col-body" id="colbody-${status.replace(/\s/g,'_')}">
        ${st.map(t => taskCardHtml(t)).join('')}
      </div>
      <div class="col-footer">
        <div class="add-task-btn" onclick="openAddTask('${status}')">
          <i class="ti ti-plus" style="font-size:13px"></i> Add task
        </div>
      </div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('content').innerHTML = html;
}

function taskCardHtml(t) {
  const subDone = t.subtasks.filter(s => s.done).length;
  const totalComments = t.comments.reduce((a, c) => a + 1 + c.replies.length, 0);
  const m = getMember(t.assignee);
  return `
  <div class="task-card" id="card-${t.id}"
       draggable="true"
       ondragstart="handleDragStart(event, ${t.id})"
       ondragend="handleDragEnd(event)"
       onclick="openTask(${t.id})">
    <div class="task-card-title">${t.title}</div>
    <div class="task-card-meta">
      ${priorityBadge(t.priority)}
      ${t.tags.map(tg => `<span class="tag">${tg}</span>`).join('')}
    </div>
    <div class="task-card-footer">
      ${t.subtasks.length ? `<span class="card-stat"><i class="ti ti-checkbox" style="font-size:12px"></i>${subDone}/${t.subtasks.length}</span>` : ''}
      ${totalComments ? `<span class="card-stat"><i class="ti ti-message" style="font-size:12px"></i>${totalComments}</span>` : ''}
      <span class="card-stat"><i class="ti ti-calendar" style="font-size:12px"></i>${t.due}</span>
      <div class="ml-auto flex">
        ${t.watchers.slice(0,3).map(wid => avatarHtml(wid, 20)).join('')}
        ${t.watchers.length > 3 ? `<div class="av" style="width:20px;height:20px;font-size:9px;background:var(--bg-secondary);color:var(--text-muted)">+${t.watchers.length-3}</div>` : ''}
      </div>
    </div>
  </div>`;
}

// ── Drag & drop ──────────────────────────────────────────────
let dragId = null;

function handleDragStart(e, id) {
  dragId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => {
    const card = document.getElementById('card-' + id);
    if (card) card.classList.add('dragging');
  }, 0);
}

function handleDragEnd(e) {
  document.querySelectorAll('.task-card').forEach(c => c.classList.remove('dragging'));
  document.querySelectorAll('.board-col').forEach(c => c.classList.remove('drag-over'));
}

function handleDragOver(e, col) {
  e.preventDefault();
  document.querySelectorAll('.board-col').forEach(c => c.classList.remove('drag-over'));
  col.classList.add('drag-over');
}

function handleDragLeave(col) {
  col.classList.remove('drag-over');
}

function handleDrop(e, status) {
  e.preventDefault();
  document.querySelectorAll('.board-col').forEach(c => c.classList.remove('drag-over'));
  if (dragId) {
    const t = getTask(dragId);
    if (t && t.status !== status) {
      const old = t.status;
      t.status = status;
      t.activity.push({ text: `Status changed from "${old}" to "${status}"`, time: fmtNow() });
      toast(`Task moved to ${status}`);
    }
    dragId = null;
    render();
  }
}

// ── List view ────────────────────────────────────────────────
function renderList() {
  const pt = getProjTasks();
  if (!pt.length) {
    document.getElementById('content').innerHTML = `
    <div class="empty-state">
      <i class="ti ti-clipboard-list"></i>
      No tasks in this project yet.<br>
      <button class="btn btn-primary" style="margin-top:12px" onclick="openAddTask()">
        <i class="ti ti-plus"></i> Add first task
      </button>
    </div>`;
    return;
  }
  let html = `
  <div class="list-table">
    <div class="list-header">
      <span>Task</span>
      <span>Status</span>
      <span>Priority</span>
      <span>Assignee</span>
      <span>Due</span>
      <span>Activity</span>
    </div>`;
  pt.forEach(t => {
    const subDone = t.subtasks.filter(s => s.done).length;
    const totalComments = t.comments.reduce((a, c) => a + 1 + c.replies.length, 0);
    const m = getMember(t.assignee);
    html += `
    <div class="list-row" onclick="openTask(${t.id})">
      <div class="list-task-title">
        ${t.title}
        ${t.subtasks.length ? `<span style="font-size:11px;color:var(--text-muted);white-space:nowrap"><i class="ti ti-checkbox" style="font-size:11px"></i>${subDone}/${t.subtasks.length}</span>` : ''}
        ${totalComments ? `<span style="font-size:11px;color:var(--text-muted)"><i class="ti ti-message" style="font-size:11px"></i>${totalComments}</span>` : ''}
      </div>
      <div>${statusPill(t.status)}</div>
      <div>${priorityBadge(t.priority)}</div>
      <div style="display:flex;align-items:center;gap:6px">${avatarHtml(t.assignee, 22)}<span style="font-size:12px;color:var(--text-secondary)">${m.name.split(' ')[0]}</span></div>
      <div style="font-size:12px;color:var(--text-muted)">${t.due}</div>
      <div style="font-size:12px;color:var(--text-muted)">${t.activity.length ? t.activity[t.activity.length-1].time : '—'}</div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('content').innerHTML = html;
}

// ── Dashboard view ───────────────────────────────────────────
function renderDashboard() {
  const pt = getProjTasks();
  const done = pt.filter(t => t.status === 'Done').length;
  const inprog = pt.filter(t => t.status === 'In Progress').length;
  const todo = pt.filter(t => t.status === 'To Do').length;
  const inrev = pt.filter(t => t.status === 'In Review').length;
  const pct = pt.length ? Math.round(done / pt.length * 100) : 0;
  const urgent = pt.filter(t => t.priority === 'Urgent').length;
  const totalComments = pt.reduce((a, t) => a + t.comments.reduce((b, c) => b + 1 + c.replies.length, 0), 0);

  let html = `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total tasks</div>
      <div class="stat-value" style="color:var(--text-primary)">${pt.length}</div>
      <div class="stat-sub">${inprog} in progress</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Completed</div>
      <div class="stat-value" style="color:#2D6A2D">${done}</div>
      <div class="stat-sub">${pct}% of total</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Urgent tasks</div>
      <div class="stat-value" style="color:#B91C1C">${urgent}</div>
      <div class="stat-sub">Need immediate attention</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Comments</div>
      <div class="stat-value" style="color:var(--brand-teal)">${totalComments}</div>
      <div class="stat-sub">Across all tasks</div>
    </div>
  </div>

  <div class="dash-card">
    <div class="dash-card-title"><i class="ti ti-chart-bar" style="color:var(--brand-orange);margin-right:6px"></i>Project progress</div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%"></div></div>
      <span style="font-size:14px;font-weight:700;color:var(--brand-orange)">${pct}%</span>
    </div>
    <div style="display:flex;gap:18px">
      ${STATUSES.map(s => {
        const n = pt.filter(t => t.status === s).length;
        const m = STATUS_META[s];
        return `<div style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text-muted)"><span style="width:8px;height:8px;border-radius:50%;background:${m.dot};display:inline-block"></span>${s}: <strong style="color:var(--text-primary)">${n}</strong></div>`;
      }).join('')}
    </div>
  </div>

  <div class="dash-card">
    <div class="dash-card-title"><i class="ti ti-users" style="color:var(--brand-teal);margin-right:6px"></i>Team workload</div>
    ${MEMBERS.map(m => {
      const mt = pt.filter(t => t.assignee === m.id);
      const md = mt.filter(t => t.status === 'Done').length;
      const mp = mt.length ? Math.round(md / mt.length * 100) : 0;
      if (!mt.length) return '';
      return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        ${avatarHtml(m.id, 30)}
        <span style="font-size:13px;min-width:90px;color:var(--text-primary);font-weight:500">${m.name}</span>
        <div style="flex:1"><div class="progress-bar"><div class="progress-fill" style="width:${mp}%;background:${m.color}"></div></div></div>
        <span style="font-size:12px;color:var(--text-muted);min-width:90px;text-align:right">${mt.length} tasks · ${mp}% done</span>
      </div>`;
    }).join('')}
  </div>

  <div class="dash-card">
    <div class="dash-card-title"><i class="ti ti-clock" style="color:var(--brand-orange-md);margin-right:6px"></i>Recently active tasks</div>
    ${pt.filter(t => t.activity.length).sort((a,b) => b.activity.length - a.activity.length).slice(0,5).map(t => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="openTask(${t.id})">
      ${statusPill(t.status)}
      <span style="font-size:13px;flex:1;color:var(--text-primary)">${t.title}</span>
      <span style="font-size:11px;color:var(--text-muted)">${t.activity[t.activity.length-1].time}</span>
      ${avatarHtml(t.assignee, 22)}
    </div>`).join('')}
  </div>`;

  document.getElementById('content').innerHTML = html;
}

// ── Main render dispatcher ───────────────────────────────────
function render() {
  if (STATE.currentView === 'board') renderBoard();
  else if (STATE.currentView === 'list') renderList();
  else renderDashboard();
}

window.render = render;
window.renderBoard = renderBoard;
window.renderList = renderList;
window.renderDashboard = renderDashboard;
window.handleDragStart = handleDragStart;
window.handleDragEnd = handleDragEnd;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;
window.taskCardHtml = taskCardHtml;

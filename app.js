/* ============================================================
   app.js — State, data, utilities for Month Stayz Thailand PM
   ============================================================ */

// ── Brand / team config ──────────────────────────────────────
const MEMBERS = [
  { id: 'YOU', name: 'You (Admin)',   initials: 'YA', color: '#E8631A', bg: '#FDF0E8', role: 'Admin'    },
  { id: 'TM1', name: 'Arjun K.',     initials: 'AK', color: '#3AAFA9', bg: '#E4F7F6', role: 'Manager'  },
  { id: 'TM2', name: 'Sneha P.',     initials: 'SP', color: '#2C1810', bg: '#E8D5C8', role: 'Designer' },
  { id: 'TM3', name: 'Rohit V.',     initials: 'RV', color: '#8B4513', bg: '#FDF0E8', role: 'Developer'},
  { id: 'TM4', name: 'Meera N.',     initials: 'MN', color: '#2D6A2D', bg: '#E8F5E8', role: 'Marketing'},
  { id: 'TM5', name: 'Priya S.',     initials: 'PS', color: '#6B21A8', bg: '#F3E8FF', role: 'Sales'    },
];

const STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];
const STATUS_META = {
  'To Do':       { cls: 's-todo',   dot: '#9E7B68', icon: 'ti-circle'          },
  'In Progress': { cls: 's-prog',   dot: '#3AAFA9', icon: 'ti-clock'           },
  'In Review':   { cls: 's-review', dot: '#E8631A', icon: 'ti-eye'             },
  'Done':        { cls: 's-done',   dot: '#4CAF50', icon: 'ti-circle-check'    },
};
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
const PRIORITY_META = {
  Urgent: { cls: 'p-urgent', icon: 'ti-flame'         },
  High:   { cls: 'p-high',   icon: 'ti-arrow-up'      },
  Medium: { cls: 'p-medium', icon: 'ti-minus'         },
  Low:    { cls: 'p-low',    icon: 'ti-arrow-down'    },
};

// ── App state ────────────────────────────────────────────────
const STATE = {
  currentUser: null,
  currentProject: 'Villa Operations',
  currentView: 'board',
  openTaskId: null,
  replyingTo: null,
  composerMember: 'YOU',
  nextId: 50,
  nextCommentId: 200,
  nextSubId: 100,
  nextActivityId: 300,
};

// ── Initial project/task data ────────────────────────────────
const PROJECTS = [
  { id: 'p1', name: 'Villa Operations',   color: '#E8631A', icon: 'ti-building' },
  { id: 'p2', name: 'Guest Experience',   color: '#3AAFA9', icon: 'ti-heart'    },
  { id: 'p3', name: 'Marketing Thailand', color: '#F5A623', icon: 'ti-speakerphone' },
  { id: 'p4', name: 'Finance & Billing',  color: '#4CAF50', icon: 'ti-cash'     },
];

let tasks = [
  // ── Villa Operations ─────────────────────────────────────
  {
    id: 1, project: 'Villa Operations', title: 'Prepare villa checklist for June arrivals',
    status: 'Done', priority: 'High', assignee: 'TM1', due: 'Jun 5',
    tags: ['housekeeping', 'ops'], watchers: ['TM1', 'TM2', 'YOU'],
    description: 'Complete the pre-arrival checklist for all villas with June bookings. Ensure towels, toiletries, and welcome kits are in place.',
    subtasks: [
      { id: 10, title: 'Confirm linen inventory', done: true,  assignee: 'TM2' },
      { id: 11, title: 'Prepare welcome kits',    done: true,  assignee: 'TM1' },
      { id: 12, title: 'Final inspection walkthrough', done: false, assignee: 'TM1' },
    ],
    comments: [
      { id: 1, author: 'TM2', text: 'Linen stock is confirmed — we have enough for 12 villas. Welcome kits are being packed now.', time: 'Jun 4, 9:15 AM', likes: 2, replies: [
        { id: 2, author: 'TM1', text: 'Perfect. I\'ll do the final walkthrough on Jun 5 morning.', time: 'Jun 4, 9:30 AM', likes: 0 }
      ]},
      { id: 3, author: 'YOU', text: '@TM1 Please add the new beach towels we ordered to the kit. Guests specifically asked for those.', time: 'Jun 4, 11:00 AM', likes: 0, replies: [] },
    ],
    activity: [
      { text: 'Arjun K. created this task', time: 'Jun 3' },
      { text: 'Sneha P. added as watcher', time: 'Jun 3' },
      { text: 'Status changed to Done', time: 'Jun 5' },
    ],
  },
  {
    id: 2, project: 'Villa Operations', title: 'Arrange airport transfers for 8 guests — Jun 10',
    status: 'In Progress', priority: 'Urgent', assignee: 'TM3', due: 'Jun 10',
    tags: ['transfers', 'logistics'], watchers: ['TM3', 'TM1', 'YOU'],
    description: 'Coordinate pickup for 8 guests arriving from Bangkok on Jun 10. Two separate flights — coordinate 2 vans.',
    subtasks: [
      { id: 13, title: 'Book van 1 (Flight TG102 — 3 guests)', done: true,  assignee: 'TM3' },
      { id: 14, title: 'Book van 2 (Flight PG201 — 5 guests)', done: false, assignee: 'TM3' },
      { id: 15, title: 'Send confirmation to guests', done: false, assignee: 'TM1' },
    ],
    comments: [
      { id: 4, author: 'TM3', text: 'Van 1 is confirmed with Phuket Transport Co. Working on van 2 — the usual provider is unavailable.', time: 'Jun 8, 2:00 PM', likes: 0, replies: [
        { id: 5, author: 'TM1', text: 'Try Chalong Transport as backup — their number is in the contacts sheet.', time: 'Jun 8, 2:20 PM', likes: 1 }
      ]},
    ],
    activity: [
      { text: 'Rohit V. created this task', time: 'Jun 7' },
      { text: 'Priority set to Urgent', time: 'Jun 8' },
    ],
  },
  {
    id: 3, project: 'Villa Operations', title: 'AC maintenance for Villa 3 and Villa 7',
    status: 'To Do', priority: 'High', assignee: 'TM3', due: 'Jun 15',
    tags: ['maintenance'], watchers: ['TM3', 'YOU'],
    description: 'Scheduled maintenance for AC units in Villa 3 (master bedroom) and Villa 7 (all units). Contact Koh Samui AC Services.',
    subtasks: [],
    comments: [],
    activity: [{ text: 'You created this task', time: 'Jun 13' }],
  },
  {
    id: 4, project: 'Villa Operations', title: 'Stock pool supplies for high season',
    status: 'In Review', priority: 'Medium', assignee: 'TM2', due: 'Jun 18',
    tags: ['supplies', 'pool'], watchers: ['TM2', 'TM1'],
    description: 'Order pool floats, sunscreen dispensers, and umbrella stands before high season begins Jul 1.',
    subtasks: [
      { id: 16, title: 'Confirm required quantities', done: true,  assignee: 'TM2' },
      { id: 17, title: 'Get 3 supplier quotes',       done: true,  assignee: 'TM2' },
      { id: 18, title: 'Place final order',           done: false, assignee: 'TM2' },
    ],
    comments: [
      { id: 6, author: 'TM2', text: 'Got quotes from 3 suppliers. Thai Pool Co. is 15% cheaper. Sending the comparison sheet now.', time: 'Jun 12, 10:00 AM', likes: 1, replies: [] },
    ],
    activity: [
      { text: 'Sneha P. created this task', time: 'Jun 10' },
      { text: 'Status moved to In Review', time: 'Jun 12' },
    ],
  },

  // ── Guest Experience ─────────────────────────────────────
  {
    id: 5, project: 'Guest Experience', title: 'Create personalised welcome letter for VIP guests',
    status: 'In Progress', priority: 'High', assignee: 'TM4', due: 'Jun 14',
    tags: ['guest', 'content'], watchers: ['TM4', 'TM1', 'YOU'],
    description: 'Write personalised welcome letters for 3 VIP returning guests arriving Jun 15. Reference their previous stay preferences.',
    subtasks: [
      { id: 19, title: 'Review previous stay notes',          done: true,  assignee: 'TM4' },
      { id: 20, title: 'Draft personalised letters (×3)',     done: false, assignee: 'TM4' },
      { id: 21, title: 'Print & add to welcome kits',        done: false, assignee: 'TM2' },
    ],
    comments: [
      { id: 7, author: 'TM4', text: 'Guest #1 (Mr. Johnson) loves fresh fruit — noted. Guest #2 prefers a quiet villa away from pool area. Drafting now.', time: 'Jun 13, 8:30 AM', likes: 2, replies: [] },
    ],
    activity: [{ text: 'Meera N. created this task', time: 'Jun 12' }],
  },
  {
    id: 6, project: 'Guest Experience', title: 'Build island tour package for June guests',
    status: 'To Do', priority: 'Medium', assignee: 'TM5', due: 'Jun 20',
    tags: ['tours', 'packages'], watchers: ['TM5', 'TM1'],
    description: 'Create a curated island tour package: Angthong Marine Park, Koh Nang Yuan, local food tour. Get pricing from local operators.',
    subtasks: [],
    comments: [],
    activity: [{ text: 'Priya S. created this task', time: 'Jun 13' }],
  },
  {
    id: 7, project: 'Guest Experience', title: 'Collect and respond to guest reviews — May',
    status: 'Done', priority: 'Medium', assignee: 'TM4', due: 'Jun 8',
    tags: ['reviews', 'guest'], watchers: ['TM4', 'YOU'],
    description: 'Collect all May reviews from Airbnb, Booking.com, and Google. Respond within 24 hours.',
    subtasks: [
      { id: 22, title: 'Airbnb reviews (12)', done: true, assignee: 'TM4' },
      { id: 23, title: 'Booking.com reviews (7)', done: true, assignee: 'TM4' },
      { id: 24, title: 'Google reviews (4)', done: true, assignee: 'TM4' },
    ],
    comments: [
      { id: 8, author: 'TM4', text: 'All 23 reviews responded to. Average rating: 4.8/5. One negative review about slow WiFi — flagged to Rohit.', time: 'Jun 7, 4:00 PM', likes: 3, replies: [
        { id: 9, author: 'TM3', text: 'WiFi issue is being addressed — new router arrives Jun 12.', time: 'Jun 7, 4:15 PM', likes: 1 }
      ]},
    ],
    activity: [
      { text: 'Meera N. created this task', time: 'Jun 1' },
      { text: 'Status changed to Done', time: 'Jun 7' },
    ],
  },

  // ── Marketing Thailand ───────────────────────────────────
  {
    id: 8, project: 'Marketing Thailand', title: 'Instagram content calendar — July',
    status: 'In Progress', priority: 'High', assignee: 'TM4', due: 'Jun 22',
    tags: ['social', 'content'], watchers: ['TM4', 'TM5', 'YOU'],
    description: 'Plan and schedule 30 posts for July Instagram. Mix of villa shots, guest testimonials, Thailand lifestyle content.',
    subtasks: [
      { id: 25, title: 'Collect villa photos from Sneha', done: true,  assignee: 'TM4' },
      { id: 26, title: 'Write 30 captions',              done: false, assignee: 'TM4' },
      { id: 27, title: 'Schedule on Later.com',          done: false, assignee: 'TM5' },
    ],
    comments: [],
    activity: [{ text: 'Meera N. created this task', time: 'Jun 10' }],
  },
  {
    id: 9, project: 'Marketing Thailand', title: 'Launch referral program for returning guests',
    status: 'To Do', priority: 'High', assignee: 'TM5', due: 'Jun 28',
    tags: ['referral', 'growth'], watchers: ['TM5', 'TM1', 'YOU'],
    description: '10% discount for guests who refer a friend. Set up landing page, email flow, and tracking.',
    subtasks: [],
    comments: [],
    activity: [{ text: 'Priya S. created this task', time: 'Jun 13' }],
  },

  // ── Finance & Billing ────────────────────────────────────
  {
    id: 10, project: 'Finance & Billing', title: 'Invoice all June bookings',
    status: 'In Progress', priority: 'Urgent', assignee: 'TM1', due: 'Jun 15',
    tags: ['invoicing', 'finance'], watchers: ['TM1', 'YOU'],
    description: 'Send invoices to all 18 June booking guests. Balance due within 7 days of arrival.',
    subtasks: [
      { id: 28, title: 'Export June bookings from system', done: true,  assignee: 'TM1' },
      { id: 29, title: 'Generate invoices (×18)',         done: false, assignee: 'TM1' },
      { id: 30, title: 'Send via email',                  done: false, assignee: 'TM1' },
    ],
    comments: [
      { id: 10, author: 'YOU', text: 'Please ensure the new GST number is on all invoices this month.', time: 'Jun 13, 9:00 AM', likes: 0, replies: [] },
    ],
    activity: [{ text: 'Arjun K. created this task', time: 'Jun 12' }],
  },
];

// ── Helper functions ─────────────────────────────────────────
function getMember(id) {
  return MEMBERS.find(m => m.id === id) || MEMBERS[0];
}

function getTask(id) {
  return tasks.find(t => t.id === id);
}

function getProjTasks(project) {
  return tasks.filter(t => t.project === (project || STATE.currentProject));
}

function avatarHtml(memberId, size = 26, showName = false) {
  const m = getMember(memberId);
  const av = `<div class="av" style="width:${size}px;height:${size}px;font-size:${Math.floor(size*0.38)}px;background:${m.bg};color:${m.color}">${m.initials}</div>`;
  if (!showName) return av;
  return `<div class="flex flex-center gap-6">${av}<span style="font-size:13px;font-weight:500">${m.name}</span></div>`;
}

function priorityBadge(p) {
  const m = PRIORITY_META[p] || PRIORITY_META.Low;
  return `<span class="badge ${m.cls}"><i class="ti ${m.icon}" style="font-size:10px"></i>${p}</span>`;
}

function statusPill(s) {
  const m = STATUS_META[s] || STATUS_META['To Do'];
  return `<span class="badge ${m.cls}"><span style="width:6px;height:6px;border-radius:50%;background:${m.dot};display:inline-block"></span>${s}</span>`;
}

function fmtNow() {
  const d = new Date();
  return `Jun ${d.getDate()}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function highlightMentions(text) {
  return text.replace(/@(\w+[\s\w]*?)(?=\s|$|[^a-zA-Z\s])/g, (match, name) => {
    const found = MEMBERS.find(m => m.name.toLowerCase().includes(name.toLowerCase()));
    if (found) return `<span class="mention">@${name}</span>`;
    return match;
  });
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<i class="ti ti-check-circle" style="color:var(--brand-teal)"></i>${msg}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function showModal(html) {
  let ov = document.getElementById('modal-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'modal-overlay';
    ov.className = 'modal-overlay';
    document.body.appendChild(ov);
  }
  ov.innerHTML = `<div class="modal">${html}</div>`;
  ov.style.display = 'flex';
  ov.onclick = e => { if (e.target === ov) closeModal(); };
}

function closeModal() {
  const ov = document.getElementById('modal-overlay');
  if (ov) ov.style.display = 'none';
}

// Make helpers global
window.STATE = STATE;
window.MEMBERS = MEMBERS;
window.STATUSES = STATUSES;
window.STATUS_META = STATUS_META;
window.PRIORITIES = PRIORITIES;
window.PRIORITY_META = PRIORITY_META;
window.PROJECTS = PROJECTS;
window.tasks = tasks;
window.getMember = getMember;
window.getTask = getTask;
window.getProjTasks = getProjTasks;
window.avatarHtml = avatarHtml;
window.priorityBadge = priorityBadge;
window.statusPill = statusPill;
window.fmtNow = fmtNow;
window.highlightMentions = highlightMentions;
window.toast = toast;
window.showModal = showModal;
window.closeModal = closeModal;

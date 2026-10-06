import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, onValue, set } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';
import './style.css';

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

const APP_PASSWORD = 'risham0043';
const STORAGE_KEY = 'nexora-savings-personal-data';
const defaultData = { balance: 0, totalSaved: 0, totalWithdrawn: 0, goal: 0, transactions: {} };
const state = { user: null, data: { ...defaultData }, screen: 'dashboard', loading: false, unsubscribe: null, firebaseReady: false };
const root = document.querySelector('#app');
const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const txns = () => Object.entries(state.data.transactions || {}).map(([id, t]) => ({ id, ...t })).sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
const dateTime = ts => ts ? new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now';
const toast = (message, type = 'success') => { const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = message; document.body.append(el); setTimeout(() => el.remove(), 3200); };
const navigate = screen => { state.screen = screen; render(); };

function render() {
  if (state.loading) { root.innerHTML = `<div class="splash"><div class="brand-mark">N</div><h1>NEXORA</h1><p>Build your next milestone.</p><div class="loader"></div></div>`; return; }
  if (!state.user) { renderAuth(); return; }
  const views = { dashboard: dashboardView, add: () => moneyForm('add'), withdraw: () => moneyForm('withdraw'), transactions: transactionsView, goal: goalView, profile: profileView };
  root.innerHTML = `<div class="app-shell">${header()}<main class="content">${(views[state.screen] || dashboardView)()}</main>${bottomNav()}</div>`;
  bindAppEvents();
}

function renderAuth() {
  root.innerHTML = `<div class="auth-page"><div class="auth-glow"></div><div class="auth-brand"><div class="brand-mark">N</div><span>NEXORA</span></div><section class="auth-card"><div class="eyebrow">PRIVATE SAVINGS SPACE</div><h1>Welcome back</h1><p class="muted">Enter your personal password to unlock your savings.</p><form id="auth-form"><label>App password<input id="password" type="password" autocomplete="current-password" required placeholder="Enter password"></label><button class="primary-button" type="submit">Unlock app <span>→</span></button></form></section><p class="auth-foot">Personal mode · Data stays on this device.</p></div>`;
  document.querySelector('#auth-form').addEventListener('submit', handleAuth);
}

async function handleAuth(event) {
  event.preventDefault();
  const password = event.currentTarget.querySelector('#password').value;
  if (password !== APP_PASSWORD) return toast('Incorrect password.', 'error');
  try {
    const credential = await signInAnonymously(auth);
    state.user = { uid: credential.user.uid, displayName: 'Risham', email: 'Personal app' };
    sessionStorage.setItem('nexora-unlocked', '1');
    subscribeRealtime();
    render();
  } catch { useOfflineMode(); toast('Firebase unavailable. App opened in offline mode; enable Anonymous sign-in to sync.', 'error'); }
}
function loadLocalData() {
  try { state.data = { ...defaultData, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')) }; }
  catch { state.data = { ...defaultData }; }
}
function useOfflineMode() { state.user = { uid: 'offline-device', displayName: 'Risham', email: 'Personal app' }; state.firebaseReady = false; loadLocalData(); sessionStorage.setItem('nexora-unlocked', '1'); render(); }
async function saveLocalData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  if (state.firebaseReady && state.user?.uid) await set(ref(db, `savings/${state.user.uid}`), state.data);
}
function subscribeRealtime() {
  if (state.unsubscribe) state.unsubscribe();
  state.firebaseReady = true;
  state.unsubscribe = onValue(ref(db, `savings/${state.user.uid}`), snapshot => {
    state.data = { ...defaultData, ...(snapshot.val() || {}) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    render();
  }, () => toast('Realtime sync is unavailable. Local changes will retry when connected.', 'error'));
}

function header() { const name = state.user.displayName || state.user.email.split('@')[0]; return `<header class="topbar"><div class="brand-inline"><div class="mini-mark">N</div><div><strong>NEXORA</strong><small>SAVINGS</small></div></div><button class="avatar" data-nav="profile" aria-label="Open profile">${esc(name.slice(0, 1).toUpperCase())}</button></header>`; }
function bottomNav() { const items = [['dashboard','⌂','Home'],['transactions','≡','Activity'],['goal','◎','Goal'],['profile','◉','Profile']]; return `<nav class="bottom-nav">${items.map(([id, icon, label]) => `<button class="nav-item ${state.screen === id ? 'active' : ''}" data-nav="${id}"><span>${icon}</span><small>${label}</small></button>`).join('')}</nav>`; }
function sectionTitle(kicker, title, action = '') { return `<div class="section-head"><div><div class="eyebrow">${kicker}</div><h2>${title}</h2></div>${action}</div>`; }
function dashboardView() {
  const goal = Number(state.data.goal || 0), balance = Number(state.data.balance || 0), progress = goal ? Math.min(100, Math.round(balance / goal * 100)) : 0;
  return `<div class="greeting"><div><div class="eyebrow">${new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</div><h1>Keep going, ${esc((state.user.displayName || 'Saver').split(' ')[0])}.</h1></div><span class="status-dot"></span></div><section class="balance-card"><div class="card-orb orb-one"></div><div class="card-orb orb-two"></div><div class="balance-label">CURRENT BALANCE <span>● LIVE</span></div><div class="balance-value">${money(balance)}</div><div class="balance-footer"><span>Total saved ${money(state.data.totalSaved)}</span><span>↗ ${money(state.data.totalWithdrawn)} withdrawn</span></div></section><div class="quick-actions"><button class="action add" data-nav="add"><span>＋</span><div><strong>Add money</strong><small>Grow your balance</small></div></button><button class="action withdraw" data-nav="withdraw"><span>↗</span><div><strong>Withdraw</strong><small>Move money out</small></div></button></div><section>${sectionTitle('YOUR PROGRESS', 'Savings goal', `<button class="text-button" data-nav="goal">Edit goal ↗</button>`)}<div class="goal-card"><div class="goal-row"><div><small>Target</small><strong>${goal ? money(goal) : 'Not set'}</strong></div><div class="progress-percent">${progress}%</div></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><div class="goal-row bottom"><small>${money(balance)} saved</small><small>${goal ? money(Math.max(0, goal - balance)) + ' to go' : 'Set a target to begin'}</small></div></div></section><section>${sectionTitle('LATEST MOVEMENTS', 'Recent transactions', `<button class="text-button" data-nav="transactions">See all ↗</button>`)}${transactionList(txns().slice(0, 3))}</section></div>`;
}
function transactionList(items) { if (!items.length) return `<div class="empty-state"><div class="empty-icon">◌</div><strong>No transactions yet</strong><p>Add your first deposit to see your progress here.</p><button class="primary-button compact" data-nav="add">Add money <span>→</span></button></div>`; return `<div class="transaction-list">${items.map(t => `<div class="transaction"><div class="tx-icon ${t.type}">${t.type === 'add' ? '＋' : '↗'}</div><div class="tx-copy"><strong>${t.type === 'add' ? 'Money added' : 'Withdrawal'}</strong><small>${esc(t.note || 'No note')} · ${dateTime(t.timestamp)}</small></div><strong class="tx-amount ${t.type}">${t.type === 'add' ? '+' : '-'}${money(t.amount)}</strong></div>`).join('')}</div>`; }
function moneyForm(type) { const add = type === 'add'; return `<div class="subpage"><button class="back-button" data-nav="dashboard">← Back</button>${sectionTitle(add ? 'ADD TO BALANCE' : 'MOVE MONEY OUT', add ? 'Add money' : 'Withdraw money')}<div class="form-card"><form id="money-form" data-type="${type}"><label>Amount<div class="amount-input"><span>₹</span><input id="amount" type="number" min="0.01" step="0.01" required placeholder="0.00"></div></label>${!add ? `<div class="available">Available balance <strong>${money(state.data.balance)}</strong></div>` : ''}<label>Note <span class="optional">OPTIONAL</span><input id="note" type="text" maxlength="120" placeholder="What is this for?"></label><button class="primary-button" type="submit">${add ? 'Add to savings' : 'Withdraw funds'} <span>→</span></button></form></div><div class="secure-note">⌁ <span>Transactions are synced securely in real time.</span></div></div>`; }
function transactionsView() { return `<div class="subpage">${sectionTitle('MONEY TRAIL', 'Transactions', `<span class="live-badge">● LIVE</span>`)}<div class="stats-strip"><div><small>In</small><strong class="green">${money(state.data.totalSaved)}</strong></div><div><small>Out</small><strong class="red">${money(state.data.totalWithdrawn)}</strong></div><div><small>Count</small><strong>${txns().length}</strong></div></div>${transactionListWithDelete(txns())}</div>`; }
function transactionListWithDelete(items) { if (!items.length) return transactionList(items); return `<div class="transaction-list full">${items.map(t => `<div class="transaction"><div class="tx-icon ${t.type}">${t.type === 'add' ? '＋' : '↗'}</div><div class="tx-copy"><strong>${t.type === 'add' ? 'Money added' : 'Withdrawal'}</strong><small>${esc(t.note || 'No note')} · ${dateTime(t.timestamp)}</small></div><strong class="tx-amount ${t.type}">${t.type === 'add' ? '+' : '-'}${money(t.amount)}</strong><button class="delete-button" data-delete="${t.id}" aria-label="Delete transaction">×</button></div>`).join('')}</div>`; }
function goalView() { const goal = Number(state.data.goal || 0), balance = Number(state.data.balance || 0), progress = goal ? Math.min(100, Math.round(balance / goal * 100)) : 0; return `<div class="subpage">${sectionTitle('MILESTONE', 'Savings goal')}<div class="goal-hero"><div class="ring" style="--progress:${progress * 3.6}deg"><div><strong>${progress}%</strong><small>complete</small></div></div><div><small>Saved toward target</small><h2>${money(balance)}</h2><p>${goal ? `${money(Math.max(0, goal - balance))} remaining` : 'Set your first target'}</p></div></div><div class="form-card"><form id="goal-form"><label>Target amount<div class="amount-input"><span>₹</span><input id="goal" type="number" min="1" step="0.01" value="${goal || ''}" required placeholder="10000"></div></label><button class="primary-button" type="submit">Save goal <span>→</span></button></form></div><div class="tip-card"><span>✦</span><div><strong>Small steps compound</strong><p>Consistency beats intensity. Keep building your future, one deposit at a time.</p></div></div></div>`; }
function profileView() { const name = state.user.displayName || 'Nexora saver'; return `<div class="subpage">${sectionTitle('ACCOUNT', 'Profile & settings')}<div class="profile-card"><div class="profile-avatar">${esc(name.slice(0,1).toUpperCase())}</div><h2>${esc(name)}</h2><p>${esc(state.user.email)}</p></div><div class="settings-list"><div><span>◌</span><div><strong>Account security</strong><small>Firebase Authentication protected</small></div><b>›</b></div><div><span>↻</span><div><strong>Live sync</strong><small>Realtime Database enabled</small></div><b class="green">●</b></div><button data-logout><span>↪</span><div><strong>Sign out</strong><small>End this session securely</small></div><b>›</b></button></div><p class="version">NEXORA SAVINGS · v1.0.0</p></div>`; }

function bindAppEvents() {
  document.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.nav)));
  document.querySelector('[data-logout]')?.addEventListener('click', () => { if (state.unsubscribe) state.unsubscribe(); state.unsubscribe = null; state.user = null; sessionStorage.removeItem('nexora-unlocked'); render(); toast('App locked safely.'); });
  document.querySelector('#money-form')?.addEventListener('submit', handleMoney);
  document.querySelector('#goal-form')?.addEventListener('submit', handleGoal);
  document.querySelectorAll('[data-delete]').forEach(el => el.addEventListener('click', () => deleteTransaction(el.dataset.delete)));
}
async function handleMoney(event) { event.preventDefault(); const form = event.currentTarget, type = form.dataset.type, amount = Number(form.querySelector('#amount').value), note = form.querySelector('#note').value.trim(); if (!Number.isFinite(amount) || amount <= 0) return toast('Enter an amount greater than zero.', 'error'); if (type === 'withdraw' && amount > Number(state.data.balance || 0)) return toast('Withdrawal exceeds your available balance.', 'error'); const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; state.data.transactions = state.data.transactions || {}; state.data.transactions[id] = { type, amount, note, timestamp: Date.now() }; if (type === 'add') { state.data.balance = Number(state.data.balance || 0) + amount; state.data.totalSaved = Number(state.data.totalSaved || 0) + amount; } else { state.data.balance = Number(state.data.balance || 0) - amount; state.data.totalWithdrawn = Number(state.data.totalWithdrawn || 0) + amount; } await saveLocalData(); toast(type === 'add' ? 'Money added to your savings.' : 'Withdrawal recorded.'); navigate('dashboard'); }

async function handleGoal(event) { event.preventDefault(); const goal = Number(event.currentTarget.querySelector('#goal').value); if (!Number.isFinite(goal) || goal <= 0) return toast('Enter a valid target amount.', 'error'); state.data.goal = goal; await saveLocalData(); toast('Savings goal updated.'); navigate('dashboard'); }

async function deleteTransaction(id) { const tx = state.data.transactions?.[id]; if (!tx) return; delete state.data.transactions[id]; if (tx.type === 'add') { state.data.balance = Math.max(0, Number(state.data.balance || 0) - Number(tx.amount)); state.data.totalSaved = Math.max(0, Number(state.data.totalSaved || 0) - Number(tx.amount)); } else { state.data.balance = Number(state.data.balance || 0) + Number(tx.amount); state.data.totalWithdrawn = Math.max(0, Number(state.data.totalWithdrawn || 0) - Number(tx.amount)); } await saveLocalData(); toast('Transaction deleted and totals adjusted.'); render(); }


if (sessionStorage.getItem('nexora-unlocked') === '1') {
  signInAnonymously(auth).then(credential => { state.user = { uid: credential.user.uid, displayName: 'Risham', email: 'Personal app' }; subscribeRealtime(); render(); }).catch(() => { useOfflineMode(); });
}
render();

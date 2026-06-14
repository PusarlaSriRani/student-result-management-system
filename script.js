const API_URL = '/api/students';

const els = {
  form: document.getElementById('studentForm'),
  formPanel: document.getElementById('formPanel'),
  addToggleBtn: document.getElementById('addToggleBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  submitBtn: document.getElementById('submitBtn'),
  recordId: document.getElementById('recordId'),
  studentName: document.getElementById('studentName'),
  rollNo: document.getElementById('rollNo'),
  subject: document.getElementById('subject'),
  marks: document.getElementById('marks'),
  searchInput: document.getElementById('searchInput'),
  searchWrap: document.querySelector('.topbar__search'),
  clearSearch: document.getElementById('clearSearch'),
  recordsBody: document.getElementById('recordsBody'),
  emptyState: document.getElementById('emptyState'),
  noResults: document.getElementById('noResults'),
  toast: document.getElementById('toast'),
  statTotal: document.getElementById('statTotal'),
  statPass: document.getElementById('statPass'),
  statFail: document.getElementById('statFail'),
  statAvg: document.getElementById('statAvg'),
};

let allRecords = [];

/* ---------------- Toast ---------------- */
let toastTimer = null;
function showToast(message, type = '') {
  els.toast.textContent = message;
  els.toast.className = 'toast show' + (type ? ` toast--${type}` : '');
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('show');
  }, 2400);
}

/* ---------------- Form panel ---------------- */
function openForm(record = null) {
  els.formPanel.hidden = false;
  if (record) {
    els.recordId.value = record.id;
    els.studentName.value = record.student_name;
    els.rollNo.value = record.roll_no;
    els.subject.value = record.subject;
    els.marks.value = record.marks;
    els.submitBtn.textContent = 'Update entry';
    els.addToggleBtn.textContent = 'New entry';
  } else {
    els.form.reset();
    els.recordId.value = '';
    els.submitBtn.textContent = 'Save entry';
  }
  els.studentName.focus();
}

function closeForm() {
  els.formPanel.hidden = true;
  els.form.reset();
  els.recordId.value = '';
}

els.addToggleBtn.addEventListener('click', () => {
  if (els.formPanel.hidden) {
    openForm();
  } else {
    closeForm();
  }
});

els.cancelBtn.addEventListener('click', closeForm);

/* ---------------- Fetch & render ---------------- */
async function loadRecords() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to load records');
    allRecords = await res.json();
    renderRecords();
    renderStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function getFilteredRecords() {
  const q = els.searchInput.value.trim().toLowerCase();
  if (!q) return allRecords;
  return allRecords.filter((r) =>
    r.student_name.toLowerCase().includes(q) ||
    r.roll_no.toLowerCase().includes(q) ||
    r.subject.toLowerCase().includes(q)
  );
}

function renderRecords() {
  const records = getFilteredRecords();
  els.recordsBody.innerHTML = '';

  const hasAny = allRecords.length > 0;
  const hasResults = records.length > 0;

  els.emptyState.hidden = hasAny;
  els.noResults.hidden = !hasAny || hasResults;

  records.forEach((r) => {
    const row = document.createElement('div');
    row.className = 'record-row';
    row.dataset.id = r.id;

    const statusClass = r.status === 'Pass' ? 'stamp--pass' : 'stamp--fail';

    row.innerHTML = `
      <span class="col col--name">${escapeHtml(r.student_name)}</span>
      <span class="col col--roll">${escapeHtml(r.roll_no)}</span>
      <span class="col col--subject">${escapeHtml(r.subject)}</span>
      <span class="col col--marks">${r.marks}</span>
      <span class="col col--pct">${formatPct(r.percentage)}%</span>
      <span class="col col--status"><span class="stamp ${statusClass}">${r.status}</span></span>
      <span class="col col--actions">
        <button class="icon-btn icon-btn--edit" title="Edit" aria-label="Edit ${escapeHtml(r.student_name)}">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4l10-10-4-4L4 16v4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M13 6l4 4" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <button class="icon-btn icon-btn--danger" title="Delete" aria-label="Delete ${escapeHtml(r.student_name)}">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </span>
    `;

    row.querySelector('.icon-btn--edit').addEventListener('click', () => openForm(r));
    row.querySelector('.icon-btn--danger').addEventListener('click', () => deleteRecord(r.id, r.student_name));

    els.recordsBody.appendChild(row);
  });
}

function renderStats() {
  const total = allRecords.length;
  const passCount = allRecords.filter((r) => r.status === 'Pass').length;
  const failCount = total - passCount;
  const avg = total
    ? allRecords.reduce((sum, r) => sum + r.percentage, 0) / total
    : 0;

  els.statTotal.textContent = total;
  els.statPass.textContent = passCount;
  els.statFail.textContent = failCount;
  els.statAvg.textContent = `${formatPct(avg)}%`;
}

function formatPct(n) {
  const num = Number(n);
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------------- Search ---------------- */
els.searchInput.addEventListener('input', () => {
  els.searchWrap.classList.toggle('has-value', els.searchInput.value.length > 0);
  renderRecords();
});

els.clearSearch.addEventListener('click', () => {
  els.searchInput.value = '';
  els.searchWrap.classList.remove('has-value');
  renderRecords();
  els.searchInput.focus();
});

/* ---------------- Create / Update ---------------- */
els.form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    student_name: els.studentName.value.trim(),
    roll_no: els.rollNo.value.trim(),
    subject: els.subject.value.trim(),
    marks: Number(els.marks.value),
  };

  if (!payload.student_name || !payload.roll_no || !payload.subject) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  if (payload.marks < 0 || payload.marks > 100 || Number.isNaN(payload.marks)) {
    showToast('Marks must be between 0 and 100', 'error');
    return;
  }

  const id = els.recordId.value;
  const isEdit = Boolean(id);

  try {
    const res = await fetch(isEdit ? `${API_URL}/${id}` : API_URL, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Could not save the record');
    }

    showToast(isEdit ? 'Entry updated' : 'Entry added', 'success');
    closeForm();
    await loadRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

/* ---------------- Delete ---------------- */
async function deleteRecord(id, name) {
  if (!confirm(`Delete the record for "${name}"? This can't be undone.`)) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Could not delete the record');

    showToast('Entry deleted', 'success');
    await loadRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ---------------- Init ---------------- */
loadRecords();
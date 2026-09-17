/* Safe additive renderer for HoReCa Radar.
 * Daily automation updates radar-data.js. This file applies content without
 * changing page structure or the filter model, and preserves lead history.
 */
(() => {
  const d = window.HORECA_RADAR_DATA;
  if (!d) return;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const cssEscape = s => (window.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/["\\]/g, '\\$&');
  const day = d.snapshotDay || d.updated || '';
  const leadBody = document.querySelector('#leadTable tbody');
  const dayFilters = document.querySelector('.dayfilters');
  const eventList = document.querySelector('#events .eventlist');
  const actionBody = document.querySelector('#actions tbody');
  const holidayGrid = document.querySelector('#holidays .holiday-grid');
  const seasonGrid = document.querySelector('#season .season-grid');

  const findLead = x => {
    if (!leadBody || !x) return null;
    if (x.id) {
      const byId = leadBody.querySelector(`[data-radar-id="${cssEscape(x.id)}"]`);
      if (byId) return byId;
    }
    const rows = [...leadBody.querySelectorAll('tr')];
    if (x.url) {
      const byUrl = rows.find(r => r.querySelector('a.lead-link')?.href === x.url);
      if (byUrl) return byUrl;
    }
    if (x.matchText) {
      const q = String(x.matchText).toLowerCase();
      return rows.find(r => r.textContent.toLowerCase().includes(q)) || null;
    }
    return null;
  };

  if (day && leadBody) {
    leadBody.querySelectorAll('tr:not([data-archive="true"])').forEach(r => {
      const snaps = new Set((r.dataset.snapshots || '').split(/\s+/).filter(Boolean));
      snaps.add(day);
      r.dataset.snapshots = [...snaps].sort().reverse().join(' ');
    });
  }

  (d.leads || []).forEach(x => {
    if (!leadBody || !x.id || findLead(x)) return;
    const tr = document.createElement('tr');
    tr.dataset.radarId = x.id;
    tr.dataset.rating = x.rating || 'B';
    tr.dataset.types = x.types || '';
    tr.dataset.created = x.created || day || '';
    tr.dataset.snapshots = x.snapshots || day || '';
    if (x.archive) tr.dataset.archive = 'true';
    tr.innerHTML = `<td><span class="created">${esc(x.createdLabel || '')}</span></td>` +
      `<td>${x.url ? `<a class="lead-link" href="${esc(x.url)}" target="_blank">${esc(x.name)} ↗</a>` : esc(x.name)}</td>` +
      `<td>${esc(x.format)}</td><td>${esc(x.signal)}</td><td><b>${esc(x.opening)}</b></td>` +
      `<td>${esc(x.confidence)}</td><td><b>${esc(x.salesWindow)}</b></td><td class="score">${esc(x.rating)}</td>` +
      `<td>${esc(x.contact)}</td><td>${esc(x.task)}</td>`;
    leadBody.prepend(tr);
  });

  (d.leadStatusUpdates || []).forEach(x => {
    const r = findLead(x);
    if (!r) return;
    const cells = r.children;
    if (x.signal != null) cells[3].textContent = x.signal;
    if (x.opening != null) cells[4].innerHTML = `<b>${esc(x.opening)}</b>`;
    if (x.confidence != null) cells[5].textContent = x.confidence;
    if (x.salesWindow != null) cells[6].innerHTML = `<b>${esc(x.salesWindow)}</b>`;
    if (x.rating != null) { r.dataset.rating = x.rating; cells[7].textContent = x.rating; }
    if (x.contact != null) cells[8].textContent = x.contact;
    if (x.task != null) cells[9].textContent = x.task;
    if (x.types != null) r.dataset.types = x.types;
  });

  (d.actions || []).forEach(x => {
    if (!actionBody || !x.id || actionBody.querySelector(`[data-radar-id="${cssEscape(x.id)}"]`)) return;
    const tr = document.createElement('tr');
    tr.dataset.radarId = x.id;
    tr.innerHTML = `<td>${esc(x.priority)}</td><td><b>${esc(x.name)}</b><br><span class="task-result">${esc(x.note)}</span></td>` +
      `<td>${esc(x.step1)}</td><td>${esc(x.step2)}</td><td><b>${esc(x.result)}</b></td><td><b>${esc(x.when)}</b></td>`;
    actionBody.prepend(tr);
  });

  (d.events || []).forEach(x => {
    if (!eventList || !x.id || eventList.querySelector(`[data-radar-id="${cssEscape(x.id)}"]`)) return;
    const row = document.createElement('div');
    row.className = 'eventrow';
    row.dataset.radarId = x.id;
    row.innerHTML = `<time>${esc(x.date)}</time><strong>${x.url ? `<a class="lead-link" href="${esc(x.url)}" target="_blank">${esc(x.name)} ↗</a>` : esc(x.name)}</strong>` +
      `<span class="potential ${esc(x.potentialClass || 'medium')}">${esc(x.potential || 'Средний')}</span><span class="why">${esc(x.why)}</span>`;
    eventList.prepend(row);
  });

  (d.holidays || []).forEach(x => {
    if (!holidayGrid || !x.id || holidayGrid.querySelector(`[data-radar-id="${cssEscape(x.id)}"]`)) return;
    const card = document.createElement('article');
    card.className = 'holiday-card';
    card.dataset.radarId = x.id;
    card.innerHTML = `<div class="holiday-date">${esc(x.date)}</div><h3>${esc(x.name)}</h3>` +
      `<span class="potential ${esc(x.potentialClass || 'medium')}">${esc(x.potential || 'Средний')}</span><p>${esc(x.why)}</p>`;
    holidayGrid.append(card);
  });

  (d.seasonalityUpdates || []).forEach(x => {
    if (!seasonGrid || !x.month) return;
    const card = [...seasonGrid.querySelectorAll('.season-card')].find(c => c.querySelector('h3')?.textContent.trim() === x.month);
    if (!card) return;
    if (x.index != null) card.querySelector('.season-index').textContent = x.index;
    if (x.note != null) card.querySelector('p').textContent = x.note;
    if (x.sell != null) card.querySelector('.sell').innerHTML = `<b>Продавать:</b> ${esc(x.sell)}`;
  });

  if (dayFilters && day) {
    dayFilters.querySelectorAll('.day-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
    let b = dayFilters.querySelector(`[data-day="${cssEscape(day)}"]`);
    if (!b) {
      b = document.createElement('button');
      b.className = 'day-btn';
      b.dataset.day = day;
      dayFilters.prepend(b);
    }
    b.setAttribute('aria-pressed', 'true');
    b.textContent = 'Сегодня · ' + day.slice(8, 10) + '.' + day.slice(5, 7);
  }

  if (d.updated) {
    const displayDate = d.updated.split('-').reverse().join('.');
    const date = document.querySelector('.hero .date');
    if (date) date.textContent = 'Обновлено ' + displayDate;
    const foot = document.querySelector('.foot');
    if (foot) foot.textContent = `HoReCa Radar v3.3 · обновлено ${displayDate}. Дневные снимки и архив лидов сохранены; структура разделов не менялась.`;
  }

  const metricBlocks = [...document.querySelectorAll('.metric')];
  const metricByLabel = label => metricBlocks.find(m => m.querySelector('small')?.textContent.trim() === label)?.querySelector('strong');
  if (leadBody && day) {
    const active = [...leadBody.querySelectorAll('tr:not([data-archive="true"])')].filter(r => (r.dataset.snapshots || '').split(/\s+/).includes(day)).length;
    const newToday = [...leadBody.querySelectorAll('tr')].filter(r => r.dataset.created === day).length;
    const activeNode = metricByLabel('Активных лидов'); if (activeNode) activeNode.textContent = String(active);
    const newNode = metricBlocks.find(m => m.querySelector('small')?.textContent.trim().startsWith('Новых'));
    if (newNode) { newNode.querySelector('small').textContent = 'Новых ' + day.slice(8,10) + '.' + day.slice(5,7); newNode.querySelector('strong').textContent = String(newToday); }
  }
  const historyNode = metricByLabel('История');
  if (historyNode && dayFilters) {
    historyNode.textContent = [...dayFilters.querySelectorAll('.day-btn')].slice(0,4).map(b => b.dataset.day.slice(8,10) + '.' + b.dataset.day.slice(5,7)).join(' / ');
  }
  const eventCounter = document.querySelector('#events > .muted');
  if (eventCounter && eventList) eventCounter.textContent = `${eventList.querySelectorAll('.eventrow').length} события · оценка влияния на спрос HoReCa.`;
})();

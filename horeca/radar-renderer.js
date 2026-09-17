/* Safe additive renderer for HoReCa Radar.
 * It never changes section structure or filter logic. It only applies content
 * from window.HORECA_RADAR_DATA and preserves existing DOM/history.
 */
(() => {
  const d = window.HORECA_RADAR_DATA;
  if (!d) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const leadBody = document.querySelector('#leadTable tbody');
  const dayFilters = document.querySelector('.dayfilters');
  const eventList = document.querySelector('#events .eventlist');
  const actionBody = document.querySelector('#actions tbody');
  const day = d.snapshotDay;

  // Preserve history: add the new snapshot day to existing active rows.
  if (day && leadBody) {
    leadBody.querySelectorAll('tr:not([data-archive="true"])').forEach(r => {
      const snaps = new Set((r.dataset.snapshots || '').split(/\s+/).filter(Boolean));
      snaps.add(day);
      r.dataset.snapshots = [...snaps].sort().reverse().join(' ');
    });
  }

  // New leads are additive only.
  (d.leads || []).forEach(x => {
    if (!leadBody || !x.id || leadBody.querySelector(`[data-radar-id="${CSS.escape(x.id)}"]`)) return;
    const tr = document.createElement('tr');
    tr.dataset.radarId = x.id; tr.dataset.rating = x.rating || 'B'; tr.dataset.types = x.types || '';
    tr.dataset.created = x.created || day || ''; tr.dataset.snapshots = x.snapshots || day || '';
    tr.innerHTML = `<td><span class="created">${esc(x.createdLabel || '')}</span></td><td>${x.url ? `<a class="lead-link" href="${esc(x.url)}" target="_blank">${esc(x.name)} ↗</a>` : esc(x.name)}</td><td>${esc(x.format)}</td><td>${esc(x.signal)}</td><td><b>${esc(x.opening)}</b></td><td>${esc(x.confidence)}</td><td><b>${esc(x.salesWindow)}</b></td><td class="score">${esc(x.rating)}</td><td>${esc(x.contact)}</td><td>${esc(x.task)}</td>`;
    leadBody.prepend(tr);
  });

  // Status updates target only explicit radar IDs.
  (d.leadStatusUpdates || []).forEach(x => {
    if (!leadBody || !x.id) return; const r = leadBody.querySelector(`[data-radar-id="${CSS.escape(x.id)}"]`); if (!r) return;
    const cells = r.children; if (x.signal != null) cells[3].textContent = x.signal; if (x.opening != null) cells[4].textContent = x.opening; if (x.task != null) cells[9].textContent = x.task;
  });

  (d.actions || []).forEach(x => {
    if (!actionBody || !x.id || actionBody.querySelector(`[data-radar-id="${CSS.escape(x.id)}"]`)) return;
    const tr=document.createElement('tr'); tr.dataset.radarId=x.id;
    tr.innerHTML=`<td>${esc(x.priority)}</td><td><b>${esc(x.name)}</b><br><span class="task-result">${esc(x.note)}</span></td><td>${esc(x.step1)}</td><td>${esc(x.step2)}</td><td><b>${esc(x.result)}</b></td><td><b>${esc(x.when)}</b></td>`; actionBody.prepend(tr);
  });

  (d.events || []).forEach(x => {
    if (!eventList || !x.id || eventList.querySelector(`[data-radar-id="${CSS.escape(x.id)}"]`)) return;
    const row=document.createElement('div'); row.className='eventrow'; row.dataset.radarId=x.id;
    row.innerHTML=`<time>${esc(x.date)}</time><strong>${x.url ? `<a class="lead-link" href="${esc(x.url)}" target="_blank">${esc(x.name)} ↗</a>` : esc(x.name)}</strong><span class="potential ${esc(x.potentialClass || 'medium')}">${esc(x.potential || 'Средний')}</span><span class="why">${esc(x.why)}</span>`; eventList.prepend(row);
  });

  if (dayFilters && day && !dayFilters.querySelector(`[data-day="${CSS.escape(day)}"]`)) {
    dayFilters.querySelectorAll('.day-btn').forEach(b=>b.setAttribute('aria-pressed','false'));
    const b=document.createElement('button'); b.className='day-btn'; b.dataset.day=day; b.setAttribute('aria-pressed','true'); b.textContent='Сегодня · '+day.slice(8,10)+'.'+day.slice(5,7); dayFilters.prepend(b);
  }
  const date=document.querySelector('.hero .date'); if(date && d.updated) date.textContent='Обновлено '+d.updated.split('-').reverse().join('.');
})();

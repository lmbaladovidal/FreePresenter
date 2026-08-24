/**
 * ProPresenter Studio - Calendar & Event Manager Module (7-Column Monthly View)
 */

import { store } from './state.js';

class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.events = this.loadEvents();
    this.activeFilter = 'all';
  }

  loadEvents() {
    try {
      const saved = localStorage.getItem("propresenter_calendar_events");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error al cargar eventos del calendario:", e);
    }

    // Default sample events if none saved
    return [
      {
        id: "evt-1",
        title: "Servicio Dominical",
        date: "2026-08-30",
        time: "10:00",
        category: "Servicio Domingo",
        notes: "Servicio principal de adoración y prédica."
      },
      {
        id: "evt-2",
        title: "Ensayo de Alabanza",
        date: "2026-08-28",
        time: "19:30",
        category: "Ensayo Alabanza",
        notes: "Revisión del repertorio para el domingo."
      },
      {
        id: "evt-3",
        title: "Reunión de Jóvenes",
        date: "2026-08-24",
        time: "18:00",
        category: "Reunión Jóvenes",
        notes: "Tema: Caminando en Fe."
      }
    ];
  }

  saveEvents() {
    try {
      localStorage.setItem("propresenter_calendar_events", JSON.stringify(this.events));
    } catch (e) {
      console.error("Error al guardar eventos del calendario:", e);
    }
  }

  addEvent(title, date, time, category, notes) {
    const newEvent = {
      id: `evt-${Date.now()}`,
      title: title || "Nuevo Evento",
      date: date || new Date().toISOString().split('T')[0],
      time: time || "19:00",
      category: category || "Servicio Domingo",
      notes: notes || ""
    };

    this.events.push(newEvent);
    this.saveEvents();
    this.renderCalendarUI();
    return newEvent;
  }

  deleteEvent(eventId) {
    this.events = this.events.filter(e => e.id !== eventId);
    this.saveEvents();
    this.renderCalendarUI();
  }

  changeMonth(delta) {
    this.currentDate.setMonth(this.currentDate.getMonth() + delta);
    this.renderCalendarUI();
  }

  setToday() {
    this.currentDate = new Date();
    this.renderCalendarUI();
  }

  setFilter(filterName) {
    this.activeFilter = filterName;
    this.renderCalendarUI();
  }

  renderCalendarUI() {
    const monthTitleEl = document.getElementById('calendar-month-title');
    const gridEl = document.getElementById('calendar-month-grid');
    if (!gridEl) return;

    const year = this.currentDate.getFullYear();
    const monthIdx = this.currentDate.getMonth();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    if (monthTitleEl) {
      monthTitleEl.textContent = `${monthNames[monthIdx]} ${year}`;
    }

    const firstDay = new Date(year, monthIdx, 1);
    const lastDay = new Date(year, monthIdx + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday...

    const prevMonthLastDay = new Date(year, monthIdx, 0).getDate();

    const todayObj = new Date();
    const isCurrentMonth = todayObj.getFullYear() === year && todayObj.getMonth() === monthIdx;
    const todayDate = todayObj.getDate();

    let gridHtml = '';
    let weekNumber = Math.ceil((((firstDay - new Date(year, 0, 1)) / 86400000) + 1) / 7);

    // Render cells (Previous Month Days + Current Month Days + Next Month Days)
    const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      // At start of each week (row), render week number column
      if (i % 7 === 0) {
        gridHtml += `<div class="cal-week-num" style="display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: var(--accent-pink); opacity: 0.6; border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); background: rgba(236,72,153,0.03);">${weekNumber++}</div>`;
      }

      let dayNum;
      let cellDateStr;
      let isOtherMonth = false;

      if (i < startDayOfWeek) {
        // Day from previous month
        dayNum = prevMonthLastDay - (startDayOfWeek - 1 - i);
        isOtherMonth = true;
        const prevM = monthIdx === 0 ? 11 : monthIdx - 1;
        const prevY = monthIdx === 0 ? year - 1 : year;
        cellDateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      } else if (i >= startDayOfWeek + daysInMonth) {
        // Day from next month
        dayNum = i - (startDayOfWeek + daysInMonth) + 1;
        isOtherMonth = true;
        const nextM = monthIdx === 11 ? 0 : monthIdx + 1;
        const nextY = monthIdx === 11 ? year + 1 : year;
        cellDateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      } else {
        // Day from current month
        dayNum = i - startDayOfWeek + 1;
        cellDateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      }

      const isToday = isCurrentMonth && !isOtherMonth && dayNum === todayDate;

      // Filter events matching cellDateStr
      const dayEvents = this.events.filter(ev => {
        if (ev.date !== cellDateStr) return false;
        if (this.activeFilter && this.activeFilter !== 'all') {
          const cat = ev.category.toLowerCase();
          if (this.activeFilter === 'domingo') return cat.includes('domingo') || cat.includes('servicio');
          if (this.activeFilter === 'ensayo') return cat.includes('ensayo') || cat.includes('alabanza');
          if (this.activeFilter === 'jovenes') return cat.includes('joven') || cat.includes('juventud');
        }
        return true;
      });

      gridHtml += `
        <div class="cal-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${cellDateStr}" style="border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 4px 6px; display: flex; flex-direction: column; justify-content: space-between; min-height: 52px; background: ${isToday ? 'rgba(236, 72, 153, 0.12)' : (isOtherMonth ? 'rgba(0,0,0,0.25)' : 'transparent')}; cursor: pointer; transition: background 0.15s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="cal-day-num" style="font-size: 0.85rem; font-weight: 700; color: ${isToday ? 'var(--accent-pink)' : (isOtherMonth ? '#475569' : '#fff')}; ${isToday ? 'background: var(--accent-pink); color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;' : ''}">${dayNum}</span>
            ${dayEvents.length > 0 ? `<span style="font-size: 0.58rem; background: var(--accent-pink); color: #fff; font-weight: 800; padding: 1px 4px; border-radius: 8px;">${dayEvents.length}</span>` : ''}
          </div>

          <div class="cal-day-events" style="display: flex; flex-direction: column; gap: 2px; margin-top: 2px; overflow: hidden;">
            ${dayEvents.map(ev => `
              <div class="cal-event-pill" data-evt-id="${ev.id}" title="${ev.title} (${ev.time})" style="background: rgba(236, 72, 153, 0.2); border-left: 2px solid var(--accent-pink); color: #fff; font-size: 0.62rem; font-weight: 600; padding: 1px 4px; border-radius: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; justify-content: space-between;">
                <span>${ev.time} ${ev.title}</span>
                <span class="btn-quick-project" data-evt-id="${ev.id}" title="Proyectar Anuncio" style="margin-left: 4px; opacity: 0.8;">📢</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    gridEl.innerHTML = gridHtml;

    // Event listeners for day clicks & event pills
    gridEl.querySelectorAll('.cal-day-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        if (e.target.closest('.cal-event-pill') || e.target.closest('.btn-quick-project')) return;
        const dateStr = cell.getAttribute('data-date');
        const modal = document.getElementById('modal-create-event');
        const inputDate = document.getElementById('input-event-date');
        if (inputDate) inputDate.value = dateStr;
        if (modal) modal.classList.add('open');
      });
    });

    gridEl.querySelectorAll('.btn-quick-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-evt-id');
        const ev = this.events.find(item => item.id === id);
        if (ev) this.projectEventAnnouncement(ev);
      });
    });
  }

  projectEventAnnouncement(ev) {
    const titleText = `📅 PRÓXIMO EVENTO: ${ev.title.toUpperCase()}`;
    const descText = `Fecha: ${ev.date} - Hora: ${ev.time} hs\n${ev.notes || ev.category}`;

    store.updateActiveSlide(
      { text: `${titleText}\n\n${descText}` },
      0,
      `EVENTO: ${ev.title}`
    );
  }
}

export const calendarManager = new CalendarManager();

// Demo events for the week
const demoEvents = [
  {
    id: 1,
    title: 'Client Meeting Planning',
    type: 'Meeting',
    client: '',
    date: '2024-06-24',
    start: '09:00',
    end: '10:30',
    notes: 'Discuss project goals.',
    color: 'event-blue'
  },
  {
    id: 2,
    title: 'Design Revisions',
    type: 'Task',
    client: '',
    date: '2024-06-25',
    start: '09:00',
    end: '10:00',
    notes: '',
    color: 'event-purple'
  },
  {
    id: 3,
    title: 'Meetup with UI8 Team',
    type: 'Meeting',
    client: '',
    date: '2024-06-26',
    start: '11:00',
    end: '12:00',
    notes: '',
    color: 'event-green'
  }
];

const calendarGridBody = document.getElementById('calendarGridBody');
let events = JSON.parse(localStorage.getItem('calendarEvents') || 'null') || demoEvents;

let eventFilter = {
  search: '',
  type: '',
  client: ''
};

const searchInput = document.querySelector('.calendar-search');
const filterBtn = document.querySelector('.calendar-filter');
const tabBtns = document.querySelectorAll('.calendar-tab');

const dayViewBtn = document.getElementById('dayViewBtn');
const weekViewBtn = document.getElementById('weekViewBtn');
const monthViewBtn = document.getElementById('monthViewBtn');
const calendarWeekGrid = document.getElementById('calendarWeekGrid');
const calendarDayGrid = document.getElementById('calendarDayGrid');
const calendarMonthGrid = document.getElementById('calendarMonthGrid');

searchInput.addEventListener('input', function() {
  eventFilter.search = this.value.toLowerCase();
  renderEvents();
});
filterBtn.addEventListener('click', function() {
  // For demo: cycle type filter (All -> Meeting -> Cleaning -> Task -> All)
  if (!eventFilter.type) eventFilter.type = 'Meeting';
  else if (eventFilter.type === 'Meeting') eventFilter.type = 'Cleaning';
  else if (eventFilter.type === 'Cleaning') eventFilter.type = 'Task';
  else eventFilter.type = '';
  renderEvents();
});
tabBtns.forEach(btn => btn.addEventListener('click', function() {
  tabBtns.forEach(b => b.classList.remove('active'));
  this.classList.add('active');
  eventFilter.type = this.textContent.includes('All') ? '' : this.textContent.replace('s','');
  renderEvents();
}));

function eventMatchesFilter(ev) {
  if (eventFilter.search && !(
    ev.title.toLowerCase().includes(eventFilter.search) ||
    (ev.client && ev.client.toLowerCase().includes(eventFilter.search))
  )) return false;
  if (eventFilter.type && ev.type !== eventFilter.type) return false;
  return true;
}

function saveEvents() {
  localStorage.setItem('calendarEvents', JSON.stringify(events));
}

function getDayCol(dateStr) {
  // Mon 24 = 2, Tue 25 = 3, ... Sun 30 = 8
  const d = new Date(dateStr);
  return d.getDay() === 0 ? 8 : d.getDay() + 1;
}
function getTimeRow(timeStr) {
  // 8:00 = 1, 9:00 = 2, ... 13:00 = 6
  const h = parseInt(timeStr.split(':')[0], 10);
  return h - 7;
}
function getRowSpan(start, end) {
  const sh = parseInt(start.split(':')[0], 10), eh = parseInt(end.split(':')[0], 10);
  const sm = parseInt(start.split(':')[1], 10), em = parseInt(end.split(':')[1], 10);
  return (eh + em/60) - (sh + sm/60);
}

function renderEvents() {
  // Remove old events
  document.querySelectorAll('.calendar-event').forEach(e => e.remove());
  events.filter(eventMatchesFilter).forEach(ev => {
    const col = getDayCol(ev.date);
    const row = getTimeRow(ev.start);
    const span = Math.max(1, Math.round(getRowSpan(ev.start, ev.end)));
    const div = document.createElement('div');
    div.className = `calendar-event ${ev.color}`;
    div.style.gridColumn = col;
    div.style.gridRow = `${row} / span ${span}`;
    div.textContent = ev.title;
    div.innerHTML = `${ev.title}<br><span>${formatTime(ev.start)} - ${formatTime(ev.end)}</span>`;
    div.setAttribute('data-id', ev.id);
    div.tabIndex = 0;
    div.addEventListener('click', () => openEventModal(ev.id));
    calendarGridBody.appendChild(div);
    makeDraggable(div, ev.id);
  });
}

function formatTime(t) {
  let [h, m] = t.split(':');
  h = parseInt(h, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

// --- Event Modal Logic ---
const eventModal = document.getElementById('eventModal');
const closeEventModal = document.getElementById('closeEventModal');
const eventModalDetails = document.getElementById('eventModalDetails');
let currentEventId = null;
function openEventModal(id) {
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  currentEventId = id;
  eventModalDetails.innerHTML = `
    <div><b>Title:</b> ${ev.title}</div>
    <div><b>Type:</b> ${ev.type}</div>
    <div><b>Date:</b> ${ev.date}</div>
    <div><b>Time:</b> ${formatTime(ev.start)} - ${formatTime(ev.end)}</div>
    <div><b>Notes:</b> ${ev.notes || ''}</div>
  `;
  eventModal.style.display = 'block';
}
closeEventModal.onclick = () => { eventModal.style.display = 'none'; };
window.addEventListener('click', e => { if (e.target === eventModal) eventModal.style.display = 'none'; });

document.getElementById('deleteEventBtn').onclick = function() {
  events = events.filter(e => e.id !== currentEventId);
  saveEvents();
  renderEvents();
  eventModal.style.display = 'none';
};

document.getElementById('editEventBtn').onclick = function() {
  openEventFormModal(currentEventId);
  eventModal.style.display = 'none';
};

// --- Event Form Modal Logic ---
const eventFormModal = document.getElementById('eventFormModal');
const closeEventFormModal = document.getElementById('closeEventFormModal');
const eventForm = document.getElementById('eventForm');
const eventFormModalTitle = document.getElementById('eventFormModalTitle');
const calendarNewBtn = document.querySelector('.calendar-new-btn');

calendarNewBtn.onclick = () => openEventFormModal();
closeEventFormModal.onclick = () => { eventFormModal.style.display = 'none'; };
window.addEventListener('click', e => { if (e.target === eventFormModal) eventFormModal.style.display = 'none'; });

function openEventFormModal(id) {
  eventForm.reset();
  populateClientDropdown();
  if (id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    eventFormModalTitle.textContent = 'Edit Event';
    eventForm.eventTitle.value = ev.title;
    eventForm.eventType.value = ev.type;
    eventForm.eventClient.value = ev.client || '';
    eventForm.eventDate.value = ev.date;
    eventForm.eventStart.value = ev.start;
    eventForm.eventEnd.value = ev.end;
    eventForm.eventNotes.value = ev.notes;
    eventForm.dataset.editId = id;
  } else {
    eventFormModalTitle.textContent = 'New Event';
    eventForm.dataset.editId = '';
  }
  eventFormModal.style.display = 'block';
}

eventForm.onsubmit = function(e) {
  e.preventDefault();
  const id = eventForm.dataset.editId ? parseInt(eventForm.dataset.editId, 10) : Date.now();
  const color = eventForm.eventType.value === 'Meeting' ? 'event-blue' : eventForm.eventType.value === 'Task' ? 'event-purple' : 'event-green';
  const newEvent = {
    id,
    title: eventForm.eventTitle.value,
    type: eventForm.eventType.value,
    client: eventForm.eventClient.value,
    date: eventForm.eventDate.value,
    start: eventForm.eventStart.value,
    end: eventForm.eventEnd.value,
    notes: eventForm.eventNotes.value,
    color
  };
  if (eventForm.dataset.editId) {
    events = events.map(ev => ev.id === id ? newEvent : ev);
  } else {
    events.push(newEvent);
  }
  saveEvents();
  renderEvents();
  eventFormModal.style.display = 'none';
};

function populateClientDropdown() {
  const clientSelect = document.getElementById('eventClient');
  const clients = JSON.parse(localStorage.getItem('clientsList') || '[]');
  clientSelect.innerHTML = '<option value="">None</option>';
  clients.forEach(c => {
    clientSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
  });
}

// --- Drag and Drop ---
function makeDraggable(element, eventId) {
  let isDragging = false;
  interact(element).draggable({
    listeners: {
      move (event) {
        isDragging = true;
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
        target.classList.add('dragging');
      },
      end (event) {
        const target = event.target;
        // Snap to grid: calculate new col/row
        const gridRect = calendarWeekGrid.getBoundingClientRect();
        const cellWidth = gridRect.width / 8; // 8 columns (time + 7 days)
        const cellHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--calendar-hour-height'));
        const x = (parseFloat(target.getAttribute('data-x')) || 0);
        const y = (parseFloat(target.getAttribute('data-y')) || 0);
        // Find the parent cell
        const parentCell = target.parentElement;
        const allCells = Array.from(document.querySelectorAll('.calendar-week-cell'));
        const cellIdx = allCells.indexOf(parentCell);
        const origRow = Math.floor(cellIdx / 7); // 0-based
        const origCol = cellIdx % 7;
        // Calculate new col/row
        const newCol = Math.min(6, Math.max(0, origCol + Math.round(x / cellWidth)));
        const newRow = Math.min(11, Math.max(0, origRow + Math.round(y / cellHeight)));
        // Update event date and time
        const eventIdx = events.findIndex(ev => ev.id === eventId);
        let newDateStr = null;
        if (eventIdx !== -1) {
          // Update date
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
          const newDate = new Date(weekStart.getTime() + newCol * 24 * 60 * 60 * 1000);
          newDateStr = newDate.toISOString().slice(0, 10);
          events[eventIdx].date = newDateStr;
          // Update time
          const duration = getRowSpan(events[eventIdx].start, events[eventIdx].end);
          const newHour = 8 + newRow;
          const startTime = `${String(newHour).padStart(2, '0')}:00`;
          const endHour = newHour + duration;
          const endTime = `${String(Math.floor(endHour)).padStart(2, '0')}:00`;
          events[eventIdx].start = startTime;
          events[eventIdx].end = endTime;
          // Debug log
          // console.log('Dragged event updated:', events[eventIdx]);
          saveEvents();
        } else {
          // console.log('Event not found in events array for drag update:', eventId);
        }
        target.style.transform = '';
        target.setAttribute('data-x', 0);
        target.setAttribute('data-y', 0);
        target.classList.remove('dragging');
        setTimeout(() => { isDragging = false; }, 100);
        // If the new date is outside the current week, update currentDate and re-render
        if (newDateStr) {
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          if (newDateStr < weekStart.toISOString().slice(0,10) || newDateStr > weekEnd.toISOString().slice(0,10)) {
            currentDate = new Date(newDateStr);
          }
        }
        renderWeekView();
      }
    },
    inertia: true
  });
  // Prevent click-to-edit if just dragged
  element.addEventListener('click', function(e) {
    if (isDragging) {
      e.stopImmediatePropagation();
      return false;
    }
  }, true);

  // --- Drag-Resize (bottom edge) ---
  interact(element).resizable({
    edges: { bottom: true },
    listeners: {
      move (event) {
        const target = event.target;
        const hourHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--calendar-hour-height'));
        let newHeight = event.rect.height;
        // Snap to nearest hour
        let span = Math.round((newHeight + 8) / hourHeight); // +8 for padding/margin fudge
        span = Math.max(1, Math.min(12, span));
        target.style.height = `calc(${span} * ${hourHeight}px - 8px)`;
        target.setAttribute('data-resize-span', span);
      },
      end (event) {
        const target = event.target;
        const span = parseInt(target.getAttribute('data-resize-span')) || 1;
        const eventId = parseInt(target.getAttribute('data-id'));
        const eventIdx = events.findIndex(ev => ev.id === eventId);
        if (eventIdx !== -1) {
          const start = events[eventIdx].start;
          let [sh, sm] = start.split(':').map(Number);
          let endH = sh + span;
          let end = `${String(endH).padStart(2, '0')}:${sm === 0 ? '00' : String(sm).padStart(2, '0')}`;
          events[eventIdx].end = end;
          saveEvents();
        }
        renderWeekView();
      }
    },
    modifiers: [
      interact.modifiers.restrictSize({
        min: { height: 32 },
        max: { height: 12 * parseInt(getComputedStyle(document.documentElement).getPropertyValue('--calendar-hour-height')) }
      })
    ]
  });
}

// --- Calendar View State ---
let calendarView = 'week';
let currentDate = new Date('2024-06-24'); // Start at week of demo events

function setCalendarView(view) {
  calendarView = view;
  dayViewBtn.classList.remove('active');
  weekViewBtn.classList.remove('active');
  monthViewBtn.classList.remove('active');
  calendarWeekGrid.style.display = 'none';
  calendarDayGrid.style.display = 'none';
  calendarMonthGrid.style.display = 'none';
  if (view === 'day') {
    dayViewBtn.classList.add('active');
    calendarDayGrid.style.display = '';
    renderDayView();
  } else if (view === 'week') {
    weekViewBtn.classList.add('active');
    calendarWeekGrid.style.display = '';
    renderWeekView();
  } else if (view === 'month') {
    monthViewBtn.classList.add('active');
    calendarMonthGrid.style.display = '';
    renderMonthView();
  }
  updateDateRangeLabel();
}

dayViewBtn.onclick = () => setCalendarView('day');
weekViewBtn.onclick = () => setCalendarView('week');
monthViewBtn.onclick = () => setCalendarView('month');

// --- Navigation ---
const calendarPrevBtn = document.getElementById('calendarPrevBtn');
const calendarNextBtn = document.getElementById('calendarNextBtn');
const calendarTodayBtn = document.getElementById('calendarTodayBtn');
const calendarDateRange = document.getElementById('calendarDateRange');

calendarPrevBtn.onclick = () => {
  if (calendarView === 'week') currentDate.setDate(currentDate.getDate() - 7);
  else if (calendarView === 'month') currentDate.setMonth(currentDate.getMonth() - 1);
  else currentDate.setDate(currentDate.getDate() - 1);
  setCalendarView(calendarView);
};
calendarNextBtn.onclick = () => {
  if (calendarView === 'week') currentDate.setDate(currentDate.getDate() + 7);
  else if (calendarView === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
  else currentDate.setDate(currentDate.getDate() + 1);
  setCalendarView(calendarView);
};
calendarTodayBtn.onclick = () => {
  currentDate = new Date();
  setCalendarView(calendarView);
};

function updateDateRangeLabel() {
  if (calendarView === 'week') {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    calendarDateRange.textContent = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (calendarView === 'month') {
    calendarDateRange.textContent = `${currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
  } else {
    calendarDateRange.textContent = `${currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
}

// --- Recurring Events Support ---
function getRecurringInstances(ev, rangeStart, rangeEnd) {
  if (!ev.recurring) return [ev];
  let out = [];
  let dt = new Date(ev.date);
  while (dt <= rangeEnd) {
    if (dt >= rangeStart) {
      out.push({ ...ev, date: dt.toISOString().slice(0, 10) });
    }
    if (ev.recurring === 'daily') dt.setDate(dt.getDate() + 1);
    else if (ev.recurring === 'weekly') dt.setDate(dt.getDate() + 7);
    else if (ev.recurring === 'monthly') dt.setMonth(dt.getMonth() + 1);
    else break;
  }
  return out;
}

// --- Month View ---
function renderMonthView() {
  const grid = calendarMonthGrid;
  grid.innerHTML = '';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = new Date(firstDay);
  startDay.setDate(1 - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1)); // Monday start
  // Header
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'calendar-month-header';
    h.textContent = d;
    grid.appendChild(h);
  });
  // Cells
  let day = new Date(startDay);
  for (let i = 0; i < 42; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-month-cell';
    if (day.getMonth() === month && day.toDateString() === (new Date()).toDateString()) cell.classList.add('today');
    const dateDiv = document.createElement('div');
    dateDiv.className = 'calendar-month-date';
    dateDiv.textContent = day.getDate();
    cell.appendChild(dateDiv);
    // Events
    const eventsHere = [];
    events.forEach(ev => {
      getRecurringInstances(ev, day, day).forEach(inst => {
        if (inst.date === day.toISOString().slice(0,10) && eventMatchesFilter(inst)) eventsHere.push(inst);
      });
    });
    if (eventsHere.length) {
      const evList = document.createElement('div');
      evList.className = 'calendar-month-events';
      eventsHere.forEach(ev => {
        const evDiv = document.createElement('div');
        evDiv.className = `calendar-month-event-title ${ev.color}`;
        evDiv.textContent = ev.title;
        evDiv.title = ev.title;
        evDiv.onclick = () => openEventModal(ev.id);
        evList.appendChild(evDiv);
      });
      cell.appendChild(evList);
    }
    grid.appendChild(cell);
    day.setDate(day.getDate() + 1);
  }
}

// --- Day View ---
function renderDayView() {
  const grid = calendarDayGrid;
  grid.innerHTML = '';
  for (let h = 8; h <= 19; h++) {
    const timeDiv = document.createElement('div');
    timeDiv.className = 'calendar-day-time';
    timeDiv.textContent = `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
    grid.appendChild(timeDiv);
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    grid.appendChild(cell);
  }
  // Events for this day
  const dayStr = currentDate.toISOString().slice(0,10);
  events.forEach(ev => {
    getRecurringInstances(ev, currentDate, currentDate).forEach(inst => {
      if (inst.date === dayStr && eventMatchesFilter(inst)) {
        const startH = parseInt(inst.start.split(':')[0], 10);
        const endH = parseInt(inst.end.split(':')[0], 10);
        const row = startH - 8;
        const span = Math.max(1, endH - startH);
        const evDiv = document.createElement('div');
        evDiv.className = `calendar-day-event ${inst.color}`;
        evDiv.style.gridRow = `${row + 1} / span ${span}`;
        evDiv.textContent = inst.title;
        evDiv.innerHTML = `${inst.title}<br><span>${formatTime(inst.start)} - ${formatTime(inst.end)}</span>`;
        evDiv.onclick = () => openEventModal(inst.id);
        grid.appendChild(evDiv);
      }
    });
  });
}

// --- Week View ---
function renderWeekView() {
  const grid = calendarWeekGrid;
  grid.innerHTML = '';
  // Header row
  grid.appendChild(document.createElement('div')); // Empty top-left
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  for (let d = 0; d < 7; d++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + d);
    const h = document.createElement('div');
    h.className = 'calendar-week-header';
    h.textContent = `${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]} ${day.getDate()}`;
    grid.appendChild(h);
  }
  // Time rows
  const cellMatrix = [];
  for (let h = 8; h <= 19; h++) {
    // Time label
    const timeDiv = document.createElement('div');
    timeDiv.className = 'calendar-week-time';
    timeDiv.textContent = `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
    grid.appendChild(timeDiv);
    // Day cells
    const rowCells = [];
    for (let d = 0; d < 7; d++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-week-cell';
      cell.style.position = 'relative';
      grid.appendChild(cell);
      rowCells.push(cell);
    }
    cellMatrix.push(rowCells);
  }
  // Place events in correct cell
  const hourHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--calendar-hour-height'));
  events.forEach(ev => {
    getRecurringInstances(ev, weekStart, new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)).forEach(inst => {
      if (!eventMatchesFilter(inst)) return;
      const dayIdx = (new Date(inst.date).getDay() + 6) % 7; // 0=Mon, 6=Sun
      const startH = parseInt(inst.start.split(':')[0], 10);
      const endH = parseInt(inst.end.split(':')[0], 10);
      const row = startH - 8;
      const span = Math.max(1, endH - startH);
      // Bounds check: only render if in visible week and time range
      if (row < 0 || row > 11 || dayIdx < 0 || dayIdx > 6) return;
      const evDiv = document.createElement('div');
      evDiv.className = `calendar-week-event ${inst.color}`;
      evDiv.textContent = inst.title;
      evDiv.innerHTML = `${inst.title}<br><span>${formatTime(inst.start)} - ${formatTime(inst.end)}</span>`;
      evDiv.setAttribute('data-id', inst.id);
      evDiv.tabIndex = 0;
      evDiv.addEventListener('click', () => openEventModal(inst.id));
      // Absolute position in the cell, span correct height
      evDiv.style.position = 'absolute';
      evDiv.style.top = '4px';
      evDiv.style.left = '4px';
      evDiv.style.right = '4px';
      evDiv.style.height = `calc(${span} * ${hourHeight}px - 8px)`;
      cellMatrix[row][dayIdx].appendChild(evDiv);
      makeDraggable(evDiv, inst.id);
    });
  });
}

// --- Scale slider for calendar hour height ---
const scaleSlider = document.getElementById('calendarScaleSlider');
if (scaleSlider) {
  scaleSlider.addEventListener('input', function() {
    document.documentElement.style.setProperty('--calendar-hour-height', this.value + 'px');
    renderWeekView();
  });
}

// --- Recurring Event UI ---
// Add recurring field to event form
const eventFormRecurring = document.createElement('select');
eventFormRecurring.id = 'eventRecurring';
eventFormRecurring.name = 'eventRecurring';
eventFormRecurring.innerHTML = '<option value="">No Repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>';
const recurringGroup = document.createElement('div');
recurringGroup.className = 'form-group';
recurringGroup.innerHTML = '<label for="eventRecurring">Repeat</label>';
recurringGroup.appendChild(eventFormRecurring);
const eventNotesGroup = eventForm.querySelector('textarea').parentElement;
eventNotesGroup.parentElement.insertBefore(recurringGroup, eventNotesGroup);

// Save recurring value
const origEventFormOnSubmit = eventForm.onsubmit;
eventForm.onsubmit = function(e) {
  e.preventDefault();
  const id = eventForm.dataset.editId ? parseInt(eventForm.dataset.editId, 10) : Date.now();
  const color = eventForm.eventType.value === 'Meeting' ? 'event-blue' : eventForm.eventType.value === 'Task' ? 'event-purple' : 'event-green';
  const newEvent = {
    id,
    title: eventForm.eventTitle.value,
    type: eventForm.eventType.value,
    client: eventForm.eventClient.value,
    date: eventForm.eventDate.value,
    start: eventForm.eventStart.value,
    end: eventForm.eventEnd.value,
    notes: eventForm.eventNotes.value,
    color,
    recurring: eventFormRecurring.value
  };
  if (eventForm.dataset.editId) {
    events = events.map(ev => ev.id === id ? newEvent : ev);
  } else {
    events.push(newEvent);
  }
  saveEvents();
  setCalendarView(calendarView);
  eventFormModal.style.display = 'none';
};

// --- Initial Render ---
setCalendarView('week'); 
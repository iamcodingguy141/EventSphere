import {dateKey,publicEvents,upcomingEvents} from './storage.js';
import {$,el,formatDate,formatTime,icon,linkEvent,main,pageHead,safe} from './ui.js';

export function renderCalendar() {
  const today=new Date();
  const dates=publicEvents();
  const upcoming=upcomingEvents();
  let month=new Date(today.getFullYear(),today.getMonth(),1);
  let selection='';
  main.innerHTML = pageHead('Event calendar','See what’s happening and plan your next experience.') + `
    <section class="container calendar-section"><div class="calendar-card panel">
    <div class="calendar-heading"><h2 id="month-title" aria-live="polite"></h2><div>
    <button class="icon-button" id="previous-month" aria-label="Previous month">${icon('left')}</button>
    <button class="button secondary small" id="today">Today</button>
    <button class="icon-button" id="next-month" aria-label="Next month">${icon('chevron')}</button></div></div>
    <div class="weekdays" aria-hidden="true">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>`<span>${day}</span>`).join('')}</div>
    <div class="calendar-grid" id="dates"></div></div>
    <aside class="panel upcoming-list"><h2 id="calendar-list-title"></h2><div id="calendar-list"></div></aside></section>`;
  const grid=el('#dates');
  function renderList() {
    const list=selection?dates.filter(event=>event.date===selection):upcoming.slice(0,6);
    el('#calendar-list-title').textContent=selection?formatDate(selection,{weekday:'long',day:'numeric',month:'long'}):'Upcoming events';
    el('#calendar-list').innerHTML=list.map(event=>`<a class="calendar-event" href="${linkEvent(event.id)}"><span class="icon-box">${icon('calendar',18)}</span><span><strong>${safe(event.title)}</strong><small>${formatDate(event.date,{day:'numeric',month:'short'})} · ${formatTime(event.start)} · ${safe(event.city)}</small></span>${icon('chevron',16)}</a>`).join('') || '<p class="muted">No events scheduled for this date.</p>';
  }
  function paint() {
    const year=month.getFullYear();
    const monthIndex=month.getMonth();
    const blanks=(month.getDay()+6)%7;
    const days=new Date(year,monthIndex+1,0).getDate();
    el('#month-title').textContent=new Intl.DateTimeFormat('en-IN',{month:'long',year:'numeric'}).format(month);
    const counts=dates.reduce((map,event)=>map.set(event.date,(map.get(event.date)??0)+1),new Map());
    const makeCell=(_,index)=>{
      const day=index-blanks+1;
      if (day<1 || day>days) return '<span class="blank-day" aria-hidden="true"></span>';
      const value=dateKey(new Date(year,monthIndex,day));
      const count=counts.get(value)??0;
      return `<button class="calendar-day ${value===dateKey(today)?'calendar-today':''}" data-date="${value}" aria-pressed="${value===selection}" ${value===dateKey(today)?'aria-current="date"':''} aria-label="${formatDate(value)}, ${count} ${count===1?'event':'events'}"><span>${day}</span>${count?`<small>${count} <span>${count===1?'event':'events'}</span></small>`:''}</button>`;
    };
    grid.innerHTML=Array.from({length:Math.ceil((blanks+days)/7)*7},makeCell).join('');
    renderList();
  }
  function shift(amount) {
    month=new Date(month.getFullYear(),month.getMonth()+amount,1);
    selection='';
    paint();
  }
  $('#previous-month').on('click',()=>shift(-1));
  $('#next-month').on('click',()=>shift(1));
  $('#today').on('click',()=>{ month=new Date(today.getFullYear(),today.getMonth(),1); selection=dateKey(today); paint(); });
  $(grid).on('click','button[data-date]',function () {
    const button=this;
    grid.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed','false');
    selection=button.dataset.date;
    button.setAttribute('aria-pressed','true');
    renderList();
  });
  paint();
}

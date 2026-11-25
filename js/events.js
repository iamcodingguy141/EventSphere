import {categories,dateKey,hasStarted,publicEvents} from './storage.js';
import {$,all,bindImageFallback,el,empty,eventCard,icon,main,options,pageHead,params,safe} from './ui.js';

export function renderEvents() {
  const selectedCategory=categories.includes(params.get('category'))?params.get('category'):'';
  main.innerHTML = pageHead('Explore events','Find concerts, workshops, meetups and more across Gujarat.') + `
    <section class="container explore">
      <form id="filters" class="filter-panel">
        <div class="filter-top">
          <label>Search events<div class="input-icon">${icon('search',19)}<input name="q" value="${safe(params.get('q'))}" placeholder="Event, organizer or keyword"></div></label>
          <label>Location<div class="input-icon">${icon('pin',19)}<input name="city" placeholder="City or venue"></div></label>
          <button class="button secondary" type="reset">Reset filters</button>
        </div>
        <div class="filter-bottom">
          <label>Category<select name="category"><option value="">All categories</option>${options(categories,selectedCategory)}</select></label>
          <label>Date<select name="date"><option value="upcoming">Upcoming</option><option value="today">Today</option><option value="week">Next 7 days</option><option value="month">Next 30 days</option><option value="past">Past events</option><option value="all">All dates</option></select></label>
          <label>Ticket price<select name="price"><option value="">Any price</option><option value="free">Free</option><option value="paid">Paid</option></select></label>
          <label>Sort by<select name="sort"><option value="soon">Date, earliest first</option><option value="later">Date, latest first</option><option value="low">Price, low to high</option><option value="high">Price, high to low</option></select></label>
        </div>
      </form>
      <div class="results-bar"><p id="result-count" aria-live="polite"></p><div class="view-buttons" aria-label="Event layout"><button class="icon-button" id="grid-view" aria-label="Grid view" aria-pressed="true">${icon('grid',18)}</button><button class="icon-button" id="list-view" aria-label="List view" aria-pressed="false">${icon('list',18)}</button></div></div>
      <div id="event-results" class="event-grid"></div>
    </section>`;
  const filters=el('#filters');
  const results=el('#event-results');
  let listView=false;
  function refresh() {
    const fields=Object.fromEntries(new FormData(filters));
    const query=fields.q.trim().toLowerCase();
    const city=fields.city.trim().toLowerCase();
    const today=dateKey();
    const rangeEnd=new Date();
    rangeEnd.setDate(rangeEnd.getDate() + (fields.date==='week'?6:29));
    const end=dateKey(rangeEnd);
    const events=publicEvents().filter(event=>{
      if (query && ![event.title,event.description,event.organizer,event.category,event.city,event.venue].some(value=>value.toLowerCase().includes(query))) return false;
      if (city && ![event.city,event.venue].some(value=>value.toLowerCase().includes(city))) return false;
      if (fields.category && event.category!==fields.category) return false;
      if (fields.price && (fields.price==='free')!==(event.price===0)) return false;
      if (fields.date==='all') return true;
      if (fields.date==='past') return hasStarted(event);
      if (hasStarted(event)) return false;
      if (fields.date==='today') return event.date===today;
      return fields.date==='upcoming' || event.date<=end;
    });
    if (fields.sort==='later') events.reverse();
    if (fields.sort==='low') events.sort((a,b)=>a.price-b.price);
    if (fields.sort==='high') events.sort((a,b)=>b.price-a.price);
    el('#result-count').textContent = events.length + (events.length===1?' event found':' events found');
    $(results).html(events.map(eventCard).join('') || empty('No matching events','Try another keyword, city or date range.')).toggleClass('event-list',listView);
    bindImageFallback();
  }
  $(filters).on('submit',event=>event.preventDefault()).on('input',refresh).on('reset',event=>{
    event.preventDefault();
    for (const input of all('input',filters)) input.value='';
    for (const select of all('select',filters)) select.selectedIndex=0;
    history.replaceState(null,'','events.html');
    refresh();
  });
  $('.view-buttons button').on('click',function () {
    listView=this.id==='list-view';
    el('#grid-view').setAttribute('aria-pressed',String(!listView));
    el('#list-view').setAttribute('aria-pressed',String(listView));
    $(results).toggleClass('event-list',listView);
  });
  refresh();
}

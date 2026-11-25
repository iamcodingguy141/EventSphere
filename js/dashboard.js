import {activeBookings,bookingEvent,sortedEvents} from './storage.js';
import {$,el,formatDate,icon,logOut,main,money,safe,statusBadge} from './ui.js';

const number = new Intl.NumberFormat('en-IN');
export const metrics = (items) => `<div class="metrics">${items.map(([value,label,symbol])=>`<article class="panel metric"><span class="icon-box">${icon(symbol,22)}</span><div><strong>${typeof value==='number'?number.format(value):value}</strong><span>${label}</span></div></article>`).join('')}</div>`;
export const panel = (title,detail,content) => `<section class="panel dashboard-panel"><div class="section-heading"><div><h2>${title}</h2>${detail?`<p>${detail}</p>`:''}</div></div>${content}</section>`;
export const noRows = (message) => `<p class="table-empty muted">${message}</p>`;
export const tally = (bookings) => activeBookings(bookings).reduce((total,booking)=>({tickets:total.tickets+booking.quantity,revenue:total.revenue+booking.total}),{tickets:0,revenue:0});

export function table(headers, rows, caption) {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="${caption}"><table><caption class="sr-only">${caption}</caption>
    <thead><tr>${headers.map(title=>`<th scope="col">${title}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="table-empty muted" data-table-empty${rows.length?' hidden':''}>No records found.</p>`;
}

export function searchable(inputSelector, tableScope, initialStatus='') {
  function filter() {
    const query=$(inputSelector).val().trim().toLowerCase();
    const status=$('[data-filter-status]').val()??'';
    const rows=$(tableScope+' tbody tr');
    const bookingIndex=Number($(tableScope).attr('data-status-col'));
    rows.each(function () {
      const state=Number.isNaN(bookingIndex)?'':$(this).children().eq(bookingIndex).text().trim();
      this.hidden=Boolean(query&&!this.textContent.toLowerCase().includes(query)) || Boolean(status&&state!==status);
    });
    $(tableScope+' [data-table-empty]').prop('hidden',Boolean(rows.filter(':not([hidden])').length));
  }
  $('[data-filter-status]').val(initialStatus);
  $(inputSelector).on('input',filter);
  $('[data-filter-status]').on('change',filter);
  filter();
}

export function listingsSearch(placeholder, statuses=[]) {
  return `<div class="table-tools"><label>Search<div class="input-icon">${icon('search',18)}<input id="table-search" placeholder="${placeholder}"></div></label>
    ${statuses.length?`<label>Status<select data-filter-status><option value="">Any status</option>${statuses.map(status=>`<option value="${status}">${status[0].toUpperCase()+status.slice(1)}</option>`).join('')}</select></label>`:''}</div>`;
}

export function bookingTable(bookings, events, max=Infinity) {
  const sorted=[...bookings].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,max);
  return table(['Booking ID','Attendee','Event','Tickets','Total','Status','Booked'],sorted.map(booking=>[
    `<span class="table-id">${safe(booking.id)}</span>`,safe(booking.attendee.name),safe(bookingEvent(booking,events).title),booking.quantity,
    money(booking.total),statusBadge(booking.status),formatDate(booking.createdAt,{day:'numeric',month:'short',year:'numeric'})
  ]),'Event bookings');
}

export function upcomingList(events) {
  return sortedEvents(events).slice(0,5).map(event=>`<div class="user-activity"><div><strong>${safe(event.title)}</strong><small>${formatDate(event.date)} · ${safe(event.city)}</small></div>${statusBadge(event.status)}</div>`).join('') || noRows('There are no upcoming events.');
}

export function monthlyStats(bookings) {
  const confirmed=activeBookings(bookings);
  const today=new Date();
  return Array.from({length:6},(_, index)=>{
    const month=new Date(today.getFullYear(),today.getMonth()-5+index,1);
    const records=confirmed.filter(booking=>{
      const created=new Date(booking.createdAt);
      return created.getFullYear()===month.getFullYear() && created.getMonth()===month.getMonth();
    });
    return {month:month.toLocaleDateString('en-IN',{month:'short'}),year:month.getFullYear(),...tally(records),bookings:records.length};
  });
}

export function chart(points,key,format=String) {
  const max=Math.max(1,...points.map(point=>point[key]));
  return `<div class="chart" aria-label="Monthly activity">${points.map(point=>{
    const value=point[key];
    return `<div class="chart-point" title="${point.month} ${point.year}: ${format(value)}"><span>${format(value)}</span><div class="bar-track"><div class="chart-bar" style="--bar-size:${value/max*100}%"></div></div><small>${point.month}</small></div>`;
  }).join('')}</div>`;
}

export function dashboardShell({role,user,tabs,action,render}) {
  const first=tabs[0][0];
  let active=tabs.some(([key])=>key===location.hash.slice(1))?location.hash.slice(1):first;
  main.innerHTML=`<div class="container workspace-dashboard">
    <aside class="dashboard-sidebar panel"><div class="workspace-name"><span class="icon-box">${icon(role==='Admin'?'grid':'business',21)}</span><div><strong>${role} workspace</strong><small>${safe(user.name)}</small></div></div>
      <nav aria-label="${role} dashboard navigation">${tabs.map(([key,label,symbol])=>`<button type="button" data-tab="${key}">${icon(symbol,19)} ${label}</button>`).join('')}
      ${role==='Organizer'?`<a href="create-event.html">${icon('plus',19)} Create event</a>`:''}
      <a href="profile.html">${icon('user',19)} Profile</a><button type="button" id="dashboard-logout">${icon('logout',19)} Log out</button></nav></aside>
    <section class="workspace-main"><div class="workspace-heading"><div><h1>${role} dashboard</h1><p>${role==='Admin'?'Review listings and monitor platform activity.':'Manage listings, bookings and ticket sales.'}</p></div>
    ${action??''}</div><div id="workspace-content"></div></section></div>`;
  const region=el('#workspace-content');
  function refresh() {
    $('[data-tab]').each(function () { $(this).attr('aria-current',this.dataset.tab===active?'page':'false'); });
    render(active,region,refresh);
  }
  $('[data-tab]').on('click',function () {
    active=this.dataset.tab;
    history.replaceState(null,'','#'+active);
    refresh();
  });
  $('#dashboard-logout').on('click',logOut);
  refresh();
}

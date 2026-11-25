import {getBookings,getCurrentUser,getEvents,getUsers,hasStarted,moderateEvent} from './storage.js';
import {$,confirmAction,formatDate,linkEvent,money,safe,statusBadge,toast} from './ui.js';
import {bookingTable,chart,dashboardShell,listingsSearch,metrics,monthlyStats,panel,searchable,table,tally,upcomingList} from './dashboard.js';

const tabs=[['overview','Overview','grid'],['events','Events','calendar'],['users','Users','users'],['organizers','Organizers','business'],['bookings','Bookings','ticket']];

export function renderAdmin() {
  dashboardShell({role:'Admin',user:getCurrentUser(),tabs,render});
  function render(view,region,refresh) {
    const users=getUsers();
    const events=getEvents();
    const bookings=getBookings();
    const attendees=users.filter(user=>user.role==='user');
    const organizers=users.filter(user=>user.role==='organizer');
    const active=events.filter(event=>event.status!=='deleted');
    const pending=active.filter(event=>event.status==='pending');
    const totals=tally(bookings);
    if (view==='events') {
      const rows=events.map(event=>[
        event.status==='approved'?`<a href="${linkEvent(event.id)}">${safe(event.title)}</a>`:safe(event.title),
        safe(event.organizer),formatDate(event.date),statusBadge(event.status),
        event.status==='deleted'?'—':`<div class="action-row">${event.status!=='approved'&&!hasStarted(event)?`<button class="button secondary small" data-moderate="approved" data-id="${safe(event.id)}">Approve</button>`:''}
        ${event.status!=='rejected'? `<button class="button secondary small" data-moderate="rejected" data-id="${safe(event.id)}">Reject</button>`:''}
        <button class="button text-danger small" data-moderate="deleted" data-id="${safe(event.id)}">Delete</button></div>`
      ]);
      region.innerHTML=panel('Manage events','Review listings and update their publication status.',listingsSearch('Event title or organizer',['pending','approved','rejected','deleted'])+
        `<div id="dash-table" data-status-col="3">${table(['Event','Organizer','Date','Status','Actions'],rows,'Manage events')}</div>`);
      searchable('#table-search','#dash-table');
      $('[data-moderate]').on('click',async function () {
        const status=this.dataset.moderate;
        const id=this.dataset.id;
        const prompt={
          approved:['Approve this event?','The event will become visible on the public website.','Approve event'],
          rejected:['Reject this event?','The listing will be hidden. Its organizer can edit and resubmit it.','Reject event'],
          deleted:['Delete this event?','The listing will be removed. Confirmed bookings for future dates will be cancelled.','Delete event']
        }[status];
        if (!await confirmAction(...prompt)) return;
        try { await moderateEvent(id,status); refresh(); toast('Event '+status+'.'); }
        catch(error) { toast(error.message,'error'); }
      });
      return;
    }
    if (view==='users'||view==='organizers') {
      const list=view==='users'?users:organizers;
      const rows=list.map(user=>[safe(user.name),safe(user.email),safe(user.phone || '—'),safe(user.role)]);
      region.innerHTML=panel(view==='users'?'Registered users':'Organizers','View account names, contact details and demo roles.',listingsSearch('Name, email or role')+`<div id="dash-table">${table(['Name','Email','Phone','Role'],rows,'Platform accounts')}</div>`);
      searchable('#table-search','#dash-table');
      return;
    }
    if (view==='bookings') {
      region.innerHTML=panel('All bookings','Search attendee and ticket records across the platform.',listingsSearch('Booking ID, attendee or event',['confirmed','cancelled'])+`<div id="dash-table" data-status-col="5">${bookingTable(bookings,events)}</div>`);
      searchable('#table-search','#dash-table');
      return;
    }
    const monthly=monthlyStats(bookings);
    region.innerHTML=metrics([[attendees.length,'Registered users','users'],[organizers.length,'Organizers','business'],[active.length,'Total events','calendar'],[bookings.length,'All bookings','ticket'],[money(totals.revenue),'Simulated revenue','rupee']])+
      `<div class="dashboard-columns">${panel('Monthly revenue','Confirmed bookings · simulated INR',chart(monthly,'revenue',money))}${panel('Booking trends','Confirmed bookings per month',chart(monthly,'bookings',value=>String(value)))}</div>
      <div class="dashboard-columns dashboard-overview">${panel('Recent bookings','Latest ticket activity across all events.',bookingTable(bookings,events,4))}
      ${panel('Awaiting approval',pending.length+' pending '+(pending.length===1?'event':'events'),upcomingList(pending)+'<button class="button secondary small" type="button" id="review-events">Review events</button>')}</div>`;
    $('#review-events').on('click',()=>{$('[data-tab="events"]').trigger('click'); $('[data-filter-status]').val('pending').trigger('change');});
  }
}

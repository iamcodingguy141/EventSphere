import {getBookings,getCurrentUser,getEvents,hasStarted,removeOwnEvent,soldSeats} from './storage.js';
import {$,confirmAction,formatDate,icon,linkEvent,money,safe,statusBadge,toast} from './ui.js';
import {bookingTable,chart,dashboardShell,listingsSearch,metrics,monthlyStats,panel,searchable,table,tally,upcomingList} from './dashboard.js';

const tabs=[['overview','Overview','grid'],['events','My events','calendar'],['bookings','Bookings','ticket'],['analytics','Analytics','chart']];

export function renderOrganizer() {
  const user=getCurrentUser();
  dashboardShell({role:'Organizer',user,tabs,action:`<a href="create-event.html" class="button primary">${icon('plus',17)} Create event</a>`,render});
  function render(view,region,refresh) {
    const events=getEvents().filter(event=>event.organizerId===user.id);
    const ids=new Set(events.map(event=>event.id));
    const bookings=getBookings().filter(booking=>ids.has(booking.eventId));
    const visible=events.filter(event=>event.status!=='deleted');
    const upcoming=visible.filter(event=>event.status==='approved'&&!hasStarted(event));
    const totals=tally(bookings);
    const monthly=monthlyStats(bookings);
    if (view==='events') {
      const rows=visible.map(event=>[
        event.status==='approved'?`<a href="${linkEvent(event.id)}">${safe(event.title)}</a>`:safe(event.title),
        formatDate(event.date),safe(event.city),soldSeats(event.id,bookings)+' / '+event.capacity,statusBadge(event.status),
        `<div class="action-row">${!hasStarted(event)?`<a class="button secondary small" href="create-event.html?id=${encodeURIComponent(event.id)}">Edit</a>`:''}<button class="button text-danger small" type="button" data-remove="${safe(event.id)}">Delete</button></div>`
      ]);
      const content=listingsSearch('Event title or city',['approved','pending','rejected'])+`<div id="dash-table" data-status-col="4">${table(['Event','Date','City','Seats sold','Status','Actions'],rows,'Organizer events')}</div>`;
      region.innerHTML=panel('My events','Manage the listings owned by this organizer account.',content);
      searchable('#table-search','#dash-table');
      $('[data-remove]').on('click',async function () {
        const eventId=this.dataset.remove;
        if (!await confirmAction('Delete this event?','The listing will be removed. Confirmed bookings for future dates will be cancelled.','Delete event')) return;
        try { await removeOwnEvent(eventId); refresh(); toast('Event deleted.'); }
        catch(error) { toast(error.message,'error'); }
      });
      return;
    }
    if (view==='bookings') {
      region.innerHTML=panel('Event bookings','Search bookings made for your events.',listingsSearch('Booking ID, attendee or event',['confirmed','cancelled'])+`<div id="dash-table" data-status-col="5">${bookingTable(bookings,events)}</div>`);
      searchable('#table-search','#dash-table');
      return;
    }
    const analytics = `<div class="dashboard-columns">${panel('Monthly revenue','Confirmed bookings · simulated INR',chart(monthly,'revenue',money))}${panel('Ticket sales','Confirmed tickets per month',chart(monthly,'tickets',value=>String(value)))}</div>`;
    if (view==='analytics') {
      const rows=visible.map(event=>[safe(event.title),statusBadge(event.status),bookings.filter(booking=>booking.eventId===event.id&&booking.status==='confirmed').length,soldSeats(event.id,bookings),money(tally(bookings.filter(booking=>booking.eventId===event.id)).revenue)]);
      region.innerHTML=analytics+panel('Event performance','Confirmed registrations by event.',table(['Event','Status','Registrations','Tickets','Revenue'],rows,'Event performance'));
      return;
    }
    region.innerHTML=metrics([[visible.length,'Total events','calendar'],[bookings.length,'All bookings','users'],[totals.tickets,'Tickets sold','ticket'],[money(totals.revenue),'Simulated revenue','rupee']])+analytics+
      `<div class="dashboard-columns dashboard-overview">${panel('Recent bookings','Latest ticket activity for your events.',bookingTable(bookings,events,4))}${panel('Upcoming events','Approved events still to come.',upcomingList(upcoming))}</div>`;
  }
}

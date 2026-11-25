import {availableSeats,canBook,getEvent,upcomingEvents} from './storage.js';
import {breadcrumb,empty,eventCard,eventImage,formatDate,formatTime,icon,linkBooking,main,money,params,safe} from './ui.js';

export function renderDetails() {
  const event=getEvent(params.get('id'));
  if (!event || event.status!=='approved') {
    main.innerHTML = '<div class="container padded">' + empty('Event unavailable','This event may be awaiting approval or have been removed.','events.html','Explore events') + '</div>';
    return;
  }
  document.title=event.title+' | EventSphere';
  const available=availableSeats(event);
  const similar=upcomingEvents().filter(item=>item.id!==event.id).sort((a,b)=>Number(b.category===event.category)-Number(a.category===event.category)).slice(0,3);
  main.innerHTML = `<div class="container details-page">${breadcrumb(event.title)}
    <div class="detail-media">${eventImage(event,true)}<span class="category-chip">${safe(event.category)}</span></div>
    <div class="detail-grid">
    <div><div class="detail-title"><h1>${safe(event.title)}</h1><p>Organized by <strong>${safe(event.organizer)}</strong></p></div>
    <div class="detail-meta">
      <div><span class="icon-box">${icon('calendar')}</span><span><strong>${formatDate(event.date)}</strong><small>${formatTime(event.start)} to ${formatTime(event.end)}</small></span></div>
      <div><span class="icon-box">${icon('pin')}</span><span><strong>${safe(event.venue)}</strong><small>${safe(event.city)}</small></span></div>
    </div>
    <section class="detail-section"><h2>About this event</h2><p class="preserve-lines">${safe(event.description)}</p></section>
    <section class="detail-section"><h2>Event schedule</h2><ol class="schedule">${event.schedule.map(item=>`<li><time>${formatTime(item.time)}</time><span>${safe(item.title)}</span></li>`).join('')}</ol></section>
    <section class="detail-section"><h2>Rules and guidelines</h2><ul class="guidelines"><li>Carry your printed or digital EventSphere ticket for check-in.</li><li>Plan to arrive before the published start time.</li><li>Bookings can be cancelled before the event starts from My Bookings.</li></ul></section></div>
    <aside class="booking-aside panel"><span class="icon-box">${icon('ticket',23)}</span><h2>Tickets</h2>
    <p class="detail-price">${event.price?money(event.price):'Free'}${event.price?'<small> / ticket</small>':''}</p>
    <dl><div><dt>Total capacity</dt><dd>${event.capacity}</dd></div><div><dt>Seats available</dt><dd>${available}</dd></div></dl>
    ${canBook(event)&&available?`<a class="button primary full" href="${linkBooking(event.id)}">Book tickets ${icon('arrow',18)}</a>`:`<p class="availability-note">${canBook(event)?'This event is sold out.':'Booking closed. The event has already started.'}</p>`}</aside></div>
    ${similar.length?`<section class="related-events"><div class="section-heading"><h2>Similar events</h2><a class="button secondary" href="events.html">Explore events ${icon('arrow',16)}</a></div><div class="event-grid">${similar.map(eventCard).join('')}</div></section>`:''}
    </div>`;
}

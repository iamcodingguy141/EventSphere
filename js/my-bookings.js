import {activeBookings,bookingEvent,canCancel,cancelBooking,getBookings,getCurrentUser,getEvents} from './storage.js';
import {$,confirmAction,dialog,empty,eventImage,formatDate,formatTime,icon,main,money,pageHead,params,safe,statusBadge,toast} from './ui.js';

const ticketLink = (booking) => 'ticket.html?id='+encodeURIComponent(booking.id);
const ownBookings = () => getBookings().filter(booking=>booking.userId===getCurrentUser().id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));

function bookingFacts(booking,event) {
  return `<dl class="ticket-facts">
    <div><dt>Customer</dt><dd>${safe(booking.attendee.name)}</dd></div>
    <div><dt>Date and time</dt><dd>${formatDate(event.date)} · ${formatTime(event.start)}</dd></div>
    <div><dt>Venue</dt><dd>${safe(event.venue)}, ${safe(event.city)}</dd></div>
    <div><dt>Tickets</dt><dd>${booking.quantity}</dd></div>
    <div><dt>Total amount</dt><dd>${money(booking.total)}</dd></div>
    <div><dt>Booking status</dt><dd>${statusBadge(booking.status)}</dd></div></dl>`;
}

function bookingItem(booking, events) {
  const event=bookingEvent(booking,events);
  return `<article class="panel booking-item" data-status="${booking.status}">
    <div class="booking-thumbnail">${eventImage(event)}</div><div class="booking-info">
    <div class="booking-top"><h2>${safe(event.title)}</h2>${statusBadge(booking.status)}</div>
    <p class="meta-line">${icon('calendar',17)} ${formatDate(event.date)} · ${formatTime(event.start)}</p>
    <p class="booking-ref">Booking ID <span>${safe(booking.id)}</span></p>
    <p class="booking-totals">${booking.quantity} ${booking.quantity===1?'ticket':'tickets'} · <strong>${money(booking.total)}</strong></p>
    <div class="action-row"><button class="button secondary small" data-view="${safe(booking.id)}">View booking</button>
    ${booking.status==='confirmed'?`<a class="button secondary small" href="${ticketLink(booking)}">${icon('print',16)} Print ticket</a>`:''}
    ${canCancel(booking,event)?`<button class="button text-danger small" data-cancel="${safe(booking.id)}">Cancel booking</button>`:''}</div></div></article>`;
}

export function renderMyBookings() {
  const bookings=ownBookings();
  const events=getEvents();
  main.innerHTML=pageHead('My bookings','Find your tickets, view booking details and manage cancellations.')+`
    <section class="container bookings-page"><label class="inline-control">Booking history<select id="booking-filter">
    <option value="">All bookings</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></label>
    <div class="booking-list">${bookings.map(booking=>bookingItem(booking,events)).join('') || empty('No bookings yet','Find an event you’d like to attend and book your first ticket.','events.html','Explore events')}
    <div class="panel empty small-empty" id="no-bookings-match" hidden><h2>No bookings match this status</h2></div></div></section>`;
  $('#booking-filter').on('change',function () {
    const value=this.value;
    const items=$('.booking-item').each(function () { this.hidden=Boolean(value&&this.dataset.status!==value); });
    $('#no-bookings-match').prop('hidden',!items.length||Boolean(items.filter(':not([hidden])').length));
  });
  $('[data-view]').on('click',function () {
    const booking=bookings.find(item=>item.id===this.dataset.view);
    const event=bookingEvent(booking,events);
    dialog(`<h2>${safe(event.title)}</h2><p class="booking-ref">Booking ID <span>${safe(booking.id)}</span></p>${bookingFacts(booking,event)}`,'Booking details');
  });
  $('[data-cancel]').on('click',async function () {
    const id=this.dataset.cancel;
    if (!await confirmAction('Cancel this booking?','The tickets will be returned to the event’s available seats.','Cancel booking')) return;
    try {
      await cancelBooking(id);
      renderMyBookings();
      toast('Booking cancelled. Seats have been released.');
    } catch(error) { toast(error.message,'error'); }
  });
}

export function renderTicket() {
  const booking=ownBookings().find(item=>item.id===params.get('id'));
  if (!booking) {
    main.innerHTML='<div class="container padded">'+empty('Ticket unavailable','This ticket could not be found for your account.','my-bookings.html','My bookings')+'</div>';
    return;
  }
  const event=bookingEvent(booking);
  const confirmed=booking.status==='confirmed';
  main.innerHTML=`<section class="container ticket-page">
    <div class="ticket-controls">
    <div><h1>${params.has('new')&&confirmed?'Booking confirmed':'Digital ticket'}</h1><p>${confirmed?'Your ticket is ready to view or print.':'This booking has been cancelled.'}</p></div>
    <div class="action-row"><a class="button secondary" href="my-bookings.html">My bookings</a>${confirmed?`<button class="button primary" id="print-ticket">${icon('print',19)} Print ticket</button>`:''}</div></div>
    <article class="digital-ticket" id="print-area">
    <header><div class="brand"><img src="images/mark.svg" alt="" width="39" height="39"><span>EventSphere</span></div><span>Event admission ticket</span></header>
    <div class="ticket-content"><h2>${safe(event.title)}</h2>${bookingFacts(booking,event)}</div>
    <footer><p>Booking ID <strong>${safe(booking.id)}</strong></p><p>Ticket ID <strong>${safe(booking.ticketId)}</strong></p></footer></article></section>`;
  $('#print-ticket').on('click',()=>window.print());
}

export function renderUserDashboard() {
  const bookings=ownBookings();
  const confirmed=activeBookings(bookings);
  const user=getCurrentUser();
  main.innerHTML=pageHead('Welcome, '+user.name,'Manage your EventSphere account and tickets.')+`
    <section class="container attendee-dashboard padded"><div class="metrics">
    ${[[bookings.length,'All bookings','calendar'],[confirmed.length,'Confirmed bookings','ticket'],[confirmed.reduce((sum,item)=>sum+item.quantity,0),'Active tickets','check']].map(([value,label,symbol])=>`<article class="panel metric"><span class="icon-box">${icon(symbol,20)}</span><div><strong>${value}</strong><span>${label}</span></div></article>`).join('')}</div>
    <div class="panel dashboard-panel"><div class="section-heading"><div><h2>Recent bookings</h2><p>${bookings.length?'Review your latest EventSphere activity.':'Your latest bookings will appear here.'}</p></div><a class="button secondary" href="my-bookings.html">My bookings ${icon('arrow',17)}</a></div>
    ${bookings.slice(0,4).map(item=>`<div class="user-activity"><div><strong>${safe(bookingEvent(item).title)}</strong><small>${formatDate(item.createdAt)} · ${item.quantity} ${item.quantity===1?'ticket':'tickets'}</small></div>${statusBadge(item.status)}</div>`).join('')}
    <div class="action-row dashboard-actions"><a class="button primary" href="events.html">Find events</a><a class="button secondary" href="profile.html">Edit profile</a></div></div></section>`;
}

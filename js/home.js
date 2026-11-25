import {activeBookings,categories,getBookings,getCurrentUser,soldSeats,upcomingEvents} from './storage.js';
import {categoryIcon,dashboard,el,eventCard,eventImage,icon,initials,main,safe} from './ui.js';

const sectionHeader = (title,detail,link='',label='') => `<div class="section-heading"><div><h2>${title}</h2><p>${detail}</p></div>${link?`<a class="button secondary" href="${link}">${label} ${icon('arrow',17)}</a>`:''}</div>`;

function developers() {
  return `<section class="container section-block" id="developers">${sectionHeader('Meet the developers','Developed as part of a college Project-Based Learning (PBL) project.')}
    <div class="developer-grid">${['Gauri Patel','Maredla Veda Varshitha '].map(name=>`<article class="developer-card"><span class="developer-avatar">${initials(name)}</span><h3>${name}</h3><p>Project developer</p></article>`).join('')}</div></section>`;
}

const workflow = [
  ['search','Find an event','Explore events by category, date or city.'],
  ['ticket','Book your tickets','Choose your ticket quantity and confirm your booking.'],
  ['calendar','Plan your visit','View your booking and print your ticket.']
];
const reasons = [
  ['pin','Discover events close to home','Find experiences across Vadodara and nearby cities.'],
  ['ticket','Keep tickets in one place','Open, print or cancel eligible bookings from your account.'],
  ['chart','Tools for event organizers','Manage event listings and follow registrations and ticket sales.']
];
const how = (items) => `<div class="info-grid">${items.map(([symbol,title,detail])=>`<article class="info-card"><span class="icon-box">${icon(symbol,24)}</span><h3>${title}</h3><p>${detail}</p></article>`).join('')}</div>`;
const testimonials = [
  ['Aarav S.','Attendee','I found a workshop close to home and printed the ticket before leaving.'],
  ['Meera J.','Attendee','The calendar made it easy to see which events fit my weekend.'],
  ['EventSphere Studio','Organizer','I could see registrations and ticket sales for each of my events in one place.']
];

export function renderHome() {
  const upcoming = upcomingEvents();
  const featured = upcoming.filter(event=>event.featured).slice(0,3);
  const next = upcoming.filter(event=>!featured.includes(event)).slice(0,3);
  const bookings = activeBookings(getBookings());
  const popular = [...upcoming].filter(event=>soldSeats(event.id,bookings)>0)
    .sort((a,b)=>soldSeats(b.id,bookings)-soldSeats(a.id,bookings)).slice(0,3);
  const stats = [[upcoming.length,'Upcoming events'],[categories.length,'Event categories'],[new Set(upcoming.map(event=>event.city)).size,'Cities'],[bookings.reduce((sum,booking)=>sum+booking.quantity,0),'Tickets booked']];
  main.innerHTML = `<section class="container hero-wrap"><div class="hero">
    <div class="hero-media">${eventImage({image:'images/hero.jpg'},true)}</div>
    <div class="hero-content"><h1>Discover Events.<br><em>Create Memories.</em></h1>
    <p>Find amazing events, connect with people, and experience unforgettable moments. Your next great experience starts here.</p>
    <form class="hero-search" action="events.html"><label class="sr-only" for="home-search">Search events</label>${icon('search',23)}<input id="home-search" name="q" placeholder="Search events, artists or places"><button class="button primary">Search</button></form>
    <div class="hero-actions"><a class="button light" href="events.html">Explore events ${icon('arrow',17)}</a><a class="button ghost" href="create-event.html">${icon('plus',17)} Create event</a></div>
    </div></div></section>
    <section class="container section-block">${sectionHeader('Featured events','A few experiences worth making time for.','events.html','View all events')}
    <div class="event-grid">${featured.map(eventCard).join('') || '<p class="muted">Featured events will appear here as they become available.</p>'}</div></section>
    <section class="soft-section" id="categories"><div class="container section-block">${sectionHeader('Popular categories','Find something you’d love to do.')}
    <div class="category-grid">${categories.map((category,index)=>`<a class="category-tile category-${index}" href="events.html?category=${encodeURIComponent(category)}"><span class="icon-box">${icon(categoryIcon(category),24)}</span><strong>${safe(category)}</strong></a>`).join('')}</div></div></section>
    <section class="container section-block">${sectionHeader('Coming up next','Make a plan for the weeks ahead.','calendar.html','View calendar')}
    <div class="event-grid">${next.map(eventCard).join('') || '<p class="muted">More upcoming events will appear here after approval.</p>'}</div></section>
    ${popular.length?`<section class="container section-block why-block">${sectionHeader('Popular events','Upcoming events with the most confirmed tickets.')}
    <div class="event-grid">${popular.map(eventCard).join('')}</div></section>`:''}
    <section class="soft-section"><div class="container section-block">${sectionHeader('How EventSphere works','From finding an event to getting through the door.')}${how(workflow)}</div></section>
    <section class="container section-block" aria-label="Platform statistics"><div class="stats-band">${stats.map(([value,label])=>`<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div></section>
    <section class="container section-block why-block">${sectionHeader('Why choose EventSphere?','One place to discover, attend and organize events.')}${how(reasons)}</section>
    <section class="soft-section"><div class="container section-block">${sectionHeader('Testimonials','Example attendee and organizer feedback for the PBL demonstration.')}
    <div class="info-grid">${testimonials.map(([name,role,quote])=>`<figure class="quote-card"><blockquote>“${quote}”</blockquote><figcaption><span class="avatar">${initials(name)}</span><span><strong>${name}</strong><small>${role}</small></span></figcaption></figure>`).join('')}</div></div></section>
    ${developers()}`;
}

export function renderAbout() {
  main.innerHTML = `<section class="container hero-wrap"><div class="about-hero"><img src="images/mark.svg" alt="" width="66" height="66"><h1>About EventSphere</h1><p>Find your next experience and bring people together through events.</p><a class="button light" href="events.html">Explore events ${icon('arrow',17)}</a></div></section>
    <section class="container section-block"><div class="about-grid"><article class="info-card"><span class="icon-box">${icon('calendar',24)}</span><h2>Project objective</h2><p>EventSphere brings event discovery, ticket booking, organizer tools and administrator approval into a single web application.</p></article>
    <article class="info-card"><span class="icon-box">${icon('users',24)}</span><h2>Our mission</h2><p>Make local events easier to find and give organizers a practical way to manage listings, registrations and attendance.</p></article></div></section>
    <section class="soft-section"><div class="container section-block">${sectionHeader('How the platform works','Attendees book approved events, organizers manage their listings, and administrators review submissions.')}${how(workflow)}</div></section>
    <section class="container section-block">${sectionHeader('Technologies used','HTML5 | CSS3 | JavaScript | jQuery | JSON')}<div class="about-grid"><article class="info-card"><h3>Browser-based storage</h3><p>JSON provides the initial records. LocalStorage keeps changes for this browser and site address.</p></article><article class="info-card"><h3>PBL demonstration</h3><p>Use the demo accounts to try all three roles. Ticket payments are simulated.</p><a class="card-link" href="${getCurrentUser()?dashboard(getCurrentUser().role):'login.html'}">Open ${getCurrentUser()?'dashboard':'demo login'} ${icon('arrow',16)}</a></article></div></section>
    ${developers()}`;
}

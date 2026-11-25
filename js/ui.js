import './vendor/jquery-3.7.1.min.js';
import {availableSeats, canBook, categories, getCurrentUser, logoutUser} from './storage.js';

export const $ = window.jQuery;
export const main = document.querySelector('#main');
export const params = new URLSearchParams(location.search);
export const el = (selector, context = document) => context.querySelector(selector);
export const all = (selector, context = document) => [...context.querySelectorAll(selector)];
export const safe = (value='') => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export const money = (value) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2,minimumFractionDigits:Number.isInteger(value)?0:2}).format(value);
export const formatDate = (date, options = {weekday:'short',day:'numeric',month:'short',year:'numeric'}) => new Intl.DateTimeFormat('en-IN',options).format(new Date(date.length === 10 ? date + 'T12:00' : date));
export const formatTime = (time) => new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit',hour12:true}).format(new Date('2000-01-01T' + time));
export const linkEvent = (id) => 'event-details.html?id=' + encodeURIComponent(id);
export const linkBooking = (id) => 'booking.html?id=' + encodeURIComponent(id);
export const dashboard = (role) => ({admin:'admin-dashboard.html',organizer:'organizer-dashboard.html',user:'user-dashboard.html'}[role] ?? 'login.html');
export const initials = (name) => name.trim().split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase();

const drawing = {
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>', chevron:'<path d="m9 18 6-6-6-6"/>', left:'<path d="m15 18-6-6 6-6"/>',
 search:'<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>', calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4m8-4v4M3 10h18"/>',
 pin:'<path d="M20 10c0 5-8 10-8 10S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 ticket:'<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7Zm11 0v2m0 2v2m0 2v2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>',
 tech:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4m-4-11 2 2m6-2-2 2"/>',
 music:'<path d="M9 19V6l11-3v13"/><ellipse cx="6" cy="19" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
 education:'<path d="m2 9 10-5 10 5-10 5-10-5Zm4 2v6c4 3 8 3 12 0v-6m4-2v6"/>',
 sports:'<path d="M8 4h8v6a4 4 0 0 1-8 0V4ZM8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v5m-4 1h8"/>',
 business:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12c6 3 12 3 18 0m-10 2h2"/>',
 art:'<path d="M21 11a9 9 0 1 0-9 10h1a2 2 0 0 0 1-4 2 2 0 0 1 1-3h3a3 3 0 0 0 3-3Z"/><path d="M7 10h.01M10 7h.01m5 1h.01M7 14h.01"/>',
 workshop:'<path d="m15 5 4 4M4 20l5-1 11-11a2.8 2.8 0 0 0-4-4L5 15l-1 5Z"/>',
 spark:'<path d="M12 2c0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10 6 0 10-4 10-10Zm7 0v4m-2-2h4"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 plus:'<path d="M12 5v14m-7-7h14"/>', check:'<path d="m5 12 4 4L19 6"/>',
 chart:'<path d="M3 3v18h18M8 16v-4m5 4V8m5 8V5"/>',
 rupee:'<path d="M6 4h12M6 8h12M8 4a4 4 0 0 1 0 8H6l9 8"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="2.5"/>',
 logout:'<path d="M10 4H4v16h6m4-12 4 4-4 4m-6-4h12"/>',
 print:'<path d="M7 7V3h10v4m-10 9H4V8h16v8h-3m-10-3h10v8H7zM16 10h1"/>'
};
export const icon = (name,size=20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing[name] ?? drawing.spark}</svg>`;
export const categoryIcon = (category) => ['tech','music','education','sports','business','art','workshop','spark'][categories.indexOf(category)] ?? 'spark';
export const statusBadge = (status) => `<span class="status status-${safe(status)}">${safe(status)}</span>`;
export const options = (values, selected) => values.map(value=>`<option${value===selected?' selected':''}>${safe(value)}</option>`).join('');
export const breadcrumb = (last,previous='Explore events',href='events.html') => `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${href}">${safe(previous)}</a>${icon('chevron',14)}<span>${safe(last)}</span></nav>`;
export const empty = (title, detail, href='', label='') => `<div class="empty"><span class="icon-box">${icon('search',25)}</span><h2>${safe(title)}</h2><p>${safe(detail)}</p>${href?`<a class="button primary" href="${href}">${safe(label)}</a>`:''}</div>`;
export const pageHead = (title, detail) => `<section class="page-intro"><div class="container"><h1>${safe(title)}</h1><p>${safe(detail)}</p></div></section>`;

export function checkedImage(value) {
  if (!value) return '';
  try {
    const url = new URL(value, location.href);
    return ['https:','http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function eventImage(event, highPriority=false) {
  const filename = event.image?.match(/^images\/([a-z]+)\.jpg$/)?.[1];
  const stock = filename && photoSources[filename];
  const url = bundledPhotos.has(filename) ? event.image : stock
    ? 'https://images.unsplash.com/photo-'+stock+'?auto=format&fit=crop&w=900&q=82'
    : checkedImage(event.image) || 'images/event-fallback.svg';
  return `<img class="event-image" src="${safe(url)}" alt="" ${highPriority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
}

export function bindImageFallback() {
  $('img.event-image').off('error.eventsphere').on('error.eventsphere',useFallback).each(function () {
    if (this.complete && !this.naturalWidth) useFallback.call(this);
  });
}
function useFallback() {
  if (!this.src.endsWith('event-fallback.svg')) this.src = 'images/event-fallback.svg';
}
const photoSources = {"tech":"1540575467063-178a50c2df87","music":"1501386761578-eac5c94b800a","photo":"1452780212940-6f5c0d14d848","business":"1556761175-b413da4baf72","culture":"1514525253161-7a46d19cd819","conference":"1505373877841-8d25f7d46678","robotics":"1485827404703-89b55fcc595e","sports":"1461896836934-ffe607ba8211","art":"1531058020387-3be344556be6","education":"1524178232363-1fb2b075b655","coding":"1515879218367-8466d910aaa4","workshop":"1552664730-d307ca884978","acoustic":"1493225457124-a3eb161ffa5f","hero":"1470229538611-16ba8c7ffbd7"};
const bundledPhotos = new Set(['hero','music','acoustic','workshop']);

export function eventCard(event) {
  const remaining = availableSeats(event);
  return `<article class="event-card"><a class="card-media" href="${linkEvent(event.id)}" aria-label="View ${safe(event.title)}">
    ${eventImage(event)}<span class="category-chip">${safe(event.category)}</span></a>
    <div class="card-body"><p class="card-date">${icon('calendar',16)} ${formatDate(event.date,{weekday:'short',day:'numeric',month:'short'})} · ${formatTime(event.start)}</p>
    <h3><a href="${linkEvent(event.id)}">${safe(event.title)}</a></h3>
    <p class="card-place">${icon('pin',16)} <span>${safe(event.venue)}, ${safe(event.city)}</span></p>
    <p class="card-organizer">By ${safe(event.organizer)}</p>
    <div class="card-footer"><div><strong>${event.price ? money(event.price) : 'Free'}</strong><small>${remaining ? remaining + ' seats available' : 'Sold out'}</small></div>
    <div class="card-actions"><a class="card-link" href="${linkEvent(event.id)}">View details</a>
    ${canBook(event)&&remaining?`<a class="button primary small" href="${linkBooking(event.id)}">Book now</a>`:''}</div></div></div></article>`;
}

export function renderShell(page) {
  const user = getCurrentUser();
  const nav = [['index.html','Home','index'],['events.html','Explore events','events'],['index.html#categories','Categories',''],['calendar.html','Calendar','calendar'],['about.html','About us','about']];
  const links = nav.map(([href,label,key])=>`<a ${key===page?'aria-current="page"':''} href="${href}">${label}</a>`).join('');
  const brand = `<a class="brand" href="index.html"><img src="images/mark.svg" alt="" width="34" height="34"><span>Event<span>Sphere</span></span></a>`;
  el('#site-header').innerHTML = `<div class="container header-inner">${brand}
    <button class="icon-button mobile-toggle" id="menu-toggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="site-nav">${icon('menu',23)}</button>
    <div class="site-nav" id="site-nav"><nav aria-label="Main navigation">${links}</nav><div class="header-actions">
    ${user?`<a href="${dashboard(user.role)}">Dashboard</a><a href="my-bookings.html">My bookings</a>
      <details class="profile-menu"><summary aria-label="Account menu"><span class="avatar">${safe(initials(user.name))}</span></summary><div><span>${safe(user.name)}</span><a href="profile.html">Profile</a><button type="button" data-logout>Log out</button></div></details>`
      :'<a href="login.html">Log in</a><a class="button primary small" href="register.html">Register</a>'}</div></div></div>`;
  el('#site-footer').innerHTML = `<div class="container"><div class="footer-main"><div>${brand}<p>Discover Experiences. Create Memories.</p></div>
    <nav aria-label="Footer navigation"><a href="events.html">Explore events</a><a href="calendar.html">Calendar</a><a href="about.html">About us</a></nav>
    <div><strong>College PBL Project</strong><p>HTML5 | CSS3 | JavaScript | JSON</p></div></div>
    <p class="footer-copy">© 2026 EventSphere. Developed by Patel Gauri &amp; Veda Mrudula. All Rights Reserved.</p></div>`;
  $('#menu-toggle').on('click',function () {
    const open = $(this).attr('aria-expanded') === 'true';
    $(this).attr('aria-expanded',String(!open));
    $('#site-nav').toggleClass('open',!open);
  });
  $('#site-nav').on('click','nav a',()=>{
    $('#menu-toggle').attr('aria-expanded','false');
    $('#site-nav').removeClass('open');
  });
  $('[data-logout]').on('click',logOut);
}
export function logOut() {
  logoutUser();
  location.href='index.html';
}

export function toast(message, kind='success') {
  const notice = document.createElement('div');
  notice.className = 'notice ' + kind;
  notice.textContent = message;
  el('#notifications').append(notice);
  setTimeout(() => notice.remove(),5000);
}

export function dialog(content, label) {
  const panel = el('#app-dialog');
  panel.setAttribute('aria-label',label);
  $(panel).html(`<button class="icon-button dialog-close" type="button" aria-label="Close dialog">${icon('close')}</button>${content}`);
  $(panel).find('.dialog-close').on('click',()=>panel.close());
  panel.showModal();
  return panel;
}

export function confirmAction(title, message, label) {
  return new Promise(resolve => {
    const panel = dialog(`<h2>${safe(title)}</h2><p>${safe(message)}</p><div class="dialog-actions"><button type="button" class="button secondary" value="cancel">Go back</button><button type="button" class="button danger" value="confirm">${safe(label)}</button></div>`,title);
    const modal = $(panel);
    const finish = (confirmed) => {
      modal.off('.confirmation');
      if (panel.open) panel.close();
      resolve(confirmed);
    };
    modal.on('click.confirmation','.dialog-actions button',function () {
      finish(this.value==='confirm');
    });
    modal.on('close.confirmation',()=>{
      if (!panel.open) finish(false);
    });
  });
}

export function formError(form,message='') {
  const alert = el('[data-error]',form);
  $(alert).text(message).prop('hidden',!message);
}

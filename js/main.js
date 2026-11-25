import {dataKey,getCurrentUser,initializeData} from './storage.js';
import {$,bindImageFallback,dashboard,empty,main,renderShell,toast} from './ui.js';

const routes = {
  index:()=>import('./home.js').then(module=>module.renderHome),
  about:()=>import('./home.js').then(module=>module.renderAbout),
  events:()=>import('./events.js').then(module=>module.renderEvents),
  'event-details':()=>import('./event-details.js').then(module=>module.renderDetails),
  calendar:()=>import('./calendar.js').then(module=>module.renderCalendar),
  login:()=>import('./auth.js').then(module=>module.renderLogin),
  register:()=>import('./auth.js').then(module=>module.renderRegister),
  profile:()=>import('./auth.js').then(module=>module.renderProfile),
  booking:()=>import('./booking.js').then(module=>module.renderBooking),
  'my-bookings':()=>import('./my-bookings.js').then(module=>module.renderMyBookings),
  ticket:()=>import('./my-bookings.js').then(module=>module.renderTicket),
  'user-dashboard':()=>import('./my-bookings.js').then(module=>module.renderUserDashboard),
  'organizer-dashboard':()=>import('./organizer.js').then(module=>module.renderOrganizer),
  'create-event':()=>import('./create-event.js').then(module=>module.renderCreateEvent),
  'admin-dashboard':()=>import('./admin.js').then(module=>module.renderAdmin)
};
const signedIn = ['profile','booking','my-bookings','ticket','user-dashboard','organizer-dashboard','admin-dashboard','create-event'];
const roleRequired = {'organizer-dashboard':'organizer','create-event':'organizer','admin-dashboard':'admin','user-dashboard':'user'};
const page = document.body.dataset.page;

async function start() {
  await initializeData();
  const user = getCurrentUser();
  if (signedIn.includes(page) && !user) {
    const next = encodeURIComponent(page + '.html' + location.search);
    location.replace('login.html?next=' + next);
    return;
  }
  if (roleRequired[page] && user?.role!==roleRequired[page]) {
    sessionStorage.setItem('eventsphere.flash','This page is available to the '+roleRequired[page]+' role.');
    location.replace(page==='create-event'?'login.html?switch=1&next=create-event.html':dashboard(user?.role));
    return;
  }
  renderShell(page);
  const render=await routes[page]();
  render();
  bindImageFallback();
  const message=sessionStorage.getItem('eventsphere.flash');
  if (message) {
    sessionStorage.removeItem('eventsphere.flash');
    toast(message);
  }
  if (location.hash) {
    const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));
    target?.scrollIntoView();
  }
  $(window).on('storage',event=>{
    const {key,storageArea} = event.originalEvent;
    if (storageArea !== localStorage) return;
    if (key === null || (key === dataKey && event.originalEvent.newValue === null)) {
      location.reload();
      return;
    }
    if (key !== dataKey) return;
    // Forms may contain unsaved input. Edits and bookings check the latest data on submit.
    if (['booking','create-event','profile','register','login'].includes(page)) return;
    if (document.querySelector('#app-dialog').open) return;
    $(main).off();
    render();
    bindImageFallback();
  });
}

start().catch(error=>{
  main.innerHTML='<div class="container padded">'+empty('EventSphere could not start',error.message)+'</div>';
}).finally(()=>main.setAttribute('aria-busy','false'));

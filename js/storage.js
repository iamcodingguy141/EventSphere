export const dataKey = 'eventsphere.state.v1';
const sessionKey = 'eventsphere.session';
let initialization;

export const categories = ['Technology','Music','Education','Sports','Business','Art and Culture','Workshops','Entertainment'];
export const payments = ['UPI','Credit/Debit Card','Net Banking'];
export const uid = () => crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2,'0')).join('');
export const dateKey = (date = new Date()) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(value => String(value).padStart(2, '0')).join('-');
const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};
export const eventStart = (event) => new Date(event.date + 'T' + event.start);
export const hasStarted = (event, now = Date.now()) => eventStart(event).getTime() <= now;
export const canBook = (event) => event?.status === 'approved' && !hasStarted(event);
export const sortedEvents = (events) => [...events].sort((a,b) => eventStart(a) - eventStart(b));
export const publicEvents = () => sortedEvents(getEvents().filter(event => event.status === 'approved'));
export const upcomingEvents = () => publicEvents().filter(event => !hasStarted(event));
export const getEvent = (id) => getEvents().find(event => event.id === id);

function parse(value) {
  try { return JSON.parse(value); }
  catch { return null; }
}

function read() {
  const state = parse(localStorage.getItem(dataKey));
  if (!state || !['users','events','bookings'].every(key => Array.isArray(state[key]))) {
    throw new Error('EventSphere could not read the saved data from this browser.');
  }
  return state;
}

function persist(state) {
  localStorage.setItem(dataKey, JSON.stringify(state));
}

function lock(operation) {
  return navigator.locks ? navigator.locks.request(dataKey, operation) : Promise.resolve().then(operation);
}

export const initializeData = () => initialization ??= lock(async () => {
  if (localStorage.getItem(dataKey) !== null) {
    read();
    return;
  }
  const [users, eventSeeds, bookingSeeds] = await Promise.all(['users','events','bookings'].map(async name => {
    const response = await fetch('./data/' + name + '.json');
    if (!response.ok) throw new Error('Open the project through VS Code Live Server so EventSphere can load its JSON data.');
    return response.json();
  }));
  const events = eventSeeds.map(({dateOffset, ...event}) => ({...event,date:dateKey(daysFromNow(dateOffset))}));
  const bookings = bookingSeeds.map(({dateOffset, ...booking}) => {
    const event = events.find(item => item.id === booking.eventId);
    const user = users.find(item => item.id === booking.userId);
    return {
      ...booking,
      createdAt:daysFromNow(dateOffset).toISOString(),
      ticketId:booking.id.replace('ES-', 'TKT-'),
      attendee:{name:user.name,email:user.email,phone:''},
      eventSnapshot:snapshot(event)
    };
  });
  if (localStorage.getItem(dataKey) === null) persist({users,events,bookings});
});

function update(change) {
  return lock(() => {
    const data = read();
    const result = change(data);
    persist(data);
    return result;
  });
}

export const getUsers = () => read().users;
export const getEvents = () => read().events;
export const getBookings = () => read().bookings;
export const getCurrentUser = () => {
  const id = sessionStorage.getItem(sessionKey);
  if (!id) return null;
  return getUsers().find(user => user.id === id) ?? null;
};
export const logoutUser = () => sessionStorage.removeItem(sessionKey);

async function passwordHash(password, salt) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bytes = await crypto.subtle.deriveBits({name:'PBKDF2', salt:new TextEncoder().encode(salt), iterations:100000, hash:'SHA-256'}, material, 256);
  return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2,'0')).join('');
}

export const normalizeEmail = (email) => email.trim().toLowerCase();
export const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validPhone = (phone) => /^\+?[\d ()-]+$/.test(phone) && /^[0-9]{7,15}$/.test(phone.replace(/\D/g, ''));

export async function registerUser({name,email,phone,password}) {
  const salt = uid();
  const hash = await passwordHash(password, salt);
  return update(data => {
    if (data.users.some(user => user.email === email)) throw new Error('An account already uses this email.');
    data.users.push({id:uid(),name,email,phone,role:'user',salt,hash});
  });
}

export async function loginUser(email, password) {
  const user = getUsers().find(item => item.email === normalizeEmail(email));
  if (!user) throw new Error('The email or password is incorrect.');
  const matches = user?.hash ? await passwordHash(password, user.salt) === user.hash : user?.demoPassword === password;
  if (!matches) throw new Error('The email or password is incorrect.');
  sessionStorage.setItem(sessionKey, user.id);
  return user;
}

function actor(data, allowed) {
  const id = sessionStorage.getItem(sessionKey);
  const user = data.users.find(item => item.id === id);
  if (!user || !allowed.includes(user.role)) throw new Error('Your session cannot perform this action. Sign in with the appropriate account.');
  return user;
}

export function updateProfile({name,email,phone}) {
  return update(data => {
    const user = actor(data,['admin','organizer','user']);
    if (data.users.some(item => item.id !== user.id && item.email === email)) throw new Error('An account already uses this email.');
    Object.assign(user,{name,email,phone});
  });
}

function snapshot(event) {
  const {title,date,start,venue,city} = event;
  return {title,date,start,venue,city};
}

export const activeBookings = (bookings) => bookings.filter(booking => booking.status === 'confirmed');
export const soldSeats = (eventId, bookings = getBookings()) =>
  activeBookings(bookings).filter(booking => booking.eventId === eventId).reduce((sum,booking) => sum + booking.quantity, 0);
export const availableSeats = (event, bookings = getBookings()) => Math.max(0,event.capacity - soldSeats(event.id, bookings));
export const knownCoupon = (code) => !code || ['EVENT10','WELCOME15'].includes(code);
export function calculatePrice(price, quantity, code) {
  const subtotal = Math.round(price * 100) * quantity;
  const rate = code === 'EVENT10' ? .10 : code === 'WELCOME15' ? .15 : 0;
  const discount = Math.round(subtotal * rate);
  return {subtotal:subtotal / 100,discount:discount / 100,total:(subtotal - discount) / 100};
}

export function createBooking({requestId,eventId,quantity,coupon,payment,attendee}) {
  return update(data => {
    const user = actor(data,['admin','organizer','user']);
    const existing = data.bookings.find(booking => booking.requestId === requestId && booking.userId === user.id);
    if (existing) return existing;
    const event = data.events.find(item => item.id === eventId);
    if (!canBook(event)) throw new Error('This event is no longer accepting bookings.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > availableSeats(event,data.bookings)) {
      throw new Error('Choose a ticket quantity within the current seat availability.');
    }
    if (!knownCoupon(coupon)) throw new Error('Enter a valid coupon or clear the coupon field.');
    if (!attendee.name || !validEmail(attendee.email) || !validPhone(attendee.phone)) {
      throw new Error('Enter the attendee’s name, email and phone number.');
    }
    const price = calculatePrice(event.price, quantity, coupon);
    if (price.total > 0 && !payments.includes(payment)) throw new Error('Choose a simulated payment method.');
    const booking = {
      id:'ES-' + uid().toUpperCase(),
      ticketId:'TKT-' + uid().toUpperCase(),
      requestId,eventId,userId:user.id,quantity,coupon,...price,attendee,
      payment:price.total > 0 ? payment : 'Free',status:'confirmed',createdAt:new Date().toISOString(),eventSnapshot:snapshot(event)
    };
    data.bookings.push(booking);
    return booking;
  });
}

export function bookingEvent(booking, events = getEvents()) {
  return events.find(event => event.id === booking.eventId) ?? booking.eventSnapshot;
}

export const canCancel = (booking,event) => booking.status === 'confirmed' && event && !hasStarted(event);

export function cancelBooking(id) {
  return update(data => {
    const user = actor(data,['admin','organizer','user']);
    const booking = data.bookings.find(item => item.id === id && item.userId === user.id);
    if (!booking || !canCancel(booking,bookingEvent(booking,data.events))) throw new Error('This booking is no longer eligible for cancellation.');
    booking.status = 'cancelled';
    booking.cancelledAt = new Date().toISOString();
  });
}

export function saveEvent(fields,id) {
  return update(data => {
    const user = actor(data,['organizer']);
    const current = id ? data.events.find(event => event.id === id && event.organizerId === user.id && event.status !== 'deleted') : null;
    if (id && !current) throw new Error('This event cannot be edited with the current account.');
    if (current && hasStarted(current)) throw new Error('Events that have started cannot be edited.');
    if (hasStarted(fields) || fields.start >= fields.end) throw new Error('Choose a future start time and a later end time.');
    if (!Number.isInteger(fields.capacity) || fields.capacity < 1 || fields.capacity < soldSeats(id,data.bookings)) {
      throw new Error('Capacity must be a positive whole number and cover all confirmed tickets.');
    }
    if (!Number.isFinite(fields.price) || fields.price < 0) throw new Error('Enter a valid price of zero or more.');
    const event = {
      ...current,...fields,id:current?.id ?? uid(),organizerId:user.id,status:'pending',featured:current?.featured ?? false,
      updatedAt:new Date().toISOString()
    };
    if (!current || current.start !== fields.start || current.end !== fields.end) {
      event.schedule = [{time:fields.start,title:'Check-in and welcome'},{time:fields.end,title:'Closing and departure'}];
    }
    if (current) Object.assign(current,event);
    else data.events.push(event);
    return event;
  });
}

function deleteListing(event, bookings) {
  const cancelledAt = new Date().toISOString();
  Object.assign(event,{status:'deleted',updatedAt:cancelledAt});
  // Keep the event and bookings for history while releasing future reservations.
  for (const booking of bookings) {
    if (booking.eventId === event.id && canCancel(booking,event)) {
      Object.assign(booking,{status:'cancelled',cancelledAt});
    }
  }
}

export function removeOwnEvent(id) {
  return update(data => {
    const user = actor(data,['organizer']);
    const event = data.events.find(item => item.id === id && item.organizerId === user.id && item.status !== 'deleted');
    if (!event) throw new Error('Only the event’s organizer can delete it.');
    deleteListing(event,data.bookings);
  });
}

export function moderateEvent(id,status) {
  return update(data => {
    actor(data,['admin']);
    const event = data.events.find(item => item.id === id && item.status !== 'deleted');
    if (!event || !['approved','rejected','deleted'].includes(status)) throw new Error('This event is no longer available to manage.');
    if (status === 'approved' && hasStarted(event)) throw new Error('This event’s start time has passed.');
    if (status === 'deleted') deleteListing(event,data.bookings);
    else Object.assign(event,{status,updatedAt:new Date().toISOString()});
  });
}

import {getCurrentUser,loginUser,normalizeEmail,registerUser,updateProfile,validEmail,validPhone} from './storage.js';
import {$,dashboard,el,formError,icon,initials,main,params,safe,toast} from './ui.js';

const demos = [
  ['User','user@eventsphere.com','User123'],
  ['Organizer','organizer@eventsphere.com','Organizer123'],
  ['Admin','admin@eventsphere.com','Admin123']
];
const passwordField = (label,name,autocomplete) => `<label>${label}<span class="password-control"><input name="${name}" type="password" required maxlength="128" autocomplete="${autocomplete}"><button class="icon-button" type="button" data-toggle-password aria-label="Show ${label.toLowerCase()}" aria-pressed="false">${icon('eye',19)}</button></span></label>`;
const error = '<p class="form-error" data-error role="alert" hidden></p>';
const nameField = (value='') => `<label>Full name<input name="name" autocomplete="name" required maxlength="80" value="${safe(value)}" placeholder="Your full name"></label>`;
const emailField = (value='') => `<label>Email address<input name="email" type="email" autocomplete="email" required maxlength="120" value="${safe(value)}" placeholder="you@example.com"></label>`;
const phoneField = (value='') => `<label>Phone number<input name="phone" type="tel" autocomplete="tel" required maxlength="24" value="${safe(value)}" placeholder="e.g. +91 90000 00000"></label>`;

export function queryNext(user) {
  const next = params.get('next') ?? '';
  if (/^booking\.html\?id=[\w-]+$/.test(next)) return next;
  if ((next==='create-event.html' || /^create-event\.html\?id=[\w-]+$/.test(next)) && user.role==='organizer') return next;
  if (['profile.html','my-bookings.html'].includes(next)) return next;
  if (/^ticket\.html\?id=[\w-]+$/.test(next)) return next;
  return dashboard(user.role);
}

function authShell(title,detail,body) {
  main.innerHTML=`<div class="container auth-page"><aside class="auth-art">
    <img src="images/mark.svg" alt="" width="52" height="52"><h2>Make time for something memorable.</h2><p>Find events, keep track of tickets and manage experiences from one place.</p><a href="events.html">Explore events ${icon('arrow',17)}</a></aside>
    <section class="panel auth-panel"><h1>${title}</h1><p class="auth-description">${detail}</p>${body}</section></div>`;
  $(main).on('click','[data-toggle-password]',function () {
    const input = $(this).siblings('input');
    const showing = input.attr('type')==='text';
    input.attr('type',showing?'password':'text');
    $(this).attr({'aria-pressed':String(!showing),'aria-label':(showing?'Show':'Hide')+' '+(input.attr('name')==='confirm'?'password confirmation':'password')});
  });
}

function bindForm(action,label) {
  $('#auth-form').on('submit',async function (event) {
    event.preventDefault();
    const form=this;
    const button=$(form).find('[type="submit"]');
    if (button.prop('disabled')) return;
    formError(form);
    button.prop('disabled',true).text('Please wait…');
    try {
      if (!form.checkValidity()) { form.reportValidity(); return; }
      await action(Object.fromEntries(new FormData(form)));
    } catch (error) { formError(form,error.message); }
    finally { button.prop('disabled',false).text(label); }
  });
}

export function renderLogin() {
  const active=getCurrentUser();
  if (active && !params.has('switch')) { location.replace(queryNext(active)); return; }
  const next=params.get('next');
  authShell('Log in','Sign in to book tickets or manage events.',`
    <form id="auth-form" class="stack-form">
      ${emailField()}${passwordField('Password','password','current-password')}
      ${error}<button class="button primary full" type="submit">Log in</button>
    </form>
    <p class="auth-link">New to EventSphere? <a href="register.html${next?'?next='+encodeURIComponent(next):''}">Create an account</a></p>
    <div class="demo-box"><strong>Try a demo account</strong><div class="demo-actions">${demos.map(([label],index)=>`<button type="button" class="button secondary small" data-demo="${index}">${label}</button>`).join('')}</div><p>Choose a role to fill in the example credentials.</p></div>`);
  $('[data-demo]').on('click',function () {
    const [,email,password]=demos[Number(this.dataset.demo)];
    $('#auth-form [name="email"]').val(email);
    $('#auth-form [name="password"]').val(password);
    formError(el('#auth-form'));
    $('#auth-form [type="submit"]').trigger('focus');
  });
  bindForm(async ({email,password})=>{
    if (!validEmail(normalizeEmail(email))) throw new Error('Enter a valid email address.');
    const user=await loginUser(email,password);
    location.href=queryNext(user);
  },'Log in');
}

function validateContact(fields) {
  const name=fields.name.trim();
  const email=normalizeEmail(fields.email);
  const phone=fields.phone.trim();
  if (name.length<2) throw new Error('Enter your full name.');
  if (!validEmail(email)) throw new Error('Enter a valid email address.');
  if (!validPhone(phone)) throw new Error('Enter a valid phone number with 7 to 15 digits.');
  return {name,email,phone};
}

export function renderRegister() {
  if (getCurrentUser()) { location.replace(dashboard(getCurrentUser().role)); return; }
  const next=params.get('next');
  authShell('Create your account','Register as an attendee and start booking events.',`
    <form id="auth-form" class="stack-form">
    ${nameField()}${emailField()}${phoneField()}
    ${passwordField('Password','password','new-password')}${passwordField('Confirm password','confirm','new-password')}
    <p class="help-text">Use at least 8 characters and enter demo details for this PBL project.</p>
    ${error}<button class="button primary full" type="submit">Create account</button></form>
    <p class="auth-link">Already have an account? <a href="login.html${next?'?next='+encodeURIComponent(next):''}">Log in</a></p>`);
  bindForm(async fields=>{
    const contact=validateContact(fields);
    if (fields.password.length<8) throw new Error('Use a password with at least 8 characters.');
    if (fields.password!==fields.confirm) throw new Error('The passwords do not match.');
    await registerUser({...contact,password:fields.password});
    sessionStorage.setItem('eventsphere.flash','Account created. You can now log in.');
    location.href='login.html'+(next?'?next='+encodeURIComponent(next):'');
  },'Create account');
}

export function renderProfile() {
  const user=getCurrentUser();
  authShell('Your profile','Update the contact details used for ticket bookings.',`
    <div class="profile-summary"><span class="avatar">${safe(initials(user.name))}</span><div><strong>${safe(user.name)}</strong><small>${safe(user.role)}</small></div></div>
    <form id="auth-form" class="stack-form">${nameField(user.name)}${emailField(user.email)}${phoneField(user.phone)}
    ${error}<button class="button primary" type="submit">Save profile</button></form>
    <p class="auth-link"><a href="${dashboard(user.role)}">Back to dashboard</a></p>`);
  bindForm(async fields=>{
    const contact=validateContact(fields);
    await updateProfile(contact);
    $('.profile-summary strong').text(contact.name);
    $('.profile-summary .avatar, .header-actions .avatar').text(initials(contact.name));
    $('.profile-menu > div > span').text(contact.name);
    toast('Profile updated.');
  },'Save profile');
}

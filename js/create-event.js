import {categories,dateKey,getCurrentUser,getEvent,hasStarted,saveEvent,soldSeats} from './storage.js';
import {$,breadcrumb,checkedImage,empty,eventImage,formError,icon,main,options,params,safe} from './ui.js';

export function renderCreateEvent() {
  const user=getCurrentUser();
  const id=params.get('id');
  const event=id?getEvent(id):null;
  if (id && (!event || event.organizerId!==user.id || event.status==='deleted' || hasStarted(event))) {
    main.innerHTML='<div class="container padded">'+empty('Event cannot be edited','Only an organizer can edit their own upcoming events.','organizer-dashboard.html#events','My events')+'</div>';
    return;
  }
  const value=(key)=>safe(event?.[key]);
  const minimum=Math.max(1,event?soldSeats(event.id):0);
  const title=event?'Edit event':'Create an event';
  const photo=event?.image ?? '';
  main.innerHTML=`<div class="container event-editor">${breadcrumb(title,'My events','organizer-dashboard.html#events')}
    <div class="simple-heading"><h1>${title}</h1><p>Fill in the event details and submit the listing for administrator approval.</p></div>
    <div class="editor-grid"><form class="panel stack-form editor-form" id="event-editor">
    <section class="stack-form"><h2>Event details</h2><label>Event name<input name="title" required minlength="3" maxlength="100" value="${value('title')}"></label>
    <div class="form-grid"><label>Category<select name="category" required><option value="">Select category</option>${options(categories,event?.category)}</select></label>
    <label>Organizer name<input name="organizer" required maxlength="80" value="${event?value('organizer'):safe(user.name)}"></label></div>
    <label>Description<textarea name="description" required minlength="12" maxlength="2000" rows="5">${value('description')}</textarea></label></section>
    <section class="stack-form"><h2>Date and venue</h2><div class="form-grid three">
    <label>Date<input name="date" type="date" min="${dateKey()}" value="${value('date')}" required></label>
    <label>Start time<input name="start" type="time" value="${value('start')}" required></label>
    <label>End time<input name="end" type="time" value="${value('end')}" required></label></div>
    <div class="form-grid"><label>Venue<input name="venue" maxlength="120" value="${value('venue')}" required></label>
    <label>City / location<input name="city" maxlength="65" value="${value('city')}" required></label></div></section>
    <section class="stack-form"><h2>Tickets and image</h2><div class="form-grid">
    <label>Ticket price (₹)<input name="price" type="number" min="0" max="999999" step="0.01" value="${event?event.price:0}" required></label>
    <label>Total seats<input name="capacity" type="number" min="${minimum}" max="1000000" step="1" value="${value('capacity')}" required></label></div>
    <label>Event image URL <small>(optional)</small><input name="image" type="text" inputmode="url" maxlength="500" value="${/^https?:/.test(photo)?safe(photo):''}" placeholder="https://example.com/event.jpg"></label>
    <p class="help-text">${photo&&!/^https?:/.test(photo)?'Leave the URL blank to keep the existing cover.':'Use an HTTP or HTTPS link to a photo you have permission to use.'}</p></section>
    <p class="form-error" data-error role="alert" hidden></p>
    <div class="action-row"><button class="button primary" type="submit">${event?'Save and resubmit':'Submit for approval'} ${icon('arrow',17)}</button>
    <a class="button secondary" href="organizer-dashboard.html#events">Back to my events</a></div></form>
    <aside class="panel editor-aside"><div class="editor-cover" id="cover-preview">${eventImage({image:photo})}</div><div>
    <h2>Cover preview</h2><p>Organizers can edit their upcoming events. New and edited listings appear to attendees once approved.</p></div></aside></div></div>`;
  const form=$('#event-editor');
  const cover=$('#cover-preview img');
  cover.on('error',function () { if (!this.src.endsWith('event-fallback.svg')) this.src='images/event-fallback.svg'; });
  form.on('change','[name="image"]',function () {
    const url=/^https?:\/\//i.test(this.value.trim())?checkedImage(this.value.trim()):'';
    cover.attr('src',url || cover.data('original') || 'images/event-fallback.svg');
  });
  cover.data('original',cover.attr('src'));
  form.on('submit',async function (submitEvent) {
    submitEvent.preventDefault();
    const button=form.find('[type="submit"]');
    if (button.prop('disabled')) return;
    formError(this);
    button.prop('disabled',true);
    try {
      const fields=Object.fromEntries([...new FormData(this)].map(([key,value])=>[key,value.trim()]));
      if (fields.title.length<3||fields.description.length<12||!fields.venue||!fields.city||!fields.organizer||!categories.includes(fields.category)) {
        throw new Error('Complete the event name, category, description, venue, location and organizer fields.');
      }
      if (fields.image && (!/^https?:\/\//i.test(fields.image) || !checkedImage(fields.image))) throw new Error('Enter an image URL starting with http:// or https://.');
      await saveEvent({...fields,image:fields.image || event?.image || 'images/event-fallback.svg',price:Number(fields.price),capacity:Number(fields.capacity)},id);
      sessionStorage.setItem('eventsphere.flash',event?'Changes saved and sent for approval.':'Event submitted for approval.');
      location.href='organizer-dashboard.html#events';
    } catch(error) { formError(this,error.message); button.prop('disabled',false); }
  });
}

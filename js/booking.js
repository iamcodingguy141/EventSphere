import {availableSeats,calculatePrice,canBook,createBooking,getCurrentUser,getEvent,knownCoupon,normalizeEmail,payments,uid} from './storage.js';
import {$,breadcrumb,empty,eventImage,formError,formatDate,formatTime,icon,linkEvent,main,money,params,safe} from './ui.js';

export function renderBooking() {
  const user=getCurrentUser();
  const event=getEvent(params.get('id'));
  const available=event?availableSeats(event):0;
  if (!canBook(event) || !available) {
    main.innerHTML='<div class="container padded">'+empty('Tickets unavailable','This event may be sold out, closed or awaiting approval.','events.html','Explore events')+'</div>';
    return;
  }
  const requestId=uid();
  main.innerHTML=`<div class="container checkout">${breadcrumb('Book tickets',event.title,linkEvent(event.id))}
    <div class="simple-heading"><h1>Book tickets</h1><p>Review your order and enter the attendee’s details.</p></div>
    <div class="checkout-grid"><form class="panel checkout-form stack-form" id="booking-form">
    <section><h2>Ticket quantity</h2><div class="qty-row"><label>Number of tickets<input name="quantity" type="number" min="1" max="${available}" step="1" value="1" required></label><p class="muted" id="available-count">${available} seats available</p></div></section>
    <section><h2>Attendee information</h2><div class="stack-form"><label>Full name<input name="name" autocomplete="name" value="${safe(user.name)}" maxlength="80" required></label>
    <div class="form-grid"><label>Email address<input type="email" name="email" autocomplete="email" value="${safe(user.email)}" maxlength="120" required></label>
    <label>Phone number<input type="tel" name="phone" autocomplete="tel" value="${safe(user.phone)}" maxlength="24" required></label></div></div></section>
    <section id="payment-section"${event.price?'':' hidden'}><fieldset><legend>Simulated payment method</legend><p class="help-text">Choose a demo payment method. No payment details are collected.</p>
    <div class="payment-options">${payments.map((method,index)=>`<label><input name="payment" type="radio" value="${method}" ${index===0?'checked':''}> ${method}</label>`).join('')}</div></fieldset></section>
    <p class="form-error" data-error role="alert" hidden></p>
    <button type="submit" class="button primary full">${event.price?'Confirm demo booking':'Confirm free booking'} ${icon('arrow',17)}</button></form>
    <aside class="panel order-summary"><div class="order-media">${eventImage(event,true)}</div><div class="order-body">
    <span class="pill">${safe(event.category)}</span><h2>${safe(event.title)}</h2>
    <p class="meta-line">${icon('calendar',17)} ${formatDate(event.date)} · ${formatTime(event.start)}</p><p class="meta-line">${icon('pin',17)} ${safe(event.venue)}, ${safe(event.city)}</p>
    <label class="coupon-field">Coupon code <small>(optional)</small><input form="booking-form" name="coupon" maxlength="20" placeholder="Try EVENT10" autocomplete="off"></label>
    <p class="help-text" id="coupon-result" aria-live="polite"></p><dl class="price-breakdown" aria-live="polite">
    <div><dt>Subtotal</dt><dd id="subtotal"></dd></div><div><dt>Discount</dt><dd id="discount"></dd></div><div class="order-total"><dt>Total</dt><dd id="total"></dd></div></dl>
    </div></aside></div></div>`;
  const form=$('#booking-form');
  const coupon=$('[name="coupon"]');
  function quote() {
    const quantity=Number(form.find('[name="quantity"]').val());
    const code=coupon.val().trim().toUpperCase();
    const price=calculatePrice(event.price,Number.isInteger(quantity)&&quantity>0?quantity:0,code);
    $('#subtotal').text(money(price.subtotal));
    $('#discount').text(price.discount?'−'+money(price.discount):money(0));
    $('#total').text(money(price.total));
    $('#coupon-result').text(code?(knownCoupon(code)?'Coupon applied.':'Coupon code not recognized.'):'');
    return {quantity,code};
  }
  form.on('input','[name="quantity"]',quote);
  coupon.on('input',quote);
  quote();
  form.on('submit',async function (submitEvent) {
    submitEvent.preventDefault();
    const button=form.find('[type="submit"]');
    if (button.prop('disabled')) return;
    formError(this);
    const fields=Object.fromEntries(new FormData(this));
    const {quantity,code}=quote();
    button.prop('disabled',true);
    try {
      const result=await createBooking({requestId,eventId:event.id,quantity,coupon:code,payment:fields.payment,attendee:{name:fields.name.trim(),email:normalizeEmail(fields.email),phone:fields.phone.trim()}});
      location.href='ticket.html?id='+encodeURIComponent(result.id)+'&new=1';
    } catch (error) {
      formError(this,error.message);
      const latest=getEvent(event.id);
      const seats=latest?availableSeats(latest):0;
      form.find('[name="quantity"]').attr('max',seats);
      $('#available-count').text(seats+' seats available');
      button.prop('disabled',!canBook(latest)||!seats);
    }
  });
}

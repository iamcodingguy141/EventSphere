# EventSphere – Event Management System

**Discover Events. Create Memories.**

A college Project-Based Learning project developed by **Patel Gauri** and **Veda Mrudula**. EventSphere lets attendees discover events and manage tickets, organizers manage their listings and bookings, and administrators review events and monitor activity.

## Run with VS Code Live Server

1. Extract `EventSphere.zip` and open the extracted `EventSphere` folder in Visual Studio Code.
2. Install the **Live Server** extension by **Ritwick Dey** if needed.
3. Right-click `index.html` and select **Open with Live Server**. You can also click **Go Live** in the VS Code status bar.
4. Use the address opened by Live Server, typically `http://127.0.0.1:5500/index.html`. Keep the same hostname and port throughout your demonstration so all roles use the same saved records.

Live Server serves the HTML, JavaScript modules and JSON files over HTTP. jQuery is included in the project. A browser connection can load additional stock photos and any image URLs supplied by organizers. The site supplies a local cover if an image fails.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| User | `user@eventsphere.com` | `User123` |
| Organizer | `organizer@eventsphere.com` | `Organizer123` |
| Admin | `admin@eventsphere.com` | `Admin123` |

The login page can fill in any of these accounts. To demo all three at once, open `login.html` in three new tabs at the same Live Server address and sign in with a different role in each. The login stays active across navigation and refreshes in its tab. Use `login.html?switch=1` to change the account in one tab. Enter example contact details when registering or booking, such as `90000 00000` for the phone field.

## Features

| Role | What you can demonstrate |
| --- | --- |
| Visitor | Featured, upcoming and popular events. Search and filter by category, date, location and price. Switch grid/list view, open event details and browse the calendar. |
| User | Register, log in, update a profile, book tickets, confirm a simulated payment, open a digital ticket, print it and cancel eligible bookings. |
| Organizer | Create, edit and delete owned events. View bookings, upcoming events, simulated revenue, ticket sales and event performance. |
| Admin | View accounts, organizers and bookings. Search listings and approve, reject or remove events. Review platform totals and monthly charts. |

The project seeds 13 approved events, one pending event and example bookings. Event dates are relative to the first launch so the sample listings begin in the future.

## Project structure

```text
EventSphere/
├── index.html, events.html, event-details.html, calendar.html, about.html
├── login.html, register.html, profile.html, user-dashboard.html
├── booking.html, my-bookings.html, ticket.html
├── organizer-dashboard.html, create-event.html, admin-dashboard.html
├── css/          Shared, page-specific, responsive and ticket print styles
├── js/           Page modules, reusable UI, dashboards and storage logic
│   └── vendor/   jQuery 3.7.1 and its MIT license
├── data/         Initial events, users and bookings as JSON
└── images/       Event photo assets, site mark and fallback cover
```

## How the project works

- **UI** uses HTML and CSS for page structure, layout, charts and print formatting. JavaScript and jQuery render events, validate forms, handle filters and dialogs, and update the dashboards.
- **Data** is seeded from the JSON files on the first launch. The application keeps accounts, events and bookings together in LocalStorage. Later visits read the saved state.
- **Sessions** use SessionStorage so each tab can sign in and out independently while sharing the same application data. If upgrading from the original ZIP, sign in again in each tab.
- **Seat inventory** subtracts confirmed ticket quantities from the event capacity. Cancelling a booking before the event starts removes it from that total. Each booking submission carries a unique request ID. The browser uses Web Locks where available to serialize competing changes across tabs.
- **Approval** returns newly created or edited listings to Pending. Admin approval makes them public. Deleting an event hides the listing and cancels its future bookings while preserving booking history.
- **Scope** is a frontend PBL demonstration. Role checks and storage run in the browser, and simulated payment collects no card or banking information. Accounts and records are specific to the browser profile and Live Server address.

## PBL presentation guide

1. **Introduce the problem.** Explain how a single platform helps attendees discover events and helps organizers manage registrations.
2. **Demonstrate the attendee flow.** Filter by Workshops and open Photography Masterclass. Use the User demo account, select two tickets, try coupon `EVENT10`, confirm the simulated payment and open the printed ticket.
3. **Show inventory consistency.** Open My Bookings, cancel that test booking and return to the event to show the restored seats.
4. **Demonstrate administrator approval.** Submit a future event from the Organizer account. Log in as Admin and approve it under Events. Return to Explore Events and find the published listing.
5. **Explain the implementation.** Show the three JSON seed files, then point to `js/storage.js` for role, booking and seat logic. Show organizer analytics and the mobile navigation to close the demo.

## Verification

- All application JavaScript files passed syntax checking.
- Eight Microsoft Edge browser test groups covered navigation, filters, the calendar, registration, login, profile, ticket pricing and printing controls, cancellation, role ownership, event creation and moderation, and layouts at 360, 768 and 1,280 pixels.
- Separate storage tests covered seeded data, password verification, duplicate submissions, sold-out events, authorization and inventory restoration.
- A three-session regression test covered simultaneous demo roles, refresh and logout behavior, and shared event approval and seat counts.
- The browser checks used a local test fixture because loopback HTTP was blocked in the test environment. The Live Server launch instructions above provide the intended way to run the packaged site.

## Future enhancements

Shared storage with server-side authentication, organizer invitations, QR check-in, booking reminders and exportable event reports.

## Image and library credits

- The bundled concert cover is by [Nainoa Shizuru on Unsplash](https://unsplash.com/@nainoa).
- The bundled audience and acoustic covers use [Nicholas Green on Unsplash](https://unsplash.com/@nickxshotz) and Edward's Unsplash image, sourced from the [Festava Live template image set](https://templatemo.com/tm-583-festava-live).
- The workshop cover is by [Alexander Suhorucov on Pexels](https://www.pexels.com/photo/women-walking-together-in-an-office-6457579/).
- Additional illustrative photos load from [Unsplash](https://unsplash.com/). Stock imagery represents event categories.
- jQuery 3.7.1 is distributed under the MIT license in `js/vendor/jquery-LICENSE.txt`.

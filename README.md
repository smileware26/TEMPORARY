# SmileWare Dental Clinic — Fixed School Prototype

This version keeps the original SmileWare UI idea but hardens the frontend demo:

- Replaced real-looking demo emails with reserved `.test` addresses.
- Added clear prototype-only messaging.
- Removed inline JavaScript event handlers from generated content.
- Added a restrictive Content Security Policy using a meta tag.
- Uses `sessionStorage` for the current demo session instead of persistent localStorage sessions.
- Escapes user-controlled values before placing them in generated HTML.
- Adds basic input length and password checks for demo registration.
- Keeps all data local to the current browser; it is not a real authentication or clinic backend.

## Demo accounts

- Admin: demo-admin@example.test / DEMO-2026!
- Reception: demo-reception@example.test / DEMO-2026!
- Dentist: demo-dentist@example.test / DEMO-2026!
- Patient: demo-patient@example.test / DEMO-2026!

## Important

This is still a client-side school prototype. It is not suitable for real patient records, real passwords, real payment information, or production authentication. A real system should use a server-side backend such as PHP with a database and secure password hashing.

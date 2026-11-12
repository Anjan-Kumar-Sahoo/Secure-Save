# Secure Save - Requirements

## Functional Requirements

### FR-01: User Registration
- Clean registration screen with email input
- Backend checks email uniqueness
- Cryptographically secure 6-digit OTP generation
- OTP sent via SMTP email
- OTP verification screen
- Login PIN creation with confirmation
- Encrypted vault initialization
- Navigation to dashboard

### FR-02: User Login
- Mandatory login PIN on every fresh launch
- Six-digit PIN by default
- PIN entry with numeric keypad
- Option to show/hide entered PIN
- Continue/unlock button
- Forgot Login PIN option
- Configurable inactivity locking
- Vault lock when app moves to background

### FR-03: Authentication Flows
- OTP expiry: 5 minutes maximum
- Maximum 5 incorrect OTP attempts per challenge
- OTP resend cooldown: 60 seconds
- Rate limiting by account and IP
- Secure OTP hashing (never store plaintext)
- OTP invalidation of previous issues

### FR-04: Card Management
- Add credit/debit cards with required fields
- Card title, cardholder name, card number, expiry date, CVV, card network, card type
- Client-side encryption of sensitive data
- Masked display on listing screen
- Reveal/hide controls for card details
- Three-dot menu per card: Edit, Delete
- Delete requires confirmation
- Edit opens prefilled form

### FR-05: Bank Details Management
- Add bank entries with bank name, account type, account holder, account number
- Dynamic key-value custom fields (Branch Name, IFSC Code, etc.)
- Link existing cards to bank entries
- Unlink cards without deleting either record
- View bank detail page with linked cards

### FR-06: Password Manager
- Add password entries with title, username, email, password, website URL, notes
- Toggle password visibility
- Secure password generator (length, uppercase, lowercase, numbers, symbols)
- Copy username/password to clipboard
- View/edit/delete operations per entry

### FR-07: My Collections
- Create collections with custom titles (optional description)
- Add items to collections: text, image, video, audio, general files
- Text editor with title and content
- Image gallery with thumbnails
- Video player with thumbnail preview
- Audio recorder/player with playback controls
- General file upload/download/rename/delete
- View/edit/rename/delete collection items

### FR-08: Navigation & UI
- Hamburger menu → navigation drawer (9 items)
- 2×2 grid dashboard tiles (Cards, Passwords, Bank Details, Add)
- Responsive layout for different screen sizes
- Footer with copyright notice

### FR-09: Security Features
- Client-side encryption (AES-256-GCM)
- Separate PIN, vault key, recovery key management
- Hardware-backed key protection (Android Keystore)
- Progressive delays after repeated failures
- Session expiration and secure logout
- Brute-force protection
- FLAG_SECURE for sensitive screens

### FR-10: Media Handling
- Image upload from gallery/file picker
- Video upload from native file picker
- Audio recording from microphone
- General file upload with size/type validation
- Download/export functionality
- Thumbnail generation/preview

## Non-Functional Requirements

### NFR-01: Security
- Zero plaintext secrets in database or logs
- All sensitive data encrypted client-side before upload
- Hardware-backed key protection where available
- Secure key separation (PIN ≠ encryption key)
- Recovery mechanism without data destruction

### NFR-02: Performance
- Screen transitions under 300ms
- Skeleton loading states for all lists
- Efficient memory management
- No memory leaks in React components

### NFR-03: Reliability
- 99.9% uptime for API endpoints
- Graceful degradation on network failure
- Offline-first where possible
- Proper error handling and user feedback

### NFR-04: Usability
- Mobile-first design philosophy
- Touch targets minimum 48px
- Intuitive navigation flow
- Clear error and success messages
- Accessible color contrast (WCAG AA)

### NFR-05: Maintainability
- Modular monolith architecture
- Clear separation of concerns
- Comprehensive documentation
- Test coverage for critical flows
- Type-safe code throughout

## User Workflows

### WW-01: New User Registration
1. Open app → registration screen
2. Enter email → Continue
3. Receive OTP via email
4. Enter OTP → Verify
5. Create login PIN → Confirm PIN
6. Vault initialization
7. Navigate to dashboard

### WW-02: User Login
1. Open app → login screen
2. Enter email and PIN
3. Authentication validated
4. Vault unlocked
5. Navigate to dashboard

### WW-03: Add a Credit Card
1. Dashboard → Cards tab
2. Floating + button → Add Card
3. Fill card details form
4. Validate inputs
5. Encrypt and save
6. Success notification
7. Return to cards listing

### WW-04: Add a Bank Account
1. Dashboard → Bank Details tab
2. Floating + button → Add Bank
3. Fill bank details (name, account type, holder, number)
4. Optional: Add custom fields
5. Link existing cards (select from saved cards)
6. Save bank entry
7. View bank detail with linked cards

### WW-05: Add a Password
1. Dashboard → Passwords tab
2. Floating + button → Add Password
3. Fill credential form
4. Optional: Generate secure password
5. Save encrypted entry
6. View/edit/delete as needed

### WW-06: Create a Collection
1. Dashboard → Collections tab
2. Floating + button → Add Title
3. Enter collection title (optional description)
4. Save collection
5. Navigate to collection detail
6. Add items (text, image, video, audio, file)

### WW-07: Forgot Login PIN
1. Login screen → Forgot PIN option
2. Enter registered email
3. Receive OTP via email
4. Verify OTP
5. Create new login PIN → Confirm
6. Reconfigure vault unlock
7. Invalidate previous sessions

## Feature Acceptance Criteria

### FAC-01: Authentication
- [ ] Registration completes end-to-end with OTP verification
- [ ] Login PIN is mandatory (no bypass)
- [ ] Forgot PIN flow works without data loss
- [ ] Session expiration works correctly
- [ ] Logout clears all sensitive state

### FAC-02: Cards
- [ ] Card CRUD operations work with encrypted storage
- [ ] Masked numbers displayed on listing screen
- [ ] Reveal/hide controls function correctly
- [ ] Three-dot menu Edit/Delete operations work
- [ ] Client-side encryption verified (no plaintext in DB)

### FAC-03: Bank Details
- [ ] Bank entries CRUD operations work
- [ ] Dynamic key-value fields add/edit/remove
- [ ] Card linking/unlinking preserves data integrity
- [ ] Delete bank does not delete linked cards

### FAC-04: Passwords
- [ ] Password CRUD operations work
- [ ] Show/hide toggle functions
- [ ] Copy to clipboard works
- [ ] Password generator produces valid output
- [ ] Reveal requires recent authentication

### FAC-05: Collections
- [ ] Create/rename/delete collections works
- [ ] Text notes add/edit/delete
- [ ] Image upload/view/delete works
- [ ] Video upload/view/delete works
- [ ] Audio record/playback works
- [ ] General file upload/download works

### FAC-06: Security
- [ ] No plaintext secrets in database logs
- [ ] All sensitive payloads encrypted before upload
- [ ] Authentication required for all resource access
- [ ] Cross-user data isolation verified
- [ ] Error messages don't expose internal details
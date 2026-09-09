# CardMax — System Improvement & Feature Task Roadmap

This document outlines prioritized, actionable tasks to improve system stability, finish incomplete user flows, enhance developer experience, and adhere to project engineering standards.

---

## 📋 Priority Matrix

| Priority | Task Area | Complexity | Est. Effort |
| :--- | :--- | :--- | :--- |
| **P0 (Blocker)** | [1. Fix ESLint & React 19 / Next 16 Compiler Errors](#task-1-fix-eslint--react-19--next-16-compiler-errors) | Low | 1 - 2 hours |
| **P1 (High)** | [2. Interactive "Add Card" & "Edit Card" Modals in Wallet](#task-2-interactive-add-card--edit-card-modals-in-wallet) | Medium | 2 - 3 hours |
| **P1 (High)** | [3. Global App Navigation Header & Footer](#task-3-global-app-navigation-header--footer) | Medium | 2 - 3 hours |
| **P1 (High)** | [4. Transform Placeholder Home Page into Live Dashboard](#task-4-transform-placeholder-home-page-into-live-dashboard) | Medium | 3 - 4 hours |
| **P2 (Medium)**| [5. Migrate Root CSS to Modular SCSS Design System](#task-5-migrate-root-css-to-modular-scss-design-system) | Medium | 2 hours |
| **P2 (Medium)**| [6. Fix Vitest Test Teardown Hang & Add Card Integration Tests](#task-6-fix-vitest-test-teardown-hang--add-card-integration-tests) | Low-Med | 1 - 2 hours |
| **P3 (Feature)**| [7. Card Recommendation & Rewards Calculator UI](#task-7-card-recommendation--rewards-calculator-ui) | High | 4 - 6 hours |

---

## Task 1: Fix ESLint & React 19 / Next 16 Compiler Errors

### Objective
Resolve all 31 ESLint errors and failing compiler checks so `pnpm lint` and CI/CD pipelines run cleanly.

### Key Problem Areas
1. **`react-hooks/immutability` & Next.js navigation**:
   - Direct mutation of `window.location.href` in event handlers violates React 19 compiler immutability rules and Next.js client navigation best practices.
   - Files affected:
     - `src/app/(frontend)/complete-profile/complete-profile-form.tsx` (line 68)
     - `src/app/(frontend)/login/login-form.tsx` (lines 127, 129)
     - `src/app/(frontend)/consent-onboarding/consent-onboarding-form.tsx` (line 50)
   - **Fix**: Use `const router = useRouter()` from `next/navigation` and call `router.push('/target')`, or `window.location.assign('/target')` if a hard reload is required for session refresh.
2. **`react-hooks/set-state-in-effect`**:
   - Calling `setState` synchronously within `useEffect` causes cascading re-renders.
   - Files affected:
     - `src/app/(frontend)/login/login-form.tsx` (line 69)
     - `src/app/(frontend)/gmail/gmail-form.tsx` (line 53)
   - **Fix**: Derive initial state from query parameters or initialize the state with `useState(() => ...)` instead of synchronizing via an effect.
3. **HTML Anchor Tags**:
   - `<a>` tag used for internal route navigation in `login-form.tsx` (line 148).
   - **Fix**: Replace with `<Link href="...">` from `next/link`.
4. **`prefer-const` warnings-turned-errors**:
   - `src/plugins/sidebar.ts` (line 3)
   - `src/seed/seeders/banks.seed.ts` (line 10)
   - `src/seed/seeders/subscription_dummy.seed.ts` (line 34)
   - **Fix**: Change `let` to `const`.

### Verification
```bash
pnpm lint
```
*Expected: 0 errors.*

---

## Task 2: Interactive "Add Card" & "Edit Card" Modals in Wallet

### Objective
Allow users to link new credit cards from the catalog to their personal wallet, specify credit limits and statement dates, and edit them directly from the UI.

### Current State
- `src/app/(frontend)/wallet/page.tsx` has buttons:
  - `<button className="btn-add">Add Card</button>` (has no `onClick` handler or modal)
  - `<button className="btn-card-action secondary">Edit</button>` (has no `onClick` handler)
- Backend endpoints and services already exist in:
  - `src/cards/endpoints.ts` (`POST /api/user-cards`, `PATCH /api/user-cards/:id`, `GET /api/user-cards/me`)
  - `src/cards/service.ts`

### Work To Do
1. Create `src/app/(frontend)/wallet/components/AddCardModal.tsx`:
   - Searchable card picker fetching available cards from `/api/cards` or Payload catalog.
   - Inputs for:
     - Credit Card selection (Bank + Card Name)
     - Credit Limit (numeric with ₹ formatting)
     - Statement Generation Day (1–31)
     - Payment Due Day (optional / auto-calculated)
   - Submits payload to `POST /api/user-cards`.
2. Create `src/app/(frontend)/wallet/components/EditCardModal.tsx`:
   - Pre-fills current `creditLimit` and `statementDay`.
   - Submits updates to `PATCH /api/user-cards/:id`.
3. Wire both modals into `src/app/(frontend)/wallet/page.tsx` with optimistic UI updates or `fetchCards()` trigger.
4. Style modals using SCSS (`src/app/(frontend)/wallet/styles.scss`).

### Verification
- Add a new card through the modal and verify it immediately displays in the grid.
- Edit the limit/statement day and verify persistence in database.
- Remove a card and verify it is deactivated.

---

## Task 3: Global App Navigation Header & Footer

### Objective
Provide a unified, responsive header and footer so users can easily navigate across all features.

### Current State
- `src/app/(frontend)/layout.tsx` only renders:
  ```tsx
  <PolicyBanner />
  <main>{children}</main>
  ```
- Users have no visible links to go between Home, Wallet, Profile, Max Pro, Subscriptions, or Logout.

### Work To Do
1. Create `src/app/(frontend)/components/Navbar/Navbar.tsx` and `Navbar.scss`:
   - Logo / Brand title linked to `/`.
   - Links: **Dashboard**, **Wallet**, **Max Pro**, **Profile**.
   - User profile dropdown showing avatar, email, subscription badge (Free vs Pro), and **Sign Out** button.
   - Mobile-responsive hamburger menu for smaller screens.
2. Create `src/app/(frontend)/components/Footer/Footer.tsx` and `Footer.scss`:
   - Brand statement and security disclaimer.
   - Links: Terms & Conditions (`/terms-and-conditions`), Privacy Policy (`/privacy-and-policy`), Consent Settings (`/settings/consent`).
3. Embed both in `src/app/(frontend)/layout.tsx` (hide header/footer on login and onboarding routes where appropriate).

### Verification
- Test navigation between all routes on desktop and mobile viewports.
- Confirm authenticated state displays user badge and sign-out button.

---

## Task 4: Transform Placeholder Home Page into Live Dashboard

### Objective
Replace the static `<div>Card max</div>` placeholder on `/` with a useful overview dashboard.

### Current State
- `src/app/(frontend)/page.tsx` contains only 10 lines of code returning plain text.

### Work To Do
1. Check authentication status in server component (`src/app/(frontend)/page.tsx`):
   - If guest: show clean landing hero with "Get Started" / "Log In" CTA.
   - If authenticated user: show personal dashboard:
     - **Wallet Summary Card**: Total active cards, aggregate credit limit, nearest upcoming statement due date.
     - **Quick Actions**: "Add New Card", "View Perks", "Connect Gmail Statements".
     - **Recommendations Widget**: "Best card to use for Dining / Fuel / Travel this month".
     - **Max Pro Upgrade Card** (if free user) or **Pro Perks Status** (if active subscriber).
2. Style with SCSS adhering to the CardMax dark/vibrant design system.

### Verification
- Visit `http://localhost:3000/` as a guest and as an authenticated user.
- Verify that wallet statistics reflect real user data.

---

## Task 5: Migrate Root CSS to Modular SCSS Design System

### Objective
Align global styles with the project rule: *"frontend project must use scss not css for ui development"*.

### Current State
- `src/app/(frontend)/styles.css` is still a monolithic `.css` file containing legacy styles, while individual pages use `.scss`.

### Work To Do
1. Create SCSS structure under `src/styles/`:
   - `_variables.scss` (colors, typography, spacing, border-radius, shadows, z-indexes)
   - `_mixins.scss` (flexbox helpers, media query breakpoints, glassmorphism, buttons)
   - `_typography.scss` (fonts, headings, body hierarchy)
   - `globals.scss` (reset, HTML/body base styles)
2. Rename/migrate `src/app/(frontend)/styles.css` to `src/app/(frontend)/styles.scss`.
3. Update imports in `src/app/(frontend)/layout.tsx` and `src/app/(frontend)/page.tsx`.

### Verification
- Verify `pnpm dev` builds without SCSS compilation errors.
- Check UI consistency across pages.

---

## Task 6: Fix Vitest Test Teardown Hang & Add Card Integration Tests

### Objective
Ensure `pnpm test:int` runs fast and exits cleanly without process hangs, and add test coverage for user-card operations.

### Current State
- Running `pnpm test:int` completes unit tests for auth, crypto, and gmail, but hangs on `tests/int/api.int.spec.ts` because the Payload / Postgres connection pool is not closed.
- There are no integration tests for `UserCard` service or endpoints.

### Work To Do
1. Fix connection teardown in `tests/int/api.int.spec.ts`:
   - Add `afterAll(async () => { await payload.db?.destroy?.() })` or proper Payload teardown.
   - Configure Vitest with `--teardown` or timeout safeguards.
2. Create `tests/int/cards.int.spec.ts`:
   - Test card linking to user (`createUserCard`).
   - Test credit limit and statement day validation.
   - Test card deactivation (`deactivateUserCard`).
   - Test audit log creation upon card changes.

### Verification
```bash
pnpm test:int
```
*Expected: All test suites pass and process exits with code 0.*

---

## Task 7: Card Recommendation & Rewards Calculator UI

### Objective
Implement the core user value proposition: helping users choose the best card for specific transaction categories.

### Background
CardMax stores `Cards`, `CreditCards`, and bank reward rules. Users want to know:
*"Which of my cards gives the highest cashback/points on Dining, Grocery, Flights, or Fuel?"*

### Work To Do
1. Create a server action or endpoint `/api/recommendations`:
   - Accept category (`dining`, `fuel`, `travel`, `shopping`, `utilities`) and amount.
   - Evaluate the user's active cards against cashback/reward multiplier rules.
   - Return sorted ranking with estimated savings (₹).
2. Build UI component in Dashboard:
   - Category selector pill buttons.
   - Top card recommendation badge with reward breakdown.
3. Track recommendation clicks using the existing `AnalyticsEvent` collection.

---

## 🚀 Suggested Execution Sequence

1. **Step 1**: Run **Task 1** (ESLint fixes) to establish clean baseline code quality.
2. **Step 2**: Implement **Task 2** (Add/Edit Card Modals) to make the Wallet fully functional.
3. **Step 3**: Implement **Task 3** (Global Navbar & Footer) to connect all pages together.
4. **Step 4**: Build **Task 4** (Dashboard on `/`) so the main landing route is no longer empty.
5. **Step 5**: Execute **Task 5 & 6** (SCSS migration and test teardown fixes).

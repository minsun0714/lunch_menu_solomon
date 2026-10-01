# SKILLS.md

Enduring engineering requirements for this repository. Follow them for every change, whether made by a person or an AI agent.

## 1. UI: shadcn/ui everywhere

- Build all UI from shadcn/ui components in `src/components/ui/` (style `new-york`, Radix primitives, `lucide-react` icons). Configuration lives in `components.json`.
- Do not hand-roll buttons, inputs, selects, dialogs, alerts, badges, cards, radio groups or toasts with raw HTML plus Tailwind classes when a shadcn component exists. Compose them in feature components under `src/components/`.
- Add missing primitives by following the official shadcn source and patterns (`npx shadcn@latest add <component>`; if the registry is unreachable, copy the official component source and adapt only its imports/aliases). Keep `data-slot` attributes, `cva` variants and `cn()` from `@/lib/utils`.
- Install only what a component needs: individual `@radix-ui/react-*` packages rather than the umbrella `radix-ui` package, and no theming, form or state libraries that the app does not use. Run the advisory check before adding any dependency.
- Style with the CSS variables defined in `src/app/globals.css` (`bg-background`, `text-muted-foreground`, `border`, `bg-primary`, ...). Use brand-specific Tailwind colors only for one-off accents.
- Use the shadcn `Dialog`/`AlertDialog` for modals and confirmations (never `window.confirm`/`alert`), and `notifier` (Sonner) for toasts.
- Keep accessibility intact: labels tied to controls, `aria-invalid`, `role="alert"/"status"` for messages, a `DialogTitle` in every dialog.

## 2. Browser APIs go through the service layer

- Every browser API call (`fetch`, `window`, `document`, `localStorage`, `ResizeObserver`, dialogs, third-party browser SDKs such as Kakao Maps, toast library) lives in a module under `src/services/`.
- HTTP calls use `apiRequest` in `src/services/api-client.ts` through the typed wrappers (`restaurant-api.ts`, `settings-api.ts`, `place-api.ts`). Components, hooks and pages must never call `fetch` directly.
- ESLint (`no-restricted-globals` in `eslint.config.mjs`) enforces this for `src/components`, `src/hooks` and pages. Do not disable the rule; add or extend a service instead.
- Service modules stay free of React; they take plain arguments and return promises or plain values so they can be unit tested.

## 3. Logic lives in custom hooks

- Components and pages render UI and wire props. State, effects, event handlers, validation, derived data and orchestration of services live in hooks under `src/hooks/` (`use-*.ts`).
- Page-level logic is one hook per page (`useHomePage`, `useSettingsPage`) composed from smaller hooks (`useRestaurants`, `useRestaurantFilters`, `useTeamSettings`, ...). Component-scoped logic gets its own hook (`useRestaurantForm`, `usePlaceSearch`, ...).
- Hooks call services, never browser APIs directly. Purely presentational state (for example hover) may stay in the component.
- Pure, framework-free helpers shared by client and server belong in `src/lib/`.

## 4. Route handlers stay thin; server logic is separate

- `src/app/api/**/route.ts` only parses the HTTP request, calls a server service and maps the result or `ApiError` to a response with the helpers in `src/server/http.ts` (`ok`, `created`, `okMessage`, `fail`, `handleRoute`).
- Server code is layered under `src/server/`:
  - `services/` — business rules, input validation and orchestration; throw `ApiError(status, message)` for expected failures.
  - `repositories/` — data access and row mapping (Supabase); no HTTP concepts.
  - `db/` — clients and configuration.
- Services and repositories never import `next/server`. Route handlers never contain validation rules or database calls.
- The API envelope stays `{ success: true, data | message }` / `{ success: false, error }`. Keep user-facing Korean messages stable.

## 5. Quality gates

- Add or update tests in `src/__tests__/` for any behavior you change (server services, repositories, services, pure helpers). Tests must not touch real Supabase or Kakao endpoints; use `helpers/supabase.ts`.
- Before finishing, `npm run lint`, `npm test` and `npm run build` must pass.
- Update `README.md` and this file when architecture or conventions change.

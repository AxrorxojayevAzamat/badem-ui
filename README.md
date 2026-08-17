# Badem CRM — Angular frontend

Angular 21 client for [badem-api](../badem-api), built with **Signal Forms**
(`@angular/forms/signals`), zoneless change detection, standalone components and
`httpResource` for data loading.

## Quick start

The API must be running first (see `../badem-api/README.md`):

```bash
cd ../badem-api && npm run seed && npm run start:dev
```

Then:

```bash
npm install
npm start
```

- App: http://localhost:4200
- Sign in with the seeded admin: `admin@badem.local` / `Admin123!`

`proxy.conf.json` forwards `/api` to `http://localhost:3000`, so the browser
talks to one origin and there is no CORS in development.

## Screens

| Route | What it does |
| --- | --- |
| `/login` | Sign in; stores the access/refresh pair |
| `/dashboard` | Stock value, low-stock sources, latest products and movements |
| `/products` · `/products/new` · `/products/:id` | Record production — **this is where stock is consumed** |
| `/sources` · `/sources/new` · `/sources/:id` | Raw materials; the detail page has restock, stock correction and the per-source ledger |
| `/history` | Full stock ledger with source / action / date filters |
| `/suppliers`, `/clients` | CRUD |
| `/employees`, `/users` | CRUD, ADMIN/MANAGER only (hidden from the nav otherwise) |
| `/account` | Profile and password change |

## Signal Forms

Every form in the app uses the signal-forms API. The shape is always the same:

```ts
// 1. a plain writable signal holds the data
private readonly model = signal({ email: '', password: '' });

// 2. validation lives in a schema, separate from the component
const credentialsSchema = schema<Credentials>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email);
});

// 3. the form is a field tree over the model, with its submit action attached
protected readonly loginForm = form(this.model, credentialsSchema, {
  submission: {
    action: async (f) => {
      try {
        await this.auth.login(f.email().value(), f.password().value());
        return null;                    // success
      } catch (error) {
        return serverError(error);      // becomes a validation error
      }
    },
  },
});
```

```html
<form [formRoot]="loginForm">
  <input [formField]="loginForm.email" />
  <field-errors [field]="loginForm.email" />
  <button type="submit" [disabled]="loginForm().submitting()">Sign in</button>
</form>
```

The `[formRoot]` directive runs the submission action itself — the template has
no `(submit)` handler and no `preventDefault()`.

### Where the interesting bits are

| Feature | File |
| --- | --- |
| Cross-field rule (`ctx.valueOf`) — a batch may not consume more than its source holds | [product-form.ts](src/app/features/products/product-form.ts) |
| Async uniqueness check with `validateHttp` + `debounce` on the SKU field | [product-form.ts](src/app/features/products/product-form.ts) |
| Reactive `disabled()` with a reason — opening stock is locked when editing | [source-form.ts](src/app/features/sources/source-form.ts) |
| Two independent forms on one page | [source-detail.ts](src/app/features/sources/source-detail.ts) |
| Password confirmation via `validate` | [account.ts](src/app/features/account/account.ts) |
| Server errors mapped onto a specific field | [form-utils.ts](src/app/shared/form-utils.ts) |
| Loading an entity into an editable model with `linkedSignal` | any `*-form.ts` |

### Things worth knowing (learned the hard way)

- **Bind with `[formField]`, not `[control]`.** Older write-ups use `[control]`; in 21.2 the directive is `FormField` with selector `[formField]`, and the `<form>` uses `FormRoot` (`[formRoot]`).
- **Put the submit action on the form**, via `FormOptions.submission`. Calling `submit(form, action)` from your own `(submit)` handler *while* `[formRoot]` is applied makes the directive fire a second, action-less submit and throw `NG01915`.
- **Use `FieldTree<unknown>` for "any field" inputs.** `FieldTree<any>` widens into the reactive-forms compat overload and stops matching real fields.
- **There are no `ng-invalid` / `ng-touched` classes.** Signal forms binds state to the field, not the element. `styles.scss` colours invalid inputs with `.field:has(.field-error)` instead, which also catches custom errors.
- **Built-in validators skip empty values**, so an optional email field needs `email(path.email)` and nothing else — no `required`, no conditional wrapper.
- **`reset()` clears touched/dirty but not the data.** After a successful save on a page that stays put, set the model *and* call `form().reset()`, or the emptied field immediately shows its "required" error.

## Localization

Russian, Uzbek (Latin) and English, switched **at runtime** from the topbar — one
build, no reload. Russian is what a new user sees; the choice is stored in
`localStorage` and also sets `<html lang>`.

```
src/app/core/i18n/
  en.ts     source dictionary + the TranslationKey type
  ru.ts     typed Record<TranslationKey, string>
  uz.ts     typed Record<TranslationKey, string>
  i18n.ts   the service: lang signal, locale, t()
```

- **A missing translation is a build error.** `ru` and `uz` are typed against the English dictionary, so adding a key to `en.ts` breaks the build until both are filled in. English is also the runtime fallback.
- **Use it as a function, not a pipe:** `{{ i18n.t('nav.products') }}`. The `lang()` signal is read while the view renders, so changing language re-renders everything that uses it — a pure pipe would cache and go stale.
- **Validation messages are functions**, not strings: `required(path.name, { message: () => this.i18n.t('validation.nameRequired') })`. Signal forms re-evaluates them, so errors already on screen change language too.
- **Interpolation:** `t('key', { name, count })` fills `{name}` placeholders.
- **Plurals** use `Intl.PluralRules`, which Russian needs — `_one` / `_few` / `_many` / `_other` suffixes are picked automatically (1 запись, 3 записи, 16 записей).
- **Dates and numbers** follow the language: locale data for `ru` and `uz` is registered at startup and `i18n.locale()` is passed to the `date` and `number` pipes (17 авг. 2026 vs 17 Aug 2026; `1 000` vs `1,000`).

Adding a language: add its dictionary file, register its locale data in
`i18n.ts`, and add an entry to `LANGUAGES`.

Note that error text coming *from the API* (e.g. "Not enough stock of …") is
still English — the backend would need to return error codes for the client to
translate those. Everything the client itself produces is localized.

## Structure

```
src/app/
  core/           models, CrudApi base, auth (service, interceptor, guards), toast
  core/services/  one thin service per resource
  shared/         <field-errors>, <form-error>, <paginator>, serverError()
  layout/         app shell (sidebar + topbar)
  features/       one folder per screen
```

## Auth

- `Auth` keeps the token pair in signals (mirrored to `localStorage` so a reload stays signed in).
- `authInterceptor` attaches the access token and, on a 401, refreshes once and replays the request. Concurrent 401s share a single refresh call — the API rotates refresh tokens, so two parallel refreshes would look like token reuse and kill the session.
- `authGuard` protects the shell; `roleGuard('ADMIN', 'MANAGER')` guards the admin routes and the nav hides what the current role cannot open. The API enforces the same rules — the UI check is only there to avoid dead ends.
- Tokens in `localStorage` are readable by any script on the origin. For production, consider httpOnly refresh cookies instead.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Dev server on :4200 with the `/api` proxy |
| `npm run build` | Production build into `dist/` |
| `npm test` | Vitest (no app tests written yet) |

## Note on versions

Signal Forms is **experimental** in Angular 21 — the API can change in a minor
release. Everything here was written against **@angular/forms 21.2.20**; if you
upgrade and a form stops compiling, check `node_modules/@angular/forms/types/`
for the current signatures.

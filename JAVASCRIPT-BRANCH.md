# `javascript-only` branch

This branch is a **plain JavaScript** port of the same Skribble clone (no TypeScript).

- **Server:** `server/src/*.js` (CommonJS), `npm run build` copies to `dist/`
- **Client:** `client/src/*.jsx` + Vite

Run locally (same as main):

```bash
npm install
npm run dev
```

`main` is unchanged; merge or cherry-pick from here only when you want JS.

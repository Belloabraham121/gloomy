"use client";

// A thin client-boundary wrapper around @openuidev/react-ui's ThemeProvider.
//
// The package's root barrel (dist/index.mjs) IS marked "use client" but does
// `export *`, which Next's RSC flight loader can't statically analyze from a
// server component (see docs/openui-migration.md). Importing the
// `ThemeProvider` subpath instead avoids that barrel, but the subpath's own
// build output has no "use client" directive at all (it's meant to be
// consumed already inside a client bundle) - it calls `createContext`/
// `useContext`, which breaks when evaluated as a server module during static
// generation ("createContext is not a function"). Marking *this* file "use
// client" makes it the actual RSC boundary, so root layout.tsx (a server
// component) can render it safely.
export { ThemeProvider } from "@openuidev/react-ui/ThemeProvider";

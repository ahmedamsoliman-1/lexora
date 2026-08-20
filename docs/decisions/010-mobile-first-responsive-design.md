# ADR 010 — Mobile-First Responsive Design

**Status:** Accepted
**Date:** Post-Phase 7

## Context

The master plan (§51) originally specified "Lexora is primarily desktop-oriented
but must remain functional on mobile/tablet." However, the primary usage
pattern has shifted to mobile-first. The initial implementation had:

- A fixed sidebar always visible (`w-64`) — unusable on phones
- No mobile navigation (no hamburger menu, no top bar)
- Writing issue panel `hidden` on mobile with no alternative access
- No responsive padding or touch-target sizing

## Decision

Adopt a **mobile-first responsive design** with three breakpoints:

- **Mobile** (< `lg` / 1024px): Top bar with hamburger menu, slide-in sidebar
  drawer (Sheet), bottom-sheet writing issue panel, single-column layouts
- **Tablet** (`sm`–`lg`): Collapsible sidebar drawer, two-column grids
- **Desktop** (`lg`+): Fixed sidebar, multi-column layouts, side panel

### Layout architecture

```
WorkspaceShell (client component, manages drawer state)
├── Sidebar (desktop, hidden below lg)
├── MobileSidebar (Sheet drawer, hidden at lg+)
├── MobileTopBar (hamburger + brand, hidden at lg+)
└── main content (responsive padding: px-4 py-6 → lg:px-10 lg:py-10)
```

### Key components

- **`Sheet`** (`src/components/ui/sheet.tsx`): Radix Dialog-based slide-in
  drawer with overlay, used for both the mobile sidebar (left) and the writing
  issue panel (bottom).
- **`WorkspaceShell`** (`src/components/layout/workspace-shell.tsx`): Client
  component that manages `mobileSidebarOpen` state and renders the appropriate
  navigation for each breakpoint.
- **`MobileTopBar`** (`src/components/layout/mobile-top-bar.tsx`): Compact
  header with hamburger toggle and brand mark, hidden on desktop.
- **`Sidebar`** refactored to share `SidebarContent` between desktop (fixed
  `aside`) and mobile (Sheet), with `onNavigate` callback to auto-close the
  drawer on link click.

### Writing issue panel

- **Desktop**: Fixed right-column `aside` (`hidden lg:block`)
- **Mobile**: Bottom Sheet (`SheetContent side="bottom"`) with `max-h-[70vh]`,
  triggered by the same panel toggle button (which checks `window.innerWidth`
  to decide which mode to use)

### Touch targets

All navigation links and buttons use `py-2.5` on mobile (40px+ height) versus
`py-2` on desktop, meeting WCAG 2.5.5 minimum touch target size.

## Rationale

- Mobile-first ensures the app is genuinely usable on phones, not just
  "functional" — per the updated product direction.
- The Sheet pattern (slide-in drawer) is the standard mobile navigation
  pattern used by Linear, Notion, and other inspiration products.
- Sharing `SidebarContent` between desktop and mobile prevents drift —
  navigation items, projects list, and user footer are always identical.
- Auto-closing the drawer on navigation (`onNavigate`) prevents the common
  mobile UX trap where the drawer stays open after clicking a link.

## Consequences

- The workspace layout is now a client component (`WorkspaceShell`) because it
  manages drawer open/close state — the server component fetches data and
  passes it through.
- The prompt editor checks `window.innerWidth` for the issue panel toggle,
  which is safe because it's a click handler (client-only by definition).
- All pages inherit responsive padding from the shell — individual pages don't
  need their own `px-*` wrapper.
- The `Sheet` component is reusable for future mobile drawers (composer,
  search results, etc.).

## Alternatives Considered

- **Bottom tab bar** — common for consumer mobile apps but doesn't scale to
  Lexora's project-list navigation. Rejected.
- **Always-collapsed icon-only sidebar** — too cramped on phones. Rejected.
- **Separate mobile routes** — duplicated code and state. Rejected in favor
  of responsive components.

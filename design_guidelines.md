# RapidFunds Design Guidelines

## Design Approach

**Selected Approach:** Design System-Inspired Dashboard
**Primary References:** Linear (precision & polish), Notion (clarity & hierarchy), Stripe Dashboard (trust & professionalism)

**Key Design Principles:**
- Clarity over cleverness: Every element serves a functional purpose
- Systematic consistency: Predictable patterns reduce cognitive load
- Professional polish: Refined details build user confidence
- Efficiency-first: Minimize clicks, maximize information density

---

## Core Design Elements

### A. Color Palette

**Primary Brand Colors (Blue-Green Professional):**
- Primary Blue: 214 95% 50% (trust, action)
- Primary Green: 152 75% 45% (approval, success)
- Dark Navy: 220 40% 15% (primary text, dark mode bg)
- Slate: 215 20% 65% (secondary text)

**Status Colors:**
- Success Green: 142 70% 45%
- Warning Amber: 38 92% 50%
- Error Red: 0 84% 60%
- Pending Blue: 214 95% 50%

**Background System:**
- Light Mode: White (0 0% 100%), Light Gray (220 15% 98%)
- Dark Mode: Dark Navy (220 40% 15%), Charcoal (220 30% 20%)
- Elevated Surfaces: 220 25% 22% (dark), 0 0% 100% (light)

**Interactive States:**
- Hover: Reduce lightness by 5%
- Active: Reduce lightness by 10%
- Disabled: 50% opacity

### B. Typography

**Font Families:**
- Primary: Inter (UI, body text) - Google Fonts
- Headings: Inter SemiBold/Bold
- Monospace: JetBrains Mono (data, codes, IDs)

**Type Scale:**
- Display (Org Name): 2.5rem, Bold, tracking-tight
- H1 (Page Titles): 2rem, SemiBold, tracking-tight
- H2 (Section Headers): 1.5rem, SemiBold
- H3 (Card Titles): 1.125rem, Medium
- Body: 0.875rem, Regular, line-height 1.6
- Caption: 0.75rem, Regular, text-slate-500
- Label: 0.75rem, Medium, uppercase, tracking-wide

### C. Layout System

**Spacing Primitives:** Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16, 24
- Component padding: p-4, p-6 (cards)
- Section spacing: mb-8, mb-12
- Element gaps: gap-3, gap-4, gap-6
- Form fields: mb-4, mb-6

**Grid Structure:**
- Sidebar: 256px fixed width (collapsible to 64px icon-only)
- Main content: flex-1 with max-w-7xl container, px-6 py-8
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6
- Forms: max-w-2xl single column for focus

**Borders & Shadows:**
- Border radius: rounded (4px) for buttons, rounded-lg (8px) for cards, rounded-xl (12px) for modals
- Borders: 1px solid slate-200 (light), slate-700 (dark)
- Card shadow: shadow-sm hover:shadow-md transition-shadow
- Modal shadow: shadow-2xl

---

## D. Component Library

### Navigation

**Sidebar:**
- Fixed left, full height, bg-slate-900 (dark) / white (light)
- Logo at top (40px height, mb-8)
- Nav items: px-3 py-2, rounded-md, hover:bg-slate-800, active with left border accent
- Icons: 20px, align-left with text
- Active state: bg-blue-600, white text, 3px left border
- Section dividers for Admin Settings (border-top)

**Top Navbar:**
- Fixed top, bg-white (light) / bg-slate-900 (dark), border-bottom
- Height: 64px, px-6
- Left: Breadcrumbs (text-sm, text-slate-600)
- Right: User dropdown (avatar, name, org badge), notifications bell
- Organization badge: pill shape, bg-green-100, text-green-800, text-xs

### Dashboard Cards

**Stat Cards:**
- White background, rounded-lg, shadow-sm, p-6
- Icon (32px) in colored circle (bg-blue-100, text-blue-600)
- Value: text-3xl, font-bold, text-slate-900
- Label: text-sm, text-slate-600, uppercase, tracking-wide
- Trend indicator: small arrow with percentage (green up, red down)

**Request Cards:**
- Border-left accent (4px) based on status (blue=pending, green=approved, red=rejected)
- Header: title (font-semibold) + amount (text-lg, text-slate-900)
- Meta row: category badge, date, requester avatar
- Footer: action buttons (approve/reject for approvers, view for requesters)

### Forms

**Input Fields:**
- Label above: text-sm, font-medium, mb-2, text-slate-700
- Input: border, rounded-md, px-3 py-2, focus:ring-2 focus:ring-blue-500
- Helper text below: text-xs, text-slate-500
- Error state: border-red-500, text-red-600
- Disabled: bg-slate-50, cursor-not-allowed, opacity-60

**Dropdowns/Selects:**
- Match input styling
- Chevron icon right-aligned
- Dropdown menu: shadow-lg, rounded-md, max-h-60, overflow-auto
- Options: px-3 py-2, hover:bg-blue-50

**Buttons:**
- Primary: bg-blue-600, text-white, px-4 py-2, rounded-md, hover:bg-blue-700
- Secondary: border, border-slate-300, bg-white, hover:bg-slate-50
- Danger: bg-red-600, text-white
- Size variants: sm (px-3 py-1.5, text-sm), md (px-4 py-2), lg (px-6 py-3, text-lg)

**File Upload:**
- Dashed border, rounded-lg, p-8, text-center
- Upload icon (48px), text "Drag & drop or click to upload"
- File list below with preview thumbnails (48px), name, size, remove button

### Data Display

**Tables:**
- Striped rows (bg-slate-50 alternate)
- Header: bg-slate-100, font-semibold, text-left, px-4 py-3
- Cells: px-4 py-3, border-b
- Hover row: bg-blue-50
- Actions column: icon buttons (24px)

**Status Badges:**
- Pill shape, px-2.5 py-0.5, rounded-full, text-xs, font-medium
- Pending: bg-blue-100, text-blue-800
- Approved: bg-green-100, text-green-800
- Rejected: bg-red-100, text-red-800

**Org Chart Nodes:**
- Rounded-lg card, shadow-md, p-4, min-w-48
- Avatar at top (48px, centered)
- Name: font-semibold, text-center
- Role: text-sm, text-slate-600, text-center
- Department badge below
- Connectors: 2px solid lines, slate-300
- Drag handle: cursor-move, hover:shadow-lg
- Color coding by department: border-left 4px accent

### Modals & Overlays

**Modals:**
- Backdrop: bg-black/50, backdrop-blur-sm
- Container: max-w-2xl, bg-white, rounded-xl, shadow-2xl
- Header: px-6 py-4, border-b, text-xl font-semibold
- Body: px-6 py-4, max-h-96, overflow-y-auto
- Footer: px-6 py-4, border-t, flex justify-end gap-3

**Toasts/Notifications:**
- Fixed top-right, max-w-sm, rounded-lg, shadow-lg, p-4
- Success: bg-green-50, border-green-500, text-green-900
- Error: bg-red-50, border-red-500, text-red-900
- Auto-dismiss after 5s with progress bar

---

## E. Page-Specific Layouts

### Onboarding Screen
- Centered card (max-w-md), logo at top
- Progress indicator (if multi-step)
- Large, clear form labels
- Primary CTA button: full width

### Dashboard
- 3-column stat card grid at top
- Recent requests table below
- Quick action buttons (Create Request, View All)
- Activity feed in right sidebar (optional 2-column layout)

### Create/Edit Request
- Single column form, max-w-2xl
- Section headers with dividers
- Approver dropdown with avatar previews
- Checklist builder (add/remove items dynamically)
- AI summary display: bg-blue-50, border-l-4 border-blue-500, p-4, italic text

### Org Chart
- Full canvas view, bg-slate-50
- Toolbar at top: Add Person, Save Layout, Export
- Zoom controls bottom-right
- Mini-map bottom-left (optional)

### Admin Settings
- Tab navigation at top (Fields, Templates, Branding, Users)
- Two-column layout: form left, preview right
- Auto-save indicator (subtle green checkmark animation)

---

## Accessibility & Interactions

- Focus states: 2px ring, blue-500, offset-2
- Keyboard navigation: full support, visible focus indicators
- ARIA labels on icon-only buttons
- Minimum touch target: 44px × 44px
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Reduced motion: respect prefers-reduced-motion for animations

**Animations:** Use sparingly
- Page transitions: fade in (200ms)
- Button interactions: scale(0.98) on active
- Card hover: lift (translate-y -2px), shadow transition
- Loading states: subtle pulse or spinner (not flashy)

---

## Images

**Logo Placement:**
- Sidebar top: 40px × 40px square or 120px × 40px horizontal
- Login/onboarding: 60px × 60px centered above form

**User Avatars:**
- Default: circular, bg-gradient with initials
- Sizes: 24px (inline), 32px (nav), 48px (cards), 64px (profile)

**Empty States:**
- Simple illustrations (not required, can use icon + text)
- Centered, max-w-sm, text-slate-600
- Clear CTA button below

**No Large Hero Images** - This is a dashboard application focused on utility and data management, not a marketing site.
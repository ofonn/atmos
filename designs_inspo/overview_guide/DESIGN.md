# Design System Strategy: Atmos Proactive Weather Intelligence

## 1. Overview & Creative North Star

### Creative North Star: "The Celestial Curator"
This design system moves away from the utility-heavy, "dashboard" feel of traditional weather apps toward a high-end, editorial experience. It treats meteorological data not as a series of numbers, but as a proactive atmospheric narrative. 

To achieve a "premium" feel, we break the rigid grid through **intentional asymmetry** and **tonal depth**. We leverage the contrast between deep, nocturnal backgrounds and vibrant, frosted interactive layers. The interface should feel like a piece of high-tech glass floating in a diffused, color-rich nebula. This is not just a tool; it is an intelligent, visual forecast of the user’s day.

---

## 2. Colors

The palette is rooted in deep purples and electric blues, designed to feel both futuristic and authoritative.

### Palette Application
- **Primary Highlights:** Use `primary` (#c7bfff) and `secondary` (#acc7ff) for critical data points and active states.
- **Deep Surfaces:** The core background uses `surface` (#10131c) to provide maximum contrast for the glass elements.
- **Gradients:** Signature UI moments (Hero sections, Primary CTAs) should utilize a linear gradient from `primary` (#806EF8) to `secondary` (#5896FD) at a 135° angle.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely by background shifts or tonal transitions. To separate a "Today" view from a "Weekly" view, place a `surface-container-low` card on a `surface` background. 

### Surface Hierarchy & Nesting
Treat the UI as physical layers of frosted glass:
1.  **Base Layer:** `surface` (#10131c).
2.  **Section Layer:** `surface-container-low` (#181b24).
3.  **Actionable Cards:** `surface-container-high` (#272a33).
4.  **Floating Glass:** `primary-container` (#8f7fff) with 40% opacity and 20px backdrop-blur.

---

## 3. Typography

The typography strategy focuses on "Editorial Impact." We use extreme scale differences to guide the eye.

| Level | Token | Font Family | Size | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Plus Jakarta Sans | 3.5rem | High-impact weather headlines (e.g., "Thunderstorm") |
| **Headline**| `headline-md`| Plus Jakarta Sans | 1.75rem | Major weather metrics (e.g., "21°C") |
| **Title**   | `title-lg`   | Plus Jakarta Sans | 1.375rem | Section headers and card titles |
| **Body**    | `body-md`    | Plus Jakarta Sans | 0.875rem | Proactive advice and descriptions |
| **Label**   | `label-md`   | Inter | 0.75rem | Captions, timestamps, and secondary metadata |

**Typography Personality:** Use `display-lg` with tight letter-spacing (-0.02em) for a modern, sleek look. Labels should always use `inter` for maximum legibility in small-scale technical data.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved by "stacking" surface tiers. Avoid standard shadows for static elements. Place a `surface-container-highest` card atop a `surface-container` background to create a soft, natural lift.

### Glassmorphism & Depth
For the "Atmos" premium feel, floating containers must use:
- **Background:** `surface-variant` at 30–50% opacity.
- **Backdrop Blur:** 16px to 32px.
- **Inner Glow:** A 0.5px top-edge highlight using `outline-variant` at 20% opacity.

### Ambient Shadows
When a "floating" effect is required (e.g., the Proactive Assistant Popover), use an extra-diffused shadow:
- **Blur:** 40px - 60px.
- **Opacity:** 6% of `on-surface` (#e0e2ee).
- **Instruction:** Never use pure black shadows; they muddy the purple gradients.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (Primary to Secondary). Roundedness: `full`. No shadow.
- **Secondary:** `surface-container-highest` with a "Ghost Border" (10% opacity `outline-variant`).
- **Tertiary:** Text-only using `primary-fixed-dim` with a subtle hover background shift to `surface-bright`.

### Proactive Assistant Cards (Glassmorphism)
These are the signature of the system.
- **Styling:** `surface-container-lowest` at 40% opacity, `xl` (1.5rem) corner radius, 24px backdrop-blur. 
- **Content:** Use `title-md` for the insight and `body-sm` for the supporting data. 
- **Layout:** Use Spacing `5` (1.7rem) for internal padding to ensure the "Glass" feels airy and high-end.

### Meteorological Lists
- **Rule:** Forbid divider lines. 
- **Structure:** Use Spacing `3` (1rem) between items. Use a subtle background shift to `surface-container-low` for every second item to create a rhythmic "Zebra" striping without harsh lines.

### Atmospheric Chips
- **Selection:** `primary-container` background with `on-primary-container` text.
- **Styling:** `sm` (0.25rem) roundedness to contrast with the `xl` roundedness of cards, creating a technical, precise look.

---

## 6. Do's and Don'ts

### Do
- **Do** use white space as a structural element. If you think it needs a line, add 12px of padding instead.
- **Do** use `display-lg` typography to break the layout. Let text overlap background elements slightly to create a layered, editorial feel.
- **Do** ensure all text on glass surfaces meets AA accessibility standards by adjusting the backdrop opacity.

### Don't
- **Don't** use 100% opaque, high-contrast borders. It breaks the "Celestial" illusion.
- **Don't** use standard Material or iOS "System" shadows.
- **Don't** use pure black (#000000) for backgrounds. Stick to the deep blue-ink of `surface` (#10131c) to maintain tonal richness.
- **Don't** overcrowd cards. If more than 4 data points exist, move them to a nested "Surface-Container" tier.
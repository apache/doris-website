# Homepage Redesign Plan

## Goal

Redesign the Apache Doris official homepage while keeping the existing homepage intact during development.
The final URL must remain `/` (no redirects, no SEO impact).

---

## Architecture: localStorage Version Toggle

The same `/` route renders either the classic or new homepage based on a localStorage flag.

```
URL: /  (unchanged throughout all phases)
 ├─ Default (no flag): Classic homepage + floating "Try New Design" button
 └─ Flag set:          New homepage + floating "Back to Classic" button

localStorage key: doris-home-version
localStorage value: 'v2' → new | anything else → classic
```

### Why localStorage (not URL params or separate route)

- URL stays `/` → SEO continuity, no redirects needed at launch
- Persists across page refreshes → consistent UX for testers
- Zero impact on existing pages/routing
- Clean removal: delete toggle logic + classic component when done

---

## File Structure

```
src/
├── pages/
│   └── index.tsx                        ← Modified: version toggle logic added
│
└── components/
    ├── home-next/                       ← New homepage (built incrementally)
    │   ├── HomeNext.tsx                 ← Root component, assembles all sections
    │   ├── HomeNext.scss                ← Global styles for new homepage
    │   └── sections/
    │       ├── HeroSection.tsx          ← Banner / headline
    │       ├── StatsSection.tsx         ← Key metrics / achievement banner
    │       ├── FeaturesSection.tsx      ← Core capabilities
    │       ├── UseCasesSection.tsx      ← Unified data warehouse use cases
    │       ├── CommunitySection.tsx     ← Connect with community
    │       └── GetStartedSection.tsx    ← CTA / get started
    │
    └── home-version-toggle/
        └── HomeVersionToggle.tsx        ← Floating toggle button (fixed position)
```

---

## index.tsx Toggle Logic

```tsx
export default function Home(): JSX.Element {
    const [isV2, setIsV2] = useState(false);

    useEffect(() => {
        // SSR-safe: only read localStorage on client
        setIsV2(localStorage.getItem('doris-home-version') === 'v2');
    }, []);

    const handleToggle = (v2: boolean) => {
        if (v2) {
            localStorage.setItem('doris-home-version', 'v2');
        } else {
            localStorage.removeItem('doris-home-version');
        }
        setIsV2(v2);
    };

    if (isV2) {
        return <HomeV2 onSwitchBack={() => handleToggle(false)} />;
    }
    return <HomeClassic onTryNew={() => handleToggle(true)} />;
}
```

- `HomeClassic` = the existing homepage code, extracted verbatim into its own component
- `HomeV2` = new homepage, built section by section
- Both receive a callback prop to trigger the switch

---

## Phased Development

### Phase 1 — Skeleton (current)
- Extract existing homepage into `HomeClassic`
- Create `HomeV2` with placeholder sections (correct layout, no real content yet)
- Add `HomeVersionToggle` floating button
- Wire up `index.tsx` toggle logic

### Phase 2 — Section-by-section redesign
- Replace each placeholder in `HomeV2/sections/` with real design
- Work one section at a time; test via "Try New Design" button

### Phase 3 — Launch
Make `HomeV2` the default by flipping one line in `index.tsx`:

```tsx
// Change from:
setIsV2(localStorage.getItem('doris-home-version') === 'v2');

// To:
setIsV2(localStorage.getItem('doris-home-version') !== 'classic');
```

### Phase 4 — Cleanup (after soak period)
1. Replace `index.tsx` export entirely:
   ```tsx
   export { default } from '../components/home-v2/HomeV2';
   ```
2. Delete `src/components/home-classic/`
3. Delete `src/components/home-version-toggle/`
4. Remove toggle props from `HomeV2`

---

## Toggle Button Design

- **Position**: fixed, bottom-right corner (`fixed bottom-6 right-6`)
- **Classic view**: green pill button — "✨ Try New Design"
- **New view**: subtle outline button — "← Back to Classic"
- Not rendered during SSR (avoids hydration mismatch)

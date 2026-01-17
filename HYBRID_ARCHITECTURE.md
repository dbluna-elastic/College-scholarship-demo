# Hybrid Vanilla/React Architecture

## Phase 3: Architecture Overview

This application uses a **hybrid architecture** that combines vanilla JavaScript modules with React components, sharing state through a common template system.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Application Load                      │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  1. Template Engine (Vanilla)                           │
│     - Detects template (URL, subdomain, env)            │
│     - Sets window.currentTemplate                        │
│     - Applies CSS variables                              │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  2. Vanilla Modules Initialization                      │
│     - navigation.js (DOM manipulation, event listeners)  │
│     - analytics.js (tracking, metrics)                  │
│     - Other vanilla utilities                            │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  3. React App Mount                                     │
│     - TemplateContext reads window.currentTemplate      │
│     - React components render with template data         │
│     - React and vanilla modules coexist                 │
└─────────────────────────────────────────────────────────┘
```

## State Sharing

### Template State

The template state is shared between vanilla and React through:

1. **Global Object**: `window.currentTemplate` (set by templateEngine)
2. **React Context**: `TemplateContext` (reads from `window.currentTemplate`)
3. **Events**: `templateChanged` event for reactive updates

### Example: Accessing Template in Vanilla Module

```javascript
import { getCurrentTemplate } from '../config/templateEngine.js';

const template = getCurrentTemplate();
console.log(template.branding.institutionName);
```

### Example: Accessing Template in React Component

```jsx
import { useContext } from 'react';
import { TemplateContext } from './context/TemplateContext.jsx';

function MyComponent() {
    const template = useContext(TemplateContext);
    return <h1>{template.branding.institutionName}</h1>;
}
```

## File Structure

```
js/
├── main.js                    # Entry point - orchestrates initialization
├── config/
│   └── templateEngine.js      # Template detection & management (vanilla)
├── modules/                   # Vanilla JavaScript modules
│   ├── navigation.js          # Navigation logic (vanilla)
│   ├── analytics.js           # Analytics tracking (vanilla)
│   └── utils/
│       └── getEnvVar.js       # Environment helper
└── react/                     # React components
    ├── index.jsx              # React mount point
    ├── App.jsx                # Main React component
    └── context/
        └── TemplateContext.jsx # Template context provider
```

## Initialization Order

The initialization happens in this specific order:

1. **Template Engine** - Must initialize first to set up branding/theme
2. **Vanilla Modules** - Initialize any vanilla JS modules that need template state
3. **React App** - Mount React components after vanilla modules are ready

This order ensures:
- Template is available when modules initialize
- CSS variables are set before React renders
- Vanilla modules can set up event listeners before React mounts

## Coexistence Patterns

### Pattern 1: Vanilla Modules + React Components

Vanilla modules handle:
- DOM manipulation outside React's control
- Event listeners on document/window
- Third-party library integration
- Performance-critical operations

React components handle:
- Complex UI state management
- Component composition
- Form handling
- Interactive UI elements

### Pattern 2: Shared Event System

Both vanilla and React can listen to template changes:

```javascript
// Vanilla module
window.addEventListener('templateChanged', (event) => {
    const template = event.detail.template;
    // Update vanilla module state
});
```

```jsx
// React component
useEffect(() => {
    const handler = (event) => {
        const template = event.detail.template;
        // React will re-render via context
    };
    window.addEventListener('templateChanged', handler);
    return () => window.removeEventListener('templateChanged', handler);
}, []);
```

## Best Practices

1. **Template First**: Always initialize template engine before other modules
2. **Global State**: Use `window.currentTemplate` for vanilla, `TemplateContext` for React
3. **Event-Driven**: Use `templateChanged` events for reactive updates
4. **Separation of Concerns**: Keep vanilla modules focused on their domain
5. **No Direct DOM Manipulation in React**: Let React manage its own DOM subtree

## Testing the Hybrid Architecture

1. **Check Console**: You should see initialization logs in order:
   ```
   🚀 Application initialized
   🎨 Template Engine initialized: Default (default)
   ✅ Template engine initialized: Default
   🧭 Navigation module initialized
   📊 Analytics module initialized
   ✅ Vanilla modules initialized
   ⚛️ React app mounted successfully
   ⚛️ React App mounted with template: Default
   ```

2. **Template Switching**: Change template via URL parameter:
   ```
   http://localhost:8080?template=texas
   ```
   Both vanilla modules and React should update.

3. **State Verification**: Open browser console and check:
   ```javascript
   window.currentTemplate  // Should show current template object
   ```

## Troubleshooting

### React not mounting
- Check that `#app` element exists in HTML
- Verify Vite React plugin is configured
- Check browser console for errors

### Template not available in React
- Ensure template engine initializes before React mount
- Verify `TemplateContext` is reading from `window.currentTemplate`
- Check that template engine sets `window.currentTemplate`

### Vanilla modules not updating
- Verify modules are listening to `templateChanged` event
- Check that modules are importing `getCurrentTemplate` correctly
- Ensure template engine dispatches events properly

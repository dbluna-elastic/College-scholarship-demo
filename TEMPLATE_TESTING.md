# Template Engine Testing Guide

## Phase 2: Template Engine Implementation

The template engine allows the application to switch between different branding and content configurations based on multiple detection strategies.

## Template Detection Strategies

The template engine tries these methods in order:

1. **URL Parameter**: `?template=texas`
2. **Subdomain**: `texas.example.com`
3. **Environment Variable**: `TEMPLATE_ID=texas`
4. **Default Fallback**: Uses `default` template

## Available Templates

- `default` - Generic fallback template
- `texas` - Texas-specific branding (Blue & Orange)
- `oklahoma` - Oklahoma-specific branding (Crimson & Cream)

## Testing Template Switching

### Method 1: URL Parameter (Easiest for Testing)

1. **Default Template:**
   ```
   http://localhost:8080
   ```

2. **Texas Template:**
   ```
   http://localhost:8080?template=texas
   ```

3. **Oklahoma Template:**
   ```
   http://localhost:8080?template=oklahoma
   ```

### Method 2: Environment Variable

Add to your `.env` file:
```bash
TEMPLATE_ID=texas
```

Then rebuild and restart:
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Method 3: Subdomain (Production)

In production, configure DNS to point:
- `texas.yourdomain.com` → Your server
- `oklahoma.yourdomain.com` → Your server

The template engine will automatically detect the subdomain.

## What Changes with Each Template

Each template provides:

1. **Branding:**
   - Institution name
   - Tagline
   - Logo path

2. **Content:**
   - Hero title
   - Hero subtitle
   - CTA button text
   - State-specific messaging

3. **Colors:**
   - Primary color (applied as CSS variable)
   - Secondary color
   - Warning color
   - Background colors

4. **Elastic Configuration:**
   - Agent ID (can be overridden via environment)

## Browser Console

Open your browser's developer console to see:
- Template initialization messages
- Template switching events
- Environment variable checks

Example console output:
```
🚀 Application initialized
🎨 Template Engine initialized: Texas (texas)
✅ Template applied to page: Texas
```

## Programmatic Template Switching

You can also switch templates programmatically in the browser console:

```javascript
import { switchTemplate } from './js/config/templateEngine.js';
switchTemplate('texas');
```

This will trigger a `templateChanged` event that updates the page automatically.

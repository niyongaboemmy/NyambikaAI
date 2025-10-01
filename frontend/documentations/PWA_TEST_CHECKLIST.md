# PWA Installation - Testing Checklist

## Pre-Testing Setup

### Environment Validation
- [ ] Application runs on HTTPS (or localhost for development)
- [ ] All dependencies installed (`npm install`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Service worker files generated in `/public`
- [ ] Manifest.json is valid and accessible at `/manifest.json`

### Required Files Check
```bash
# Verify these files exist:
ls -la public/manifest.json
ls -la public/sw.js
ls -la public/workbox-*.js
ls -la public/*icon*.png
```

---

## Development Testing

### 1. Console Debugging (Chrome DevTools)

```javascript
// Open Console and run these checks:

// 1. Check HTTPS
console.log('HTTPS:', window.location.protocol === 'https:');

// 2. Check Service Worker
console.log('SW Support:', 'serviceWorker' in navigator);

// 3. Check Manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => console.log('Manifest:', m))
  .catch(e => console.error('Manifest Error:', e));

// 4. Check Service Worker Registration
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW Registrations:', regs));

// 5. Check if already installed
console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches);

// 6. Listen for beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ beforeinstallprompt fired!', e);
});
```

### 2. Application Panel (Chrome DevTools)

#### Manifest Tab
- [ ] Name: "Nyambika - AI Fashion Try-On"
- [ ] Short name: "Nyambika"
- [ ] Start URL: "/"
- [ ] Display: "standalone"
- [ ] Theme color: "#6366f1"
- [ ] Background color: "#0f0f23"
- [ ] Icons: At least 192x192 and 512x512
- [ ] No errors or warnings

#### Service Workers Tab
- [ ] Service worker is activated and running
- [ ] Skip waiting checkbox available
- [ ] Update on reload works
- [ ] No errors in service worker logs

#### Storage Tab
- [ ] localStorage contains theme preferences
- [ ] Can clear site data successfully
- [ ] No quota exceeded errors

---

## Desktop Testing (Chrome/Edge)

### Initial Installation Flow

#### Step 1: Load Application
- [ ] Open application in Chrome/Edge
- [ ] Wait 5 seconds for install prompt
- [ ] Install banner appears in bottom-left corner
- [ ] Banner shows "Install Nyambika" heading
- [ ] Platform icon shows desktop monitor
- [ ] "Install Now" button is visible

#### Step 2: Installation Banner
- [ ] Banner is dismissible with X button
- [ ] "Not Now" button works
- [ ] Dismissal saves to localStorage
- [ ] Banner doesn't reappear after dismissal (same session)
- [ ] Banner reappears after 7 days (test with localStorage manipulation)

#### Step 3: Native Install Prompt
- [ ] Click "Install Now" button
- [ ] Native browser prompt appears
- [ ] App icon displays in prompt
- [ ] App name shows correctly
- [ ] URL shows in prompt
- [ ] "Install" button works
- [ ] "Cancel" button works

#### Step 4: Post-Installation
- [ ] App icon appears on desktop/dock
- [ ] App icon appearance matches design
- [ ] Double-clicking icon launches app
- [ ] App opens in standalone window (no browser UI)
- [ ] Window title shows "Nyambika"
- [ ] Window icon matches app icon

### Manual Instructions (Fallback)

#### When beforeinstallprompt doesn't fire:
- [ ] "How to Install" button visible
- [ ] Clicking opens modal with instructions
- [ ] Modal shows desktop-specific steps
- [ ] Modal has gradient header
- [ ] Benefits section lists 4 items
- [ ] Numbered steps (1-3) are clear
- [ ] Close button works
- [ ] Clicking backdrop closes modal

### Installed App Testing
- [ ] App launches in standalone mode
- [ ] No browser address bar visible
- [ ] Navigation works correctly
- [ ] External links open in browser
- [ ] Offline functionality works
- [ ] App updates when online
- [ ] Theme persists across sessions
- [ ] Can uninstall from chrome://apps

---

## Mobile Testing (Android)

### Chrome on Android

#### Step 1: Initial Load
- [ ] Open app in Chrome on Android
- [ ] Wait 5 seconds for install prompt
- [ ] Install banner appears at bottom
- [ ] Banner is full-width on mobile
- [ ] Shows smartphone icon
- [ ] Text is readable on small screen

#### Step 2: beforeinstallprompt Event
- [ ] Event fires automatically (check via USB debugging)
- [ ] Banner appears after delay
- [ ] "Install Now" button visible
- [ ] "Not Now" button visible
- [ ] Dismissal works correctly

#### Step 3: Native Prompt
- [ ] Tap "Install Now"
- [ ] Android native prompt appears
- [ ] App icon displays
- [ ] App name correct
- [ ] Install button works
- [ ] Prompt can be cancelled

#### Step 4: Home Screen
- [ ] Icon appears on home screen
- [ ] Icon matches design
- [ ] Long-press shows app info
- [ ] App info shows correct details
- [ ] Icon is not pixelated

#### Step 5: Launch Experience
- [ ] Tapping icon launches app
- [ ] Splash screen shows (if configured)
- [ ] App opens in fullscreen
- [ ] Status bar matches theme
- [ ] Navigation bar matches theme
- [ ] No browser UI visible

### Manual Instructions (Samsung Internet / Other)
- [ ] Instructions button shows for unsupported browsers
- [ ] Modal explains Android-specific steps
- [ ] Three-dot menu icon shown
- [ ] "Add to Home screen" mentioned
- [ ] Steps are numbered clearly

---

## Mobile Testing (iOS)

### Safari on iOS

#### Step 1: Detection
- [ ] App detects iOS correctly
- [ ] Desktop beforeinstallprompt does NOT fire
- [ ] iOS-specific prompt appears after 5 seconds
- [ ] "How to Install" button visible

#### Step 2: Manual Instructions
- [ ] Click "How to Install"
- [ ] Modal opens with iOS instructions
- [ ] Share button icon displayed
- [ ] "Add to Home Screen" step clear
- [ ] Plus icon shown in instructions
- [ ] Three numbered steps
- [ ] Safari compatibility note visible

#### Step 3: Following Instructions
Manual testing required:
- [ ] Tap Safari Share button (bottom center)
- [ ] Scroll down in share sheet
- [ ] "Add to Home Screen" option visible
- [ ] Tap "Add to Home Screen"
- [ ] Customization screen appears
- [ ] App name is editable
- [ ] URL shows
- [ ] App icon preview displays

#### Step 4: Home Screen Icon
- [ ] Icon appears on home screen
- [ ] Icon matches design (not pixelated)
- [ ] Icon doesn't have "Open in Safari" indicator
- [ ] Long-press works (iOS 13+)
- [ ] Can remove icon
- [ ] Can rearrange icon

#### Step 5: Launch Experience
- [ ] Tapping icon launches app
- [ ] Opens without Safari UI
- [ ] Status bar style matches configuration
- [ ] Viewport matches standalone mode
- [ ] Swipe navigation disabled
- [ ] Back gesture works within app

### iPad Safari
Same as iPhone testing, but additionally:
- [ ] Layout adapts to iPad screen
- [ ] Modal doesn't look stretched
- [ ] Touch targets are appropriate size
- [ ] Landscape mode works

---

## Cross-Browser Testing

### Supported Browsers

| Browser | Version | Install Support | Status |
|---------|---------|----------------|--------|
| Chrome Desktop | Latest | ✅ Full | [ ] Tested |
| Edge Desktop | Latest | ✅ Full | [ ] Tested |
| Chrome Android | Latest | ✅ Full | [ ] Tested |
| Safari iOS | Latest | ⚠️ Manual | [ ] Tested |
| Safari macOS | Latest | ❌ None | [ ] Tested |
| Firefox Desktop | Latest | ❌ None | [ ] Tested |
| Firefox Android | Latest | ❌ None | [ ] Tested |
| Samsung Internet | Latest | ✅ Full | [ ] Tested |

### Unsupported Browser Behavior
- [ ] No errors in console
- [ ] App still functions normally
- [ ] Install prompt doesn't show
- [ ] No JavaScript errors
- [ ] Graceful degradation

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through install banner elements
- [ ] Focus indicators visible
- [ ] Enter key activates buttons
- [ ] Escape key closes modal
- [ ] Tab order is logical
- [ ] No keyboard traps

### Screen Reader (NVDA/JAWS/VoiceOver)
- [ ] Banner is announced
- [ ] Button purposes are clear
- [ ] Modal title is announced
- [ ] Instructions are readable
- [ ] Close button is identifiable
- [ ] ARIA labels present and correct

### Visual
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Text is readable at 200% zoom
- [ ] Icons have text alternatives
- [ ] Focus indicators are visible
- [ ] No color-only information

### Motor
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] Buttons have appropriate padding
- [ ] No accidental activations
- [ ] Swipe gestures work
- [ ] Double-tap doesn't trigger

---

## Performance Testing

### Metrics to Track
```javascript
// Measure impact of install prompt

// 1. Bundle size increase
const promptSize = /* size of InstallPrompt.tsx after minification */;
console.log('Prompt bundle size:', promptSize);

// 2. Render time
performance.mark('prompt-render-start');
// Render InstallPrompt component
performance.mark('prompt-render-end');
performance.measure('prompt-render', 'prompt-render-start', 'prompt-render-end');

// 3. Event listener overhead
console.time('event-listeners');
// Setup beforeinstallprompt listeners
console.timeEnd('event-listeners');
```

### Performance Checklist
- [ ] Prompt renders within 16ms (1 frame)
- [ ] No jank when banner appears
- [ ] Modal opens smoothly (no stutter)
- [ ] Animations are 60fps
- [ ] No memory leaks
- [ ] Event listeners cleaned up properly
- [ ] localStorage access is throttled

### Lighthouse Audit
Run in Chrome DevTools:
- [ ] PWA score: ≥ 90
- [ ] Installable: ✅ Pass
- [ ] Service worker registered: ✅ Pass
- [ ] Viewport meta tag: ✅ Pass
- [ ] Themed omnibox: ✅ Pass
- [ ] Manifest valid: ✅ Pass

---

## Offline Testing

### Service Worker Caching
- [ ] Turn off network
- [ ] Refresh page
- [ ] App loads from cache
- [ ] Images load from cache
- [ ] Navigation works offline
- [ ] "Offline" indicator shows (if implemented)

### Installed App Offline
- [ ] Launch installed app
- [ ] Turn off network
- [ ] App continues to work
- [ ] Cached content displays
- [ ] Offline fallback shows for network requests

---

## Edge Cases

### Already Installed
- [ ] Open installed app
- [ ] Install prompt doesn't show
- [ ] `isStandalone()` returns true
- [ ] No console errors
- [ ] App functions normally

### Dismissed Multiple Times
- [ ] Dismiss prompt
- [ ] Close app
- [ ] Reopen within 7 days
- [ ] Prompt doesn't show
- [ ] After 7 days, prompt shows again

### Slow Network
- [ ] Throttle to Slow 3G
- [ ] Load application
- [ ] Install prompt still appears
- [ ] Manifest loads successfully
- [ ] Icons load successfully

### Service Worker Update
- [ ] Deploy new version
- [ ] Open installed app
- [ ] Service worker updates
- [ ] No errors during update
- [ ] App continues to function

### Multiple Tabs
- [ ] Open app in multiple tabs
- [ ] Dismiss in one tab
- [ ] Check if dismissed in other tabs
- [ ] Install in one tab
- [ ] Verify state in other tabs

---

## Security Testing

### HTTPS Enforcement
- [ ] App only works on HTTPS
- [ ] HTTP redirects to HTTPS (production)
- [ ] localhost works for development
- [ ] No mixed content warnings
- [ ] Service worker only registers on HTTPS

### Content Security Policy
- [ ] Inline scripts have nonces
- [ ] External resources whitelisted
- [ ] No CSP violations in console
- [ ] Service worker respects CSP

### Permissions
- [ ] No unnecessary permissions requested
- [ ] Notification permission (if implemented) has clear purpose
- [ ] Location permission (if implemented) explains why
- [ ] Camera permission (if implemented) only when needed

---

## Analytics Validation

### Event Tracking
Monitor these events in Google Analytics:

1. **pwa_installed**
   - [ ] Fires when app installed
   - [ ] Correct platform label (ios/android/desktop)
   - [ ] Timestamp is accurate

2. **pwa_install_choice**
   - [ ] Fires after native prompt
   - [ ] Outcome is 'accepted' or 'dismissed'
   - [ ] Platform is tracked

3. **pwa_install_dismissed**
   - [ ] Fires when banner dismissed
   - [ ] Platform is tracked
   - [ ] Timestamp is accurate

4. **pwa_install_error**
   - [ ] Fires on installation failure
   - [ ] Error message is logged
   - [ ] Platform is tracked

### Conversion Tracking
- [ ] Track install prompt impressions
- [ ] Track install button clicks
- [ ] Calculate conversion rate
- [ ] Track by platform
- [ ] Track by dismissal reason

---

## Regression Testing

### After Code Changes
- [ ] Prompt still appears correctly
- [ ] Platform detection still works
- [ ] Native prompt still fires
- [ ] Modal still opens
- [ ] Theme compatibility maintained
- [ ] No new console errors
- [ ] Analytics still working

### After Next.js Update
- [ ] Service worker still generates
- [ ] Manifest still serves
- [ ] Build completes successfully
- [ ] No warnings about PWA
- [ ] Install functionality intact

---

## Production Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Lighthouse PWA score ≥ 90
- [ ] Analytics tracking verified
- [ ] Icons optimized and correct sizes
- [ ] Manifest validated
- [ ] Service worker tested

### Post-Deployment
- [ ] Test on production URL
- [ ] HTTPS certificate valid
- [ ] Manifest serves with correct MIME type
- [ ] Service worker registers
- [ ] Install prompt appears
- [ ] Can successfully install
- [ ] Analytics events fire
- [ ] No 404s for PWA assets

### Monitoring
- [ ] Set up alerts for failed installations
- [ ] Monitor install conversion rate
- [ ] Track service worker errors
- [ ] Monitor offline functionality
- [ ] Track uninstall rate (if possible)

---

## Documentation

### For Users
- [ ] Installation guide published
- [ ] Platform-specific instructions clear
- [ ] Screenshots included
- [ ] Troubleshooting section
- [ ] Benefits clearly explained

### For Developers
- [ ] Technical documentation complete
- [ ] Architecture documented
- [ ] Testing procedures documented
- [ ] Deployment guide ready
- [ ] Maintenance procedures defined

---

## Sign-Off

### Development Team
- [ ] Component implementation approved
- [ ] Code review completed
- [ ] Tests passing
- [ ] Documentation reviewed

### QA Team
- [ ] All test cases executed
- [ ] Edge cases verified
- [ ] Cross-browser tested
- [ ] Accessibility validated

### Product Team
- [ ] UX reviewed and approved
- [ ] Analytics configured
- [ ] User documentation ready
- [ ] Success metrics defined

---

## Notes

### Known Issues
_Document any known issues here_

### Browser-Specific Quirks
_Document browser-specific behaviors_

### Future Improvements
_List potential enhancements_

---

**Testing Completed By**: _______________  
**Date**: _______________  
**Version**: _______________  
**Build**: _______________

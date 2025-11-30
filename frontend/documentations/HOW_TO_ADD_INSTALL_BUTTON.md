# How to Add the Install App Button

The `InstallAppButton` component provides a persistent, always-visible way for users to install your PWA. This ensures users can discover the installation feature even if they miss the automatic prompt.

## Quick Start

### 1. Import the Component

```typescript
import { InstallAppButton } from '@/components/InstallAppButton'
```

### 2. Add to Your Navigation/Header

Choose the location that best fits your app's design:

#### Option A: In the Main Navigation (Recommended)

**File**: `/src/components/RoleBasedNavigation.tsx` or your navigation component

```tsx
<nav className="flex items-center gap-4">
  {/* Your existing nav items */}
  <Link href="/">Home</Link>
  <Link href="/about">About</Link>

  {/* Add the install button */}
  <InstallAppButton variant="compact" />
</nav>
```

#### Option B: In the Header

**File**: `/src/components/Header.tsx` or similar

```tsx
<header className="flex justify-between items-center p-4">
  <Logo />

  <div className="flex items-center gap-3">
    {/* Other header items */}
    <InstallAppButton variant="compact" />
  </div>
</header>
```

#### Option C: In the User Menu/Profile Dropdown

```tsx
<DropdownMenu>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />

    {/* Add as a menu item */}
    <DropdownMenuItem asChild>
      <InstallAppButton variant="compact" className="w-full" />
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Option D: Floating Action Button (Mobile)

```tsx
{
  /* For mobile-specific placement */
}
;<div className="lg:hidden fixed bottom-4 right-4 z-40">
  <InstallAppButton variant="icon-only" />
</div>
```

---

## Available Variants

### 1. Default (Full Button)

```tsx
<InstallAppButton />
```

- **Best for**: Desktop navigation, headers
- **Appearance**: Full button with icon and "Install App" text
- **Size**: Medium (px-4 py-2)

### 2. Compact (Smaller Button)

```tsx
<InstallAppButton variant="compact" />
```

- **Best for**: Crowded navigation bars, mobile headers
- **Appearance**: Smaller button with icon and "Install" text
- **Size**: Small (px-3 py-1.5, text-sm)

### 3. Icon Only (Minimal)

```tsx
<InstallAppButton variant="icon-only" />
```

- **Best for**: Floating action buttons, toolbars
- **Appearance**: Just the download icon in a circular button
- **Size**: Icon only (p-2, rounded-full)

---

## Customization

### Custom Styling

```tsx
<InstallAppButton variant="compact" className="your-custom-classes" />
```

### Responsive Behavior

Show different variants based on screen size:

```tsx
{
  /* Mobile: Icon only */
}
;<div className="md:hidden">
  <InstallAppButton variant="icon-only" />
</div>

{
  /* Desktop: Full button */
}
;<div className="hidden md:block">
  <InstallAppButton variant="default" />
</div>
```

---

## Real-World Examples

### Example 1: E-commerce Site Navigation

```tsx
// In your navigation component
<nav className="flex items-center justify-between p-4 bg-white dark:bg-gray-900">
  <Logo />

  <div className="flex items-center gap-4">
    <Link href="/products">Products</Link>
    <Link href="/cart">Cart</Link>

    {/* Install button visible to all users */}
    <InstallAppButton variant="compact" />

    <UserMenu />
  </div>
</nav>
```

### Example 2: Mobile-First App

```tsx
// Mobile header with hamburger menu
;<header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-sm z-50">
  <div className="flex items-center justify-between p-4">
    <MenuButton />
    <Logo />

    {/* Compact install button for mobile */}
    <InstallAppButton variant="compact" className="text-xs" />
  </div>
</header>

{
  /* Floating button for additional visibility */
}
;<div className="fixed bottom-6 right-6 lg:hidden">
  <InstallAppButton variant="icon-only" />
</div>
```

### Example 3: Settings Page

```tsx
// In settings or profile page
<div className="space-y-6">
  <h2>App Settings</h2>

  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div>
      <h3 className="font-medium">Install App</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Install Nyambika for faster access and offline support
      </p>
    </div>

    <InstallAppButton variant="default" />
  </div>
</div>
```

---

## Behavior

### What Happens When Clicked?

1. **If native prompt is available** (Chrome/Edge):

   - Triggers the browser's native install dialog
   - User can install directly

2. **If native prompt is NOT available** (iOS Safari, Firefox):

   - Shows the InstallPrompt modal
   - Displays platform-specific instructions
   - Guides user through manual installation

3. **If already installed**:
   - Button automatically hides
   - No action needed

### Automatic Hiding

The button will automatically hide when:

- ✅ App is already installed (standalone mode)
- ✅ User has just installed the app

---

## Integration with InstallPrompt

The `InstallAppButton` and `InstallPrompt` work together:

1. **InstallPrompt** (automatic):

   - Shows after 3-second delay
   - Can be dismissed
   - Respects 7-day dismissal period
   - Bottom banner on desktop/mobile

2. **InstallAppButton** (manual):
   - Always visible (until installed)
   - User can click anytime
   - Bypasses dismissal restrictions
   - Triggers the prompt immediately

**Best Practice**: Use both!

- Automatic prompt: For users who don't notice the button
- Manual button: For users who want to install later

---

## Recommended Placements

### Priority 1: Main Navigation ⭐⭐⭐

```tsx
<InstallAppButton variant="compact" />
```

**Why**: Most visible, always accessible

### Priority 2: User Menu/Profile ⭐⭐

```tsx
<InstallAppButton variant="compact" />
```

**Why**: Users expect app-related settings here

### Priority 3: Settings Page ⭐⭐

```tsx
<InstallAppButton variant="default" />
```

**Why**: Users looking for features will find it

### Priority 4: Floating Button (Mobile) ⭐

```tsx
<InstallAppButton variant="icon-only" />
```

**Why**: Additional visibility on mobile devices

---

## Testing

### How to Test the Button

1. **Development**:

   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

2. **Check visibility**:

   - Button should appear in your chosen location
   - Button should NOT appear if app is already installed

3. **Test clicking**:

   - Click button
   - Verify prompt/modal appears
   - Check platform-specific instructions

4. **Test on different platforms**:
   - Chrome Desktop: Native prompt should appear
   - iOS Safari: Instructions modal should appear
   - Android Chrome: Native prompt should appear

---

## Styling Tips

### Match Your Brand

```tsx
<InstallAppButton className="bg-gradient-to-r from-your-brand-500 to-your-accent-600" />
```

### Light/Dark Theme Adaptation

The button automatically adapts to your theme! No extra configuration needed.

### Custom Gradient

```tsx
<InstallAppButton className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />
```

### Rounded Corners

```tsx
<InstallAppButton
  className="rounded-full" // More rounded
/>
```

---

## Accessibility

The button is fully accessible:

- ✅ Proper ARIA labels
- ✅ Keyboard navigable (Tab + Enter)
- ✅ Screen reader friendly
- ✅ Focus indicators
- ✅ Descriptive title attribute

---

## Analytics Integration

The button automatically tracks:

- Click events
- Installation outcomes
- Platform detection

Same analytics as the automatic `InstallPrompt` component.

---

## FAQ

### Q: Where should I place it?

**A**: Main navigation is best. It's always visible and users expect action buttons there.

### Q: Can I use multiple buttons?

**A**: Yes! You can place it in multiple locations. All buttons will hide when the app is installed.

### Q: What if users dismiss the automatic prompt?

**A**: The button remains visible, giving users another chance to install.

### Q: Does it work on all platforms?

**A**: Yes! It adapts to each platform's installation method.

### Q: Can I customize the colors?

**A**: Yes! Use the `className` prop to override default styles.

---

## Complete Example

Here's a complete example showing all recommended placements:

```tsx
// src/components/Layout.tsx
import { InstallAppButton } from '@/components/InstallAppButton'

export function Layout({ children }) {
  return (
    <div className="min-h-screen">
      {/* Header with install button */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow">
        <nav className="container mx-auto flex items-center justify-between p-4">
          <Logo />

          <div className="hidden md:flex items-center gap-4">
            <Link href="/products">Products</Link>
            <Link href="/about">About</Link>

            {/* Desktop: Compact button */}
            <InstallAppButton variant="compact" />

            <UserMenu />
          </div>

          {/* Mobile: Icon only in header */}
          <div className="md:hidden flex items-center gap-2">
            <InstallAppButton variant="icon-only" />
            <MobileMenu />
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer>...</footer>

      {/* Optional: Mobile floating button for extra visibility */}
      <div className="fixed bottom-20 right-4 lg:hidden z-40">
        <InstallAppButton variant="icon-only" className="shadow-2xl" />
      </div>
    </div>
  )
}
```

---

**Remember**: The goal is to make the PWA installation feature **discoverable** without being **intrusive**. The button provides a persistent, user-controlled way to install your app!

🎯 **Next Step**: Add `<InstallAppButton variant="compact" />` to your navigation component now!

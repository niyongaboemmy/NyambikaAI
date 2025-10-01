# Quick Start: Add Install Button to Your Navigation

## 🚀 3-Minute Setup

Follow these steps to add the Install App button to your navigation:

---

## Step 1: Find Your Navigation Component

Look for one of these files in your project:
- `/src/components/Navbar.tsx`
- `/src/components/Navigation.tsx`
- `/src/components/Header.tsx`
- `/src/components/RoleBasedNavigation.tsx`
- `/src/app/layout.tsx` (if navigation is in layout)

---

## Step 2: Add the Import

At the top of your navigation file, add:

```typescript
import { InstallAppButton } from '@/components/InstallAppButton';
```

---

## Step 3: Add the Button

Add this line in your navigation:

```tsx
<InstallAppButton variant="compact" />
```

### Example: Typical Navigation

**Before**:
```tsx
<nav className="flex items-center gap-4">
  <Link href="/">Home</Link>
  <Link href="/products">Products</Link>
  <Link href="/about">About</Link>
  <UserMenu />
</nav>
```

**After**:
```tsx
<nav className="flex items-center gap-4">
  <Link href="/">Home</Link>
  <Link href="/products">Products</Link>
  <Link href="/about">About</Link>
  
  {/* Add install button here */}
  <InstallAppButton variant="compact" />
  
  <UserMenu />
</nav>
```

---

## Step 4: Test It!

1. Run your dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Look for the "Install" button in your navigation

4. Click it to test the install flow!

---

## Alternative Placements

### Mobile Floating Button

Add this to your layout:

```tsx
{/* Floating install button for mobile */}
<div className="lg:hidden fixed bottom-6 right-6 z-50">
  <InstallAppButton variant="icon-only" />
</div>
```

### In User Menu

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Account</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    
    {/* Add here */}
    <DropdownMenuItem asChild>
      <InstallAppButton variant="compact" className="w-full" />
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## That's It!

✅ Users can now easily discover and install your PWA  
✅ Button automatically hides after installation  
✅ Works on all platforms (iOS, Android, Desktop)  

---

## Need More Options?

See [HOW_TO_ADD_INSTALL_BUTTON.md](./HOW_TO_ADD_INSTALL_BUTTON.md) for:
- More placement examples
- Customization options
- Responsive behavior
- Complete integration guide

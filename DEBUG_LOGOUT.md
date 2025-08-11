# Logout Button Locations

## 1. RED LOGOUT BUTTON (Most Visible)
- **Location**: Top-right corner of the page, in the header
- **Appearance**: Red button with "Logout" text and logout icon
- **Between**: Notification bell icon and user avatar (JD)
- **How to use**: Just click it directly

## 2. USER DROPDOWN MENU
- **Location**: Top-right corner - click on the circular "JD" avatar
- **Steps**:
  1. Click the "JD" circle (user avatar) in top-right
  2. A dropdown menu will appear
  3. Click "Log out" at the bottom of the menu
  4. Confirm in the dialog that appears

## 3. MOBILE VIEW
- **Location**: Hamburger menu (☰) in top-left on mobile
- **Steps**:
  1. Click hamburger menu
  2. Scroll to bottom
  3. Click user menu
  4. Select "Log out"

## Visual Guide

```
Header Layout:
[andi logo] -------- [Search] -------- [Company▼] [🔔] [RED LOGOUT BUTTON] [JD]
                                                          ^^^^^^^^^^^^^^^^   ^^^^
                                                          Direct logout     Click for menu
```

## If You Don't See the Logout Button

1. **Check if you're logged in**: The page should show the dashboard
2. **Browser cache**: Try hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. **Console errors**: Open browser console (F12) and check for errors
4. **Screen size**: On small screens, use the hamburger menu

## Testing the Logout

When you click any logout button:
1. Browser console will show: "Direct logout clicked" or "Logout button clicked"
2. You should be redirected to `/login` page
3. Your authentication token will be cleared

## Current Implementation

The logout button has been made more prominent:
- Changed from outline to solid red color
- Added logout icon
- Increased size for better visibility
- Positioned between notifications and user avatar
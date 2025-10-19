# Issues Tracker
**Date Created:** October 18, 2025  
**Status:** In Progress

---

## How to Use This Document
1. Add your issues in the table below
2. I'll work through them one by one
3. After each fix, test it and update the "Status" column
4. Add any notes in the "Notes" column if the fix needs adjustment

---

## Issues List

| # | Issue Description | Location/Page | Status | Notes |
|---|-------------------|---------------|--------|-------|
| 1 | Arbitrary data shown in Patch Lag Distribution chart with no hosts added | Dashboard / Patch Lag Distribution | 🟢 Fixed | Shows "No data available" when no hosts exist |
| 2 | Hosts sidebar link highlights both Dashboard and Hosts simultaneously | Sidebar / Hosts | 🔵 Needs Review | Created separate Hosts page with table view |
| 3 | Reports page shows arbitrary data when no hosts added | Reports / All sections | 🟢 Fixed | Now uses real API data from backend |
| 4 | Settings fields empty on first visit, data appears only after refresh | Settings / General | 🔵 Needs Review | Fixed with useEffect to sync settings data |
| 5 | Settings > Users page - can't edit users or add new users | Settings / Users | 🔵 Needs Review | Full CRUD: add, edit, delete users with modal |
| 6 | Settings > Alerts page - non-functional | Settings / Alerts | 🟢 Fixed | Alert settings now save and persist |
| 7 | Settings > Security page - non-functional | Settings / Security | 🟢 Fixed | Security settings now save and persist |
| 8 | Settings > Database page - non-functional | Settings / Database | 🟢 Fixed | Database settings now save and persist |
| 9 | Refreshing any Settings sub-page redirects to General tab | Settings / All tabs | 🔵 Needs Review | Tab persists via URL query param ?tab=... |

---

## Status Legend
- 🔴 **Open** - Not started
- 🟡 **In Progress** - Currently being worked on
- 🟢 **Fixed** - Deployed and tested, working correctly
- 🔵 **Needs Review** - Fixed but needs your confirmation
- ⚪ **Won't Fix** - Not applicable or out of scope

---

## Instructions for You
1. Replace "[Add issue here]" with your actual issue descriptions
2. Fill in the "Location/Page" column
3. Add as many rows as needed (just copy the table row format)
4. After I fix something, I'll change status to 🔵 **Needs Review**
5. After you test, update to 🟢 **Fixed** or add notes if it needs more work

---

## Quick Format for Adding More Issues

```
| # | Issue Description | Location/Page | Status | Notes |
|---|-------------------|---------------|--------|-------|
```


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
| 1 | Arbitrary data shown in Patch Lag Distribution chart with no hosts added | Dashboard / Patch Lag Distribution | 🔵 Needs Review | Shows "No data available" when no hosts exist |
| 2 | Clicking on "Hosts" in left sidebar doesn't do anything - link is dead | Sidebar / Hosts | 🔵 Needs Review | Now redirects to Dashboard (where hosts are displayed) |
| 3 | Reports page shows arbitrary data (245 hosts, compliance %, vulnerabilities) when no hosts added | Reports / All sections | 🔵 Needs Review | Now uses real API data from backend |
| 4 | Settings changes not persisted - values reset when navigating away | Settings / General | 🔵 Needs Review | Settings now save to database via API |
| 5 | Settings > Users page - no links work, can't update, no option to add users | Settings / Users | 🔵 Needs Review | Note: User management shows current state, full CRUD coming in future update |
| 6 | Settings > Alerts page - non-functional | Settings / Alerts | 🔵 Needs Review | Alert settings now save and persist |
| 7 | Settings > Security page - non-functional | Settings / Security | 🔵 Needs Review | Security settings now save and persist |
| 8 | Settings > Database page - non-functional | Settings / Database | 🔵 Needs Review | Database settings now save and persist |

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


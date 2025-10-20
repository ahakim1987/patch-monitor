# Issues Tracker
**Date Created:** October 18, 2025  
**Last Updated:** October 19, 2025  
**Status:** Active

---

## Current Open Issues

| # | Issue Description | Location/Impact | Status | Notes |
|---|-------------------|-----------------|--------|-------|
| 1 | Agent patchmonitor user home directory permissions causing DNF failures | Agent installation on Fedora/RHEL systems | 🔴 Open | DNF requires write access to ~/.local/state, installer should create and set permissions automatically |

---

## Recently Resolved Issues (Archive)

### October 19, 2025
- ✅ Agent token generation from UI (no more .env editing)
- ✅ Dashboard timezone datetime bug (500 errors fixed)
- ✅ Python 3.6+ compatibility for older systems
- ✅ APT cache reading without sudo permissions
- ✅ DNF parsing for multiple package formats (Rocky, Fedora)
- ✅ GPG key prompt handling
- ✅ Agent performance optimization (5-10 min → 10-30 sec)
- ✅ Collection interval changed to 6 hours
- ✅ Fast batch security detection (APT & DNF)

### October 18, 2025
- ✅ Settings persistence across tabs and refreshes
- ✅ User management CRUD functionality
- ✅ Reports page showing real data
- ✅ Dashboard charts with proper empty states
- ✅ Dedicated Hosts page with agent deployment instructions

---

## Status Legend
- 🔴 **Open** - Not started
- 🟡 **In Progress** - Currently being worked on
- 🟢 **Fixed** - Deployed and tested, working correctly
- 🔵 **Needs Review** - Fixed but needs your confirmation

---

## Adding New Issues

Use this format:
```
| # | Issue Description | Location/Impact | Status | Notes |
|---|-------------------|-----------------|--------|-------|
```

# Project Roadmap

This document outlines the planned features and milestones for the LoFi Project Management application.

## Completed Milestones

### Task 15: Board Layout & Read-Only View
- [x] Server-side `GET /boards/:id` route.
- [x] Board, Column, and Card UI components.
- [x] Data fetching hook `useBoard`.
- [x] Integration into `App.tsx`.
- [x] Comprehensive test suite (17+ tests).


## Upcoming Milestones

## Priority: GitHub Integration (Task 19)

NOTE: closes issue 19
> [!NOTE]
> These milestones replace the PAT-based auth concept from the original monolithic spec.
> The intent is a polished, browser-based auth experience similar to `gh auth login`.

> [!IMPORTANT]
> **Terminology**: GitHub calls the current product just **"Projects"** (no version number). The legacy product was "Projects (classic)" and is fully sunset. However, the **GraphQL API** still uses `ProjectV2` as the schema object name (e.g., `user.projectV2()`, `createProjectV2`). A **REST API** for Projects also exists (released Sept 2025). When our docs say "GitHub Projects", we mean the current product, accessed via the `ProjectV2` GraphQL API or the Projects REST API.

### GitHub Auth (OAuth Device Flow)

**Goal**: Allow a user to connect their GitHub account without manually copying tokens.

**Context**: GitHub's [OAuth Device Flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow) is designed for CLI and local-server apps that lack a traditional web redirect. It works by showing the user a short code and directing them to `github.com/login/device`. This is the same pattern the official `gh` CLI uses.

**Decisions**:
- **App Type**: GitHub OAuth App (simpler, `client_id` only — no `client_secret` needed for Device Flow).
- **Token Storage**: OS Keychain (Windows Credential Manager / macOS Keychain / Linux Secret Service) via a library like `keytar`. Secure by default, no custom encryption to maintain.

**Requirements (EARS)**:

| ID | Requirement |
| :--- | :--- |
| AUTH-1 | When the user initiates "Connect GitHub", the App shall request a device code from GitHub and display the user code and the verification URL (`github.com/login/device`). |
| AUTH-2 | While the user code is displayed, the App shall poll GitHub's token endpoint at the prescribed interval until the user authorizes or the code expires. |
| AUTH-3 | When GitHub returns an access token, the App shall persist the token to the OS keychain and transition the UI to an "Authenticated" state showing the connected GitHub username. |
| AUTH-4 | If the device code expires before the user authorizes, then the App shall display an expiration message and allow the user to retry. |
| AUTH-5 | If the user revokes access or the token becomes invalid, then the App shall clear the stored token from the OS keychain and return to the "Not Connected" state. |

### GitHub Project Selection & Creation

**Goal**: After auth, present the user with their existing GitHub Projects. The user may select an existing project or create a new one to pull in locally as a board.

**Context**: GitHub Projects are **user- or org-scoped**, not bound to a single repository. A single project can span multiple repositories, and projects and repos can independently be public or private. This means the local board inherits the project's multi-repo nature — cards on the board may originate from different repos.

**Decisions**:
- **Board ↔ Project**: One local board maps to one GitHub Project, but that project may contain items from multiple repos. The App will track the project ID and discover linked repos dynamically.
- **Column Mapping**: Auto-map columns by name on initial link (e.g., local "To Do" → GitHub Status "Todo"). User can override in settings if the names don't match.

**Requirements (EARS)**:

| ID | Requirement |
| :--- | :--- |
| PROJ-1 | While the user is authenticated, when the user navigates to project selection, the App shall fetch and display a list of the user's GitHub Projects. |
| PROJ-2 | When the user selects an existing project from the list, the App shall pull the project's items into a new local board, storing the project ID. |
| PROJ-3 | When the user chooses "Create New Project", the App shall prompt for a project name, create the project via the GitHub API, and initialize a new local board linked to it. |
| PROJ-4 | When a project is pulled in, the App shall auto-map local columns to GitHub Status field values by name and allow the user to adjust the mapping. |
| PROJ-5 | While a board is linked to a GitHub Project, the App shall display the linked project name in the board header or settings. |
| PROJ-6 | If the linked GitHub Project is deleted or inaccessible, then the App shall display a warning and allow the user to re-link or unlink. |

---

### Task 16: Basic Drag & Drop
- **Goal**: Allow users to move cards between columns.
- **Context**: Need to implement a reliable drag-and-drop experience (e.g., using `dnd-kit`).
- **Scope**:
  - Integrate `dnd-kit` into `BoardLayout`.
  - Update local state immediately (optimistic UI).
  - Persist changes to the server via `PATCH /cards/:id`.
- **TDD Tasks**:
  - Test draggable cards and droppable columns.
  - Test state update on "drop".

### Task 17: Dynamic Columns
NOTE: closes Issue 16
- **Goal**: Allow users to add, rename, and remove columns.
- **Context**: Currently columns are derived from the domain model's fixed set (or DB rows).
- **Scope**:
  - UI for "Add Column".
  - Rename column title.
  - Delete column (with safety check if cards exist).
  - Update `BoardRepository` to handle structural changes.

### Task 18: Real-time Sync
- **Goal**: Sync board state across multiple clients using WebSockets.
- **Context**: Build on top of the existing `EventBus` on the server.
- **Scope**:
  - WebSocket connection in `useBoard`.
  - Handle "remote update" @[remote update] events.
  - Integration with Optimistic UI updates.

# FitComm Tracker Documentation

**FitComm Tracker** is a React-based web application designed to bridge the gap between fitness coaches and their community members. It features a dual-interface system (Coach Mode & Member Mode) that allows users to track workouts, rest days, and reflections, while coaches can monitor community progress.

## 🛠 Tech Stack

*   **Core:** React 19 (Hooks, Functional Components)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **Icons:** Lucide React
*   **Bundling:** Native ES Modules (via `importmap` in `index.html`)

## 📂 Project Structure

The project follows a flat, component-based structure.

*   **`App.tsx`**: The root container. It acts as the central state store, managing data for logs, user profiles, and view navigation. It handles the switching between "Coach" and "Member" modes.
*   **`components/`**:
    *   **`CoachDashboard.tsx`**: The main view for coaches, featuring a sliding toggle between the Community Feed and Member List.
    *   **`ActivityCard.tsx`**: A reusable card component displaying individual log entries with distinct visual styles for Workouts, Rest, and Reflections.
    *   **`Heatmap.tsx`**: A GitHub-contribution-style visualization of user consistency.
    *   **Modals**:
        *   `LogModal.tsx`: Multi-step wizard for creating new logs.
        *   `ProfileModal.tsx`: User profile and settings management.
        *   `ActivityModal.tsx`: Detailed view of a specific log, handling edit/delete permissions.
        *   `CoachMemberModal.tsx`: Coach-specific view of a member's stats and history.

## 🧠 Architecture & State Management

### 1. Data Flow
Since there is no external state management library (like Redux or Zustand), **`App.tsx`** serves as the "Single Source of Truth".
*   `feedItems`: Array of activity logs visible to the community (public logs).
*   `myActivities`: Array of the logged-in user's personal logs (includes private logs).
*   **Sync Logic**: Functions like `handleLog`, `handleUpdateActivity`, and `handleDeleteActivity` in `App.tsx` ensure that changes in the personal history propagate correctly to the public feed based on visibility flags (`isPublicNote`, `isPublicPhoto`).

### 2. Navigation
Routing is handled via internal state (`useState`) rather than a router library.
*   **Member View**: Toggles between `FEED` and `YOU` views using a sliding pill animation.
*   **Coach View**: Toggles between `FEED` and `MEMBERS`.

### 3. Dual Mode System
The app features a global toggle `isCoachMode`.
*   **Member Mode**: Focuses on logging personal data, viewing personal stats (Heatmap, Streaks), and a community feed.
*   **Coach Mode**: Focuses on aggregation. Coaches can see all public feeds and a directory of members with their specific stats (Streak, Max Streak, Last Active).

## ✨ UI/UX Implementation Details

### Morphing Modal Animations
The application uses a distinctive "Morph" animation for opening modals.
1.  **Trigger**: When a user clicks a button (e.g., the "+" FAB), the button's bounding rectangle is captured (`getBoundingClientRect`).
2.  **Mount**: The modal mounts with `position: fixed` matching the trigger's exact coordinates and dimensions.
3.  **Animate**: Using `requestAnimationFrame` and `useLayoutEffect`, the modal transitions to its centered, expanded state.
4.  **Unmount**: The animation reverses, shrinking back into the trigger button before unmounting.

*See `LogModal.tsx` or `ProfileModal.tsx` for the `animStyles` implementation.*

### Sliding Views
Both dashboards utilize a container with `width: 200%` and a CSS `transform: translateX(...)` transition to create a mobile-app-like swipe effect between views without unmounting components.

### Permissions & Logic
*   **Deletions**:
    *   **Members**: Can only delete logs created within the last 30 minutes. Logic resides in `ActivityModal.tsx`.
    *   **Coaches**: Can delete any log at any time.
*   **Streaks**: Calculated dynamically in `App.tsx` (and `CoachDashboard.tsx`) by iterating through logs and checking for consecutive dates (ignoring "Reflect" logs).

## 🎨 Styling (Tailwind CSS)

*   **Dark Mode**: The app is built with "Dark Mode First" principles but supports light mode via the `.dark` class on the `html` tag.
*   **Custom Scrollbars**: Utility classes `.no-scrollbar` hide native scrollbars while maintaining scroll functionality for a cleaner UI.
*   **Colors**:
    *   **Primary**: Indigo (`indigo-500`/`indigo-600`)
    *   **Workouts**: Teal (`teal-400`/`#2dd4bf`)
    *   **Rest**: Salmon/Red (`rose-500`/`#f87171`)
    *   **Reflect**: Yellow (`yellow-500`/`#facc15`)

## 🚀 Future Improvements

1.  **Backend Integration**: Currently, all data is mock data stored in React state. Integrating a backend (Firebase/Supabase) would be the next step.
2.  **Date Handling**: Currently uses native `Date` object and string parsing. Migrating to `date-fns` or `dayjs` would improve streak calculation reliability across timezones.
3.  **Image Upload**: Currently uses `FileReader` to create base64 strings. Real-world implementation requires cloud storage (e.g., AWS S3).

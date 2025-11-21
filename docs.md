<!--
AI CONTEXT INSTRUCTIONS:
- Treat this document as the single source of truth about the project.
- Do NOT invent new features outside the MVP scope below.
- All user identity is handled via Whop SDK (`whop_user_id`).
- Frontend: Next.js (TypeScript). Backend: API Routes.
- Output clean, production-grade code. Avoid unnecessary complexity.
-->

# 🏋️‍♂️ Fitness Accountability App (Whop Embedded)

_Purpose: A Whop-embedded fitness accountability app focused on daily consistency, reflection, and coach-visible engagement._

---

## 🔍 Purpose
A micro-social accountability tool built as a **Whop App**, designed for fitness coaches and their communities.  
It helps members stay consistent with daily workouts or rest days through a simple daily tap, optional proof photos, and visual feedback — all inside Whop.

Coaches pay for the app (subscription) to increase engagement, retention, and proof of participation within their communities.

---

## 🎯 Core Philosophy
- **Frictionless Consistency:** One tap a day keeps the habit alive.  
- **Visible Effort:** Optional photos and notes add authenticity.  
- **Honest Accountability:** Rest days and reflections keep users consistent without guilt.  
- **Community Reinforcement:** Shared progress builds motivation.  
- **Zero-login UX:** Uses Whop’s built-in `whop_user_id`; no external sign-in.

---

## 👥 Target Users
- **Members:** People in Whop fitness communities aiming to build consistent workout habits.  
- **Coaches/Owners:** Community leaders who want to visualize and quantify member engagement.

---

## 💡 V1 Feature Set — Final

### **Daily Check-Ins**
| Feature | Description | Purpose |
| --- | --- | --- |
| **Workout Done Button** | One tap per day to log completion. | Simple, habit-forming action. |
| **Muscle Group Selection** | Quick dropdown (Push/Pull/Legs/Cardio/Full Body/Other). **Required.** | Adds lightweight workout context. |
| **Optional Note/Emoji** | Add a short comment or emoji. | Personal expression & data variety. |
| **Photo Upload** | Mandatory **2× per week**, private by default (optional share). | Ensures authenticity, prevents ghosting. |
| **24-Hour Window** | Check-ins valid only for current day. | Prevents back-logging. |
| **Visual Feedback** | Confetti/streak bar fill animation. | Reinforces dopamine loop. |
| **Public Feed Display** | e.g. “Jane completed a Push workout 💪 2 hours ago.” (photo visible only if shared). | Creates social validation & visibility. |
| **Daily Stats** | Shows “15/40 members checked in today” on feed. | Promotes collective accountability. |

---

### **Rest Day Flow**
| Feature | Description | Purpose |
| --- | --- | --- |
| **"Rest Day" Button** | Member actively logs a rest day. | Keeps streaks fair and honest. |
| **Optional Note** | Add note like “Active recovery walk.” | Adds nuance and personalization. |
| **Maintains Streak** | Rest days count toward consistency. | Encourages healthy recovery. |
| **Public Feed Display** | e.g. “Mike logged a rest day 🔵 5 hours ago.” | Normalizes rest & recovery. |

---

### **Reflection Flow**
| Feature | Description | Purpose |
| --- | --- | --- |
| **"Couldn't Work Out" Button** | Record reason (Busy/Sick/Low Energy/Other). | Encourages honesty, prevents churn. |
| **Calming Message** | Reassuring message post-reflection. | Maintains emotional stability. |
| **Breaks Streak** | Reflections are recorded, not counted toward streak. | Keeps data authentic. |
| **Tracked Separately** | Coaches see reflections vs total ghosts. | Reveals engagement honesty. |

---

### **Progress Tracking**
| Feature | Description | Purpose |
| --- | --- | --- |
| **Streak Counter** | Counts workout + rest days. | Simple consistency indicator. |
| **Heatmap/Calendar** | 🟩 workout, 🔵 rest, 🟨 reflection, 🟥 ghost. | Clear visual effort overview. |
| **Weekly Summary** | “5 workouts + 2 rest days = 7/7 engaged (100%).” | Reinforces consistent effort. |

---

### **Community Layer**
| Feature | Description | Purpose |
| --- | --- | --- |
| **Public Feed** | Displays all check-ins (workout/rest day) with timestamps. | Fosters social accountability. |
| **Activity Stats** | Shows total active members today. | Motivates collective effort. |

---

### **Coach Dashboard**
| Feature | Description | Purpose |
| --- | --- | --- |
| **Member Overview** | All members with streak colors: 🟢 active, 🟡 slipping, 🔴 ghosting. | At-a-glance engagement map. |
| **Stats Summary** | % engaged this week, avg consistency rate. | Tracks community health. |
| **Reflection Visibility** | See who reflected vs ghosted. | Enables human connection & support. |
| **Photo Tracking** | Shows who met 2×/week photo rule (no private photo access). | Accountability without invasion. |

---

### ❌ **Cut from V1 (Future Versions)**
- Time-locked button  
- Announcements/scheduling feature  
- Public check-in reactions  
- Leaderboard  
- Monthly snapshot  
- Progress photo gallery/timeline  
- Reflection streak tracking  

---

## 🧩 Tech Stack
| Layer | Tool | Notes |
| --- | --- | --- |
| **Frontend** | Next.js + React (TypeScript) | Whop app template-based. |
| **Backend** | Next.js API Routes | Modular monolith for fast iteration. |
| **Database** | PostgreSQL (Prisma ORM) | Hosted on Supabase or Neon. |
| **Storage** | Supabase / S3 | For uploaded photos. |
| **Auth** | Whop SDK (uses `user_id`) | No extra sign-in required. |
| **Deployment** | Vercel | Auto-deploy from GitHub CI/CD. |
| **Testing** | Jest + Playwright | Unit + E2E happy-path tests. |
| **Monitoring** | Sentry + Vercel logs | Basic error tracking. |

---

## 🔒 Identity & Authentication
- Uses `x-whop-user-token` header from Whop’s embedded context.  
- Backend verifies token → extracts `user_id` and `community_id`.  
- First-time users auto-created in DB via `/api/init-user`.  
- No manual sign-in. Whop manages session and permissions.

---

## 🧠 App Data Model (Simplified)
```plaintext
users (whop_user_id PK, name, role)
checkins (id, whop_user_id, type [workout/rest/reflection], muscle_group, note, photo_url, shared_photo, created_at)
community_stats (id, date, total_members, active_today)

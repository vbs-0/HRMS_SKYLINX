# Module 11 Specs: Social Feed & Rewards

This document provides a comprehensive technical reference for the **Social Feed & Rewards** module of SKYLINX PeopleOS HRMS, covering database models, backend NestJS controllers, frontend Next.js pages, role permissions, and end-to-end data flows.

---

## 1. Functional Purpose & Business Logic

The Social module hosts company announcements, community timelines, peer recognition highlights, and points redemption vouchers:

1.  **Community Social Feed**:
    *   Employees author posts (`SocialPost` model) categorized as standard news or notices.
    *   Subscribers engage via post likes (`SocialLike`) and comments (`SocialComment`).
    *   Company Announcements (`Announcement` table) can be pinned by HR Admins, with tracking for read confirmations (`AnnouncementRead` table).
2.  **Peer-to-Peer Recognition**:
    *   Employees and managers recognize coworker achievements (`RecognitionReward` model) with custom messages and designated point rewards.
3.  **Points Rewards Ledger**:
    *   All points earned (e.g. from peer recognitions, performance awards, or anniversaries) are tracked in the `RewardLedger` table.
    *   Calculates total available points by summing entries.
4.  **Voucher Redemption Store**:
    *   HR Admins publish active vouchers (`RewardVoucher` model, detailing points cost, providers, and codes).
    *   Employees redeem vouchers using accumulated points. This creates a debit ledger entry (`RewardLedger.points` as a negative value) and reveals the voucher code to the employee.
5.  **Anniversary & Birthday Crons**:
    *   Periodic cron jobs query birthdays and work anniversaries in the `Employee` table. They auto-publish celebration cards to the feed and email notifications, potentially adding points to the employee's ledger.

### Dropdown Linkages & Connection Completion
*   **Source Fields**: 
    *   **Give Recognition Form**: Dropdown selection of Recipient Employee (sourced from active directory) and Points templates (e.g., 50, 100, 200).
    *   **Redeem Dialog**: Selects from active `RewardVoucher` items in the vouchers catalog page.
*   **Dropdown Administration**:
    *   Vouchers catalog and points costs are managed in the Vouchers settings page (`/settings/rewards/vouchers`), updating the `RewardVoucher` table.
    *   Reward settings and rules are updated inside the Rewards policy panel (`/settings/rewards/rules`), updating limits on points employees can award per month.
    *   Any changes made in these settings are instantly populated in the dropdown menus of the rewards and social dashboards.

---

## 2. Detailed Schema & Database Mappings

The social feed and rewards module uses the following models in `packages/database/prisma/schema.prisma`:

*   **`SocialPost`**:
    *   `id` (String CUID, Primary Key)
    *   `authorUserId` (String CUID, Foreign Key to `User.id`)
    *   `type` (String, Default: "POST")
    *   `title` (String, Optional)
    *   `body` (String)
    *   `mediaUrl` (String, Optional)
    *   `visibility` (String, Default: "COMPANY")
    *   `pinned` (Boolean, Default: false)
*   **`SocialLike`**:
    *   `id` (String CUID, Primary Key)
    *   `postId` (String CUID, Foreign Key to `SocialPost.id`)
    *   `userId` (String CUID, Foreign Key to `User.id`)
    *   *Constraint*: Unique composite index `@@unique([postId, userId])`
*   **`SocialComment`**:
    *   `id` (String CUID, Primary Key)
    *   `postId` (String CUID, Foreign Key to `SocialPost.id`)
    *   `userId` (String CUID, Foreign Key to `User.id`)
    *   `body` (String)
*   **`RewardVoucher`**:
    *   `id` (String CUID, Primary Key)
    *   `code` (String, Unique)
    *   `title` (String)
    *   `provider` (String)
    *   `valueAmount` (Decimal)
    *   `pointsCost` (Int)
    *   `status` (String, Default: "ACTIVE")
*   **`RewardLedger`**:
    *   `id` (String CUID, Primary Key)
    *   `employeeId` (String CUID, Foreign Key to `Employee.id`)
    *   `points` (Int) // Positive for credits, negative for debits (redemptions)
    *   `reason` (String)
    *   `source` (String)
*   **`RecognitionReward`**:
    *   `id` (String CUID, Primary Key)
    *   `recipientEmployeeId` (String CUID, Foreign Key to `Employee.id`)
    *   `givenByUserId` (String CUID, Optional)
    *   `title` (String)
    *   `message` (String)
    *   `points` (Int, Default: 0)
*   **`Announcement`**:
    *   `id` (String CUID, Primary Key)
    *   `companyId` (String CUID, Foreign Key to `Company.id`)
    *   `title` (String)
    *   `body` (String)
    *   `pinned` (Boolean, Default: false)
    *   `audience` (String, Default: "ALL")
*   **`AnnouncementRead`**:
    *   `id` (String CUID, Primary Key)
    *   `announcementId` (String CUID, Foreign Key to `Announcement.id`)
    *   `employeeId` (String CUID, Foreign Key to `Employee.id`)
    *   *Constraint*: Unique composite index `@@unique([announcementId, employeeId])`

---

## 3. NestJS API Controllers & Services

*   **Folder Location**: `apps/api/src/modules/social` & `apps/api/src/modules/rewards`
*   **Controllers**: `social.controller.ts` & `rewards.controller.ts`
*   **Endpoints**:
    *   `GET /api/v1/social/feed`: Aggregates active social posts and announcements.
    *   `POST /api/v1/social/posts`: Inserts a user post.
    *   `POST /api/v1/social/posts/:id/like` & `DELETE /posts/:id/like`: Toggles post likes.
    *   `POST /api/v1/social/posts/:id/comments`: Appends comments to feed posts.
    *   `GET /api/v1/rewards`: Returns ledger records and accumulated points.
    *   `POST /api/v1/rewards/vouchers`: HR Admin adds redeemable items.
    *   `POST /api/v1/rewards/points`: Manually awards points (inserts into ledger).
    *   `POST /api/v1/rewards/recognitions`: Records peer recognition and triggers a ledger credit run.

---

## 4. Next.js UI Screens & Multi-Role View Mappings

*   **Files**:
    *   `apps/web/app/social/page.tsx`
    *   `apps/web/app/rewards/page.tsx`
    *   `apps/web/components/rewards-console.tsx`

### A. HR Admin View
*   **Access Requirements**: Role `HR_ADMIN` or `OWNER` with `rewards.create`, `social.create`.
*   **UI Controls**:
    *   `Publish Announcement` uploader: Creates pinned announcements.
    *   `Award Points` button: Awards points directly to employees.
    *   `Vouchers Store setup` panel: Publishes new discount vouchers.

### B. Manager View
*   **Access Requirements**: Role `MANAGER` with standard permissions.
*   **UI Controls**:
    *   `Peer Recognition` dashboard: Evaluates and posts recognitions. Can award points up to monthly budget limits.

### C. Employee View
*   **Access Requirements**: Role `EMPLOYEE` with self-scope permissions.
*   **UI Controls**:
    *   `Timeline Feed`: Standard likes/comments controls.
    *   `Give Kudos` button: Writes peer recognition posts and transfers points.
    *   `Redeem points` store tab: Displays point balances, reviews vouchers, and redeems coupon codes.

---

## 5. End-to-End Cycle Flowchart

This flowchart outlines the complete kudos, points ledger allocation, and voucher redemption cycle:

```mermaid
flowchart TD
    A[Employee: Opens Rewards Portal] --> B(Clicks Give Kudos to Peer)
    B -->|Select Recipient & Points| C(API: POST /api/v1/rewards/recognitions)
    C -->|Prisma Transaction| D[Insert RecognitionReward record]
    D -->|Credit Ledger| E(DB: Insert RewardLedger positive points)
    E -->|Notify Recipient| F[Notify recipient user of kudos]
    E -->|Update Feed| G[Create celebration post on Social Feed]
    
    Note over F, H: Redemption Flow (Debiting points for voucher purchase)
    
    H[Employee: Clicks Redeem points store] --> I[UI reads total points balance]
    I -->|Select Voucher| J{Does employee points balance >= pointsCost?}
    J -->|No| K[UI: Gray out Redeem button & show balance needed]
    J -->|Yes| L[Employee clicks Purchase Voucher]
    L -->|Submit Purchase| M(API: POST /api/v1/rewards/points with negative pointsCost)
    M -->|Prisma Transaction| N[Debit Ledger balance]
    N -->|Insert Ledger Debit| O(DB: Insert RewardLedger negative points)
    N -->|Reveal Code| P(DB: Return RewardVoucher code to user UI)
    P --> Q[Employee: Copy code and apply at provider store]
```

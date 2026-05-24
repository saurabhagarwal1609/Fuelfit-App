# Firestore Security Specification

## 1. Data Invariants

- **User Profile**:
  - Path: `/users/{userId}`
  - Invariant: `userId` must match `request.auth.uid`.
  - Immutable: `uid`, `email`, `createdAt`.
  - Admin: Can read/write all profiles.

- **Meals**:
  - Path: `/meals/{mealId}`
  - Invariant: `resource.data.uid` must match `request.auth.uid`.
  - Validation: Must have `name`, `calories`, `timestamp`.
  - Size Limits: `name` max 100 chars.

- **Workouts**:
  - Path: `/workouts/{workoutId}`
  - Invariant: `resource.data.uid` must match `request.auth.uid`.
  - Validation: Must have `exerciseName`, `timestamp`.

## 2. The Dirty Dozen Payloads (Targeting Vulnerabilities)

1. **Identity Spoofing (Create)**: Attempt to create a meal for another user.
   - Payload: `{ uid: "other_user_id", name: "Evil Meal", calories: 666, timestamp: request.time }`
   - Expect: `PERMISSION_DENIED`
2. **Identity Spoofing (Update)**: Attempt to change the `uid` of an existing meal.
   - Payload: `{ uid: "attacker_id" }`
   - Expect: `PERMISSION_DENIED`
3. **Ghost Field (Shadow Update)**: Attempt to inject a field not in the schema.
   - Payload: `{ isVerified: true, calories: 500 }`
   - Expect: `PERMISSION_DENIED`
4. **Invalid Type Poisoning**: Attempt to set a number to a string.
   - Payload: `{ calories: "five hundred" }`
   - Expect: `PERMISSION_DENIED`
5. **Denial of Wallet (ID Poisoning)**: Document ID with 1MB of junk.
   - Path: `/meals/JUNK_ID_LONG`
   - Expect: `PERMISSION_DENIED`
6. **Denial of Wallet (String Bloating)**: 1MB string in `name`.
   - Payload: `{ name: "A".repeat(1024 * 1024) }`
   - Expect: `PERMISSION_DENIED`
7. **Privilege Escalation**: User trying to make themselves an admin.
   - Payload: `{ role: "admin" }`
   - Expect: `PERMISSION_DENIED`
8. **Orphaned Record (Missing User)**: Creating a meal without a valid user doc.
   - Requirement: `exists(/databases/$(database)/documents/users/$(request.auth.uid))`
   - Expect: `PERMISSION_DENIED` if user doc doesn't exist.
9. **Temporal Integrity (Future Stamp)**: Setting `createdAt` to 2099.
   - Payload: `{ createdAt: timestamp("2099-01-01T00:00:00Z") }`
   - Expect: `PERMISSION_DENIED`
10. **State Shortcutting**: Updating a terminal status (if applicable).
    - Expect: `PERMISSION_DENIED`
11. **PII Blanket Read**: Authenticated user trying to list all users.
    - Expect: `PERMISSION_DENIED`
12. **Query Scraping (Bypassing Filter)**: Listing meals without `where('uid', '==', uid)`.
    - Expect: `PERMISSION_DENIED`

## 3. Test Runner (Draft)

```typescript
// firestore.rules.test.ts (conceptual)
// ... test code following the pillars ...
```

# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default-Deny Catch-All**: All paths not explicitly matched in `/learners/{learnerId}` or `/admins/{adminId}` are strictly denied (`allow read, write: if false;`).
2. **Identity & Ownership**: A `/learners/{learnerId}` document can only be created by a verified authenticated user (`request.auth != null && request.auth.token.email_verified == true`) where `learnerId == request.auth.uid` and `incoming().uid == request.auth.uid`.
3. **Immutable Ownership & Creation Time**: `uid` and `createdAt` can never be modified after document creation (`incoming().uid == existing().uid && incoming().createdAt == existing().createdAt`).
4. **Strict Server Timestamps**: `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. **Strict Key Allowlisting & Schema Bounds**: Every field on `LearnerProfile` is validated via `isValidLearnerProfile(data)` with `.hasAll(...)` and `.hasOnly(...)`, string length bounds (`maxLength`), regex patterns, and integer range bounds.
6. **Zero Blanket Reads & Query Enforcer**: `get` and `list` on `/learners/{learnerId}` are restricted strictly to `isAdmin() || (isSignedIn() && resource.data.uid == request.auth.uid)`.
7. **Bootstrapped Verified Admin**: `isAdmin()` requires `isSignedIn() && request.auth.token.email_verified == true` and either `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or `request.auth.token.email == 'tiktokautomation7861@gmail.com'`.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null` attempting `create` on `/learners/user_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: `auth = { uid: 'user_1', email_verified: false }` attempting `create` on `/learners/user_1` -> `PERMISSION_DENIED`.
3. **Cross-User Spoof Create**: `auth = { uid: 'user_1' }` creating `/learners/user_2` or setting `uid: 'user_2'` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Adding `"isAdmin": true` or `"ghostField": "hack"` to `/learners/user_1` -> `PERMISSION_DENIED`.
5. **Resource ID Poisoning**: Creating `/learners/invalid$id!with*bad^chars` -> `PERMISSION_DENIED`.
6. **Oversized String Denial-of-Wallet**: Setting `displayName` to a 500-character string (`> 80`) -> `PERMISSION_DENIED`.
7. **Invalid Enum Injection**: Setting `difficultyLevel: "impossible"` (not in `['easy', 'medium', 'hard']`) -> `PERMISSION_DENIED`.
8. **Forged Client Timestamp**: Setting `createdAt` or `updatedAt` to a past/future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
9. **Immutable Field Mutation**: Updating `createdAt` or `uid` on an existing `/learners/user_1` document -> `PERMISSION_DENIED`.
10. **Unauthorized Cross-User Read**: `user_2` attempting `get` on `/learners/user_1` -> `PERMISSION_DENIED`.
11. **Unfiltered List Scraping**: Non-admin `user_2` attempting `list` on `/learners` without `where('uid', '==', 'user_2')` -> `PERMISSION_DENIED`.
12. **Self-Assigned Admin Escalation**: Non-admin user attempting to write `/admins/user_1` -> `PERMISSION_DENIED`.

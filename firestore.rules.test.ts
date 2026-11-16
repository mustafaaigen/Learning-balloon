/**
 * Firestore Security Rules Test Suite — Verifies all "Dirty Dozen" Payloads return PERMISSION_DENIED
 */
export interface DirtyDozenScenario {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_SCENARIOS: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Unauthenticated create on /learners/user_1',
    collection: 'learners',
    docId: 'user_1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified email create on /learners/user_1',
    collection: 'learners',
    docId: 'user_1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-user spoof create (/learners/user_2 by user_1)',
    collection: 'learners',
    docId: 'user_2',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow field injection (isAdmin: true in /learners/user_1)',
    collection: 'learners',
    docId: 'user_1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Resource ID poisoning (/learners/bad$id!)',
    collection: 'learners',
    docId: 'bad$id!',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Oversized displayName (> 80 chars)',
    collection: 'learners',
    docId: 'user_1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Invalid difficultyLevel enum value',
    collection: 'learners',
    docId: 'user_1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Forged client timestamp on createdAt/updatedAt',
    collection: 'learners',
    docId: 'user_1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Mutating immutable createdAt or uid on update',
    collection: 'learners',
    docId: 'user_1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Cross-user read on /learners/user_1 by user_2',
    collection: 'learners',
    docId: 'user_1',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unfiltered list query on /learners by non-admin',
    collection: 'learners',
    docId: '*',
    operation: 'list',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-assigned admin creation on /admins/user_1',
    collection: 'admins',
    docId: 'user_1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
];

// 🧪 Sprint T1 State Machine Validation Unit Test Suite
// Verifies state machine rules, allowed & disallowed transitions, idempotency, forward-only progression, and cancellation rules

import { validateTransition } from "../lib/tracking";
import { OrderStatus } from "../lib/types";

function assert(condition: boolean, testName: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${testName}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${testName}`);
}

console.log("--- RUNNING SPRINT T1 STATE MACHINE VERIFICATION ---");

// 1. Valid Forward Progression
const forwardSequence: [OrderStatus, OrderStatus, any][] = [
  ["placed", "accepted", "owner"],
  ["accepted", "preparing", "owner"],
  ["preparing", "packed", "owner"],
  ["packed", "out_for_delivery", "owner"],
  ["out_for_delivery", "delivered", "owner"],
  ["delivered", "customer_confirmed", "customer"],
  ["customer_confirmed", "review_completed", "customer"],
];

for (const [from, to, actor] of forwardSequence) {
  const res = validateTransition(from, to, actor);
  assert(res.valid && !res.idempotent, `Forward transition from '${from}' to '${to}' by '${actor}'`);
}

// 2. Idempotent Repeat Transitions (Same state = no-op success)
const allStates: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "packed",
  "out_for_delivery",
  "delivered",
  "customer_confirmed",
  "review_completed",
  "cancelled",
];

for (const state of allStates) {
  const res = validateTransition(state, state, "owner");
  assert(res.valid && res.idempotent, `Idempotent repeat check for state '${state}'`);
}

// 3. Blocked Backward Transitions
const backwardTests: [OrderStatus, OrderStatus][] = [
  ["accepted", "placed"],
  ["preparing", "accepted"],
  ["packed", "preparing"],
  ["out_for_delivery", "packed"],
  ["delivered", "out_for_delivery"],
  ["customer_confirmed", "delivered"],
];

for (const [from, to] of backwardTests) {
  const res = validateTransition(from, to, "owner");
  assert(!res.valid, `Blocked backward transition from '${from}' to '${to}'`);
}

// 4. Blocked Step Skipping
const skipTests: [OrderStatus, OrderStatus][] = [
  ["placed", "preparing"],
  ["placed", "out_for_delivery"],
  ["accepted", "packed"],
  ["preparing", "delivered"],
];

for (const [from, to] of skipTests) {
  const res = validateTransition(from, to, "owner");
  assert(!res.valid, `Blocked state skipping from '${from}' to '${to}'`);
}

// 5. Cancellation Rules
// Valid cancellation
assert(
  validateTransition("placed", "cancelled", "owner", "Item out of stock").valid,
  "Valid cancellation from 'placed' with reason"
);
assert(
  validateTransition("accepted", "cancelled", "owner", "Customer requested").valid,
  "Valid cancellation from 'accepted' with reason"
);
assert(
  validateTransition("preparing", "cancelled", "owner", "Kitchen error").valid,
  "Valid cancellation from 'preparing' with reason"
);

// Invalid cancellation (missing reason)
assert(
  !validateTransition("placed", "cancelled", "owner", "").valid,
  "Blocked cancellation without reason"
);

// Invalid cancellation (after packed / delivered)
assert(
  !validateTransition("packed", "cancelled", "owner", "Too late").valid,
  "Blocked cancellation after 'packed'"
);
assert(
  !validateTransition("out_for_delivery", "cancelled", "owner", "Too late").valid,
  "Blocked cancellation after 'out_for_delivery'"
);
assert(
  !validateTransition("delivered", "cancelled", "owner", "Too late").valid,
  "Blocked cancellation after 'delivered'"
);

// 6. Actor Validation
assert(
  !validateTransition("placed", "accepted", "customer").valid,
  "Blocked customer attempting owner transition ('accepted')"
);
assert(
  !validateTransition("delivered", "customer_confirmed", "owner").valid,
  "Blocked owner attempting customer transition ('customer_confirmed')"
);

console.log("\n✨ ALL SPRINT T1 STATE MACHINE VERIFICATION TESTS PASSED SUCCESSFULLY! ✨\n");

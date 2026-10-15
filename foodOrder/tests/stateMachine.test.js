const { test } = require('node:test');
const assert = require('node:assert');
const { STATUS, ACTOR, TRANSITIONS, canTransit } = require('../cloudfunctions/order/stateMachine.js');

const LEGAL = [
  [STATUS.UNPAID, STATUS.PAID, ACTOR.CUSTOMER, 'pay'],
  [STATUS.UNPAID, STATUS.CANCELLED, ACTOR.CUSTOMER, 'cancel'],
  [STATUS.PAID, STATUS.CANCELLED, ACTOR.CUSTOMER, 'cancel'],
  [STATUS.PAID, STATUS.CANCELLED, ACTOR.MERCHANT, 'reject'],
  [STATUS.PAID, STATUS.PREPARING, ACTOR.MERCHANT, 'accept'],
  [STATUS.PREPARING, STATUS.READY, ACTOR.MERCHANT, 'finish'],
  [STATUS.READY, STATUS.COMPLETED, ACTOR.CUSTOMER, 'complete'],
  [STATUS.READY, STATUS.COMPLETED, ACTOR.MERCHANT, 'complete'],
];

test('all 8 legal transitions are allowed for the right actor', () => {
  for (const [from, to, actor, action] of LEGAL) {
    assert.ok(canTransit(from, to, actor), `${actor} should be able to ${action}: ${from} -> ${to}`);
  }
});

test('legal transitions are denied for the wrong actor, unless both actors may do it', () => {
  const OTHER = (a) => (a === ACTOR.CUSTOMER ? ACTOR.MERCHANT : ACTOR.CUSTOMER);
  // (from,to) pairs that are legal for BOTH actors (customer cancel + merchant reject; both complete)
  const actorsByPair = new Map();
  for (const [from, to, actor] of LEGAL) {
    const key = `${from}|${to}`;
    actorsByPair.set(key, (actorsByPair.get(key) || new Set()).add(actor));
  }
  for (const [from, to, actor] of LEGAL) {
    if (actorsByPair.get(`${from}|${to}`).has(OTHER(actor))) continue;
    assert.ok(!canTransit(from, to, OTHER(actor)), `${OTHER(actor)} must not do: ${from} -> ${to}`);
  }
});

test('every other combination in the status x status x actor matrix is illegal', () => {
  const statuses = Object.values(STATUS);
  const actors = Object.values(ACTOR);
  const legalSet = new Set(LEGAL.map(([f, t, a]) => `${f}|${t}|${a}`));
  for (const from of statuses) {
    for (const to of statuses) {
      for (const actor of actors) {
        const isLegal = legalSet.has(`${from}|${to}|${actor}`);
        assert.strictEqual(
          canTransit(from, to, actor),
          isLegal,
          `mismatch for ${actor}: ${from} -> ${to} (expected ${isLegal})`
        );
      }
    }
  }
});

test('terminal states have no outgoing transitions', () => {
  assert.strictEqual(TRANSITIONS[STATUS.COMPLETED], undefined);
  assert.strictEqual(TRANSITIONS[STATUS.CANCELLED], undefined);
  assert.ok(!canTransit(STATUS.COMPLETED, STATUS.UNPAID, ACTOR.MERCHANT));
  assert.ok(!canTransit(STATUS.CANCELLED, STATUS.PAID, ACTOR.MERCHANT));
});

test('unknown status or actor returns false', () => {
  assert.ok(!canTransit('NOPE', STATUS.PAID, ACTOR.CUSTOMER));
  assert.ok(!canTransit(STATUS.UNPAID, 'NOPE', ACTOR.CUSTOMER));
  assert.ok(!canTransit(STATUS.UNPAID, STATUS.PAID, 'admin'));
});

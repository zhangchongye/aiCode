const { test } = require('node:test');
const assert = require('node:assert');
const { STATUS, ACTOR, TRANSITIONS, canTransit } = require('../cloudfunctions/order/stateMachine.js');
const { statusText, statusColor, customerActions } = require('../miniprogram/utils/orderStatus.js');

const EXPECTED_ACTIONS = {
  [STATUS.UNPAID]: [
    { action: 'pay', target: STATUS.PAID },
    { action: 'cancel', target: STATUS.CANCELLED },
  ],
  [STATUS.PAID]: [{ action: 'cancel', target: STATUS.CANCELLED }],
  [STATUS.PREPARING]: [],
  [STATUS.READY]: [{ action: 'complete', target: STATUS.COMPLETED }],
  [STATUS.COMPLETED]: [],
  [STATUS.CANCELLED]: [],
};

test('every status has a text and a color', () => {
  for (const status of Object.values(STATUS)) {
    assert.ok(statusText(status), `missing text for ${status}`);
    assert.ok(statusColor(status), `missing color for ${status}`);
  }
});

test('customer actions match the expected action set per status', () => {
  for (const [status, expected] of Object.entries(EXPECTED_ACTIONS)) {
    const actual = customerActions(status).map(({ action, target }) => ({ action, target }));
    assert.deepStrictEqual(actual, expected, `actions mismatch for ${status}`);
  }
});

test('every exposed customer action has a label', () => {
  for (const status of Object.values(STATUS)) {
    for (const a of customerActions(status)) {
      assert.ok(a.label, `missing label for ${status} action ${a.action}`);
    }
  }
});

test('every exposed customer action is a legal transition in the server state machine', () => {
  for (const status of Object.values(STATUS)) {
    for (const { action, target } of customerActions(status)) {
      assert.ok(
        canTransit(status, target, ACTOR.CUSTOMER),
        `exposed action "${action}" on ${status} -> ${target} is NOT legal server-side`
      );
    }
  }
});

test('every legal customer transition in the state machine is exposed to the UI', () => {
  for (const [from, list] of Object.entries(TRANSITIONS)) {
    const customerTargets = new Set(
      list.filter((t) => t.actor === ACTOR.CUSTOMER).map((t) => t.to)
    );
    const exposedTargets = new Set(customerActions(from).map((a) => a.target));
    assert.deepStrictEqual(
      [...customerTargets].sort(),
      [...exposedTargets].sort(),
      `UI is missing customer actions for status ${from}`
    );
  }
});

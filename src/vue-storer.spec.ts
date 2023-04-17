import { computed, reactive, readonly, defineComponent, nextTick } from 'vue';
import { test, expect } from 'vitest';
import { render } from '@testing-library/vue';

import { defineStore } from './vue-storer';

const useCounter = defineStore('counter', () => {
  const state = reactive({
    name: 'Counter',
    count: 0,
  });

  const getters = readonly({
    doubleCount: computed(() => state.count * 2),
  });

  const actions = readonly({
    increment() {
      state.count += 1;
    },
  });

  return { state, getters, actions };
});

test('store - 1', async () => {
  const { state, getters, actions, $reset } = useCounter();

  expect(state.count).toEqual(0);
  expect(getters.doubleCount).toEqual(0);

  actions.increment();
  expect(state.count).toEqual(1);
  expect(getters.doubleCount).toEqual(2);

  $reset();
  expect(state.count).toEqual(0);
  expect(getters.doubleCount).toEqual(0);
});

test('store - 2', async () => {
  const Test = defineComponent({
    emits: ['called'],
    setup(props, { emit }) {
      const { actions, $subscribe } = useCounter();

      $subscribe(() => {
        emit('called');
      });

      return { actions };
    },
    template: `<button @click="actions.increment">Increment</button>`,
  });

  const wrapper = render(Test);

  (await wrapper.findByText('Increment')).click();

  await nextTick();

  const calledEvent = wrapper.emitted('called');
  expect(calledEvent).toHaveLength(1);
});

import { isRef, isReadonly, isReactive, effectScope, watch } from 'vue';
import cloneDeep from 'lodash.clonedeep';

interface Storer {
  $reset(): void;
  $subscribe<F extends (...args: any[]) => any>(fn: F): void;
}

export const defineStore = <F extends (...args: any[]) => any>(name: string, options: F) => {
  const store = options();

  const initialState = cloneDeep(store);

  function $reset() {
    if (isReactive(store.state)) {
      Object.entries(initialState.state).forEach(([key, val]) => {
        store.state[key] = val;
      });
    } else {
      Object.entries(initialState).forEach(([key, val]) => {
        if (isRef(val) && !isReadonly(val)) {
          store[key].value = val.value;
        }
      });
    }
  }

  const $subscribe: Storer['$subscribe'] = (fn) => {
    const scope = effectScope();

    scope.run(() => {
      if (isReactive(store.state)) {
        watch(
          () => store.state,
          (value) => {
            fn(value);
          },
          { deep: true },
        );
      } else {
        watch(
          () => store,
          (value) => {
            const obj = {} as Record<string, unknown>;

            Object.entries(value).forEach(([key, val]) => {
              if (isRef(val) && !isReadonly(val)) {
                obj[key] = val;
              }
            });

            fn(obj);
          },
          { deep: true },
        );
      }
    });
  };

  return () =>
    ({
      ...store,
      $reset,
      $subscribe,
    } as ReturnType<F> & Storer);
};

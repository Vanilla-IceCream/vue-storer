import { isReactive, effectScope, watch } from 'vue';
import cloneDeep from 'lodash.clonedeep';

interface Store<S, G, A> {
  state: S;
  getters: G;
  actions: A;
  $reset: () => void;
  $subscribe: (fn: (state: S) => void) => void;
}

type StoreOptions<S, G, A> = () => {
  state?: S;
  getters?: G;
  actions?: A;
};

export const defineStore = <S extends object, G extends object, A extends Record<string, any>>(
  name: string,
  options: StoreOptions<S, G, A>,
  storage?: Storage,
): (() => Store<S, G, A>) => {
  const store = options();

  const initialState = cloneDeep(store);

  function $reset() {
    if (isReactive(store.state) && initialState.state) {
      Object.entries(initialState.state).forEach(([key, val]) => {
        if (store.state) {
          store.state[key as keyof typeof store.state] = val;
        }
      });
    }
  }

  const $subscribe = (fn: (state: S) => void) => {
    const scope = effectScope();

    scope.run(() => {
      if (isReactive(store.state)) {
        watch(
          () => store.state,
          (value) => {
            fn(value as S);
          },
          { deep: true },
        );
      }
    });
  };

  if (storage && isReactive(store.state)) {
    watch(
      () => store.state,
      (value) => {
        storage.setItem(name, JSON.stringify(value));
      },
      { deep: true },
    );

    const persistedState: S = JSON.parse(storage.getItem(name) as string);

    if (persistedState) {
      Object.entries(persistedState).forEach(([key, val]) => {
        if (store.state) {
          store.state[key as keyof typeof store.state] = val;
        }
      });
    }
  }

  return () => ({ ...store, $reset, $subscribe } as Store<S, G, A>);
};

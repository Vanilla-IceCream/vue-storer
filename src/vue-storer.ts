import { isReactive, effectScope, watch } from 'vue';
import cloneDeep from 'lodash.clonedeep';

interface Store<S, G, A> {
  state: S;
  getters: G;
  actions: A;
  $reset: () => void;
  $subscribe: (fn: (state: S) => void) => () => void;
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
  const scope = effectScope(true);

  let inited = false;
  let stored: Store<S, G, A>;
  let stated: S;

  return () => {
    if (!inited) {
      inited = true;
      stored = scope.run(() => options()) as Store<S, G, A>;
      stated = cloneDeep(stored.state);
    }

    function $reset() {
      const _stated = cloneDeep(stated);

      Object.entries(_stated).forEach(([key, val]) => {
        stored.state[key as keyof typeof stored.state] = val;
      });
    }

    const $subscribe = (fn: (state: S) => void) => {
      const subscriber = effectScope();

      subscriber.run(() => {
        if (isReactive(stored.state)) {
          watch(
            () => stored.state,
            (value) => {
              fn(value as S);
            },
            { deep: true },
          );
        }
      });

      return () => {
        subscriber.stop();
      };
    };

    if (storage && isReactive(stored.state)) {
      watch(
        () => stored.state,
        (value) => {
          storage.setItem(name, JSON.stringify(value));
        },
        { deep: true },
      );

      const persistedState: S = JSON.parse(storage.getItem(name) as string);

      if (persistedState) {
        Object.entries(persistedState).forEach(([key, val]) => {
          stored.state[key as keyof typeof stored.state] = val;
        });
      }
    }

    return { ...stored, $reset, $subscribe };
  };
};

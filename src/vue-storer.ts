import { isReactive, effectScope, watch, toRaw } from 'vue';

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
  storage?: Storage
): (() => Store<S, G, A>) => {
  const scope = effectScope(true);

  let inited = false;
  let stored: Store<S, G, A>;
  let stated: S;
  let hydrated = false;

  return () => {
    if (!inited) {
      inited = true;
      stored = scope.run(() => options()) as Store<S, G, A>;
      stated = structuredClone(toRaw(stored.state));
    }

    function $reset() {
      const _stated = structuredClone(stated);

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
            { deep: true }
          );
        }
      });

      return () => {
        subscriber.stop();
      };
    };

    if (storage && isReactive(stored.state)) {
      const watcher = watch(
        () => stored.state,
        (value) => {
          storage.setItem(name, JSON.stringify(value));
        },
        { deep: true }
      );

      if (!hydrated) {
        hydrated = true;

        const raw = storage.getItem(name);

        if (raw) {
          watcher.pause();

          try {
            const persistedState: S = JSON.parse(raw);

            Object.entries(persistedState).forEach(([key, val]) => {
              stored.state[key as keyof typeof stored.state] = val;
            });
          } catch (err) {
            console.error(`[vue-storer] Failed to parse persisted state for "${name}"`, err);
          } finally {
            watcher.resume();
          }
        }
      }

      if (storage === localStorage) {
        window.addEventListener('storage', (event) => {
          if (event.key === name && event.newValue) {
            watcher.pause();

            try {
              const newState: S = JSON.parse(event.newValue);

              Object.entries(newState).forEach(([key, val]) => {
                stored.state[key as keyof typeof stored.state] = val;
              });
            } catch (err) {
              console.error(
                `[vue-storer] Failed to sync state from storage event for "${name}"`,
                err
              );
            } finally {
              watcher.resume();
            }
          }
        });
      }
    }

    return { ...stored, $reset, $subscribe };
  };
};

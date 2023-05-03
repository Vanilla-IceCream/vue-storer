# vue-storer

State management for Vue.

## Installation

Install `vue-storer` with your favorite package manager:

```sh
$ npm i vue-storer
# or
$ yarn add vue-storer
# or
$ pnpm i vue-storer
# or
$ bun add vue-storer
```

## Usage

```ts
// esm
import { defineStore } from 'vue-storer';

// cjs
const { defineStore } = require('vue-storer');
```

## Guide

```ts
import { reactive, readonly } from 'vue';
import { defineStore } from 'vue-storer';

export const useCounter = defineStore('counter', () => {
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
```

```vue
<script lang="ts" setup>
import { useCounter } from './store';

const { state, getters, actions, $reset, $subscribe } = useCounter();

$subscribe((state) => {
  console.log(state.count);
});
</script>

<template>
  <p>Name: {{ state.name }}</p>
  <p>Count: {{ state.count }}</p>
  <p>Double Count: {{ getters.doubleCount }}</p>
  <button @click="actions.increment">Increment</button>
  <button @click="$reset">Reset</button>
</template>
```

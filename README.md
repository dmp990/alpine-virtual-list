# Alpine Virtual List

[![CI](https://github.com/dmp990/alpine-virtual-list/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dmp990/alpine-virtual-list/actions/workflows/ci.yml)

An Alpine.js plugin for rendering large, fixed-height lists with a small DOM window.

## Install

```sh
npm install alpine-virtual-list
```

```js
import Alpine from "alpinejs";
import virtualList from "alpine-virtual-list";

Alpine.plugin(virtualList);
Alpine.start();
```

For a script-tag build:

```html
<script defer src="/dist/cdn.js"></script>
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

## Usage

Place `x-virtual-list` on the scroll container and provide one child `<template>`.
The template root is reused for each visible item.

```html
<div
  x-data="{
    rows: Array.from({ length: 10000 }, (_, id) => ({ id, name: `Row ${id + 1}` }))
  }"
  x-virtual-list="{ items: rows, itemHeight: 44, overscan: 8, as: 'row', key: 'id' }"
  style="height: 360px; overflow-y: auto;"
>
  <template>
    <div class="row">
      <strong x-text="row.name"></strong>
      <span x-text="`#${index}`"></span>
    </div>
  </template>
</div>
```

## Options

| Option         | Type     | Default | Description                                               |
| -------------- | -------- | ------- | --------------------------------------------------------- |
| `items`        | `array`  | `[]`    | Items to render. Passing an array directly also works.    |
| `itemHeight`   | `number` | `40`    | Fixed row height in pixels.                               |
| `estimateSize` | `number` | `40`    | Alias for `itemHeight`.                                   |
| `overscan`     | `number` | `5`     | Extra rows to render before and after the viewport.       |
| `as`           | `string` | `item`  | Variable name for the current item in the template scope. |
| `indexAs`      | `string` | `index` | Variable name for the current item index.                 |
| `key`          | `string` | `index` | Property name or function used to keep row nodes stable.  |

Every row also receives a `virtual` object with `index`, `odd`, and `even`.

## Notes

This first version intentionally targets fixed-height rows. That keeps the plugin small, predictable, and fast. Variable-height measuring can be added later without changing the basic template API.

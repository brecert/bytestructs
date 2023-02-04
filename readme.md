# bytestructs

bytestructs is a small (<1.2kb gzipped) library to read bytes with a simple and readable dsl.

Some of the functionality is inspired by python's [`struct`](https://docs.python.org/3/library/struct.html) module.

I'm not quite sure what I want the functionality to be.

Right now it's in-between a javascript friendly `struct` and a way to define actual bytestructs with types, feedback would be appreciated.

```js
import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import {
  bytes,
  readBytesFrom,
  readStructFrom,
  sizeOf,
  writeBytesInto,
  writeStructInto,
} from "./bytestruct.js";

const Vec3f = bytes`be f64*3`;
const Position = bytes`be x:f64 y:f64 z:f64`;
const Triangle = bytes`be vertices:${Position}*3`;

const data = new Uint8Array(sizeOf(Triangle));
const view = new DataView(data.buffer);

assertEquals(
  writeBytesInto(view, Vec3f, [1, 2, 3], 0),
  24,
);

assertEquals(
  readBytesFrom(view, Vec3f, 0),
  [1, 2, 3],
);

const triangle = {
  vertices: [
    { x: 1, y: 2, z: 3 },
    { x: 4, y: 5, z: 6 },
    { x: 7, y: 8, z: 9 },
  ],
};

assertEquals(
  writeStructInto(view, Triangle, triangle, 0),
  72,
);

assertEquals(
  readStructFrom(view, Triangle, 0),
  triangle,
);
```
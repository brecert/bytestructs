import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import {
  bytes,
  readBytesFrom,
  readStructFrom,
  sizeOf,
  writeBytesInto,
  writeStructInto,
} from "./bytestruct.js";

Deno.test("sizeOf", () => {
  const struct = bytes`be byte*3 x:u8 y:u32 le z:u8 uv:u8*2`;
  assertEquals(sizeOf(struct), 3 + 1 + 4 + 1 + 2);
});

Deno.test("readBytesFrom", () => {
  const struct = bytes`le byte*3 x:f32 y:f32 be z:f32 uv:u8*2`;

  const buffer = new ArrayBuffer(sizeOf(struct));
  const view = new DataView(buffer);
  view.setUint8(0, 0);
  view.setUint8(1, 1);
  view.setUint8(2, 2);
  view.setFloat32(3, 3.3, true);
  view.setFloat32(7, 4.4, true);
  view.setFloat32(11, 5.5, false);
  view.setUint8(15, 6);
  view.setUint8(16, 7);

  assertEquals(
    readBytesFrom(view, struct, 0),
    [0, 1, 2, Math.fround(3.3), Math.fround(4.4), Math.fround(5.5), 6, 7],
  );
});

Deno.test("writeBytesInto", () => {
  const struct = bytes`le byte*3 x:f32 y:f32 be z:f32 uv:u8*2`;

  const buffer = new ArrayBuffer(sizeOf(struct));
  const view = new DataView(buffer);

  writeBytesInto(view, struct, [0, 1, 2, 3.3, 4.4, 5.5, 6, 7], 0);

  assertEquals(
    readBytesFrom(view, struct, 0),
    [0, 1, 2, Math.fround(3.3), Math.fround(4.4), Math.fround(5.5), 6, 7],
  );
});

Deno.test("writeStructInto", () => {
  const struct = bytes`le x:f32 y:f32 be z:f32 uv:u8*${2}`;

  const buffer = new ArrayBuffer(sizeOf(struct));
  const view = new DataView(buffer);

  writeStructInto(view, struct, { x: 1.1, y: 2.2, z: 3.3, uv: [4, 5] }, 0);

  assertEquals(
    readBytesFrom(view, struct, 0),
    [Math.fround(1.1), Math.fround(2.2), Math.fround(3.3), 4, 5],
  );
});

Deno.test("readStructFrom", () => {
  const struct = bytes`le x:f32 y:f32 be z:f32 uv:u8*2`;

  const buffer = new ArrayBuffer(sizeOf(struct));
  const view = new DataView(buffer);

  writeStructInto(view, struct, { x: 1.1, y: 2.2, z: 3.3, uv: [4, 5] }, 0);

  assertEquals(
    readStructFrom(view, struct, 0),
    {
      x: Math.fround(1.1),
      y: Math.fround(2.2),
      z: Math.fround(3.3),
      uv: [4, 5],
    },
  );
});
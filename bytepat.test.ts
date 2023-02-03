import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { bytes, readBytesFrom, sizeOf, writeBytesInto } from "./bytepat.js";

Deno.test("basic reading and writing", () => {
  const buf = new ArrayBuffer(50);
  const view = new DataView(buf);

  const pat = bytes`le f32*3`;
  assertEquals(sizeOf(pat), 12);
  assertEquals(writeBytesInto(pat, [1, 2, 3], view, 0), 12);
  assertEquals(readBytesFrom(pat, view, 0), [1, 2, 3]);
});

Deno.test("basic reading and writing with labels", () => {
  const buf = new ArrayBuffer(32);
  const view = new DataView(buf);

  const pat = bytes`be x:u8 y:u8 z:u8`;
  writeBytesInto(pat, [1, 2, 3], view, 0);

  const read = readBytesFrom(pat, view, 0);

  assertEquals(read.fields?.x, 1);
});

import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { bytes } from "./bytestruct.mini.js";

Deno.test("bytes", () => {
  const ty = bytes`be b1 s16 s32`;

  assertEquals(ty.byteSize(), 7);

  assertEquals(
    new Uint8Array(ty.bytes([1, 2, 3])),
    new Uint8Array([1, 0, 2, 0, 0, 0, 3]),
  );

  assertEquals(
    ty.readBytes(new Uint8Array([1, 0, 2, 0, 0, 0, 3]).buffer),
    [1, 2, 3],
  );
});

Deno.test("bytes repeat", () => {
  const ty = bytes`be b1*2 s16*2 s32*2`;

  assertEquals(ty.byteSize(), 14);

  const values = [1, 2, 3, 4, 5, 6];
  const expectedBytes = new Uint8Array(
    [1, 2, 0, 3, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6],
  );

  assertEquals(
    new Uint8Array(ty.bytes(values)),
    expectedBytes,
  );

  assertEquals(
    ty.readBytes(expectedBytes.buffer),
    values,
  );
});

Deno.test("bytes byte type", () => {
  const ty = bytes`be b3 b2 b1`;

  assertEquals(ty.byteSize(), 6);

  const values = [1, 2, 3, 4, 5, 6];
  const expectedBytes = new Uint8Array([1, 2, 3, 4, 5, 6]);

  assertEquals(
    new Uint8Array(ty.bytes(values)),
    expectedBytes,
  );

  assertEquals(
    ty.readBytes(expectedBytes.buffer),
    values,
  );
});

Deno.test("bytes interpolation", () => {
  const ty = bytes`be b1*${3} u8*${2}`;

  assertEquals(ty.byteSize(), 5);

  const values = [1, 2, 3, 4, 5];
  const expectedBytes = new Uint8Array([1, 2, 3, 4, 5]);

  assertEquals(
    new Uint8Array(ty.bytes(values)),
    expectedBytes,
  );

  assertEquals(
    ty.readBytes(expectedBytes.buffer),
    values,
  );
});

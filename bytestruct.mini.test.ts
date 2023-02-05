import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { bytes, ByteStruct, ByteValue } from "./bytestruct.mini.js";

function toBytes(byteStruct: ByteStruct, values: ByteValue[]) {
  const buffer = new ArrayBuffer(byteStruct.byteSize());
  byteStruct.writeBytes(values, buffer);
  return buffer;
}
Deno.test("bytes", () => {
  const ty = bytes`be b1 s16 s32`;

  assertEquals(ty.byteSize(), 7);

  assertEquals(
    new Uint8Array(toBytes(ty, [1, 2, 3])),
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
    new Uint8Array(toBytes(ty, values)),
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
    new Uint8Array(toBytes(ty, values)),
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
    new Uint8Array(toBytes(ty, values)),
    expectedBytes,
  );

  assertEquals(
    ty.readBytes(expectedBytes.buffer),
    values,
  );
});

Deno.test("readme bytestruct mini", () => {
  const struct = bytes`be s64 u32 u8*2 b3`;

  assertEquals(struct.byteSize(), 17);

  const array = new Uint8Array(struct.byteSize());

  assertEquals(
    struct.writeBytes([10n, 2, 3, 4, 5, 6, 7], array.buffer),
    17,
  );

  assertEquals(
    array,
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 2, 3, 4, 5, 6, 7]),
  );

  assertEquals(
    struct.readBytes(array.buffer),
    [10n, 2, 3, 4, 5, 6, 7],
  );
});

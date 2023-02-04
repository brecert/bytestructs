import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { bytes, readBytesFrom, sizeOf, writeBytesInto } from "./bytestruct.js";

Deno.test("basic reading and writing", () => {
  const buf = new ArrayBuffer(50);
  const view = new DataView(buf);

  const fields = bytes`le f32*3`;
  assertEquals(sizeOf(fields), 12);
  assertEquals(writeBytesInto(fields, [1, 2, 3], view, 0), 12);
  assertEquals(readBytesFrom(fields, view, 0), [1, 2, 3]);
});

Deno.test("basic reading and writing with labels", () => {
  const buf = new ArrayBuffer(32);
  const view = new DataView(buf);

  const VertexInfo = bytes`be x:u8 y:u32 z:u8 uv:u8*2`;

  writeBytesInto(VertexInfo, [1, 2, 3, 4, 5], view, 0);

  const read = readBytesFrom(VertexInfo, view, 0);

  assertEquals(read.fields, { x: 1, y: 2, z: 3, uv: [4, 5] });
});

Deno.test("byte type", () => {
  
  const ModelInfo = bytes`be header:byte*8 vertexCount:u32`;
  
  const buf = new ArrayBuffer(sizeOf(ModelInfo));
  const view = new DataView(buf);

  writeBytesInto(ModelInfo, [1, 2, 3, 4, 5, 6, 7, 8, 10], view, 0);

  assertEquals(new Uint8Array(buf), new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0, 10]))

  const read = readBytesFrom(ModelInfo, view, 0);

  assertEquals(read.fields, { header: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), vertexCount: 10 });
});

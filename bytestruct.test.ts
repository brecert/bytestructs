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

Deno.test("sizeOf nested", () => {
  const struct1 = bytes`be byte*3`;
  const struct2 = bytes`be byte*3 x:u8 y:u8 z:u8 ${struct1} u:u8 v:u8`;
  assertEquals(sizeOf(struct2), 3 + 1 + 1 + 1 + 3 + 1 + 1);
});

Deno.test("readStructFrom nested", () => {
  const Vector3f = bytes`be x:f64 y:f64 z:f64`;
  const Texcoord = bytes`be u:u8 v:u8`;
  const Vertex =
    bytes`be position:${Vector3f} normal:${Vector3f} uv:${Texcoord}`;

  const buffer = new ArrayBuffer(sizeOf(Vertex));
  const view = new DataView(buffer);

  let pos = 0;
  view.setFloat64(pos, 1.1);
  view.setFloat64(pos += 8, 2.2);
  view.setFloat64(pos += 8, 3.3);
  view.setFloat64(pos += 8, 4.4);
  view.setFloat64(pos += 8, 5.5);
  view.setFloat64(pos += 8, 6.6);
  view.setUint8(pos += 8, 7);
  view.setUint8(pos += 1, 8);

  assertEquals(
    readStructFrom(view, Vertex, 0),
    {
      position: { x: 1.1, y: 2.2, z: 3.3 },
      normal: { x: 4.4, y: 5.5, z: 6.6 },
      uv: { u: 7, v: 8 },
    },
  );
});

Deno.test("writeStructInto nested", () => {
  const Vector3f = bytes`be x:f64 y:f64 z:f64`;
  const Texcoord = bytes`be u:u8 v:u8`;
  const Vertex =
    bytes`be position:${Vector3f} normal:${Vector3f} uv:${Texcoord}`;

  const buffer = new ArrayBuffer(sizeOf(Vertex));
  const view = new DataView(buffer);

  const data = {
    position: { x: 1.1, y: 2.2, z: 3.3 },
    normal: { x: 4.4, y: 5.5, z: 6.6 },
    uv: { u: 7, v: 8 },
  };

  writeStructInto(view, Vertex, data, 0);
  assertEquals(readStructFrom(view, Vertex, 0), data);
});

Deno.test("readme bytestruct", () => {
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
});

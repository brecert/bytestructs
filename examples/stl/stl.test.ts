import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { sizeOf } from "../../bytestruct.js";
import * as stl from "./stl.ts";

const textDecoder = new TextDecoder();
// todo: change this
const modelData = await Deno.readFile("./examples/stl/cube.stl");
const dataView = new DataView(modelData.buffer);

Deno.test("readSTL", () => {
  const model = stl.readSTL(dataView);

  assertEquals(
    textDecoder.decode(model.header.header),
    "Exported from Blender-3.4.1".padEnd(80, "\0"),
  );

  assertEquals(
    model.triangles.length,
    12,
  );
});

Deno.test("writeSTL", () => {
  const originalModel = stl.readSTL(dataView);

  const buffer = new ArrayBuffer(
    sizeOf(stl.BinarySTLHeader) +
      sizeOf(stl.Triangle) * originalModel.header.triangleCount,
  );
  const view = new DataView(buffer);

  stl.writeSTL(view, originalModel.triangles, originalModel.header.header);

  const model = stl.readSTL(view);

  assertEquals(model, originalModel);
});

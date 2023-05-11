import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { sizeOf } from "../../bytestruct.js";
import * as stl from "./stl.ts";

const textDecoder = new TextDecoder();
const dataView = () => {
  const modelData = Deno.readFileSync("./examples/stl/cube.stl");
  return new DataView(modelData.buffer);
};

Deno.test("readSTL", () => {
  const model = stl.readSTL(dataView());

  assertEquals(
    textDecoder.decode(model.header.header),
    "Exported from Blender-3.4.1".padEnd(80, "\0"),
  );

  assertEquals(
    model.triangles.length,
    12,
  );

  assertEquals(
    model.triangles[0],
    {
      flags: 0,
      normal: { x: -1, y: 0, z: 0 },
      vertices: [
        { x: -1, y: -1, z: -1 },
        { x: -1, y: -1, z: 1 },
        { x: -1, y: 1, z: 1 },
      ],
    },
  );
});

Deno.test("writeSTL", () => {
  const originalModel = stl.readSTL(dataView());

  const buffer = new ArrayBuffer(
    sizeOf(stl.BinarySTLHeader) +
      sizeOf(stl.Triangle) * originalModel.header.triangleCount,
  );
  const view = new DataView(buffer);

  stl.writeSTL(view, originalModel.triangles, originalModel.header.header);

  const model = stl.readSTL(view);

  assertEquals(model, originalModel);
});

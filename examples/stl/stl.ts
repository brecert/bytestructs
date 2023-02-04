import {
  bytes,
  readStructFrom,
  sizeOf,
  writeStructInto,
} from "../../bytestruct.js";

export interface Vector3f {
  x: number;
  y: number;
  z: number;
}

export interface Triangle {
  normal: Vector3f;
  points: [Vector3f, Vector3f, Vector3f];
  flags: number;
}

export interface BinarySTLHeader {
  header: Uint8Array;
  triangleCount: number;
}

export const Vector3f = bytes<Vector3f>`le
  x: f32
  y: f32
  z: f32
`;

export const Triangle = bytes<Triangle>`le
  normal: ${Vector3f}
  vertices: ${Vector3f}*3
  flags: u16
`;

export const BinarySTLHeader = bytes<BinarySTLHeader>`le
  header: byte*80
  triangleCount: u32
`;

export function readSTL(view: DataView) {
  let pos = 0;
  const header = readStructFrom(view, BinarySTLHeader, pos);
  pos += sizeOf(BinarySTLHeader);
  const triangles = [];

  for (let i = 0; i < header.triangleCount; i++) {
    triangles.push(readStructFrom(view, Triangle, pos));
    pos += sizeOf(Triangle);
  }

  return { header, triangles };
}

export function writeSTL(
  view: DataView,
  triangles: Triangle[],
  header: Uint8Array,
) {
  let pos = 0;
  pos += writeStructInto(view, BinarySTLHeader, {
    header,
    triangleCount: triangles.length,
  }, 0);
  for (const triangle of triangles) {
    pos += writeStructInto(view, Triangle, triangle, pos);
  }
}

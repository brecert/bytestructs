import { bytes } from "../bytestruct.js"

const Vector3f = bytes`le
  x: f32
  y: f32
  z: f32
`

const Triangle = bytes`le
  normal: ${Vector3f}
  points: ${Vector3f}*3
  flags: u16
`
const BinarySTLHeader = bytes`le
  header: byte*80
  triangleCount: u32
`

const STL = bytes`
  header: ${BinarySTLHeader}
  triangles: ${Triangle}*${(self) => self.header.triangleCount}
`
interface ByteStructField {
  name: "f" | "s" | "u";
  size: number;
  littleEndian: boolean;
  repeat?: number;
}

type ByteValue =
  | number
  | bigint
  | number[]
  | bigint[]
  | Uint8Array;

interface ByteValuesArray extends Array<ByteValue> {
  fields?: Record<string, ByteValue>;
}

declare function bytes(
  strings: TemplateStringsArray,
  ...values: any[]
): ByteStructField[];

declare function sizeOf(fields: ByteStructField[]): number;

declare function readBytesFrom(
  view: DataView,
  fields: ByteStructField[],
  offset: number,
): ByteValuesArray;

declare function writeBytesInto(
  view: DataView,
  fields: ByteStructField[],
  bytes: ByteValue[],
  offset: number,
): number;

declare function writeStructInto(
  view: DataView,
  fields: ByteStructField[],
  struct: Record<string, ByteValue>,
  offset: number,
): number;

declare function readStructFrom(
  view: DataView,
  fields: ByteStructField[],
  offset: number,
): Record<string, ByteValue>;

export {
  bytes,
  ByteStructField,
  ByteValue,
  readBytesFrom,
  readStructFrom,
  sizeOf,
  writeBytesInto,
  writeStructInto,
};

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

declare function sizeOf(pat: ByteStructField[]): number;

declare function readBytesFrom(
  pat: ByteStructField[],
  view: DataView,
  offset: number,
): ByteValuesArray;

declare function writeBytesInto(
  pat: ByteStructField[],
  bytes: ByteValue[],
  view: DataView,
  offset: number,
): number;

export {
  bytes,
  ByteStructField,
  ByteValue,
  readBytesFrom,
  sizeOf,
  writeBytesInto,
};

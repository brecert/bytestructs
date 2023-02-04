interface ByteStructField<T = unknown> {
  name: "f" | "s" | "u";
  size: number;
  littleEndian: boolean;
  repeat?: number;
}

type ByteValue =
  | number
  | bigint
  | Uint8Array
  | { [key: string]: ByteValue }
  | ByteValue[];

declare function bytes<T = Record<string, ByteValue>>(
  strings: TemplateStringsArray,
  ...values: any[]
): ByteStructField<T>[];

declare function sizeOf(fields: ByteStructField[]): number;

declare function readBytesFrom(
  view: DataView,
  fields: ByteStructField[],
  offset: number,
): ArrayLike<number | bigint>;

declare function writeBytesInto(
  view: DataView,
  fields: ByteStructField[],
  bytes: ArrayLike<number | bigint>,
  offset: number,
): number;

declare function writeStructInto<T>(
  view: DataView,
  fields: ByteStructField<T>[],
  struct: T,
  offset: number,
): number;

declare function readStructFrom<T>(
  view: DataView,
  fields: ByteStructField<T>[],
  offset: number,
): T;

export {
  bytes,
  ByteStructField,
  ByteValue,
  readBytesFrom,
  readStructFrom,
  sizeOf,
  writeBytesInto,
  writeStructInto
}
interface BytePat {
  name: "f" | "s" | "u";
  size: number;
  littleEndian: boolean;
  repeat?: number;
}

type ByteValue =
  | number
  | bigint
  | number[]
  | bigint[];

interface ByteValuesArray extends Array<ByteValue> {
  fields?: Record<string, ByteValue>
}

declare function bytes(
  strings: TemplateStringsArray,
  ...values: any[]
): BytePat[];

declare function sizeOf(pat: BytePat[]): number;

declare function readBytesFrom(
  pat: BytePat[],
  view: DataView,
  offset: number,
): ByteValuesArray;

declare function writeBytesInto(
  pat: BytePat[],
  bytes: ByteValue[],
  view: DataView,
  offset: number,
): number;

export { BytePat, bytes, ByteValue, readBytesFrom, sizeOf, writeBytesInto };

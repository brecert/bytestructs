export type ByteValue = number | bigint;

export interface ByteStruct {
  byteSize(): number;
  readBytes(buffer: ArrayBuffer): ByteValue[];
  writeBytes(values: ByteValue[], buffer: ArrayBuffer): number;
}

declare function bytes(strings: TemplateStringsArray, ...values: any): ByteStruct

export { bytes };

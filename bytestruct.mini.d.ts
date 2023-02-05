type ByteValue = number | bigint;

declare function bytes(strings: TemplateStringsArray, ...values: any): {
  byteSize(): number;
  bytes(values: ByteValue[]): ArrayBuffer;
  readBytes(buffer: ArrayBuffer): ByteValue[];
  writeBytes(buffer: ArrayBuffer, values: ByteValue[]): number;
};

export { bytes };

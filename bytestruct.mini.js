/// <reference types="./bytestruct.mini.d.ts" />

const FullName = {
  f: 'Float',
  s: 'Int',
  u: 'Uint'
}

// we match the entire repeat to save on bytes
// the performance benefit of not matching it shouldn't be that high in this context
// (le|be) is (l|b)e for byte size
const
  TOKENS = /^([fsub])(\d+)(\*(\d+)?)?|(l|b)e$/

const
  TokenTypeName = 1,
  TokenTypeSize = 2,
  TokenRepeat = 3,
  TokenRepeatCount = 4,
  TokenEndianness = 5

export function bytes(strings, ...values) {
  const fields = []

  let littleEndian
  for (const string of strings) {
    for (const typeString of string.split(/\s+/)) {
      if (typeString) {
        const typeToken = typeString.match(TOKENS)

        if (typeToken[TokenEndianness]) {
          littleEndian = typeToken[TokenEndianness] === 'le'
        } else {
          fields.push([
            typeToken[TokenTypeName],
            typeToken[TokenTypeSize],
            typeToken[TokenRepeatCount] ?? 1,
            littleEndian,
          ])
        }
      }
    }

    // we could add checks here, but it's not really needed.
    if (values.length) {
      fields.at(-1)[2] = values.shift()
    }
  }

  return {
    byteSize() {
      let byteSize = 0
      // .reduce compresses worse
      for (const [type, size, repeat] of fields) {
        // we use / 8 for better compression
        byteSize += type !== 'b'
          ? size * repeat / 8
          : size * repeat
      }
      return byteSize
    },
    readBytes(buffer) {
      const view = new DataView(buffer);
      const values = []
      let viewPos = 0

      for (const [type, size, repeat, littleEndian] of fields) {
        if (type === 'b') {
          const bytes = new Uint8Array(buffer, viewPos, size * repeat)
          values.push(...bytes)
          viewPos += size * repeat
        } else {
          const byteSize = size / 8
          // we use the regex here to save on bytes instead of (type === 's' || type === 'u')
          const fullName = size === 64 && /[su]/.test(type)
            ? `Big${FullName[type]}`
            : FullName[type]

          for (let i = 0; i < repeat; i++) {
            const value = view[`get${fullName}${size}`](viewPos, littleEndian)
            values.push(value)
            viewPos += byteSize
          }
        }
      }

      return values
    },
    bytes(values) {
      const buffer = new ArrayBuffer(this.byteSize())
      this.writeBytes(values, buffer)
      return buffer
    },
    writeBytes(values, buffer) {
      const view = new DataView(buffer)
      let viewPos = 0
      let bytePos = 0

      for (const [type, size, repeat, littleEndian] of fields) {
        if (type === 'b') {
          const bytes = values.slice(bytePos, bytePos + size * repeat)
          new Uint8Array(buffer, bytePos).set(bytes)
          bytePos += size * repeat
          viewPos += size * repeat
        } else {
          const byteSize = size / 8
          const fullName = size === 64 && /[su]/.test(type)
            ? `Big${FullName[type]}`
            : FullName[type]

          for (let i = 0; i < repeat; i++) {
            view[`set${fullName}${size}`](viewPos, values[bytePos++], littleEndian)
            viewPos += byteSize
          }
        }
      }

      return viewPos
    }
  }
}

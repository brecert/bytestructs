/// <reference types="./bytestruct.d.ts" />

// types
// f32, f64
// s8, s16, s32, s64
// u8, u16, u32, u64
// byte, pad

const
  TOKENS = /(le|be)|(?:([fsu])(8|16|32|64))|(\d+)|(\w+):|(\s+)|(.)/g

const
  TokenEndianness = 1,
  TokenPartTypeName = 2,
  TokenPartTypeSize = 3,
  TokenNum = 4,
  TokenLabel = 5,
  TokenIgnore = 6,
  TokenSymbol = 7

const
  ModeTypes = 0,
  ModeRepeat = 1

const ByteSizes = {
  8: 1,
  16: 2,
  32: 4,
  64: 8
}

const FullName = {
  f: 'Float',
  s: 'Int',
  u: 'Uint'
}

export function bytes(strings, ...values) {
  let mode = ModeTypes
  let littleEndian
  let parts = []
  let label

  const handleMode = (value, token) => {
    ({
      [ModeTypes]: () => {
        if (DEBUG) {
          if (!token) {
            throw new Error(`Invalid interpolation for ${value}`)
          }
          if (littleEndian == null && !token[TokenEndianness]) {
            throw new Error(`Pattern much start by declaring endianness with 'le' or 'be'`)
          }
          if (label != null && !token[TokenPartTypeName]) {
            throw new Error(`Label requires a type after it`)
          }
        }

        if (token[TokenEndianness]) {
          littleEndian = token[TokenEndianness] === 'le'
        } else if (token[TokenPartTypeName]) {
          let name = token[TokenPartTypeName]
          let size = token[TokenPartTypeSize]

          let part = { name, size, littleEndian }
          if (label != null) {
            part.label = label
            label = undefined
          }
          parts.push(part)
        } else if (token[TokenLabel]) {
          label = token[TokenLabel]
        } else if (token[TokenSymbol] === '*') {
          mode = ModeRepeat
        } else {
          if (DEBUG) throw new Error(`Invalid token for '${token[0]}' for ModeTypes`)
        }
      },
      [ModeRepeat]: () => {
        if (DEBUG && !token) throw new Error(`Invalid interpolation for ${value}`)

        if (token[TokenNum]) {
          const times = parseInt(token[TokenNum])
          parts.at(-1)['repeat'] = times
          mode = ModeTypes
        } else {
          if (DEBUG) throw new Error(`Invalid token '${token[0]}' for ModeRepeat`)
        }
      }
    })[mode]()
  }

  for (let i = 0; i < strings.length; i++) {
    const string = strings[i];
    const tokens = string.matchAll(TOKENS);
    for (const token of tokens) {
      if (token[TokenIgnore]) continue;

      handleMode(undefined, token)
    }

    if (i < values.length) handleMode(values[i])
  }

  return parts
}

export function sizeOf(fields) {
  let totalSize = 0
  for (const field of fields) {
    let byteSize = ByteSizes[field.size]
    if (field.repeat) byteSize *= field.repeat
    totalSize += byteSize
  }
  return totalSize
}

// todo: clean
export function readBytesFrom(fields, view, offset) {
  let pos = offset
  let output = []
  for (let i = 0; i < fields.length; i++) {
    const { name, size, littleEndian, repeat, label } = fields[i]
    let fullName = FullName[name]
    let byteSize = ByteSizes[size]

    if (name === 's' || name === 'u' && size === 64) {
      fullName = `Big${fullName}`
    }

    if (label) output.fields ??= {}

    // having labels directly assign to the array seems like it could be a source of issues
    // keeping for now out of convenience
    const readData = view[`get${fullName}${size}`].bind(view)
    if (repeat) {
      if (label) output.fields[label] = []
      for (let j = 0; j < repeat; j++) {
        const data = readData(pos, littleEndian)
        output.push(data)
        if (label) output.fields[label][j] = data
        pos += byteSize
      }
    } else {
      const data = output[i] = readData(pos, littleEndian)
      if (label) output.fields[label] = data
      pos += byteSize
    }
  }
  return output
}

export function writeBytesInto(fields, bytes, view, offset) {
  let pos = offset

  if (DEBUG) {
    let entrySize = fields.reduce((prev, type) => prev + (type.repeat ?? 1), 0)
    if (entrySize !== bytes.length) {
      throw new Error(`Byte count and total pat byte count does not match.`)
    }
  }

  let bytePos = 0
  for (let i = 0; i < fields.length; i++) {
    const { name, size, littleEndian, repeat } = fields[i]
    let fullName = FullName[name]
    let byteSize = ByteSizes[size]

    if (name === 's' || name === 'u' && size === 64) {
      fullName = `Big${fullName}`
    }

    let writeData = view[`set${fullName}${size}`].bind(view)
    if (repeat) {
      for (let i = 0; i < repeat; i++) {
        writeData(pos, bytes[bytePos], littleEndian)
        pos += byteSize
        bytePos += 1
      }
    } else {
      writeData(pos, bytes[bytePos], littleEndian)
      pos += byteSize
      bytePos += 1
    }
  }

  return pos - offset
}
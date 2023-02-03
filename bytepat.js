/// <reference types="./bytepat.d.ts" />

// types
// f32, f64
// s8, s16, s32, s64
// u8, u16, u32, u64
// byte, pad

const
  DEBUG = true

const
  TOKENS = /(le|be)|(?:([fsu])(8|16|32|64))|(\d+)|(\s+)|(.)/g

const
  TokenEndianness = 1,
  TokenPartTypeName = 2,
  TokenPartTypeSize = 3,
  TokenNum = 4,
  TokenIgnore = 5,
  TokenSymbol = 6

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

  const handleMode = (value, token) => {
    ({
      [ModeTypes]: () => {
        if (DEBUG && !token) throw new Error(`Invalid interpolation for ${value}`)
        if (DEBUG && littleEndian == null && !token[TokenEndianness])
          throw new Error(`Pattern much start by declaring endianness with 'le' or 'be'`)

        if (token[TokenEndianness]) {
          littleEndian = token[TokenEndianness] === 'le'
        } else if (token[TokenPartTypeName]) {
          let name = token[TokenPartTypeName]
          let size = token[TokenPartTypeSize]

          parts.push({ name, size, littleEndian })
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

export function sizeOf(pat) {
  let totalSize = 0
  for (const part of pat) {
    let byteSize = ByteSizes[part.size]
    if (part.repeat) byteSize *= part.repeat
    totalSize += byteSize
  }
  return totalSize
}

export function readBytesFrom(pat, view, offset) {
  let pos = offset
  let output = []
  for (const { name, size, littleEndian, repeat } of pat) {
    let fullName = FullName[name]
    let byteSize = ByteSizes[size]

    if (name === 's' || name === 'u' && size === 64) {
      fullName = `Big${fullName}`
    }

    let readData = view[`get${fullName}${size}`].bind(view)
    if (repeat) {
      for (let i = 0; i < repeat; i++) {
        output.push(readData(pos, littleEndian))
        pos += byteSize
      }
    } else {
      output.push(readData(pos, littleEndian))
    }
  }
  return output
}

export function writeBytesInto(pat, bytes, view, offset) {
  let pos = offset

  if (DEBUG) {
    let entrySize = pat.reduce((prev, type) => prev + (type.repeat ?? 1), 0)
    if (entrySize !== bytes.length) {
      throw new Error(`Byte count and total pat byte count does not match.`)
    }
  }

  let bytePos = 0
  for (let i = 0; i < pat.length; i++) {
    const { name, size, littleEndian, repeat } = pat[i]
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
      bytePos += 1
    }
  }

  return pos - offset
}
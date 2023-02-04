/// <reference types="./bytestruct.d.ts" />

// types
// f32, f64
// s8, s16, s32, s64
// u8, u16, u32, u64
// todo?: byte (u8)?, pad (u8)?

const
  // globalThis.__DEBUG__ will be replaced with false and optimized away at build time.
  DEBUG = globalThis.__DEBUG__ ?? true

const
  TOKENS = /(le|be)|(byte)|(?:([fsu])(8|16|32|64))|(\d+)|(\w+):|(\s+)|(.)/g

const
  TokenEndianness = 1,
  TokenByte = 2,
  TokenPartTypeName = 3,
  TokenPartTypeSize = 4,
  TokenNum = 5,
  TokenLabel = 6,
  TokenIgnore = 7,
  TokenSymbol = 8

const
  ModeTypes = 0,
  ModeRepeat = 1

const ByteSizes = {
  8: 1,
  16: 2,
  32: 4,
  64: 8,
  bytes: 1
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
          if (!token && !Array.isArray(value)) {
            throw new Error(`Invalid interpolation for ${value}`)
          }
          if (littleEndian == null && !token[TokenEndianness]) {
            throw new Error(`Pattern much start by declaring endianness with 'le' or 'be'`)
          }
          if (label != null && !Array.isArray(value) && !token[TokenPartTypeName] && !token[TokenByte]) {
            throw new Error(`Label '${label}' requires a type after it`)
          }
        }

        if (Array.isArray(value)) {
          parts.push({ name: value, label })
          label = undefined
        } else if (token[TokenEndianness]) {
          littleEndian = token[TokenEndianness] === 'le'
        } else if (token[TokenByte]) {
          let part = { name: 'bytes' }
          if (label != null) {
            part.label = label
            label = undefined
          }
          parts.push(part)
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
        if (DEBUG && !token && typeof value !== 'number')
          throw new Error(`Invalid interpolation for ${value}`)

        if (!token || token[TokenNum]) {
          const times = value ?? parseInt(token[TokenNum])
          parts.at(-1).repeat = times
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
    let byteSize = Array.isArray(field.name)
      ? sizeOf(field.name)
      : ByteSizes[field.size ?? field.name]

    if (field.repeat) byteSize *= field.repeat
    totalSize += byteSize
  }
  return totalSize
}

export function writeStructInto(view, fields, struct, offset) {
  let pos = offset
  for (const { name: type, size, littleEndian, repeat, label } of fields) {
    if (DEBUG && !label) {
      // we do not continue here because we do not want a difference in behavior between debug and final builds
      console.warn(`You're trying to write a struct that has unnamed fields. Unnamed fields may not be written, please name them or use 'writeBytesInto' instead if this is not the intended behavior.`)
    }
    const value = struct[label]

    if (Array.isArray(type)) {
      pos += writeStructInto(view, type, value, pos)
      continue
    }

    const byteSize = ByteSizes[size]
    const fullName = (type === 's' || type === 'u') && size === 64
      ? `Big${FullName[type]}`
      : FullName[type]

    const writeData = view[`set${fullName}${size}`].bind(view)
    if (repeat) {
      for (let i = 0; i < repeat; i++) {
        writeData(pos, value[i], littleEndian)
        pos += byteSize
      }
    } else {
      writeData(pos, value, littleEndian)
      pos += byteSize
    }
  }

  return pos - offset
}

export function readStructFrom(view, fields, offset) {
  const struct = {}
  let pos = offset

  // todo: test performance
  for (const { name: type, size, littleEndian, repeat, label } of fields) {
    const byteSize = ByteSizes[size ?? type]

    if (DEBUG && label in struct) {
      console.warn(`There are duplicate fields for '${label}' in ${struct}`)
    }

    if (!label) {
      pos += byteSize
      continue
    }

    if (Array.isArray(type)) {
      struct[label] = readStructFrom(view, type, pos)
      pos += sizeOf(type)
      continue
    }

    if (type === 'bytes') {
      const size = repeat ?? 1
      const uint8 = new Uint8Array(view.buffer)
      struct[label] = uint8.slice(pos, pos + size)
      pos += size
    } else {
      const fullName = (type === 's' || type === 'u') && size === 64
        ? `Big${FullName[type]}`
        : FullName[type]

      const readData = view[`get${fullName}${size}`].bind(view)
      if (repeat) {
        const bytes = []
        for (let j = 0; j < repeat; j++) {
          bytes[j] = readData(pos, littleEndian)
          pos += byteSize
        }
        struct[label] = bytes
      } else {
        struct[label] = readData(pos, littleEndian)
        pos += byteSize
      }
    }
  }

  return struct
}

// todo: clean
export function readBytesFrom(view, fields, offset) {
  let pos = offset
  let output = []
  for (let i = 0; i < fields.length; i++) {
    const { name, size, littleEndian, repeat } = fields[i]

    // TODO: not sure how I feel about the `byte` feature
    // it feel like a feature to be a feature when 'good-enough' alternatives exist even if they're not perfect
    if (name === 'bytes') {
      const size = repeat ?? 1
      const uint8 = new Uint8Array(view.buffer)
      const slice = uint8.slice(pos, pos + size)
      output.push.apply(output, slice)
      pos += size
      continue
    }

    const byteSize = ByteSizes[size]
    const fullName = (name === 's' || name === 'u') && size === 64
      ? `Big${FullName[name]}`
      : FullName[name]

    const readData = view[`get${fullName}${size}`].bind(view)
    if (repeat) {
      for (let j = 0; j < repeat; j++) {
        const data = readData(pos, littleEndian)
        output.push(data)
        pos += byteSize
      }
    } else {
      const data = readData(pos, littleEndian)
      output.push(data)
      pos += byteSize
    }
  }
  return output
}

export function writeBytesInto(view, fields, bytes, offset) {
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

    if (name === 'bytes') {
      const size = repeat ?? 1
      const data = bytes.slice(bytePos, bytePos + size)
      // todo: check if more specialized init is faster
      const uint8 = new Uint8Array(view.buffer);
      uint8.set(data, pos)
      pos += size
      bytePos += size
      continue
    }

    const byteSize = ByteSizes[size]
    const fullName = (name === 's' || name === 'u') && size === 64
      ? `Big${FullName[name]}`
      : FullName[name]

    const writeData = view[`set${fullName}${size}`].bind(view)
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
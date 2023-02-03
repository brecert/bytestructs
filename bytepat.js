// types
// f32, f64
// s8, s16, s32, s64
// u8, u16, u32, u64
// byte, pad

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

const numTypeRe = /^([fsu])(8|16|32|64)$/

// format: (le|be) (types )* 
export function parsePat(expr) {
  const parts = expr.split(' ')
  const littleEndian = parts[0] === 'be' ? false : true;
  const output = Array(parts.length - 1)

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];

    if (numTypeRe.test(part)) {
      const [_, ty, bits] = part.match(numTypeRe);

      output[i - 1] = ({ ty, bits, littleEndian })
    }
  }

  return output
}

export function unpackFrom(pat, view, offset) {
  let pos = 0
  let output = []
  for (const { ty, bits, littleEndian } of pat) {
    let fullName = FullName[ty]
    let sizeof = ByteSizes[bits]
    if (ty === 's' || ty === 'u' && bits === 64) {
      fullName = `Big${fullName}`
    }

    const data = view[`get${fullName}${bits}`](offset + pos, littleEndian)
    output.push(data)

    pos += sizeof
  }
  return output
}

const pat = parsePat('le u8 u8 u8')
console.log(pat)
const buf = new ArrayBuffer(32)
const view = new DataView(buf)
view.setInt8(0, 4)
const unpacked = unpackFrom(pat, view, 0)
console.log(unpacked)
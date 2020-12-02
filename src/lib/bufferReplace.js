const bufferReplace = (buf, a, b) => {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf)
  const idx = buf.indexOf(a)
  if (idx === -1) return buf
  if (!Buffer.isBuffer(b)) b = Buffer.from(b)

  const before = buf.slice(0, idx)
  const after = bufferReplace(buf.slice(idx + a.length), a, b)
  const len = idx + b.length + after.length
  return Buffer.concat([before, b, after], len)
}

module.exports = bufferReplace
export default bufferReplace

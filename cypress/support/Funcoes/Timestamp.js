
function isoForFileName(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

module.exports = { isoForFileName }

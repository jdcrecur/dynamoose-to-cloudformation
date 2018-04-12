module.exports = {
  name: 'Hashing',
  attributes: {
    id: {
      type: String,
      required: true,
      hashKey: true
    },
    userId: {
      type: String,
      index: true,
      required: true
    },
    hash: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    expirationDate: {
      type: String,
      required: true
    }
  }
}

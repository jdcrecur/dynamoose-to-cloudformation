module.exports = {
  name: 'Products',
  attributes: {
    id: {
      type: String,
      required: true,
      hashKey: true
    },
    name: {
      type: String,
      index: true,
      required: true
    },
    category: {
      type: String,
      required: true
    }
  }
}

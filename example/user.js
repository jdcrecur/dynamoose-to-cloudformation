module.exports = {
  name: 'user',
  attributes: {
    id: {
      type: String,
      required: true,
      hashKey: true,
    },
    forename: {
      type: String,
      index: true,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    roles: [{
      name: String,
    }],
  },
}

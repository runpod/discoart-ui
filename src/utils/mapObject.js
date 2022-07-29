const mapObject = ({ keyMapper, valueMapper, mapee, allowNull }) => {
  let newObject = {}

  Object.entries(mapee).forEach(([key, value]) => {
    const newKey = keyMapper ? keyMapper(key) : key
    const newValue = valueMapper ? valueMapper(value) : value
    if (allowNull) {
      newObject[newKey] = newValue
    } else if (newValue) {
      newObject[newKey] = newValue
    }
  })

  return newObject
}

export default mapObject

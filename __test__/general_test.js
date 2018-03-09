describe('npm-shrinkwrap.json', () => {
  it('should not include fsevents (a macOS-only package)', () => {
  expect(shrinkwrap.dependencies.fsevents).toBe(undefined)
})
})

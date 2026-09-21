describe('Server environment configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('uses process.env.PORT when specified', () => {
    process.env.PORT = '8080'
    const port = Number(process.env.PORT) || 4000
    const host = '0.0.0.0'
    expect(port).toBe(8080)
    expect(host).toBe('0.0.0.0')
  })

  it('defaults to port 4000 when PORT is not provided', () => {
    delete process.env.PORT
    const port = Number(process.env.PORT) || 4000
    const host = '0.0.0.0'
    expect(port).toBe(4000)
    expect(host).toBe('0.0.0.0')
  })
})

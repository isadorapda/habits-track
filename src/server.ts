import Fastify from 'fastify'

const app = Fastify()

app.get('/', () => {
  return ''
})
app.listen({
  port: 3333,
})

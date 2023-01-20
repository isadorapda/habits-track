import { prisma } from './lib/prisma'
import { z } from 'zod'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'

export async function appRoutes(app: FastifyInstance) {
  app.post('/new-habit', async (request) => {
    const createHabitBody = z.object({
      title: z.string(),
      weekDaysHabits: z.array(z.number().min(0).max(6)),
    })
    const { title, weekDaysHabits } = createHabitBody.parse(request.body)

    const today = dayjs().startOf('day').toDate()

    await prisma.habit.create({
      data: {
        title,
        created_at: today,
        weekDaysHabits: {
          create: weekDaysHabits.map((weekDay) => {
            return {
              week_day: weekDay,
            }
          }),
        },
      },
    })
  })

  app.get('/day', async (request) => {
    const getDayParams = z.object({
      date: z.coerce.date(),
    })
    const { date } = getDayParams.parse(request.query)
    const parsedDate = dayjs(date).startOf('day')
    const weekDay = parsedDate.get('day')
    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date,
        },
        weekDaysHabits: {
          some: { week_day: weekDay },
        },
      },
    })
    const day = await prisma.day.findUnique({
      where: {
        date: parsedDate.toDate(),
      },
      include: {
        dailyHabits: true,
      },
    })
    const completedHabits = day?.dailyHabits.map((dayHabit) => {
      return dayHabit.habit_id
    })
    return { possibleHabits, completedHabits }
  })
}

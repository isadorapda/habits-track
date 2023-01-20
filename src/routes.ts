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
  app.patch('/habits/:id/toggle', async (request) => {
    const toggleHabitParams = z.object({
      id: z.string().uuid(),
    })

    const { id } = toggleHabitParams.parse(request.params)

    const today = dayjs().startOf('day').toDate()

    let day = await prisma.day.findUnique({
      where: {
        date: today,
      },
    })

    if (!day) {
      day = await prisma.day.create({
        data: {
          date: today,
        },
      })
    }

    const dailyHabit = await prisma.dailyHabit.findUnique({
      where: {
        day_id_habit_id: {
          day_id: day.id,
          habit_id: id,
        },
      },
    })

    if (dailyHabit) {
      await prisma.dailyHabit.delete({
        where: {
          id: dailyHabit.id,
        },
      })
    } else {
      await prisma.dailyHabit.create({
        data: {
          day_id: day.id,
          habit_id: id,
        },
      })
    }
  })

  app.get('/summary', async () => {
    const summary = await prisma.$queryRaw`
      SELECT 
        D.id, 
        D.date,
        (
          SELECT 
            cast(count(*) as float)
          FROM daily_habits DH
          WHERE DH.day_id = D.id
        ) as completed,
        (
          SELECT
            cast(count(*) as float)
          FROM week_days_habits WDH
          JOIN habits H
            ON H.id = WDH.habit_id
          WHERE
            WDH.week_day = cast(strftime('%w', D.date/1000.0, 'unixepoch') as int)
            AND H.created_at <= D.date
        ) as amount
      FROM days D
    `

    return summary
  })
}

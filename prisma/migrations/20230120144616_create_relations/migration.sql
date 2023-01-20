-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_week_days_habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habit_id" TEXT NOT NULL,
    "week_day" INTEGER NOT NULL,
    CONSTRAINT "week_days_habits_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_week_days_habits" ("habit_id", "id", "week_day") SELECT "habit_id", "id", "week_day" FROM "week_days_habits";
DROP TABLE "week_days_habits";
ALTER TABLE "new_week_days_habits" RENAME TO "week_days_habits";
CREATE UNIQUE INDEX "week_days_habits_habit_id_week_day_key" ON "week_days_habits"("habit_id", "week_day");
CREATE TABLE "new_daily_habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day_id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    CONSTRAINT "daily_habits_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "days" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "daily_habits_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_daily_habits" ("day_id", "habit_id", "id") SELECT "day_id", "habit_id", "id" FROM "daily_habits";
DROP TABLE "daily_habits";
ALTER TABLE "new_daily_habits" RENAME TO "daily_habits";
CREATE UNIQUE INDEX "daily_habits_day_id_habit_id_key" ON "daily_habits"("day_id", "habit_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

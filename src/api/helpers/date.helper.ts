import { Days } from "../../database/interfaces/enums";

export class DateHelper {
  private daysOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  isDateDifferenceGreaterThan = (
    startDateStr: string,
    endDateStr: string
  ): number => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Calculate the difference in milliseconds
    const timeDifference = endDate.getTime() - startDate.getTime();

    // Convert milliseconds to days
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

    // Check if the difference is greater than {days}
    return daysDifference;
  };

  getNextWeekdayByDay = (
    startDate: string | Date,
    day: string,
    weekOffset: number
  ): Date => {
    const targetDayIndex = this.daysOfWeek.indexOf(day);

    if (targetDayIndex === -1) {
      throw new Error(`Invalid day: ${day}`);
    }

    // Calculate the date of the next occurrence of the target day
    const currentDate = new Date(startDate);

    const currentDayIndex = currentDate.getDay();
    const daysUntilTargetDay = (targetDayIndex + 7 - currentDayIndex) % 7;

    const nextWeekday = new Date(currentDate);
    nextWeekday.setDate(
      currentDate.getDate() + daysUntilTargetDay + 7 * weekOffset
    );

    return nextWeekday;
  };

  // Function to get the next occurrence of a specific weekday in the next month
  getNextMonthdayByDay(
    startDate: string | Date,
    day: string,
    monthOffset: number
  ): Date {
    const targetDayIndex = this.daysOfWeek.indexOf(day);
    const currentDate = new Date(startDate);
    const currentMonth = currentDate.getMonth();
    const startWeekOfMonth = Math.ceil(currentDate.getDate() / 7);

    if (targetDayIndex === -1) {
      throw new Error(`Invalid day: ${day}`);
    }

    // Calculate the date of the next occurrence of the target day in the current or next month
    let nextMonthday = new Date(currentDate);
    nextMonthday.setMonth(currentMonth + monthOffset, 1);

    while (nextMonthday.getDay() !== targetDayIndex) {
      nextMonthday.setDate(nextMonthday.getDate() + 1);
    }

    // Adjust to the same week within the month as the starting date
    const targetWeekOfMonth = Math.ceil(nextMonthday.getDate() / 7);
    const weekDifference = startWeekOfMonth - targetWeekOfMonth;
    nextMonthday.setDate(nextMonthday.getDate() + 7 * weekDifference);

    return nextMonthday;
  }

  addDaysToDate = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  getDayOfWeek = (date: Date): string | Days => {
    return this.daysOfWeek[date.getDay()];
  };

  getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  getDaysInYear = (date: Date): number => {
    const year = date.getFullYear();
    return this.isLeapYear(year) ? 366 : 365;
  };

  isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };
}

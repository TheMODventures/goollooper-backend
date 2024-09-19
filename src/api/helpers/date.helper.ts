import { STRIPE_FIXED, STRIPE_PERCENTAGE } from "../../constant";
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

  calculateStripeFee(amountInCents: number): number {
    return Math.round(amountInCents * STRIPE_PERCENTAGE) + STRIPE_FIXED;
  }

  calculateProfit(
    originalAmountInCents: number,
    netTransferAmountInCents: number
  ): number {
    return originalAmountInCents - netTransferAmountInCents;
  }
  mailTemplate = (date: Date, otp: string): string => {
    return `
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
          font-family: Arial, sans-serif;
        }
        .container {
          width: 100%;
          padding: 20px;
          background-color: #ffffff;
        }
        .content {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
          font-size: 24px;
          color: #333333;
        }
        p {
          font-size: 16px;
          color: #555555;
        }
        .otp {
          font-size: 18px;
          font-weight: bold;
          color: #007bff;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #999999;
          text-align: center;
          margin-top: 20px;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 10px;
          }
          h1 {
            font-size: 20px;
          }
          p {
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <h1>OTP Verification</h1>
          <p>We received a request to verify your account. Use the OTP below to complete the verification process.</p>
          <div class="otp">${otp}</div>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${date.getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
    `;
  };
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  type BookingResponse,
  bookingSelect,
  toBookingResponse,
} from '../bookings/booking-response.js';

/** How many recent bookings the dashboard lists (Laravel's widget setting `entries_number`). */
const LATEST_BOOKINGS_COUNT = 10;

export interface DashboardSummary {
  totalBookings: number;
  /** Sum of booking totals, PKR. */
  totalSales: number;
  totalUsers: number;
  latestBookings: Omit<BookingResponse, 'attendees'>[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Same figures as Laravel's admin home page: total bookings, total sales, total users.
   * Laravel's "latest bookings" query had no ordering and returned the oldest 50; this returns
   * the newest 10.
   */
  async getSummary(): Promise<DashboardSummary> {
    const [totalBookings, salesSum, totalUsers, latestBookings] = await this.prisma.$transaction([
      this.prisma.booking.count({ where: { deletedAt: null } }),
      this.prisma.booking.aggregate({ where: { deletedAt: null }, _sum: { totalAmount: true } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.booking.findMany({
        where: { deletedAt: null },
        select: bookingSelect,
        orderBy: { id: 'desc' },
        take: LATEST_BOOKINGS_COUNT,
      }),
    ]);

    return {
      totalBookings,
      totalSales: salesSum._sum.totalAmount ?? 0,
      totalUsers,
      latestBookings: latestBookings.map((booking) => {
        const { attendees, ...summary } = toBookingResponse(booking);
        return summary;
      }),
    };
  }
}

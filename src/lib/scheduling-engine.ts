import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SchedulingEngine {
  /**
   * Checks if a resource (Equipment, Studio, Talent) is available for a given timeframe.
   * Prevents double-booking conflicts across different projects.
   */
  static async checkResourceAvailability(resourceId: string, startDate: Date, endDate: Date) {
    const conflicts = await prisma.booking.findMany({
      where: {
        resource_id: resourceId,
        status: { in: ['confirmed', 'pending'] },
        OR: [
          {
            // Booking starts inside our requested window
            start_date: { gte: startDate, lt: endDate }
          },
          {
            // Booking ends inside our requested window
            end_date: { gt: startDate, lte: endDate }
          },
          {
            // Booking completely engulfs our requested window
            start_date: { lte: startDate },
            end_date: { gte: endDate }
          }
        ]
      },
      include: {
        project: { select: { project_name: true } }
      }
    });

    if (conflicts.length > 0) {
      return {
        available: false,
        conflicts: conflicts.map(c => ({
          bookingId: c.id,
          projectName: c.project.project_name,
          startDate: c.start_date,
          endDate: c.end_date
        }))
      };
    }

    return { available: true, conflicts: [] };
  }

  /**
   * Safely books a resource if it is available.
   */
  static async bookResource(companyId: string, projectId: string, resourceId: string, startDate: Date, endDate: Date) {
    const availability = await this.checkResourceAvailability(resourceId, startDate, endDate);

    if (!availability.available) {
      throw new Error(`Resource conflict detected with ${availability.conflicts.length} existing booking(s).`);
    }

    return await prisma.booking.create({
      data: {
        company_id: companyId,
        project_id: projectId,
        resource_id: resourceId,
        start_date: startDate,
        end_date: endDate,
        status: 'confirmed'
      }
    });
  }
}

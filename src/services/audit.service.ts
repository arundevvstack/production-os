import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export const auditService = {
  /**
   * Logs a critical platform action with before/after state diffing and client metadata
   */
  async log({
    companyId,
    userId,
    action,
    entityType,
    entityId,
    beforeState,
    afterState,
    req
  }: {
    companyId: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    beforeState?: Record<string, any> | null;
    afterState?: Record<string, any> | null;
    req?: NextRequest | Request;
  }) {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (req) {
      // Safely extract client IP from common forwarder headers or request info
      const headers = req.headers;
      ipAddress = 
        headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        headers.get('x-real-ip') ||
        null;
      
      userAgent = headers.get('user-agent');
    }

    try {
      const auditEntry = await prisma.auditLog.create({
        data: {
          company_id: companyId,
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          before_state: beforeState || undefined,
          after_state: afterState || undefined,
          ip_address: ipAddress,
          user_agent: userAgent
        }
      });
      return auditEntry;
    } catch (error) {
      console.error('Audit system failed to write log entry:', error);
      // Fail-silent in production to prevent audit logger from blocking main business flows
      return null;
    }
  },

  /**
   * Retrieves the full history timeline for a specific database entity
   */
  async getEntityHistory(companyId: string, entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: {
        company_id: companyId,
        entity_type: entityType,
        entity_id: entityId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role_id: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  },

  /**
   * Retrieves audit logs for the company tenant
   */
  async getCompanyAuditLogs(companyId: string, limit = 100, offset = 0) {
    return prisma.auditLog.findMany({
      where: {
        company_id: companyId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role_id: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit,
      skip: offset
    });
  }
};

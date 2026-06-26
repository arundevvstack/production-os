import { NextResponse } from 'next/server';
// Force Turbopack to recompile
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        department: true,
        role_id: true,
      },
      orderBy: {
        fullName: 'asc',
      }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_name, client_name, project_type, color } = body;

    if (!project_name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();

    const project = await prisma.project.create({
      data: {
        id,
        project_name,
        client_name,
        project_type,
        color: color || 'bg-emerald-500',
        updated_at: new Date()
      }
    });

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

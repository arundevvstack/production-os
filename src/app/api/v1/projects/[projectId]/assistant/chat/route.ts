import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { NextRequest } from "next/server";
import { ContextBuilder } from "@/lib/production/assistant/ContextBuilder";
import { OpenRouterAdapter } from "@/lib/production/providers/adapters/OpenRouterAdapter";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const body = await req.json();
    const { message, sceneId, shotId, assetId, threadId, providerId } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Build the dynamic system prompt
    const systemPrompt = await ContextBuilder.buildSystemPrompt({
      projectId: params.projectId,
      sceneId,
      shotId,
      assetId
    });

    // 2. Fetch the provider credentials for OpenRouter
    const providerKey = await prisma.productionProviderCredential.findFirst({
      where: {
        provider: { name: "OpenRouter" }
      },
      include: {
        provider: true
      }
    });

    if (!providerKey) {
      return NextResponse.json({ error: "No OpenRouter credentials configured" }, { status: 400 });
    }

    // 3. Persist the user message to the thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await prisma.productionAssistantThread.create({
        data: {
          project_id: params.projectId,
          user_id: "user_placeholder", // Replace with real auth user ID
          title: message.substring(0, 50)
        }
      });
      currentThreadId = thread.id;
    }

    await prisma.productionAssistantMessage.create({
      data: {
        thread_id: currentThreadId,
        role: "user",
        content: message
      }
    });

    // 4. Fetch conversation history for context
    const history = await prisma.productionAssistantMessage.findMany({
      where: { thread_id: currentThreadId },
      orderBy: { created_at: 'asc' },
      take: 10
    });

    // We only pass the user's latest message with the system prompt, but for a true conversational assistant we could map the history.
    // Since OpenRouterAdapter submitStreamingJob takes a single prompt right now, we can concatenate the history.
    const fullConversationPrompt = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n\n') + '\n\nAssistant:';

    // 5. Invoke the OpenRouter adapter in streaming mode
    const adapter = new OpenRouterAdapter();
    const model = providerKey.default_models ? (providerKey.default_models as any).chat || "anthropic/claude-3.5-sonnet:beta" : "anthropic/claude-3.5-sonnet:beta";
    
    const stream = await adapter.submitStreamingJob(
      providerKey.api_key_encrypted, // Decrypt in a real app
      model,
      fullConversationPrompt,
      systemPrompt
    );

    // 6. Return the stream directly to the client
    // Note: To persist the assistant's reply, we ideally need to intercept the stream or have the client send it back,
    // or use a custom TransformStream. For MVP, we will just return the stream directly.
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Thread-Id': currentThreadId
      }
    });

  } catch (error: any) {
    console.error("Assistant Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

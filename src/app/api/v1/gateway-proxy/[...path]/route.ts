import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { uploadToSupabaseStorage } from "@/lib/supabase/storage";

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const isHybrid = process.env.LOCAL_AI_ENABLED === "true";
  const { path } = await params;
  const pathString = path.join("/");
  
  const body = await req.json();

  if (!isHybrid) {
    // --------------------------------------------------------
    // LOCAL DEVELOPMENT MODE (No Supabase, Local PC Gateway)
    // --------------------------------------------------------
    const localUrl = "http://localhost:8000";
    try {
      const res = await fetch(`${localUrl}/${pathString}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000 * 5) // Local inference could be long
      });
      
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // --------------------------------------------------------
  // HYBRID MODE (Next.js on Vercel -> Gateway on Local PC)
  // --------------------------------------------------------
  const gatewayUrl = process.env.LOCAL_AI_GATEWAY_URL;
  const gatewayKey = process.env.LOCAL_AI_GATEWAY_KEY;

  if (!gatewayUrl || !gatewayKey) {
    return NextResponse.json({ error: "Missing Hybrid Gateway Configuration" }, { status: 500 });
  }

  try {
    const timestamp = Date.now().toString();
    const payloadString = JSON.stringify(body);
    const signature = crypto.createHmac("sha256", gatewayKey)
                            .update(timestamp + payloadString)
                            .digest("hex");

    let attempt = 0;
    const maxRetries = 3;
    let res: Response | null = null;
    let lastError: any = null;

    while (attempt < maxRetries) {
      try {
        res = await fetch(`${gatewayUrl}/${pathString}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-AI-KEY": gatewayKey,
            "X-Timestamp": timestamp,
            "X-Signature": signature
          },
          body: payloadString,
          signal: AbortSignal.timeout(Number(process.env.LOCAL_AI_TIMEOUT) || 60000)
        });
        
        if (res.ok || res.status >= 400) {
            break;
        }
      } catch (err) {
        lastError = err;
      }
      attempt++;
      if (attempt < maxRetries) {
          // exponential backoff
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }

    if (!res && lastError) {
        return NextResponse.json({ error: "Failed to reach remote Gateway", cause: lastError.message }, { status: 502 });
    }
    
    if (!res) {
        return NextResponse.json({ error: "Unknown gateway error" }, { status: 500 });
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return NextResponse.json(errorData || { error: "Gateway error" }, { status: res.status });
    }

    const data = await res.json();

    // If generation completed, we need to securely fetch the image and upload it to Supabase
    if (data.status === "completed" && data.url_path) {
      const fetchTimestamp = Date.now().toString();
      const fetchSignature = crypto.createHmac("sha256", gatewayKey)
                                   .update(fetchTimestamp) // no body for GET
                                   .digest("hex");

      const fileRes = await fetch(`${gatewayUrl}${data.url_path}`, {
        method: "GET",
        headers: {
          "X-AI-KEY": gatewayKey,
          "X-Timestamp": fetchTimestamp,
          "X-Signature": fetchSignature
        }
      });

      if (!fileRes.ok) {
        return NextResponse.json({ error: "Failed to fetch generated file from Gateway" }, { status: 502 });
      }

      const buffer = await fileRes.arrayBuffer();
      const filename = data.url_path.split("/").pop();
      const contentType = fileRes.headers.get("content-type") || "image/png";

      // Direct upload to Supabase Storage
      const supabaseUrl = await uploadToSupabaseStorage("assets", `generated/${filename}`, buffer, contentType);
      
      // Rewrite the URL path so the adapter picks up the Supabase URL
      data.url_path = supabaseUrl;
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: "Gateway Proxy Error", details: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const isHybrid = process.env.LOCAL_AI_ENABLED === "true";
  const { path } = await params;
  const pathString = path.join("/");

  if (!isHybrid) {
    const localUrl = "http://localhost:8000";
    try {
      const res = await fetch(`${localUrl}/${pathString}`);
      return NextResponse.json(await res.json(), { status: res.status });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  const gatewayUrl = process.env.LOCAL_AI_GATEWAY_URL;
  const gatewayKey = process.env.LOCAL_AI_GATEWAY_KEY;

  if (!gatewayUrl || !gatewayKey) {
    return NextResponse.json({ error: "Missing Hybrid Gateway Configuration" }, { status: 500 });
  }

  try {
    const timestamp = Date.now().toString();
    const signature = crypto.createHmac("sha256", gatewayKey)
                            .update(timestamp)
                            .digest("hex");

    const res = await fetch(`${gatewayUrl}/${pathString}`, {
      method: "GET",
      headers: {
        "X-AI-KEY": gatewayKey,
        "X-Timestamp": timestamp,
        "X-Signature": signature
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return NextResponse.json(errorData || { error: "Gateway error" }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (e: any) {
    return NextResponse.json({ error: "Gateway Proxy Error", details: e.message }, { status: 500 });
  }
}

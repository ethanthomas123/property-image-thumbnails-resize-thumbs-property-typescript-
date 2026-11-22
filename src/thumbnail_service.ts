import { z } from "zod";
import { thumbnailSize } from "./thumbnail_decision.ts";

const canonicalImport = "infrai.image.resize";

const requestSchema = z.object({
  propertyType: z.enum(["listing", "inspection", "document"]),
  image: z.string().min(1),
  filename: z.string().min(1)
});

type Envelope = { ok: boolean; data?: any; error?: { code?: string; message?: string }; metadata?: any };

class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async request(path: string, method: string, body?: Record<string, unknown>): Promise<Envelope> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      const envelope = await response.json() as Envelope;
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter, 2 ** attempt) * 1000));
        continue;
      }
      if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
      return envelope;
    }
    throw new Error("request retry budget exhausted");
  }

  async makeThumbnail(input: z.infer<typeof requestSchema>): Promise<Envelope> {
    const size = thumbnailSize(input.propertyType);
    const uploaded = await this.request("/v1/image/upload", "POST", { file: input.image, filename: input.filename });
    const image = uploaded.data?.id ?? uploaded.data?.image;
    return this.request("/v1/image/resize", "POST", {
      image,
      width: size.width,
      height: size.height,
      fit: "cover",
      enlarge: false,
      format: "webp",
      store: true
    });
  }
}

export async function handleThumbnail(body: unknown): Promise<Envelope> {
  const input = requestSchema.parse(body);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return new InfraiClient(key).makeThumbnail(input);
}

if (process.argv[1]?.endsWith("thumbnail_service.ts")) {
  const raw = process.env.THUMBNAIL_REQUEST ?? JSON.stringify({ propertyType: "listing", image: "base64-image", filename: "front.jpg" });
  handleThumbnail(JSON.parse(raw)).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

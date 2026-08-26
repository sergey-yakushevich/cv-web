import { type NextRequest, NextResponse } from "next/server";
import { getVariant } from "@/data/resumes";
import { attachmentHeader, resumePdfFileName } from "@/lib/pdf/filename";
import { renderResumePdf } from "@/lib/pdf/render-resume";

// puppeteer-core needs Node APIs, so this cannot run on the edge runtime, and
// it must never be pre-rendered into a static asset at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { variant: string };
}

/**
 * Renders one CV version to PDF and returns it as a download.
 *
 * The slug is checked against the known variants before it reaches the
 * browser, so this route can only ever print a page this app owns.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const variant = getVariant(params.variant);

  if (!variant) {
    return NextResponse.json({ error: "Unknown CV version" }, { status: 404 });
  }

  /*
   * Print over loopback, not the request's own origin.
   *
   * Behind kamal-proxy the request arrives as HTTPS, so request.nextUrl.origin
   * came out as "https://localhost:3000" — the forwarded scheme bolted onto the
   * internal listen address. Chrome then tried to speak TLS to a plain HTTP
   * port and every production render failed with ERR_SSL_PROTOCOL_ERROR.
   *
   * The container is fetching itself, so 127.0.0.1 on the port it listens on is
   * both correct and independent of proxy headers, the public hostname, and DNS.
   */
  const origin = `http://127.0.0.1:${process.env.PORT ?? 3000}`;

  try {
    const pdf = await renderResumePdf({ slug: variant.slug, origin });
    const fileName = resumePdfFileName(variant);

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": attachmentHeader(fileName),
        "Content-Length": String(pdf.byteLength),
        // Always re-render: the CV data changes more often than anyone downloads.
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(`PDF render failed for /${variant.slug}:`, error);

    return NextResponse.json(
      {
        error: "Could not render the PDF",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

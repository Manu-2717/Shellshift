import { getGameStandings } from "@/lib/games/standings";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/api/games/[gameId]/standings">) {
  const { gameId } = await context.params;
  const result = await getGameStandings(gameId);
  return Response.json(result, {
    status: result.error ? 403 : 200,
    headers: {
      // Vercel Edge CDN Caching: Edge serves requests for 5s with background stale-while-revalidate.
      // 100 users polling simultaneously = only 1 serverless invocation every 5 seconds.
      "Cache-Control": "public, s-maxage=5, stale-while-revalidate=25",
      "CDN-Cache-Control": "public, s-maxage=5",
      "Vercel-CDN-Cache-Control": "public, s-maxage=5",
    },
  });
}

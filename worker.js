const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Create video
    if (url.pathname === "/generate" && request.method === "POST") {
      try {
        const body = await request.json();

        const prompt = String(body.prompt || "").trim();
        const aspectRatio = body.aspectRatio || "16:9";
        const duration = Number(body.duration || 5);

        if (!prompt) {
          return json({ error: "Prompt खाली है" }, 400);
        }

        const allowedRatios = ["16:9", "9:16", "1:1", "4:3", "3:4"];
        const ratio = allowedRatios.includes(aspectRatio)
          ? aspectRatio
          : "16:9";

        const videoDuration = Math.min(
          30,
          Math.max(2, duration)
        );

        const response = await fetch(
          "https://api.replicate.com/v1/models/alibaba/wan-3-prime/predictions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.REPLICATE_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: {
                prompt: prompt,
                aspect_ratio: ratio,
                duration: videoDuration,
                resolution: "720p",
                enable_prompt_expansion: true
              }
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          return json(
            {
              error: result.detail || "Replicate API error",
              details: result
            },
            response.status
          );
        }

        return json({
          success: true,
          id: result.id,
          status: result.status
        });

      } catch (error) {
        return json({
          error: error.message || "Video generate नहीं हो सकी"
        }, 500);
      }
    }

    // Check video status
    if (url.pathname === "/status" && request.method === "GET") {
      const id = url.searchParams.get("id");

      if (!id) {
        return json({ error: "Prediction ID नहीं मिला" }, 400);
      }

      try {
        const response = await fetch(
          `https://api.replicate.com/v1/predictions/${encodeURIComponent(id)}`,
          {
            headers: {
              "Authorization": `Bearer ${env.REPLICATE_API_TOKEN}`
            }
          }
        );

        const result = await response.json();

        if (!response.ok) {
          return json(result, response.status);
        }

        return json({
          success: true,
          id: result.id,
          status: result.status,
          output: result.output || null,
          error: result.error || null
        });

      } catch (error) {
        return json({
          error: error.message || "Status check नहीं हो सका"
        }, 500);
      }
    }

    return json({
      message: "Badal AI Video Generator API चल रही है 🚀"
    });
  }
};

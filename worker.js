export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate" && request.method === "POST") {
      const body = await request.json();

      const response = await fetch(
        "https://api.replicate.com/v1/predictions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            version: "MODEL_VERSION_ID",
            input: body
          })
        }
      );

      return new Response(await response.text(), {
        status: response.status,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    return new Response("Worker is running!");
  }
};

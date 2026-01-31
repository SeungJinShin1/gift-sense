export async function onRequestPost(context) {
  const apiKey = context.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server Configuration Error: API Key missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const requestBody = await context.request.json();

    // [Tier 1 유료 모델 사용] gemini-2.5-flash-preview-09-2025
    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    // 구글 API의 응답 상태를 그대로 받아서 처리
    if (!googleResponse.ok) {
        const errorText = await googleResponse.text();
        return new Response(JSON.stringify({ error: `Google API Error: ${googleResponse.status}`, details: errorText }), {
            status: googleResponse.status,
            headers: { "Content-Type": "application/json" },
        });
    }

    const data = await googleResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
export async function onRequestPost(context) {
  const apiKey = context.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API Key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const requestBody = await context.request.json();

    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await googleResponse.json();

    // [핵심 변경 사항] 
    // Gemini API의 응답 상태(status)를 그대로 프론트엔드로 전달합니다.
    // 성공이면 200, 실패면 400~500번대가 전달되어 프론트엔드에서 response.ok로 판단 가능해집니다.
    return new Response(JSON.stringify(data), {
      status: googleResponse.status, 
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
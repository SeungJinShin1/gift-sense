export async function onRequestPost(context) {
    // 1. Cloudflare 대시보드에서 설정한 환경 변수 가져오기
    // 설정한 이름이 VITE_GEMINI_API_KEY라면 아래와 같이 접근합니다.
    const apiKey = context.env.VITE_GEMINI_API_KEY;
  
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  
    try {
      // 2. 프론트엔드에서 보낸 요청 본문(JSON) 파싱
      const requestBody = await context.request.json();
  
      // 3. Google Gemini API 호출
      // Functions 환경 내부에서 호출하므로 API Key가 외부에 노출되지 않습니다.
      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );
  
      // 4. Google의 응답 받기
      const data = await googleResponse.json();
  
      // 5. 프론트엔드로 결과 반환
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
  
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
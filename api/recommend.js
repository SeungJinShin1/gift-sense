// Vercel Serverless Function (Node.js 환경)
// 이 코드는 미국 서버(기본값)에서 실행되므로 Gemini 지역 제한을 우회합니다.

export default async function handler(req, res) {
  // 1. CORS 설정 (다른 도메인에서 호출 방지, 필요한 경우 수정 가능)
  // Vercel은 기본적으로 동일 출처 요청을 허용하므로 별도 설정이 없어도 되지만,
  // 명시적으로 메서드를 제한하는 것이 좋습니다.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. 환경 변수에서 API 키 가져오기
  // Vercel 대시보드 > Settings > Environment Variables에서 설정한 이름
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Configuration Error: API Key missing' });
  }

  try {
    // 3. 프론트엔드에서 보낸 데이터 받기
    const requestBody = req.body;

    // 4. Google Gemini API 호출
    // Tier 1 유료 모델 사용 (gemini-2.5-flash-preview-09-2025)
    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    // 5. 결과 처리
    if (!googleResponse.ok) {
        const errorText = await googleResponse.text();
        return res.status(googleResponse.status).json({ 
            error: `Google API Error`, 
            details: errorText 
        });
    }

    const data = await googleResponse.json();

    // 6. 프론트엔드로 성공 응답 반환
    return res.status(200).json(data);

  } catch (err) {
    console.error("Backend Error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
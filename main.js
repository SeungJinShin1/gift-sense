// Gemini API 설정을 위한 변수
// 개발/배포 환경(Vite + Cloudflare)에서 .env 변수를 로드합니다.
// 주의: 로컬 테스트 시 import.meta.env가 undefined일 수 있으므로 안전하게 접근합니다.
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || ""; 

// 상태 관리
const state = {
    relation: '',
    gender: '',
    age: '20대',
    occasion: '',
    budget: 50000,
    interests: []
};

// DOM 요소 로드
const steps = {
    1: document.getElementById('step-1'),
    2: document.getElementById('step-2'),
    3: document.getElementById('step-3'),
    4: document.getElementById('step-4')
};
const budgetSlider = document.getElementById('budget-slider');
const budgetDisplay = document.getElementById('budget-display');

// 초기화
function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // 버튼 선택 로직 (관계, 성별, 상황, 관심사)
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const parent = btn.parentElement;
            const value = btn.dataset.value;
            const isMultiSelect = parent.id === 'interest-options';

            if (isMultiSelect) {
                // 다중 선택 (관심사)
                btn.classList.toggle('selected-btn');
                if (state.interests.includes(value)) {
                    state.interests = state.interests.filter(i => i !== value);
                } else {
                    state.interests.push(value);
                }
            } else {
                // 단일 선택
                parent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected-btn'));
                btn.classList.add('selected-btn');
                
                if (parent.id === 'relation-options') state.relation = value;
                if (parent.id === 'gender-options') state.gender = value;
                if (parent.id === 'occasion-options') state.occasion = value;
            }
        });
    });

    // 나이 선택
    document.getElementById('age-select').addEventListener('change', (e) => {
        state.age = e.target.value;
    });

    // 예산 슬라이더
    budgetSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        state.budget = val;
        budgetDisplay.textContent = val >= 500000 ? "500,000원+" : val.toLocaleString() + "원";
    });
}

// 전역 함수로 노출 (HTML onclick에서 접근 가능하도록 window 객체에 할당)
window.goToStep = function(stepNum) {
    // 유효성 검사 (Step 1 -> 2 갈 때)
    if (stepNum === 2) {
        if (!state.relation || !state.gender || !state.occasion) {
            alert('관계, 성별, 상황을 모두 선택해주세요!');
            return;
        }
    }

    // 화면 전환
    Object.values(steps).forEach(el => el.classList.add('hidden'));
    steps[stepNum].classList.remove('hidden');
    window.scrollTo(0, 0);
};

window.startRecommendation = async function() {
    window.goToStep(3); // 로딩 화면 (AI 분석 중)

    // 프롬프트 구성
    const prompt = `
        당신은 대한민국 최고의 선물 추천 전문가(MD)입니다.
        다음 사용자 정보를 바탕으로 현재 한국 시장에서 구매 가능한 최고의 선물 3가지를 추천해주세요.
        
        [사용자 정보]
        - 대상: ${state.relation} (${state.gender}, ${state.age})
        - 상황: ${state.occasion}
        - 예산: 약 ${state.budget.toLocaleString()}원
        - 관심사: ${state.interests.join(', ') || '없음 (대중적인 것 추천)'}

        [필수 조건]
        1. 두루뭉술한 카테고리가 아닌, 정확한 브랜드와 제품명(예: 조말론 우드세이지 앤 씨솔트 30ml)을 제시할 것.
        2. 최신 트렌드를 반영할 것.
        3. 추천 이유는 '센스 있다'는 소리를 들을 수 있는 감성적인 포인트로 작성할 것.
        4. 아래 JSON 스키마를 정확히 따를 것.

        Response JSON Schema:
        {
          "recommendations": [
            {
              "product_name": "정확한 제품명",
              "brand": "브랜드명",
              "reason": "감성적인 추천 이유",
              "approx_price": "예상 가격 (문자열)",
              "search_keyword": "쇼핑 검색 최적화 키워드",
              "message": "카드에 적을 감동적인 짧은 문구"
            }
          ]
        }
    `;

    try {
        // [핵심 변경 사항]
        // API Key 없이 Cloudflare Functions('/recommend')로 요청을 보냅니다.
        const response = await fetch('/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                },
                // Cloudflare Function이 이 요청을 받아 Google Search Grounding 설정을 포함해 전달합니다.
                tools: [{ google_search: {} }] 
            })
        });

        // 응답 상태 확인
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Server Error");
        }

        const data = await response.json();
        
        // Gemini 응답 처리
        if (data.candidates && data.candidates[0].content) {
            const resultText = data.candidates[0].content.parts[0].text;
            const resultJson = JSON.parse(resultText);
            renderResults(resultJson.recommendations);
        } else {
            throw new Error("No candidates returned");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("AI 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
        window.goToStep(2); // 에러 발생 시 설정 화면으로 복귀
    }
};

function renderResults(recommendations) {
    const container = document.getElementById('results-container');
    container.innerHTML = '';

    recommendations.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl p-5 shadow-md border border-gray-100 fade-in-up';
        card.style.animationDelay = `${index * 0.1}s`;

        // 검색 링크 생성 (검색 쿼리 딥링크)
        // 링크가 깨지지 않도록 검색 결과 페이지로 연결합니다.
        const naverLink = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(item.search_keyword)}`;
        const coupangLink = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(item.search_keyword)}`;

        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <span class="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-md mb-1 inline-block">${item.brand}</span>
                    <h3 class="text-lg font-bold text-gray-800 leading-tight">${item.product_name}</h3>
                </div>
                <span class="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg shrink-0 ml-2">${item.approx_price}</span>
            </div>
            
            <p class="text-gray-600 text-sm mb-4 leading-relaxed bg-gray-50 p-3 rounded-lg">
                💡 ${item.reason}
            </p>

            <!-- 카드 메시지 보기 (토글) -->
            <div class="mb-4">
                <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="text-xs text-gray-400 underline hover:text-pink-500">
                    💌 함께 쓸 카드 문구 보기
                </button>
                <div class="hidden mt-2 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-gray-700 italic font-serif">
                    "${item.message}"
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-4">
                <a href="${naverLink}" target="_blank" class="flex items-center justify-center bg-green-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-600 transition">
                    <span class="mr-1">N</span> 네이버 최저가
                </a>
                <a href="${coupangLink}" target="_blank" class="flex items-center justify-center bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition">
                    <span class="mr-1">C</span> 쿠팡 로켓배송
                </a>
            </div>
        `;
        container.appendChild(card);
    });

    window.goToStep(4);
}

// 앱 시작
init();
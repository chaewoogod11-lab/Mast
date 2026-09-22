# Resource 콘텐츠 편집 안내

`resources.json`이 Resource 콘텐츠의 원본입니다. `npm run build`를 실행하면 `scripts/render-resources.mjs`가 `resources.html`의 `RESOURCE CONTENT START/END` 구간을 정적 HTML로 갱신한 다음 `dist/`를 만듭니다. 생성된 `resources.html`도 소스 변경과 함께 저장해야 기존 GitHub Pages 브랜치 방식에서 최신 내용이 보입니다. 브라우저에서 JSON을 가져오는 런타임 의존성은 없습니다.

## 공통 규칙

- 세 주요 배열은 `industryCollaborations`, `projects`, `caseStudies`입니다. `speakerSessions`는 아래쪽의 작은 과거 행사 아카이브입니다.
- 각 항목에 고유한 `id`(영문 소문자·숫자·하이픈), `title`, `publication`을 둡니다. `publication: "public"`인 항목만 렌더링합니다. 조사·승인 대기는 `"pending"` 또는 `"draft"`로 둡니다. 비밀 원문·개인정보를 이 저장소에 보관하지 않습니다.
- `publicStatus`가 `Permission required` 또는 `Do not publish`이면 공개 렌더링을 거부합니다. `Summary only` 항목은 텍스트만 허용하며 이미지·원문 링크를 넣으면 빌드가 실패합니다. 자료가 존재한다는 사실을 공개 승인으로 해석하지 않습니다.
- `sources`에는 근거 문서명, 페이지, 확인 일자 등 작성용 출처를 기록합니다. 이 필드는 HTML로 출력하지 않으며 `content/` 자체도 배포에서 제외합니다. 공개 저장소에 커밋하면 Git으로는 읽을 수 있으므로 비밀 링크·내용을 넣지 않습니다.
- 자료가 없는 선택 필드는 생략합니다. 특히 `insights`와 `frameworks`는 근거가 있을 때만 채웁니다. 빈 배열이면 제목과 빈 목록도 출력하지 않습니다.
- `visual`은 선택 사항입니다. 없으면 이미지 자리가 없는 텍스트 카드로 표시합니다. 있을 때는 `src`에 `assets/` 바로 아래의 공개용 PNG/JPG/JPEG/SVG/WebP 파일 경로, `alt`에 의미 있는 대체 설명을 넣습니다. `caption`은 선택입니다. 이미지 비율을 유지하며 화면 너비에 맞춥니다.
- 외부 `recapUrl` 및 `materialsUrl`은 공개 가능한 HTTPS 자료만 사용합니다. 녹화본은 게시하지 않습니다. 렌더러는 기존 Pknic 원문 URL과 주요 영상 플랫폼 URL을 거부하지만, 새 링크의 내용·공개 권한까지 자동 판정하지는 않습니다.
- PKNIC은 서면 파트너 승인이 확인되지 않아 Resources에서 보류합니다. `publication`만 public으로 바꾸어도 공개되지 않도록 차단했습니다. 향후 승인된 최종 문구를 받으면 이 차단과 데이터를 함께 검토해야 합니다. 실제 활동 시기는 November 2024이며 원본 덱·분석·표지는 공개하지 않습니다.
- `resource-visuals.json`은 공개 이미지의 승인·해시를 기록하는 작성용 목록이며 현재는 빈 배열입니다. Curriculum은 사용자 요청에 따라 텍스트만 표시합니다. 이전 PPT 이미지 두 장은 공개 자산에서 제거했으며 다시 참조하면 빌드가 실패합니다.

## 배열별 필드

| 분류 | 선택 필드 | 표시 구조 |
| --- | --- | --- |
| Industry Collaborations | `partner`, `term`, `summary`, `challenge`, `scope`, `outcome`, `visual`, `wordmark`, `recapUrl` | 파트너·학기 → 제목·요약 → 과제·범위·공개 결과 |
| Projects | `term`, `summary`, `purpose`, `built`, `deliverable`, `documentedSession`, `outcome`, `visual`, `detailVisual`, `featured`, `materialsUrl`, `recapUrl` | 제목·요약 → 확인된 수행 내용; Curriculum은 아래의 서술형 구조 사용 |
| Case Studies | `industry`, `company`, `term`, `summary`, `strategicQuestion`, `studied`, `focusAreas`, `frameworks`, `insights`, `visual`, `materialsUrl` | 산업·회사·요약 → 전략 질문 → 프레임워크·인사이트 |
| Past Speaker Sessions | `date`, `speaker`, `affiliation`, `summary` | 날짜 → 행사명 → 연사 → 당시 소속·직책 → 주제 요약 |

`focusAreas`, `frameworks`, `insights`는 문자열 배열입니다. Speaker 항목에는 확인된 날짜·연사·요약을 입력하고, 당시 직책·소속을 모르면 `affiliation`을 생략합니다. 링크나 영상 필드는 없습니다.

2026-09-22 조사 handoff와 최신 요청을 반영했습니다. Projects에는 MAST Curriculum 소개인 “Better Questions. Stronger Thinkers.”와 MAST Career Webinar Series를 표시합니다. Case Studies에는 Gong Cha Singapore, Amazon, AMC, AliveCor and Neurobit의 완성된 전략 분석·제안 자료에서 작성한 요약을 표시합니다. 회사 의뢰나 실행 성과를 뜻하지 않습니다. 네 사례의 MAST 활동 시기는 미확인이므로 term을 생략했습니다. Tim Hortons는 외부 Ivey 케이스로서 실제 MAST 학습·분석 근거가 없어 pending입니다.

Curriculum 소개는 `eyebrow`, `title`, `lead`, `summary`, `narrative.heading`, `narrative.paragraphs`, `principles`로 구성합니다. 회원이 제공한 소개를 다듬은 본문과 기수별 공동 작업의 의미, 다섯 가지 사고 원칙을 정적 HTML로 렌더링합니다. 중복된 원고나 HTML entity가 표시되지 않도록 일반 텍스트만 입력합니다. PPT 이미지, 확대 링크, 학기·산출물 표는 이 소개에 표시하지 않습니다.

## Aside 조사 결과 반영

1. 원문에 근거한 산업, 회사, 학기, 전략 질문, 분석 방법, 핵심 인사이트를 확인합니다. 인사이트에는 구체적인 출처 위치를 `sources`로 남깁니다.
2. 공개 가능한 프로젝트의 목적·수행 내용·산출물·결과를 해당 배열에 추가합니다. 회사 사례 연구를 산학협력이나 독립 프로젝트로 바꾸려면 실제 협업·수행 근거가 필요합니다.
3. 공개용 도표·이미지를 `assets/`에 넣고 `visual`로 연결합니다. 전체 덱을 이미지로 나눈 자료, 기밀 원본 또는 허가되지 않은 개인 사진은 사용하지 않습니다.
4. 승인된 Curriculum visual은 `about.html`의 `#mission .about-mission` 안에서 카드 그리드 다음에 `figure.about-curriculum-visual`로 추가할 수 있습니다. 내부에 실제 `img`와 필요 시 `figcaption`만 넣으면 기존 반응형 스타일이 적용됩니다. 준비 전에는 빈 figure나 placeholder를 만들지 않습니다. Founder’s Message와 기존 Core Values는 유지합니다.
5. `npm run build`, `npm test` 후 `http://127.0.0.1:4173`에서 실제 문장 길이·이미지·모바일 배치를 확인합니다. `content/` 원본과 갱신된 `resources.html`을 함께 검토합니다.

조사 ZIP과 전체 handoff·SOURCE_AUDIT 원본은 저장소 밖에 보존했습니다. 이를 공개 assets 또는 다운로드 링크에 복사하지 않습니다. 이번 작업은 전달된 scoped research를 사용한 통합이며 OneDrive 전체를 다시 직접 감사했다는 의미는 아닙니다. 적용 결과·보류 사항은 `reports/RESOURCES_RESEARCH_INTEGRATION_2026-09-22.md`를 참고하세요.

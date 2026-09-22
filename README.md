# MAST website

기존 HTML/CSS/JavaScript 정적 사이트입니다. Node.js 도구는 로컬 빌드·검수용이며 공개 페이지에는 런타임 의존성이 추가되지 않습니다.

## 로컬 확인

Node.js 20 이상에서 저장소 루트 기준으로 실행합니다. Windows PowerShell에서는 실행 정책에 따라 `npm.cmd`, `npx.cmd`를 사용합니다.

```sh
npm ci
npx playwright install chromium
npm test
npm run preview
```

미리보기: `http://127.0.0.1:4173`. `npm test`는 공개 빌드 생성, 내부 경로·공개 자료 검사, Chromium 브라우저 검사를 실행합니다. 스크린샷은 `test-results/`에 저장됩니다. 테스트는 Contact 폼을 전송하지 않습니다.

```sh
npm run build
```

`dist/`에는 4개 페이지, 사용 중인 CSS/JS, 참조된 이미지, 원래의 `CNAME`과 `.nojekyll`만 들어갑니다. 참조하지 않는 원본 자산, 중첩 저장소, 테스트, 보고서는 포함되지 않습니다. `resources.js`와 `team.js`는 기존 빈 파일로서 사용하지 않으며 빌드에도 포함하지 않습니다.

## 배포 구조

- `CNAME`의 `iumast.com`과 페이지·자산의 상대 경로를 유지합니다.
- 사용자 정의 GitHub Pages 업로드 작업에서는 `dist/`만 공개 대상으로 지정합니다.
- 기존 브랜치 루트/Jekyll 방식에서는 `_config.yml`의 제외 목록을 적용합니다. 저장소 루트에 `.nojekyll`을 추가하면 이 제외 설정을 우회할 수 있으므로 추가하지 않습니다.
- 기존 `MAST/`는 별도 Git 저장소 사본입니다. 해당 사본을 변경하지 않았으며 공개 대상에서 제외했습니다. 루트 저장소의 변경사항과 혼동하지 마세요.
- 로컬 검수는 `/` 및 `/Mast/` 경로에서 수행합니다. 실제 GitHub Pages 설정과 DNS는 변경하지 않았습니다.
- Pknic 원본 표지와 제거한 Curriculum PPT 이미지는 저장소 밖에 보존했습니다. 공개 폴더에 복사하지 마세요.

## 콘텐츠 편집

Resources는 `content/resources.json`에서 관리합니다. `npm run build`가 `resources.html`과 `dist/`를 함께 갱신합니다. Industry Collaborations / Projects / Case Studies의 세 분류와 작은 Past Speaker Sessions 아카이브로 구성되며, 선택 이미지·프레임워크·인사이트를 추가할 수 있습니다. [콘텐츠 편집 안내](content/README.md)를 참고하세요.

Curriculum은 “Better Questions. Stronger Thinkers.”라는 제목의 텍스트 소개입니다. PPT 이미지 대신 질문·판단·공동 커리큘럼과 다섯 가지 사고 원칙을 표시합니다. PKNIC과 Tim Hortons는 공개 승인 또는 MAST 활동 근거가 확인될 때까지 보류합니다.

현재 공개 연락 주소는 사용자가 지정한 `chacha@iu.edu`입니다. 개인 LinkedIn은 유지하며 MAST 조직 LinkedIn은 공개하지 않습니다. Team의 2026–27 Leadership과 이전 부서 명단은 구분해서 표시합니다.

조사 보고서·검수 화면은 로컬 `reports/`에 보관하며 Git과 웹 배포에서 제외합니다. 조사 원본·비공개 자료를 저장소에 추가하지 마세요.

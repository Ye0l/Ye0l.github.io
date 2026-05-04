# FF14 Crystalline Conflict Ranking Tracker

FF14 한국 공식 Crystalline Conflict 랭킹 페이지를 주기적으로 수집해 SQLite에 누적 저장하고, 캐릭터별 순위 추이를 보는 로컬 대시보드입니다.

## 실행

현재 Python 패키지 의존성은 없습니다. 새 환경에서는 `.venv`만 만들면 됩니다.

```bash
python3 -m venv .venv
.venv/bin/python -m cc_ranking.fetch
.venv/bin/python -m cc_ranking.server --port 8000
```

`requirements.txt`는 아직 필요하지 않습니다. 나중에 외부 패키지를 추가하면 의존성 파일도 같이 추가하세요.

브라우저에서 `http://127.0.0.1:8000`을 열면 됩니다.

페이지는 역할별로 나뉩니다.

- `index.html`: 사용자용 랭킹/추이 화면
- `api.html`: Discord Bot API 가이드

## 프론트/백엔드 분리

`web/` 폴더는 정적 파일만 있으므로 GitHub Pages에 그대로 올릴 수 있습니다. 백엔드는 개인 서버에서 아래처럼 실행합니다.

```bash
.venv/bin/python -m cc_ranking.server --host 0.0.0.0 --port 8000
```

GitHub Pages에서 백엔드 API를 호출하려면 `web/config.js`의 값을 백엔드 주소로 바꾸세요.

```js
window.CC_API_BASE = "https://api.example.com";
```

백엔드가 내려가거나 API 응답이 실패하면 프론트는 `web/static/data/`의 정적 JSON을 자동으로 읽습니다. 정적 데이터 경로를 바꾸려면 `web/config.js`에서 조정하세요.

```js
window.CC_STATIC_DATA_BASE = "static/data";
```

백엔드는 JSON/SVG 응답에 CORS 헤더를 붙입니다.

## 매일 수집

랭킹 수집은 공개 프론트에 노출하지 않습니다. 서버에서 CLI로 실행하거나 cron에 등록하세요.

```cron
0 15 * * * /home/kastre/workspace/cc-ranking/scripts/poll_kst_until_changed.sh
```

위 스크립트는 KST 기준 매일 15:00부터 18:00까지 10분 간격으로 파싱합니다. 데이터 변동이 감지되면 정적 fallback 파일을 갱신한 뒤 `scripts/on_ranking_changed.sh`를 실행하고 즉시 종료합니다.

터미널에서 직접 실행하면 현재 상태를 화면과 `data/fetch.log`에 같이 출력합니다. cron에서는 `data/fetch.log`만 확인하면 됩니다.

```bash
tail -f data/fetch.log
```

후속 작업 파일을 다른 경로로 쓰려면 첫 번째 인자로 넘기면 됩니다.

```cron
0 15 * * * /home/kastre/workspace/cc-ranking/scripts/poll_kst_until_changed.sh /home/kastre/deploy_after_cc_change.sh
```

공식 페이지의 기준 시간이 `2026-05-02 15:00～16:00 기준` 같은 형태로 내려오므로, 같은 기준 시간 데이터는 중복 저장하지 않고 같은 스냅샷을 갱신합니다. `cc_ranking.fetch`는 저장 전 기존 스냅샷과 현재 파싱 결과를 비교해 `changed=true|false`를 출력합니다.

시간대를 기다리지 않고 동작만 짧게 확인하려면 환경변수로 실행 창과 간격을 조정할 수 있습니다.

```bash
START_HM=0000 END_HM=2359 INTERVAL_SECONDS=10 scripts/poll_kst_until_changed.sh
```

정적 fallback 파일만 갱신하려면 아래 명령을 실행합니다.

```bash
.venv/bin/python -m cc_ranking.export_static
```

## Discord Bot API

봇에서는 아래 엔드포인트를 호출하면 됩니다.

```text
GET /api/v1/top?limit=10
GET /api/v1/top?limit=10&snapshot_id=1
GET /api/v1/snapshots
GET /api/v1/search?q=캐릭터명
GET /api/v1/character?name=캐릭터명&server=서버명
GET /api/v1/character?key=서버::캐릭터명
GET /api/v1/graph.svg?name=캐릭터명&server=서버명
```

`/api/v1/character` 응답에는 최신 순위, 히스토리, 요약값, Discord embed 초안, 그래프 URL이 같이 들어갑니다. Discord 메시지에는 `discord_embed`를 그대로 참고하고, 이미지에는 `/api/v1/graph.svg?...` URL을 붙이면 됩니다.

## 구조

- `cc_ranking/parser.py`: 공식 페이지 HTML 파서
- `cc_ranking/db.py`: SQLite 스키마와 조회 함수
- `cc_ranking/fetch.py`: 페이지 수집 및 저장 CLI
- `cc_ranking/export_static.py`: SQLite 데이터를 `web/static/data/` 정적 JSON으로 내보내는 CLI
- `cc_ranking/server.py`: 표준 라이브러리 기반 로컬 웹 서버/API
- `web/`: 대시보드 UI

## 테스트

```bash
.venv/bin/python -m unittest discover -s tests
```

---
title: AI Agent를 활용한 Apache Doris Core 릴리스
language: ko
description: "AI Agent와 Release Manager를 위한 Apache Doris Core 릴리스 전체 절차 안내서: 준비, 패키징, 서명, 투표, 릴리스 완료 및 웹사이트 업데이트."
keywords:
    - Apache Doris Core 릴리스
    - AI Agent
    - Release Manager
    - Apache 투표
    - SVN dist
    - GPG 서명
    - 릴리스 노트
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# AI Agent를 활용한 Apache Doris Core 릴리스 {#release-apache-doris-core-with-an-ai-agent}

<!-- Knowledge type: Agent runbook -->
<!-- Applicable scenario: Apache Doris Core release / Release Manager assistant -->

이 페이지는 AI Agent를 위한 Doris Core 릴리스 런북입니다. Agent가 Release Manager를 대신해 릴리스 결정을 내리도록 하는 것이 목적은 아닙니다. Agent가 Release Manager에게 브랜치와 태그 준비, RC 소스 패키지 생성, 서명, Apache dev SVN 업로드, 투표 시작, 정식 릴리스 완료, Doris 웹사이트 업데이트까지 전체 릴리스 과정을 단계별로 안내할 수 있도록 하는 것이 목적입니다.

Agent는 이 문서를 순서대로 따라야 합니다. 각 단계에서 목표, Release Manager의 확인이 필요한 입력 정보, 직접 실행하거나 Release Manager에게 실행을 요청할 명령, 해당 단계의 완료 여부를 검증할 수 있는 결과를 설명하세요.

## 범위와 제한 사항 {#scope-and-boundaries}

이 문서는 Apache Doris Core, 즉 `apache/doris` 저장소의 소스 릴리스에 적용됩니다. 릴리스 도우미 스크립트는 Doris 저장소의 다음 경로에 있습니다.

```text
tools/release-tools/
```

웹사이트 업데이트 도우미 지침은 Doris Website 저장소의 다음 경로에 있습니다.

```text
doc-tools/skills/add-release/SKILL.md
```

Agent는 다음 제한 사항을 준수해야 합니다.

| 항목 | 요구 사항 |
| --- | --- |
| 릴리스 결정 | Release Manager와 커뮤니티가 릴리스 결정을 내립니다. Agent는 주의 사항 안내, 확인, 정보 정리만 수행합니다 |
| ASF 계정과 비밀번호 | 자격 증명을 파일에 쓰거나, 로그에 출력하거나, Git에 커밋하지 마세요 |
| GPG 개인 키와 암호 문구 | Release Manager가 로컬에서 관리합니다. Agent는 암호 문구를 요청하거나 저장해서는 안 됩니다 |
| 공개 SVN 쓰기 작업 | 쓰기 작업을 할 때마다 먼저 Release Manager에게 대상 URL과 파일 목록을 확인받으세요 |
| 이메일 발송 | 스크립트는 이메일 초안만 생성합니다. Release Manager가 검토한 뒤 `@apache.org` 주소에서 직접 발송해야 합니다 |
| 투표 결과 | Agent는 투표 집계를 도울 수 있지만, 결과가 ASF 투표 규칙을 충족하는지는 Release Manager가 확인해야 합니다 |
| 편의용 바이너리 | 스크립트는 로컬 편의용 바이너리에 서명하고 체크섬을 생성할 수 있지만, 바이너리 패키지를 업로드하지는 않습니다 |

## Agent가 먼저 수집해야 할 입력 정보 {#inputs-the-agent-must-collect-first}

릴리스 절차를 시작하기 전에 Release Manager에게 다음 입력 정보를 확인하세요. 핵심 항목이 하나라도 누락되었다면 패키징이나 업로드를 진행하지 마세요.

| 입력 정보 | 예시 | 용도 |
| --- | --- | --- |
| 릴리스 버전 | `4.0.7` | 패키지 이름, 웹사이트 링크, 릴리스 이메일 생성 |
| RC 번호 | `rc01` 또는 `rc02` | Git 태그와 dev SVN 디렉터리 생성 |
| Git 태그 | `4.0.7-rc01` | 릴리스 후보의 변경 불가능한 소스 기준점 |
| 릴리스 브랜치 | `branch-4.0` | 태그가 예상한 브랜치에서 생성되었는지 확인 |
| Apache ID | `morningman` | SVN, KEYS, 이메일, 서명 정보에 사용 |
| Apache 이메일 | `morningman@apache.org` | 투표 이메일의 서명자 이메일로 사용 |
| 서명 키 | GPG 지문, 또는 자동 감지를 위한 빈 값 | `.asc` 서명 생성 |
| 릴리스 노트 URL | GitHub 이슈 또는 웹사이트 릴리스 노트 URL | 투표 이메일과 웹사이트 업데이트에 사용 |
| 편의용 바이너리 | `x64`, `x64-noavx2`, `arm64` tarball의 로컬 경로 | 선택적으로 서명하고 투표 이메일에 표시 |
| PMC 릴리스 SVN 권한 | 있음, 또는 PMC의 도움 필요 | 정식 릴리스 SVN 단계에 필요 |
| 웹사이트 업데이트 시점 | 지금 또는 나중에 | Doris Website 업데이트 절차를 실행할지 결정 |

입력 정보를 수집한 뒤 릴리스 계획을 다시 설명하세요. 예를 들면 다음과 같습니다.

```text
This release plan is for Apache Doris 4.0.7, RC rc01, tag 4.0.7-rc01.
The RC source artifacts will be uploaded to https://dist.apache.org/repos/dist/dev/doris/4.0.7-rc01/.
After the vote passes, the final source artifacts will be published to https://dist.apache.org/repos/dist/release/doris/4.0/4.0.7/.
```

## 1단계: 릴리스 준비 상태 확인 {#stage-1-confirm-release-preparation}

도우미 스크립트부터 바로 실행하지 마세요. 먼저 릴리스 준비가 완료되었는지 확인하세요. Doris 릴리스 도우미 스크립트는 다음 작업이 이미 완료되었다고 가정합니다.

1. Release Manager가 커뮤니티에서 릴리스 계획 논의를 마쳤습니다.
2. 릴리스 브랜치가 생성되었습니다.
3. 대상 버전의 이슈, PR, 주요 버그 수정이 종료, 병합 또는 연기 처리되었습니다.
4. 필요한 패치가 릴리스 브랜치에 cherry-pick되었습니다.
5. QA 또는 담당 유지 관리자가 안정성 검증을 마쳤습니다.
6. 브랜치를 성공적으로 빌드할 수 있습니다.
7. 릴리스 노트가 준비되었습니다. 일반적으로 GitHub 이슈나 Markdown 문서 형식입니다.
8. Git 태그가 생성되어 `apache/doris`를 가리키는 원격 저장소에 푸시되었습니다.

Release Manager에게 Doris 저장소에서 다음 확인 명령을 실행하도록 요청하세요.

```bash
git fetch --tags <apache-remote>
git rev-parse <version>-<rc>
git ls-remote --tags <apache-remote> refs/tags/<version>-<rc>
```

완료 기준:

- 로컬 태그가 존재합니다.
- Apache Doris GitHub 원격 저장소에 동일한 태그가 있습니다.
- 로컬 태그와 원격 태그가 같은 커밋을 가리킵니다.
- Release Manager가 릴리스 브랜치, 릴리스 노트, 검증 작업이 준비되었음을 확인합니다.

태그가 없거나 태그가 가리키는 커밋이 일치하지 않으면 릴리스 절차를 중단하고, Release Manager에게 태그를 수정한 뒤 계속 진행하도록 요청하세요.

## 2단계: `release.env` 구성 {#stage-2-configure-releaseenv}

Release Manager에게 Doris 저장소의 릴리스 도구 디렉터리로 이동하도록 요청하세요.

```bash
cd tools/release-tools
```

그런 다음 `release.env`를 편집합니다. `4.0.7-rc01`의 주요 필드는 다음과 같습니다.

```bash
VERSION="4.0.7"
RC="rc01"
TAG="${VERSION}-${RC}"
GIT_REMOTE="upstream-apache"

APACHE_ID="<your-apache-id>"
APACHE_EMAIL="<your-apache-id>@apache.org"
SIGNER_NAME="<your display name>"
SIGNING_KEY="<your signing key fingerprint, or empty if only one secret key exists>"

RELEASE_NOTES_URL="<release notes issue or page URL>"
ANNOUNCE_RELEASE_NOTES_URL="<release notes URL for announce email, or empty to reuse>"
```

Release Manager에게 다음 파생 값을 확인하도록 안내하세요.

| 필드 | 예상 값 |
| --- | --- |
| `TAG` | `4.0.7-rc01`처럼 RC 접미사를 포함해야 합니다 |
| `PKG_BASE` | `apache-doris-4.0.7-rc01-src`처럼 RC 접미사가 있는 투표 단계의 소스 패키지 이름 |
| `RELEASE_PKG_BASE` | `apache-doris-4.0.7-src`처럼 RC 접미사가 없는 최종 릴리스 소스 패키지 이름 |
| `DEV_SVN_DIR` | `https://dist.apache.org/repos/dist/dev/doris/4.0.7-rc01`과 같은 dev SVN RC 디렉터리 |
| `RELEASE_SVN_DIR` | `https://dist.apache.org/repos/dist/release/doris/4.0/4.0.7`과 같은 릴리스 SVN 디렉터리 |
| `VERIFY_GUIDE_URL` | Doris 릴리스 검증 가이드를 가리켜야 합니다 |

투표 이메일에 편의용 바이너리를 나열해야 한다면 Release Manager가 바이너리 tarball의 로컬 절대 경로를 `BIN_FILES`에 지정할 수 있습니다. 다음 제한 사항을 명확히 설명하세요.

- `02-package-sign-upload.sh`는 `BIN_FILES`의 파일에 서명하고 각 파일 옆에 `.asc` 및 `.sha512` 파일을 생성합니다.
- 스크립트는 이러한 바이너리 패키지를 Apache dev SVN에 업로드하지 않습니다.
- ASF 투표 대상 릴리스 산출물은 소스만 포함합니다.

## 3단계: ASF SVN 자격 증명 내보내기 {#stage-3-export-asf-svn-credentials}

Release Manager에게 현재 셸에서 ASF 자격 증명을 환경 변수로 내보내도록 요청하세요.

```bash
export ASF_USERNAME=<your-apache-id>
export ASF_PASSWORD='<your-apache-ldap-password>'
```

Release Manager에게 비밀번호를 보내 달라고 요청하지 마세요. 비밀번호를 `release.env`에 쓰지 마세요.

완료 기준:

- 현재 셸에 `ASF_USERNAME`이 존재합니다.
- 현재 셸에 `ASF_PASSWORD`가 존재합니다.
- 두 변수 모두 Git에 커밋되지 않습니다.

## 4단계: 서명 및 릴리스 환경 확인 {#stage-4-check-the-signing-and-release-environment}

다음을 실행합니다.

```bash
./01-check-env.sh
```

이 스크립트는 다음 사항을 확인합니다.

- `git`, `gpg`, `svn`, `sha512sum`, `curl`, `gzip`을 포함한 필수 도구.
- `GPG_TTY`를 사용할 수 있는지 여부.
- `gpg.conf`에 SHA512 다이제스트 기본 설정이 있는지 여부.
- 사용할 수 있는 로컬 GPG 비밀 키가 있는지 여부.
- 서명 키가 Doris KEYS에 포함되어 있는지 여부.
- 로컬 테스트 서명과 검증이 정상적으로 작동하는지 여부.
- ASF SVN 자격 증명이 있는지 여부.

스크립트가 `gpg.conf` 편집, 키 가져오기, 키 생성 또는 KEYS 게시를 요청하면 먼저 스크립트가 무엇을 변경하는지 설명하세요. 그런 다음 Release Manager가 승인 여부를 결정하도록 하세요.

성공 시 다음 줄이 출력됩니다.

```text
environment looks READY for <version>-<rc>
```

이 줄이 나타나지 않으면 패키징과 업로드를 진행하지 마세요.

## 5단계: RC 소스 산출물 패키징, 서명 및 업로드 {#stage-5-package-sign-and-upload-the-rc-source-artifacts}

업로드 스크립트를 실행하기 전에 대상 dev SVN URL을 다시 명시하세요.

```text
https://dist.apache.org/repos/dist/dev/doris/<version>-<rc>/
```

Release Manager가 확인한 뒤 다음을 실행합니다.

```bash
./02-package-sign-upload.sh
```

스크립트는 다음 작업을 수행합니다.

1. 로컬 태그가 존재하는지 확인합니다.
2. Apache Doris GitHub 원격 저장소에 동일한 태그가 있는지 확인합니다.
3. 로컬 태그와 원격 태그가 같은 커밋을 가리키는지 확인합니다.
4. `git archive`로 소스 tarball을 생성합니다.
5. `.asc` GPG 서명을 생성합니다.
6. `.sha512` 체크섬을 생성합니다.
7. 서명과 체크섬을 검증합니다.
8. 선택적으로 `BIN_FILES`에 나열된 편의용 바이너리에 서명하고 체크섬을 생성합니다.
9. 두 차례 확인을 거친 뒤 소스 tarball, `.asc`, `.sha512`를 Apache dev SVN에 업로드합니다.

두 확인 시점 모두 Release Manager에게 다음 사항을 확인하도록 안내하세요.

- 대상 SVN URL이 올바릅니다.
- 업로드 목록에는 소스 tarball, 서명, 체크섬만 포함되어 있습니다.
- 파일 이름에 RC 접미사가 포함되어 있습니다.
- SVN 커밋 메시지가 이 RC와 일치합니다.

완료 기준:

- dev SVN 디렉터리에 다음 세 파일이 있습니다.

```text
apache-doris-<version>-<rc>-src.tar.gz
apache-doris-<version>-<rc>-src.tar.gz.asc
apache-doris-<version>-<rc>-src.tar.gz.sha512
```

- 스크립트가 Release Manager에게 `./03-vote-mail.sh`를 실행하라고 안내하며 종료됩니다.

업로드 전에 버전, 태그, 파일 이름 또는 SVN URL이 잘못된 것을 발견하면 중단하고, Release Manager가 커밋을 승인하지 않도록 하세요.

## 6단계: `[VOTE]` 이메일 생성 및 발송 {#stage-6-generate-and-send-the-vote-email}

다음을 실행합니다.

```bash
./03-vote-mail.sh
```

스크립트는 `WORK_DIR` 아래에 다음 파일을 작성합니다.

```text
vote-email.txt
vote-email.eml
```

Release Manager가 이메일 초안을 검토하도록 도와주세요.

| 확인 항목 | 요구 사항 |
| --- | --- |
| 제목 | `[VOTE] Release Apache Doris <version>-<rc>` |
| GitHub 태그 링크 | `https://github.com/apache/doris/releases/tag/<version>-<rc>`를 가리킵니다 |
| 릴리스 노트 | 이 버전의 릴리스 노트를 가리킵니다 |
| RC 산출물 | dev SVN RC 디렉터리를 가리킵니다 |
| PGP 키 | 지문, Apache 이메일, KEYS URL이 올바릅니다 |
| 검증 가이드 | Doris 릴리스 검증 가이드를 가리킵니다 |
| 투표 기간 | 투표가 최소 72시간 동안 진행된다고 명시합니다 |
| 편의용 바이너리 | 포함된 경우 tarball, `.asc`, `.sha512`의 URL이 모두 올바릅니다 |

Release Manager는 `@apache.org` 주소에서 다음 주소로 이메일을 직접 발송해야 합니다.

```text
dev@doris.apache.org
```

Agent는 이메일을 자동으로 발송해서는 안 됩니다.

완료 기준:

- `[VOTE]` 이메일이 `dev@doris.apache.org`로 발송되었습니다.
- Release Manager가 투표 시작 시각을 기록합니다.
- 투표가 최소 72시간 동안 진행됩니다.

## 7단계: 투표 추적 및 `[RESULT]` 이메일 발송 {#stage-7-track-the-vote-and-send-the-result-email}

투표 기간 동안 Release Manager가 다음과 같은 투표 테이블을 관리하도록 도와주세요.

| 투표자 | Apache ID | 투표 | 구속력 여부 | 비고 |
| --- | --- | --- | --- | --- |
| `<name>` | `<apache-id>` | `+1` | 예/아니요 | `<verification summary>` |

Release Manager에게 다음 사항을 안내하세요.

- 명시적인 답신만 투표로 집계합니다.
- Release Manager에게 암묵적인 `+1`은 부여되지 않습니다. Release Manager도 투표하려면 명시적으로 답신해야 합니다.
- PMC의 투표는 구속력이 있습니다. 다른 커뮤니티 구성원의 투표는 구속력이 없습니다.
- 투표는 최소 72시간 동안 진행되어야 합니다.
- 릴리스에는 일반적으로 구속력 있는 `+1` 투표가 최소 3표 필요하며, `+1`이 `-1`보다 많아야 합니다.
- 유효한 `-1`이나 심각한 검증 문제가 있으면 Release Manager가 이 RC를 취소하고 새 RC를 준비할지 결정해야 합니다.

투표가 통과되면 Release Manager가 `[RESULT]` 이메일을 직접 발송합니다. Agent는 본문 초안을 작성할 수 있지만, 투표 집계, 구속력 여부, 메일링 리스트 스레드 링크는 Release Manager가 확인해야 합니다.

완료 기준:

- `[RESULT][VOTE]` 이메일이 `dev@doris.apache.org`로 발송되었습니다.
- Release Manager가 이 RC의 투표 통과를 확인합니다.

## 8단계: 최종 소스 산출물 게시 및 `[ANNOUNCE]` 이메일 생성 {#stage-8-publish-the-final-source-artifacts-and-generate-the-announce-email}

투표가 통과되고 `[RESULT]` 이메일이 발송된 후에만 완료 스크립트를 실행하세요.

```bash
./04-release-complete.sh
```

스크립트는 다음 작업을 수행합니다.

1. 투표를 통과한 RC의 소스 tarball, 서명, 체크섬이 dev SVN에 있는지 확인합니다.
2. 대상 릴리스 SVN 디렉터리가 아직 존재하지 않는지 확인합니다.
3. `svnmucc`를 사용해 릴리스 SVN 디렉터리를 생성합니다.
4. RC 파일을 dev SVN에서 릴리스 SVN으로 이동합니다.
5. 최종 릴리스 파일 이름에서 RC 접미사를 제거합니다.
6. dev SVN에서 RC 디렉터리를 삭제합니다.
7. `announce-email.txt`와 `announce-email.eml`을 생성합니다.

Release Manager에게 다음 사항을 안내하세요.

- 릴리스 SVN에 쓰려면 일반적으로 PMC 권한이 필요합니다.
- 대상 릴리스 SVN 디렉터리에는 RC 접미사가 포함되어서는 안 됩니다.
- 최종 소스 패키지 파일 이름에는 RC 접미사가 포함되어서는 안 됩니다.
- 이 단계에서는 dev SVN의 RC 디렉터리가 삭제됩니다.
- 스크립트는 SVN 변경 사항을 커밋하기 전에 최종 확인을 요청합니다.

릴리스 SVN으로의 이동이 이미 완료되었고 공지 이메일만 다시 생성해야 한다면 다음을 사용하세요.

```bash
./04-release-complete.sh --mail-only
```

완료 기준:

- 릴리스 SVN 디렉터리에 다음 파일이 있습니다.

```text
apache-doris-<version>-src.tar.gz
apache-doris-<version>-src.tar.gz.asc
apache-doris-<version>-src.tar.gz.sha512
```

- 해당 `<version>-<rc>` 디렉터리가 dev SVN에서 삭제되었습니다.
- 공지 이메일 초안이 생성되었습니다.

## 9단계: `[ANNOUNCE]` 이메일 발송 {#stage-9-send-the-announce-email}

Release Manager가 `announce-email.txt`를 검토하도록 도와주세요.

| 확인 항목 | 요구 사항 |
| --- | --- |
| 제목 | `[ANNOUNCE] Apache Doris <version> release` |
| 다운로드 페이지 | `https://doris.apache.org/download/`를 가리킵니다 |
| 소스 산출물 | 릴리스 SVN의 최종 디렉터리를 가리킵니다 |
| 릴리스 노트 | 최종 릴리스 노트를 가리킵니다 |
| 서명 | 올바른 Release Manager 이름을 사용합니다 |

Release Manager는 `@apache.org` 주소에서 다음 주소로 공지 이메일을 직접 발송합니다.

```text
dev@doris.apache.org
```

완료 기준:

- `[ANNOUNCE]` 이메일이 발송되었습니다.
- Release Manager가 웹사이트나 GitHub Release에서 참조할 수 있도록 메일링 리스트 스레드 링크를 저장합니다.

## 10단계: Doris 웹사이트 릴리스 정보 업데이트 {#stage-10-update-the-doris-website-release-information}

릴리스 투표가 통과되면 Doris Website 저장소로 이동해 다음 문서를 읽으세요.

```text
doc-tools/skills/add-release/SKILL.md
```

먼저 다음 입력 정보를 수집하거나 확인하세요.

| 입력 정보 | 설명 |
| --- | --- |
| 버전 | 예: `4.0.7` |
| 릴리스 계열 | 예: `4.0` |
| 릴리스 노트 원본 | GitHub 이슈, Markdown 본문 또는 기존 릴리스 노트 |
| 릴리스 날짜 | Apache 다운로드 디렉터리의 타임스탬프나 공지 날짜를 우선 사용 |
| 소스 패키지 URL | `https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz` |
| 바이너리 패키지 URL | `x64`, `x64-noavx2`, `arm64` 및 각각의 `.asc`와 `.sha512` |
| 소스 파일 이름 접미사 | 최종 소스 패키지에 RC 접미사가 없는지 확인 |
| 웹사이트 표시 위치 | `Latest`, `Prev`를 업데이트할지, 과거 릴리스만 업데이트할지 결정 |
| 현지화 | 기본적으로 영어와 중국어 릴리스 노트의 내용을 일치시킴 |

일반적으로 업데이트할 파일:

```text
src/constant/download.data.ts
releasenotes/v<series>/release-<version>.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v<series>/release-<version>.md
releasenotes/all-release.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md
sidebarsReleases.json
```

특히 다음 사항을 확인하세요.

- `DORIS_VERSIONS`와 `ALL_VERSIONS` 모두 새 버전을 포함합니다.
- 새 버전이 대표 버전으로 표시된다면 `VersionEnum.Latest` 또는 `VersionEnum.Prev`가 올바르게 업데이트됩니다.
- 소스 관련 `source` 및 `version` 필드가 실제 소스 패키지 URL을 생성합니다.
- 모든 바이너리 패키지에 `.tar.gz`, `.asc`, `.sha512` 링크가 있습니다.
- 영어와 중국어 릴리스 노트의 구조가 같습니다.
- `all-release.md`가 릴리스 날짜 기준 최신순으로 정렬되어 있습니다.
- `sidebarsReleases.json`이 새 릴리스 노트 ID를 포함하며 유효한 JSON 형식을 유지합니다.

권장 검증 명령:

```bash
curl -sI https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz
curl -sI https://download.velodb.io/apache-doris-<version>-bin-x64.tar.gz
curl -sI https://download.velodb.io/apache-doris-<version>-bin-x64-noavx2.tar.gz
curl -sI https://download.velodb.io/apache-doris-<version>-bin-arm64.tar.gz

git diff --check
node -e "JSON.parse(require('fs').readFileSync('sidebarsReleases.json','utf8')); console.log('sidebarsReleases.json ok')"
rg -n "<version>|release-<version>|apache-doris-<version>" src/constant/download.data.ts releasenotes i18n/zh-CN/docusaurus-plugin-content-docs-releases/current sidebarsReleases.json
```

Release Manager가 빌드 검증을 허용하면 Doris Website 저장소의 일반적인 Docusaurus 빌드 명령이나 로컬 검증 명령을 실행하세요. Release Manager가 명시적으로 빌드를 생략했다면 최종 요약에 그 사실을 기재하세요.

완료 기준:

- 웹사이트 다운로드 데이터에 새 버전이 포함되어 있습니다.
- 영어와 중국어 릴리스 노트가 추가되거나 업데이트되었습니다.
- 릴리스 인덱스와 사이드바가 업데이트되었습니다.
- 소스 패키지, 바이너리 패키지, 서명, 체크섬 링크에 접근할 수 있습니다.
- 관련 검증 명령이 통과했거나, 생략한 검증이 명확히 보고되었습니다.

## 11단계: 릴리스 후 확인 {#stage-11-post-release-checks}

마지막으로 Release Manager가 다음 사항을 확인하도록 도와주세요.

| 확인 항목 | 요구 사항 |
| --- | --- |
| Apache 다운로드 | `https://downloads.apache.org/doris/<series>/<version>/`에 접근할 수 있습니다 |
| 다운로드 페이지 | 웹사이트의 `/download/` 페이지에 새 버전이 표시됩니다 |
| 릴리스 노트 | 웹사이트의 `/releases/` 페이지에 새 릴리스 노트가 표시됩니다 |
| GitHub Release | 해당 태그의 GitHub Release가 업데이트되었습니다 |
| 이전 버전 | 웹사이트 정책에서 요구하는 경우 이전 버전 링크가 아카이브 URL을 가리킵니다 |
| 메일링 리스트 | `[VOTE]`, `[RESULT]`, `[ANNOUNCE]` 스레드 링크가 저장되어 있습니다 |
| 소스 검증 | 최종 다운로드 URL의 파일이 서명 및 체크섬 검증을 통과합니다 |

최종 다운로드 URL로 검증을 수행하는 예시는 다음과 같습니다.

```bash
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz.asc
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz.sha512
wget https://downloads.apache.org/doris/KEYS

gpg --import KEYS
gpg --verify apache-doris-<version>-src.tar.gz.asc apache-doris-<version>-src.tar.gz
sha512sum --check apache-doris-<version>-src.tar.gz.sha512
```

## 중단 후 재검토해야 하는 조건 {#stop-and-re-evaluate-conditions}

다음 중 하나라도 발생하면 Release Manager에게 릴리스 절차를 일시 중단하도록 권고하세요.

- 로컬 태그와 원격 태그가 서로 다른 커밋을 가리킵니다.
- `01-check-env.sh`가 `environment looks READY`를 출력하지 않습니다.
- GPG 서명 또는 체크섬 검증에 실패합니다.
- dev SVN 또는 릴리스 SVN의 대상 디렉터리가 이번 버전의 디렉터리가 아닙니다.
- 투표를 시작한 지 72시간이 지나지 않았습니다.
- 구속력 있는 `+1` 투표가 3표 미만입니다.
- 해결되지 않은 유효한 `-1`이 있습니다.
- 검증자가 소스 패키지에서 예상치 못한 바이너리나 빌드 산출물을 발견합니다.
- LICENSE, NOTICE 또는 라이선스 헤더 검사에 실패합니다.
- 웹사이트 링크가 존재하지 않는 소스 패키지, 바이너리 패키지, 서명 또는 체크섬을 가리킵니다.

문제를 해결하려면 새 RC가 필요한 경우 Release Manager에게 다음과 같이 안내하세요.

1. 릴리스 브랜치를 수정합니다.
2. `rc01`에서 `rc02`로 변경하는 것처럼 새 태그를 생성하고 푸시합니다.
3. `RC`와 `TAG`를 `release.env`에서 업데이트합니다.
4. 4단계부터 다시 시작합니다.

## Agent 응답 템플릿 예시 {#suggested-agent-reply-template}

Release Manager가 "Doris 4.0.7 릴리스를 시작해 주세요"라고 말하면 Agent는 다음과 같이 응답할 수 있습니다.

```text
I will guide you through the Doris Core release flow. First I need to confirm a few inputs:

1. Is this rc01 or a later RC?
2. Has the 4.0.7-rcXX tag already been created and pushed to apache/doris?
3. What is the Git remote name in your Doris checkout that points to apache/doris?
4. What is the Release Notes URL?
5. Should this vote email list convenience binaries?
6. Do you have release SVN write permission, or do you need a PMC member to help with the final release step?

After confirming these, I will check the tag and release.env, then run 01-check-env.sh. I will stop for your confirmation before any public SVN write or email send.
```

## 최종 요약 템플릿 {#final-summary-template}

릴리스가 완료되면 Release Manager에게 간단한 요약을 전달하세요.

```text
Apache Doris <version> release flow is complete.

- RC tag: <version>-<rc>
- Vote artifacts: <dev SVN URL>
- Release artifacts: <release SVN URL>
- Vote thread: <mail thread URL>
- Result thread: <mail thread URL>
- Announce thread: <mail thread URL>
- Website PR/commit: <URL or commit>
- Validation:
  - Signature/checksum: passed
  - Website links: passed
  - Docusaurus build: passed/skipped

Remaining manual follow-ups:
- <none or list remaining follow-ups>
```

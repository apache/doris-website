---
title: 리뷰 및 CI
language: ko
description: Apache Doris Pull Request를 리뷰하고, CI를 실행하고, 지적 사항을 해결하여 변경 사항을 병합하는 방법입니다.
keywords:
    - Apache Doris
    - Pull Request 리뷰
    - CI
    - TeamCity
    - AI 리뷰
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

<!-- Knowledge type: procedure -->
<!-- Applicable scenarios: after opening a PR / review / CI / merge -->

Pull Request(PR)를 생성한 후에는 기여자가 코드 리뷰, CI 검사, 필요한 수정을 모두 완료해야 PR을 병합할 수 있습니다. 이 가이드에서는 PR 생성부터 병합까지의 전체 과정을 설명합니다. PR 생성 방법은 [Pull Request 가이드](./pull-request.md)를 참고하세요.

![PR 리뷰, CI 및 병합 워크플로](/images/review-and-ci-workflow.jpg)

전체 절차:

1. Committer가 아니라면 Committer에게 변경 사항을 살펴보고 CI 워크플로를 승인해 달라고 요청합니다.
2. 자신의 변경 사항을 직접 리뷰하고, 필요에 따라 `doris-repo-review` 스킬로 로컬 AI 리뷰를 실행합니다.
3. CI 워크플로가 승인되면 PR 댓글로 TeamCity 검사를 실행합니다.
4. CI와 리뷰에서 발견된 문제를 해결하고, 현재 커밋에 대한 모든 필수 검사가 통과했는지 확인합니다.
5. Reviewer와 관련 Code Owner가 코드를 승인하면 Committer에게 PR 병합을 요청합니다.

## 1. Committer에게 CI 워크플로 승인 요청하기 {#1-ask-a-committer-to-approve-the-ci-workflow}

Committer가 아닌 기여자가 PR을 생성하면 CI 워크플로가 필요한 권한을 가진 커뮤니티 구성원의 승인을 기다릴 수 있습니다. Committer에게 변경 사항을 살펴보고 워크플로를 승인해 달라고 요청하세요. 워크플로 승인은 CI가 PR의 코드를 실행할 수 있도록 허용하는 것일 뿐입니다. Committer가 코드를 승인했거나 병합에 동의했다는 뜻은 아닙니다.

[Apache Doris Slack 커뮤니티](https://doris.apache.org/slack?utm_source=website&utm_medium=docs&utm_content=review_ci)에 참여하고 `#dev` 채널에 다음 정보를 게시하면 커뮤니티에서 적합한 Reviewer를 찾는 데 도움이 됩니다.

```text
PR: <PR URL>
Module: <affected module>
Change: <one-sentence purpose>
Local validation: <tests already run>
Help needed: Approve CI workflow / Review
```

누구에게 연락해야 할지 모르겠다면 해당 모듈에서 최근 병합된 PR이나 변경된 파일의 커밋 이력을 확인하세요. 그런 다음 `#dev`에서 해당 모듈에 익숙한 Committer에게 도움을 요청할 수 있습니다.

## 2. 변경 사항을 로컬에서 리뷰하기 {#2-review-the-change-locally}

워크플로 승인이나 원격 CI를 기다리는 동안 PR을 직접 리뷰하세요.

- 변경된 파일이 PR 설명과 일치하고 관련 없는 수정이 포함되지 않았는지 확인합니다.
- 정상 경로, 오류 경로, 경계 조건, 호환성에 미치는 영향을 확인합니다.
- 새로운 동작을 검증하는 테스트가 있으며, 기존 테스트가 이유 없이 삭제되거나 검증 수준이 낮아지지 않았는지 확인합니다.
- 필요한 경우 설정 참고 문서, 사용자 문서, 오류 메시지, 업그레이드 참고 사항을 업데이트합니다.
- 로그에 비밀번호, 토큰, 키 또는 기타 비밀 정보가 포함되지 않았는지 확인합니다.

### `doris-repo-review`로 로컬 AI 리뷰 실행하기 {#run-a-local-ai-review-with-doris-repo-review}

Apache Doris는 [`doris-repo-review` 스킬](https://github.com/apache/doris-skills/tree/main/skills/doris-repo-review)을 제공합니다. 이 스킬은 로컬 Doris 소스 체크아웃에서 온라인 Code Review 파이프라인과 같은 방식으로 PR을 리뷰합니다. 코드를 컴파일하거나 테스트를 실행하지는 않으므로 CI를 대신할 수 없습니다.

Apache Doris 스킬을 설치합니다.

```bash
npx skills add apache/doris-skills
```

로컬 환경에는 `git`, 인증된 `gh` CLI, `jq`, `python3`가 필요합니다. Doris 체크아웃에는 전체 Git 이력이 있어야 합니다. 로컬 `apache/doris` 소스 체크아웃 디렉터리에서 스킬을 지원하는 Agent를 사용해 다음 명령을 실행합니다.

```text
/doris-repo-review https://github.com/apache/doris/pull/<PR number>
```

명령 뒤에 중점적으로 검토할 항목을 추가할 수 있습니다.

```text
/doris-repo-review https://github.com/apache/doris/pull/<PR number> focus on compatibility and error handling
```

스킬은 현재 작업 디렉터리를 PR의 정확한 커밋에 맞추고 `review-docs/` 아래에 영어와 중국어 리뷰 문서를 작성합니다. 추적 중인 로컬 변경 사항은 실행 전에 직접 커밋하거나 스태시하세요. 스킬은 변경 사항을 대신 스태시하거나 삭제하지 않으며, 실행 후 작업 디렉터리가 detached HEAD 상태로 남을 수 있습니다.

다음 조건을 모두 충족하면 스킬은 로컬에서 인증된 `gh` 계정으로 기계가 읽을 수 있는 PASS 댓글을 자동으로 게시합니다.

- 리뷰 판정이 `APPROVE`이며, `Blocker` 또는 `Major` 지적 사항이 없습니다.
- 리뷰가 수렴했고 리뷰 문서가 검증을 통과했습니다.
- 선택한 모델과 추론 강도가 스킬 요구 사항을 충족합니다.
- 리뷰 중에 PR head가 변경되지 않았습니다.

판정이 `REQUEST_CHANGES`이거나, 리뷰가 수렴하지 않았거나, 실행 환경이 요구 사항을 충족하지 못했거나, PR head가 변경된 경우에는 PASS 댓글을 게시하지 않습니다. 이 댓글은 특정 커밋에 대한 로컬 AI 리뷰의 실행 확인서입니다. Apache 프로젝트 구성원이 직접 내린 승인을 뜻하지 않으며, Reviewer의 코드 승인을 대신하지도 않습니다.

## 3. TeamCity CI 실행하기 {#3-trigger-teamcity-ci}

CI 워크플로가 승인되면 PR에 다음 댓글을 게시하여 TeamCity 파이프라인을 실행합니다.

```text
run buildall
```

`run buildall`은 PR에서 변경한 파일을 기준으로 필요한 전체 검사를 실행합니다. 일반적인 검증에는 이 명령을 우선 사용하세요. 특정 검사 그룹을 실행하거나 재시도하려면 [TeamCity 트리거 워크플로](https://github.com/apache/doris/blob/master/.github/workflows/comment-to-trigger-teamcity.yml)에서 현재 지원하는 다른 명령을 사용합니다.

| 명령 | 목적 |
|---------|---------|
| `run buildall` | 필요한 전체 컴파일 및 테스트 실행 |
| `run compile` | 컴파일 검사 실행 |
| `run beut` | BE 단위 테스트 실행 |
| `run feut` | FE 단위 테스트 실행 |
| `run cloudut` | Cloud 단위 테스트 실행 |
| `run p0` | P0 회귀 테스트 실행 |
| `run p1` | P1 회귀 테스트 실행 |
| `run external` | External 회귀 테스트 실행 |
| `run cloud_p0` | Cloud P0 회귀 테스트 실행 |
| `run cloud_p1` | Cloud P1 회귀 테스트 실행 |
| `run vault_p0` | Vault P0 회귀 테스트 실행 |
| `run nonConcurrent` | 동시에 실행할 수 없는 회귀 테스트 실행 |
| `run check_coverage` | 코드 커버리지 검사 실행 |
| `run performance` | 성능 테스트 실행 |

PR이 `regression-test/pipeline/` 아래의 인증 정보 보안에 영향을 줄 수 있는 파이프라인 스크립트를 변경하면 개별 테스트 명령이 차단됩니다. Committer가 스크립트의 안전성을 검토한 후 `run buildall`을 사용해 변경 사항을 확인했음을 표시하고 파이프라인을 실행해야 합니다.

## 4. CI 통과 여부 확인하기 {#4-determine-whether-ci-passed}

PR 검사에는 필수 검사와 선택 검사가 포함됩니다.

- **필수 검사**: PR을 병합하려면 현재 PR head에 대한 모든 필수 검사가 통과해야 합니다.
- **선택 검사**: 이 결과는 추가 판단 근거를 제공하지만 병합을 직접 차단하지는 않습니다. 실패하더라도 무시하지 말고 변경 사항이 실패를 일으켰는지 확인해야 합니다.

CI가 실패하면 검사 로그를 열어 코드 결함, 테스트 결함, 인프라 문제, 간헐적으로 실패하는 테스트 중 무엇이 원인인지 파악합니다. 코드와 테스트의 결함은 수정한 뒤 새 커밋을 푸시하세요. 인프라 문제나 간헐적으로 실패하는 테스트가 의심되면 실패한 로그의 URL과 판단 근거를 PR에 추가한 뒤, Committer나 모듈 유지관리자에게 재시도 또는 조사를 도와달라고 요청합니다.

푸시할 때마다 PR head가 변경됩니다. 최신 커밋에 대한 검사 결과만 사용하세요. 이전 커밋에서 검사가 통과했거나 AI Review PASS를 받았더라도 현재 커밋에는 적용되지 않습니다.

## 5. Committer에게 온라인 AI 리뷰 실행 요청하기 {#5-ask-a-committer-to-trigger-online-ai-review}

Committer 또는 필요한 저장소 권한을 가진 다른 구성원은 PR에 다음 댓글을 게시하여 온라인 AI 리뷰를 실행할 수 있습니다.

```text
/review
```

명령에 중점적으로 검토할 항목을 지정할 수도 있습니다.

```text
/review focus on compatibility and error handling
```

온라인 AI 리뷰는 `doris-repo-review` 스킬과 같은 리뷰 방식을 사용하지만, 작업이 온라인 대기열에 들어가므로 리소스가 확보될 때까지 기다려야 합니다. PR의 검사 영역에서 `code-review` 상태와 해당 GitHub Actions 로그를 확인하세요. 작업이 한동안 대기 중이거나 실행 중이라는 이유만으로 중복 실행을 요청하지 마세요.

`code-review` 검사가 성공했다는 것은 온라인 리뷰가 완료되어 리뷰 결과를 제출했다는 뜻입니다. 리뷰에서 문제가 발견되지 않았다는 뜻은 아닙니다. 리뷰 요약과 인라인 댓글을 읽고 지적 사항을 해결하세요.

## 6. 리뷰 지적 사항을 해결하고 병합 완료하기 {#6-address-review-findings-and-complete-the-merge}

### Code Owner 승인받기 {#obtain-code-owner-approval}

Apache Doris는 [`.github/CODEOWNERS`](https://github.com/apache/doris/blob/master/.github/CODEOWNERS)를 사용하여 특정 코드 경로의 Code Owner를 지정합니다. PR이 이러한 경로를 변경하면 GitHub가 해당 담당자나 팀에 리뷰를 요청합니다. Code Owner 리뷰가 필요한 모듈은 PR을 병합하기 전에 관련 Code Owner의 승인을 받아야 합니다.

Code Owner 승인, CI 워크플로 승인, 일반 Reviewer의 승인은 각각 별개의 요구 사항입니다. 어느 하나가 다른 하나를 대신할 수 없습니다. PR의 리뷰어 영역과 병합 요구 사항을 확인하여 대기 중인 Code Owner 리뷰가 있는지 살펴보세요. 누구에게 연락해야 할지 모르겠다면 현재 `CODEOWNERS` 파일을 기준으로 확인하고 Slack `#dev` 채널에 PR URL을 게시합니다. 저장소 설정이 바뀔 수 있으므로 이 가이드에는 Code Owner 목록을 별도로 싣지 않습니다.

### 리뷰 지적 사항 해결하기 {#address-review-findings}

사람이나 AI의 리뷰 피드백을 받으면 다음과 같이 진행합니다.

1. 각 지적 사항이 현재 변경 사항에 적용되는지 판단합니다.
2. 유효한 지적 사항은 코드, 테스트 또는 문서에서 해결하고 무엇을 변경했는지 답변합니다.
3. 적용되지 않는 지적 사항은 기술적 이유와 뒷받침하는 근거를 설명합니다.
4. 문제가 해결된 후에만 대화를 해결됨으로 표시합니다.
5. 새 커밋을 푸시한 뒤에는 영향을 받는 CI와 리뷰 검사를 다시 실행합니다. 이전 커밋에 연결된 AI Review PASS는 새 커밋에 적용되지 않습니다.
6. PR에 충돌이 있으면 최신 대상 브랜치를 기준으로 리베이스하고 충돌을 해결합니다.

PR이 다음 조건을 모두 충족하면 Committer에게 병합을 요청합니다.

- PR 설명이 완전하고 변경 범위가 명확합니다.
- 모든 리뷰 지적 사항이 해결되었습니다.
- 최신 PR head에 대한 모든 필수 검사가 통과했습니다.
- 대상 브랜치와의 미해결 충돌이 없습니다.
- Reviewer가 코드를 승인했습니다.
- 변경된 경로의 Code Owner가 요구 사항에 따라 코드를 승인했습니다.

Committer는 리뷰, CI 결과, 프로젝트 병합 정책을 바탕으로 최종 병합 여부를 결정합니다.

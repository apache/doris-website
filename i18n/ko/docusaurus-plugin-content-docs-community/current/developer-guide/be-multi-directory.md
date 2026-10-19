---
title: BE 다중 디렉터리 공유 캐시
language: ko
description: 여러 디렉터리(worktree)에서 Apache Doris BE를 개발할 때 ccache 공유 캐시를 설정하고 디버깅하는 방법을 안내합니다.
keywords:
    - Apache Doris BE
    - ccache
    - git worktree
    - 다중 디렉터리 개발
    - CCACHE_BASEDIR
    - ffile-prefix-map
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

# BE 다중 디렉터리 공유 캐시 {#be-multi-directory-shared-cache}

AI 에이전트와 함께 Doris BE를 개발할 때는 보통 `git worktree` 등의 방식을 사용해 서로 다른 디렉터리에서 여러 개발 브랜치를 병렬로 관리합니다. ccache 캐시는 전체 경로의 영향을 받으므로 cpp 파일의 내용이 거의 같더라도 디렉터리가 다르면 캐시가 적중하지 않습니다. 그 결과 worktree 디렉터리에서 처음부터 다시 컴파일해야 하므로 개발 속도가 크게 느려집니다. 이 문제를 해결하기 위해 별도의 최적화가 적용되어 있습니다. 아래 설명에 따라 설정하세요.

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Multi-worktree parallel development / Build acceleration -->

## 1. 디렉터리 요구 사항 {#1-directory-requirements}

Doris는 이미 환경 설정 파일에서 `CCACHE_BASEDIR`와 `-ffile-prefix-map`을 설정하여 대부분의 컴파일 옵션에 사용되는 경로를 동일한 경로로 매핑하므로 캐시가 적중할 수 있습니다. **전제 조건은 모든 Doris 개발 디렉터리의 상위 디렉터리가 같아야 한다는 것입니다.** 즉, 모든 Doris 개발 디렉터리는 다음과 같이 형제 관계여야 합니다:

```bash
xxx/doris_main
xxx/doris1
xxx/doris2
```

## 2. 환경 설정 {#2-environment-configuration}

<!-- Knowledge type: Operation steps -->

### 2.1 UBSAN_IGNORELIST의 하드코딩된 경로 설정 {#21-configure-the-ubsan_ignorelist-hardcoded-path}

위의 자동 설정 외에도 하드코딩된 경로는 수동으로 조정해야 합니다. worktree 디렉터리의 `custom_env.sh`에 메인 저장소의 UBSAN IGNORELIST 경로를 하드코딩하세요:

```bash
export UBSAN_IGNORELIST=${DORIS_MAIN_REPO}/conf/ubsan_ignorelist.txt
```

여기서 `DORIS_MAIN_REPO`는 메인 저장소의 경로입니다. 다음 방식을 권장합니다:

1. 메인 저장소의 `custom_env.sh`에 이 값을 직접 설정합니다.
2. `hooks/setup_worktree.sh`와 `AGENTS.md`를 연계하여 AI 워크플로가 이 값을 모든 worktree 디렉터리에 자동으로 전파하도록 합니다.

### 2.2 ccache 캐시 용량 늘리기 {#22-increase-the-ccache-cache-capacity}

캐시 공간을 충분히 확보하려면 ccache 캐시 용량을 수동으로 늘리세요:

```bash
ccache --set-config=max_size=50G
```

| 설정 | 권장 값 | 설명                                                  |
| ------------- | ----------------- | ------------------------------------------------------------ |
| `max_size`    | `50G`             | 여러 worktree를 병렬로 사용할 때 권장하는 최소 용량 |

## 3. 디버깅 방법 {#3-debugging-methods}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Troubleshooting / Cache miss diagnosis -->

### 3.1 캐시 통계 확인 {#31-view-cache-statistics}

`ccache -s`를 실행하여 캐시 통계를 확인하고 캐시가 작동하는지 점검하세요. 특히 `cache hit rate` 필드를 확인하세요. 이 값이 너무 낮으면 캐시가 제대로 적중하지 않는 것입니다. 정확한 결과를 얻으려면 매번 통계를 확인하기 전에 `ccache -z`를 실행하여 통계를 초기화하세요.

| 명령어      | 용도                                  |
| ------------ | ---------------------------------------- |
| `ccache -s`  | 캐시 적중 통계 확인                |
| `ccache -z`  | 통계 초기화(캐시는 삭제하지 않음)  |
| `ccache -C`  | 캐시 삭제(주의해서 사용)       |

### 3.2 ccache 디버그 로깅 활성화 {#32-enable-ccache-debug-logging}

캐시 적중에 문제가 있음을 확인했다면 ccache 디버그 로깅을 활성화하세요:

```bash
export CCACHE_LOGFILE=/path/to/xxx
export CCACHE_DEBUG=1
```

| 환경 변수 | 효과                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| `CCACHE_LOGFILE`     | 각 캐시 적중 또는 미스의 원인을 확인하는 데 사용하는 상세 로그 출력 파일        |
| `CCACHE_DEBUG=1`     | 각 컴파일 단위의 입력을 기록하는 `*.ccache-input-text` 파일 생성 |

### 3.3 캐시 미스 원인 파악 {#33-identify-the-cause-of-a-miss}

`CCACHE_DEBUG=1`을 활성화하면 각 컴파일 단위마다 `*.ccache-input-text` 파일이 생성됩니다. 이 파일에는 소스 파일 경로, 컴파일 옵션 등 해당 컴파일 단위의 입력이 기록됩니다.

이론적으로 서로 다른 두 디렉터리에 있는 동일한 파일에서 **ccache 캐시가 적중하려면 각 디렉터리의 `ccache-input-text` 파일 내용이 완전히 같아야 합니다.** 캐시 미스가 발생한 파일은 양쪽의 `ccache-input-text` 파일을 비교하여 원인을 파악하세요.

## 4. 자주 묻는 질문(FAQ) {#4-frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->

### Q1: 캐시 적중률이 항상 0임 {#q1-the-cache-hit-rate-is-always-0}

모든 worktree가 동일한 상위 디렉터리 아래에 있는지 확인하세요. 그렇지 않으면 `CCACHE_BASEDIR`와 `-ffile-prefix-map`이 경로를 동일한 값으로 매핑할 수 없어 캐시가 전혀 적중하지 않습니다.

### Q2: 캐시 항목이 자주 제거됨 {#q2-cache-space-is-evicted-frequently}

2.2절의 설명에 따라 `max_size`를 늘리세요. 여러 worktree를 병렬로 사용하는 경우 최소 50 GB를 권장합니다.

### Q3: UBSAN_IGNORELIST 경로에서 오류가 발생함 {#q3-the-ubsan_ignorelist-path-reports-an-error}

worktree 디렉터리의 `custom_env.sh`가 메인 저장소의 ignorelist 파일을 가리키도록 설정되어 있지 않습니다. 설정 방법은 2.1절을 참조하세요.

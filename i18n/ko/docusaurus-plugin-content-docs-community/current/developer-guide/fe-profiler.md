---
title: FE Profiler로 플레임 그래프 생성
language: ko
description: async-profiler를 사용해 Apache Doris FE의 플레임 그래프를 생성하고 성능 병목을 찾습니다.
keywords:
    - Apache Doris
    - FE Profiler
    - async-profiler
    - 플레임 그래프
    - profile_fe.sh
    - FE 성능 병목
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

# FE Profiler로 플레임 그래프 생성 {#generate-flame-graphs-with-fe-profiler}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Troubleshooting -->

## 소개 {#introduction}

Apache Doris 2.1.4 이상 버전에서는 FE 배포 디렉터리 `${DORIS_FE_HOME}/bin`에 `profile_fe.sh` 스크립트가 포함되어 있습니다. 이 스크립트는 [async-profiler](https://github.com/async-profiler/async-profiler)를 사용해 FE의 플레임 그래프를 생성하므로 FE 성능 병목을 찾을 수 있습니다.

### 지원 운영 체제 {#system-support}

| 운영 체제 | 지원 여부 |
|--------|-----------|
| Linux | 지원 |
| macOS | 지원 |
| Windows | 아직 지원하지 않음 |

## 사용 방법 {#usage-steps}

### 1. profile_fe.sh 실행 {#1-run-profile_fesh}

```shell
# Profile the FE for 10 seconds by default and generate a flame graph
${DORIS_FE_HOME}/bin/profile_fe.sh

# Profile the FE for 30 seconds and generate a flame graph
PROFILE_SECONDS=30 ${DORIS_FE_HOME}/bin/profile_fe.sh
```

| 환경 변수 | 의미 | 기본값 |
|----------------------|---------|---------|
| `PROFILE_SECONDS` | async-profiler 샘플링 시간(초) | `10` |

### 2. 워크로드 실행 {#2-trigger-the-workload}

명령을 실행하면 async-profiler가 지정된 시간 동안 샘플링을 계속합니다. 이 시간 동안 대상 쿼리를 FE에 반복해서 전송하여 async-profiler가 대상 코드 경로의 스택 프레임을 수집할 수 있도록 하세요.

### 3. 플레임 그래프 확인 {#3-view-the-flame-graph}

샘플링이 끝나면 스크립트가 `${DORIS_FE_HOME}/log` 디렉터리에 HTML 플레임 그래프 파일을 생성합니다. FE 성능 병목은 보통 "평탄한 구간"(높이가 낮고 폭이 넓은 형태)으로 나타납니다. 해당 스택 프레임에 대응하는 코드를 최적화하세요.

플레임 그래프 예시:

![](/images/fe-profiler.png)

## 이전 FE 버전에서 async-profiler 사용 {#using-async-profiler-on-older-fe-versions}

Doris 2.1.4 이전 버전에서는 다음 두 파일을 수동으로 다운로드하세요.

1. [ap-loader-all-3.0-8.jar](https://repo1.maven.org/maven2/me/bechberger/ap-loader-all/3.0-8/ap-loader-all-3.0-8.jar)를 `${DORIS_FE_HOME}/lib` 디렉터리에 다운로드합니다.
2. [profile_fe.sh](https://raw.githubusercontent.com/apache/doris/master/bin/profile_fe.sh)를 `${DORIS_FE_HOME}/bin` 디렉터리에 다운로드합니다.
3. `profile_fe.sh`를 실행해 플레임 그래프를 생성합니다.

## 자주 묻는 질문 {#faq}

**질문: 샘플링 중 대상 함수의 스택 프레임이 플레임 그래프에 나타나지 않습니다.**

대개 샘플링 중에 해당 쿼리 경로가 실행되지 않았기 때문입니다. `profile_fe.sh`가 실행되는 동안 대상 SQL을 직접 또는 스크립트로 반복 실행하거나, `PROFILE_SECONDS=30`으로 샘플링 시간을 늘리세요.

**질문: FE Profiler와 [Arthas](./arthas) 중 무엇을 선택해야 하나요?**

- `profile_fe.sh`: 샘플링 시간이 고정된 스크립트 기반 방식으로, 일회성 플레임 그래프를 빠르게 생성하는 데 적합합니다.
- Arthas: `trace`, `watch` 등을 통해 실행 중 동작을 더 세밀하게 관찰할 수 있는 대화형 터미널로, 심층 분석에 적합합니다.

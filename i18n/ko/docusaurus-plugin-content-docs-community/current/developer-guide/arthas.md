---
title: Arthas를 활용한 FE 성능 분석
language: ko
description: "Arthas로 Apache Doris FE 성능을 온라인에서 분석합니다. flame graph, 함수 추적, 런타임 관찰 기능을 활용할 수 있습니다."
keywords:
    - Apache Doris
    - Arthas
    - FE 성능 분석
    - flame graph
    - 함수 추적
    - JVM
    - DorisFE
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

# Arthas를 활용한 FE 성능 분석 {#analyzing-fe-performance-with-arthas}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Troubleshooting -->

## 소개 {#introduction}

Apache Doris 3.1.0 이상 버전에서는 FE 배포 디렉터리 `${DORIS_FE_HOME}/arthas`에 Arthas 도구(버전 4.0.5)가 포함되어 있습니다. Arthas를 사용하면 온라인으로 flame graph를 생성하고, 함수 호출 경로를 추적하고, 함수 실행 시간을 측정하고, 함수 입력과 반환값을 관찰할 수 있어 FE의 런타임 문제를 더 쉽게 파악할 수 있습니다.

명령어에 대한 자세한 설명은 [Arthas 공식 문서](https://arthas.aliyun.com/en/doc/)를 참고하세요.

### 지원 시스템 {#system-support}

| 시스템 | 지원 여부 |
|------|---------|
| Linux | 지원 |
| macOS | 지원 |
| Windows | 아직 지원하지 않음 |

### 이전 FE 버전에서 수동 설치 {#manual-installation-for-older-fe-versions}

Doris 3.1.0 이전 버전에서는 Arthas를 수동으로 다운로드하세요.

```bash
wget https://github.com/alibaba/arthas/releases/download/arthas-all-4.0.5/arthas-bin.zip
unzip arthas-bin.zip -o ${DORIS_FE_HOME}/arthas
```

## flame graph 생성 {#generating-a-flame-graph}

1. `${DORIS_FE_HOME}/arthas/as.sh` 스크립트를 실행하고 프로세스 목록에서 `DorisFE` 프로세스의 번호를 선택하세요.

    ```shell
    bash ./as.sh
    Arthas script version: 4.0.5
    Found existing java process, please choose one and input the serial number of the process, eg : 1. Then hit ENTER.
    * [1]: 75123 com.intellij.idea.Main
      [2]: 77285 org.apache.doris.DorisFE
      [3]: 76901 DorisBE
      [4]: 6776 org.jetbrains.jps.cmdline.Launcher
      [5]: 76265 DorisBE
      [6]: 80527 org.jetbrains.jps.cmdline.Launcher
    2
    ```

2. Arthas 명령줄에서 프로파일링을 시작하세요.

    ```shell
    [arthas@77285]$ profiler start
    Profiling started
    ```

3. 프로파일링을 중지하고 HTML 형식의 flame graph를 생성하세요.

    ```shell
    [arthas@77285]$ profiler stop --format html
    OK
    profiler output file: <DORIS_FE_HOME>/arthas-output/20250627-115104.html
    ```

    출력 파일은 `${DORIS_FE_HOME}/arthas-output/`에 저장됩니다. 브라우저에서 파일을 열어 실행 비중이 높은 함수를 분석하세요.

## 자주 사용하는 Arthas 명령어 요약 {#common-arthas-command-cheatsheet}

| 명령어 | 용도 |
|------|------|
| `profiler start` / `profiler stop --format html` | CPU flame graph 수집 |
| `trace <class> <method>` | 함수 호출 경로와 실행 시간 추적 |
| `watch <class> <method>` | 함수 입력과 반환값 관찰 |
| `thread` | JVM 스레드 상태 확인 |
| `dashboard` | 전반적인 JVM 런타임 지표를 실시간으로 확인 |

## 자주 묻는 질문 {#faq}

**질문: `DorisFE` 프로세스가 `as.sh` 실행 시 표시되지 않습니다.**

FE 프로세스가 시작되었는지, `as.sh`가 FE와 동일한 머신에서 실행되는지 확인하세요. 프로세스 목록에는 현재 사용자가 볼 수 있는 JVM이 표시됩니다.

**질문: 생성된 flame graph가 비어 있거나 샘플이 너무 적습니다.**

프로파일링 중 FE에서 쿼리나 요청이 지속적으로 처리되고 있는지 확인하세요. `profiler start`와 `profiler stop` 사이의 간격을 늘릴 수 있습니다.

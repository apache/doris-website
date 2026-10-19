---
title: Pipeline Tracing
language: ko
description: Apache Doris의 Pipeline Tracing은 스케줄링 추적 데이터를 기록하고 Perfetto로 시각화합니다.
keywords:
    - Apache Doris
    - Pipeline Tracing
    - Pipeline 실행 엔진
    - Perfetto
    - 스케줄링 분석
    - BE 성능 튜닝
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

# Pipeline Tracing {#pipeline-tracing}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Scheduling analysis -->

## 소개 {#introduction}

Apache Doris의 Pipeline 실행 엔진에서는 각 Instance의 실행 계획 트리가 여러 Pipeline Task로 분할되며, 사용자 정의 Pipeline 스케줄러가 이를 스케줄링하고 실행합니다. Pipeline Task 수가 많아지면 이러한 Task가 스레드와 CPU 코어에 걸쳐 어떻게 스케줄링되는지가 실행 성능에 영향을 미치는 중요한 요인이 됩니다.

Pipeline Tracing 도구는 특정 쿼리 또는 기간의 스케줄링 과정을 관찰하여 성능을 분석하고 병목 지점을 쉽게 찾을 수 있도록 합니다.

## 사용 절차 {#usage-steps}

### 1. 스케줄링 데이터 기록 {#1-record-scheduling-data}

HTTP 인터페이스를 사용하여 BE의 스케줄링 과정 기록 여부와 기록 방식을 제어합니다. 이 설정은 대상 BE에만 적용됩니다.

| 목적 | HTTP 명령 |
|---------|----------|
| Pipeline Tracing 기록 비활성화 | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=disable` |
| 쿼리마다 기록 하나 생성 | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=perquery` |
| 일정 기간의 추적 기록 생성 | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=periodic` |
| 기록 주기 설정(초 단위) | `curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?dump_interval=60` |

명령 예시:

```shell
# Disable Pipeline Tracing recording
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=disable

# Produce one record per query
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=perquery

# Produce a tracing record over a fixed period
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?type=periodic

# Set the period length to 60 seconds
curl -X POST http://{be_host}:{http_port}/api/pipeline/tracing?dump_interval=60
```

### 2. 데이터 형식 변환 {#2-convert-the-data-format}

기록된 데이터는 해당 BE의 `log/tracing` 디렉터리에 저장됩니다. `doris/tools/pipeline-tracing/`의 변환 스크립트를 사용하여 원시 데이터를 Perfetto에서 불러올 수 있는 JSON 형식으로 변환합니다.

```shell
cd doris/tools/pipeline-tracing/
python3 origin-to-show.py -s <SOURCE_FILE> -d <DEST>.json
```

매개변수:

| 매개변수 | 의미 |
|------|------|
| `-s <SOURCE_FILE>` | BE가 생성한 원시 추적 파일의 경로 |
| `-d <DEST>.json` | 시각화에 사용할 출력 JSON 파일의 경로 |

자세한 사용법은 해당 디렉터리의 `README.md` 파일을 참조하세요.

### 3. Perfetto에서 시각화 {#3-visualize-in-perfetto}

1. [Perfetto](https://ui.perfetto.dev/)를 엽니다.
2. `Open trace file`을 클릭하고 이전 단계에서 생성한 JSON 파일을 선택합니다.
3. 스케줄링 결과를 확인합니다.

    ![](/images/tracing1.png)

    Perfetto에서는 동일한 Task가 CPU 코어에 걸쳐 어떻게 스케줄링되는지도 확인할 수 있습니다.

    ![](/images/tracing2.png)

## 자주 묻는 질문 {#faq}

**질문: 추적 파일은 어디에 있나요?**

해당 BE의 `log/tracing` 디렉터리에 있습니다. 파일 이름에는 타임스탬프와 쿼리 정보가 포함됩니다.

**질문: Pipeline Tracing을 활성화하면 성능에 영향을 주나요?**

어느 정도 오버헤드가 발생합니다. 스케줄링을 조사하는 동안에만 활성화하고, 조사가 완료되면 `type=disable`로 비활성화하세요.

---
title: Apache Doris 버전 규칙 및 버전 선택
language: ko
description: Apache Doris 버전 번호 규칙(major/minor/patch), 업그레이드 및 다운그레이드 호환성 정책, CPU 바이너리 선택 안내.
keywords:
    - Apache Doris 버전 번호
    - Doris 버전 규칙
    - Doris 업그레이드 및 다운그레이드
    - Latest Stable 버전
    - x64 avx2 ARM64
    - Doris 바이너리 선택
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

# Apache Doris 버전 규칙 및 버전 선택 {#apache-doris-version-rules-and-version-selection}

<!-- Knowledge type: Rule specification -->
<!-- Applicable scenarios: Version selection / Upgrade and downgrade evaluation / Pre-deployment check -->

이 문서에서는 Apache Doris 버전 번호의 의미, 업그레이드 및 다운그레이드 호환성 정책, CPU 아키텍처에 맞는 바이너리를 선택하는 방법을 설명합니다.

## 버전 번호 규칙 {#version-number-rules}

Apache Doris는 세 부분으로 구성된 버전 번호 `X.Y.Z`를 사용합니다. 각 부분의 의미, 일반적인 변경 사항, 릴리스 주기는 다음과 같습니다.

| 위치 | 이름 | 의미 | 릴리스 주기 |
| --- | --- | --- | --- |
| X | Major | 주요 기능 릴리스 또는 아키텍처 업그레이드 | 매년 |
| Y | Minor | 중요 기능, 성능 최적화 또는 필요한 메타데이터/데이터 형식 변경 | 분기마다 |
| Z | Patch | 버그 수정, 성능 최적화 및 소규모 기능 업데이트 | 일반적으로 2-4주마다 |

## 버전 업그레이드 및 다운그레이드 {#version-upgrade-and-downgrade}

<!-- Knowledge type: Rule specification -->

| 업그레이드 유형 | 순방향 호환성(이전 버전 → 새 버전) | 역방향 호환성(새 버전 → 이전 버전) | 권장 사항 |
| --- | --- | --- | --- |
| Major (X) | 호환 | 보장하지 않음 | 업그레이드 전에 데이터 백업 |
| Minor (Y) | 호환 | 보장하지 않음 | 업그레이드 전에 데이터 백업 |
| Patch (Z) | 호환 | 호환 | 데이터 호환성 문제 없이 바로 업그레이드 및 다운그레이드 가능 |

Major (X) 및 Minor (Y) 버전 업그레이드에는 메타데이터나 데이터 형식 변경이 포함될 수 있습니다. Apache Doris는 이러한 변경의 순방향 호환성, 즉 이전 버전에서 새 버전으로 업그레이드할 수 있음을 보장하지만, 역방향 호환성, 즉 새 버전에서 이전 버전으로 다운그레이드할 수 있음은 보장하지 않습니다. Patch (Z) 버전은 업그레이드와 다운그레이드를 모두 지원합니다.

## 버전 선택 방법 {#how-to-select-a-version}

Apache Doris 팀은 주로 최신 두 버전 브랜치를 유지 관리하며, 각 브랜치에 **Latest**와 **Stable**이라는 레이블을 붙입니다.

| 레이블 | 포함 내용 | 적합한 사용 환경 |
| --- | --- | --- |
| Latest | 최신 기능, 최적화 및 버그 수정 | 새 기능 체험, POC 검증, 성능 테스트, 사전 운영 환경 |
| Stable | 지속적인 버그 수정, 더 높은 안정성 | 운영 환경 |

## CPU 모델 및 바이너리 버전 {#cpu-models-and-binary-versions}

<!-- Knowledge type: Hardware requirement -->
<!-- Applicable scenarios: Pre-deployment check / Environment acceptance -->

Apache Doris는 CPU 아키텍처와 명령어 집합에 따라 세 가지 바이너리를 제공합니다.

| 바이너리 이름 | 지원 CPU | 설명 |
| --- | --- | --- |
| x64(avx2) | AVX2 명령어 집합을 지원하는 x86_64 CPU | 기본 권장 바이너리로, 최상의 성능 제공 |
| x64(no avx2) | AVX2 명령어 집합을 지원하지 않는 x86_64 CPU | 구형 x86_64 프로세서용 |
| ARM64 | ARM 기반 CPU | ARM 서버용(Kunpeng, Graviton 등) |

:::tip 팁
다음 명령을 실행하여 CPU가 AVX2 명령어 집합을 지원하는지 확인하세요.

```bash
cat /proc/cpuinfo | grep avx2
```

출력 결과가 있으면 CPU가 AVX2를 지원하므로 `x64(avx2)` 바이너리를 선택할 수 있습니다.
:::

## 자주 묻는 질문 {#faq}

**질문: 2.0.x에서 1.2.x로 바로 다운그레이드할 수 있나요?**

아니요. Major 또는 Minor 버전 간 다운그레이드는 메타데이터와 데이터 형식의 호환성을 보장하지 않습니다. Major 또는 Minor 버전을 업그레이드하기 전에는 반드시 전체 백업을 수행하세요.

**질문: Patch 버전은 중간 버전을 건너뛰고 업그레이드할 수 있나요(예: 2.0.1에서 2.0.5로 바로 업그레이드)?**

네. Patch 버전은 순방향 및 역방향 호환성을 유지하므로 업그레이드하거나 다운그레이드할 때 중간 버전을 건너뛸 수 있습니다.

**질문: Latest와 Stable 중 어떤 버전을 선택해야 하나요?**

운영 환경에서는 Stable을 우선 선택하세요. 평가하거나 새 기능을 체험하려면 Latest를 선택하세요.

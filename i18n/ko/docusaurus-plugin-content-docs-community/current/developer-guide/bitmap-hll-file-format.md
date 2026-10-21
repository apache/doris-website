---
title: Bitmap 및 HLL 바이너리 형식 명세
language: ko
description: Apache Doris Bitmap 및 HLL 바이너리 형식 명세, Flag의 의미, C++ / Java 직렬화 예제.
keywords:
    - Apache Doris Bitmap 형식
    - HLL 직렬화
    - Roaring Bitmap
    - Roaring64Map
    - Roaring64NavigableMap
    - HyperLogLog
    - BitmapValue 직렬화
    - 바이너리 형식 명세
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

<!-- Knowledge type: Data format specification -->
<!-- Applicable scenarios: Kernel development / data parsing / cross-language serialization -->

# Bitmap 및 HLL 데이터 형식 {#bitmap-and-hll-data-format}

이 문서는 Apache Doris Bitmap / HLL 바이너리 형식을 이해하거나 파싱해야 하는 개발자를 대상으로 합니다. 각 유형의 바이트 배치와 Flag의 의미를 설명하고, C++ 및 Java의 직렬화 / 역직렬화 진입점을 안내합니다.

## 목차 {#contents}

- [Bitmap 형식](#bitmap-format): 다섯 가지 Flag 유형과 바이트 배치
- [HLL 형식](#hll-format): 네 가지 Flag 유형과 바이트 배치
- [직렬화 / 역직렬화 진입점](#serialization--deserialization-entry-points): C++ 및 Java의 구현 위치

---

## Bitmap 형식 {#bitmap-format}

### 개요 {#overview}

Doris는 Roaring Bitmap을 사용해 Bitmap을 저장합니다. BE 측에서는 CRoaring을 사용합니다.

- `Roaring` 직렬화 형식은 C++, Java, Go 등 여러 언어 간에 호환됩니다.
- C++ `Roaring64Map`의 직렬화 결과는 Java의 `Roaring64NavigableMap`과 **호환되지 않습니다**.

Doris Bitmap에는 총 다섯 가지 유형이 있습니다. 각 유형은 한 바이트의 `flag`로 식별합니다. 전체 바이트 배치는 다음과 같습니다.

```text
 | flag     | data .....|
 <--1Byte--><--n bytes-->
```

### Flag 값 {#flag-values}

| Flag | 이름 | 데이터 배치 | 유형 설명 |
|------|------|-------------|------------------|
| 0 | `EMPTY` | 데이터가 없습니다. 전체 직렬화 결과는 한 바이트입니다. | 빈 Bitmap |
| 1 | `SINGLE32` | 4바이트로 표현한 32비트 부호 없는 정수 하나입니다. | Bitmap에 32비트 정수 값 하나가 포함됩니다. |
| 2 | `BITMAP32` | `roaring::Roaring`의 직렬화 결과입니다. | 32비트 Bitmap입니다. Java 측에서는 `org.roaringbitmap.RoaringBitmap`에, C++ 측에서는 `roaring::Roaring`에 해당합니다. 이 유형을 사용해 직접 역직렬화할 수 있습니다. |
| 3 | `SINGLE64` | 8바이트로 표현한 64비트 부호 없는 정수 하나입니다. | Bitmap에 64비트 정수 값 하나가 포함됩니다. |
| 4 | `BITMAP64` | Bitmap 크기를 나타내는 1~8바이트 가변 길이 인코딩 `uint64` 뒤에 `[4-byte high bits + 32-bit Roaring Bitmap serialization data]` 항목이 반복됩니다. | 64비트 Bitmap입니다. Java 측에서는 `org.roaringbitmap.RoaringBitmap`에, C++ 측에서는 Doris의 `Roaring64Map`에 해당합니다. 데이터 구조는 Roaring 라이브러리와 같지만 직렬화 / 역직렬화 메서드는 다릅니다. |
| 5 | `SET` | 값의 개수를 나타내는 1바이트 뒤에 모든 값이 이어집니다(값당 8바이트). | Bitmap의 값 개수가 1~32개이면 실제 저장 유형은 hashset입니다. |

---

## HLL 형식 {#hll-format}

### 개요 {#overview-1}

HLL 직렬화 형식은 Doris 내부에 구현되어 있습니다. Bitmap과 마찬가지로 HLL의 바이너리 배치는 한 바이트의 `flag` 뒤에 여러 바이트의 데이터가 이어지는 형태입니다.

```text
 | flag     | data .....|
 <--1Byte--><--n bytes-->
```

### Flag 값 {#flag-values-1}

| Flag | 이름 | 데이터 배치 | 유형 설명 |
|------|------|-------------|------------------|
| 0 | `HLL_DATA_EMPTY` | 데이터가 없습니다. 전체 직렬화 결과는 한 바이트입니다. | 빈 HLL |
| 1 | `HLL_DATA_EXPLICIT` | 명시적 데이터 블록의 개수를 나타내는 1바이트 뒤에 데이터 블록이 이어집니다. 각 데이터 블록은 길이를 나타내는 8바이트와 데이터로 구성됩니다. | 모든 고유 값을 명시적으로 저장합니다. |
| 2 | `HLL_DATA_SPARSE` | 레지스터 개수를 나타내는 4바이트 뒤에 레지스터가 이어집니다. 각 레지스터는 2바이트 인덱스와 1바이트 값으로 구성됩니다. | 희소 저장 방식입니다. 영이 아닌 값만 저장합니다. |
| 3 | `HLL_DATA_FULL` | `16 * 1024`바이트의 값 데이터로 이루어진 연속 블록입니다. | 모든 `16 * 1024`개 레지스터에 값이 있음을 나타냅니다. |

---

## 직렬화 / 역직렬화 진입점 {#serialization--deserialization-entry-points}

<!-- Knowledge type: Code index -->

| 유형 | 언어 | 파일 | 메서드 |
|------|----------|------|--------|
| Bitmap | C++ | `be/src/util/bitmap_value.h` | `BitmapValue::write()` / `BitmapValue::deserialize()` |
| Bitmap | Java | `fe/fe-common/src/main/java/org/apache/doris/common/io/BitmapValue.java` | `serialize()` / `deserialize()` |
| HLL | C++ | `be/src/olap/hll.h` | `serialize()` / `deserialize()` |
| HLL | Java | `fe/fe-common/src/main/java/org/apache/doris/common/io/hll.java` | `serialize()` / `deserialize()` |

---

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

**질문: C++ 측에서 기록한 64비트 Bitmap을 Java의 `Roaring64NavigableMap`으로 역직렬화할 수 없는 이유는 무엇인가요?**

답변: Doris C++ `Roaring64Map`의 직렬화 형식은 Java의 `Roaring64NavigableMap`과 호환되지 않습니다. 언어 간에 64비트 Bitmap을 주고받을 때는 Doris Bitmap 자체에서 정의한 형식(`BITMAP64`, Flag = 4)을 사용하고, 위의 바이트 배치에 따라 파싱하세요.

**질문: Bitmap 바이너리 데이터가 32비트인지 64비트인지 어떻게 구분하나요?**

답변: 첫 번째 바이트를 Flag로 읽으면 됩니다. `0/1/2`는 32비트 표현(비어 있음 / 단일 값 / Roaring32)을, `3/4`는 64비트 표현을, `5`는 hashset(64비트 값)을 나타냅니다.

**질문: HLL 레지스터의 총개수가 `16 * 1024`인 이유는 무엇인가요?**

답변: Doris HLL 구현에서는 레지스터 개수를 16384개로 고정합니다(정밀도 `2^14`). `HLL_DATA_FULL`은 모든 레지스터에 값이 있는 조밀한 표현입니다.

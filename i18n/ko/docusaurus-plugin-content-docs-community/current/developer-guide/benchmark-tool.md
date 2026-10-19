---
title: BE 스토리지 계층 벤치마크 도구
language: ko
description: segment 읽기/쓰기 및 성능 테스트를 위한 Apache Doris BE 스토리지 계층 벤치마크 도구입니다.
keywords:
    - Apache Doris
    - BE storage layer
    - Benchmark
    - Segment
    - Page
    - Dictionary encoding
    - google benchmark
    - CustomBenchmark
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

# BE 스토리지 계층 벤치마크 도구 {#be-storage-layer-benchmark-tool}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Storage layer benchmarking -->

## 목적 {#purpose}

`benchmark_tool`은 Apache Doris BE 스토리지 계층(예: `segment`, `page`)의 성능을 테스트합니다. 입력 데이터로 지정된 객체를 구성하고 [google benchmark](https://github.com/google/benchmark)를 통해 성능 테스트를 실행합니다.

## 컴파일 {#compilation}

1. Doris 자체를 컴파일할 수 있는 환경이 준비되어 있는지 확인합니다. [컴파일 및 배포](/community/source-install/compilation-with-docker)를 참고하세요.
2. Doris 저장소에서 `run-be-ut.sh`를 실행합니다.
3. 컴파일된 실행 파일은 `./be/ut_build_ASAN/test/tools/benchmark_tool`에 생성됩니다.

## 사용법 {#usage}

### 공통 매개변수 {#common-parameters}

| 매개변수 | 의미 | 기본값 |
|------|------|--------|
| `--operation` | 테스트 유형입니다. 자세한 내용은 아래 시나리오를 참고하세요. | 없음(필수) |
| `--column_type` | segment 테이블 스키마의 컬럼 타입입니다. `int`, `char`, `varchar`, `string`을 지원합니다. | `int,varchar` |
| `--rows_number` | 데이터 행 수입니다. | `10000` |
| `--iterations` | 테스트 반복 횟수입니다. `0`으로 설정하면 benchmark가 자동으로 결정합니다. | `10` |
| `--input_file` | 파일에서 데이터를 가져올 때 사용할 데이터 파일 경로입니다. | 없음 |

타입별 길이 규칙:

| 타입 | 길이 |
|------|------|
| `char` | `8` |
| `varchar` | 최댓값 |
| `string` | 최댓값 |

무작위 데이터 세트 생성 규칙:

| 타입 | 규칙 |
|------|------|
| `int` | `[1, 1000000]` 범위에서 무작위로 생성 |
| `char` | 길이는 `[1, 8]` 범위에서 무작위로 정하며, 문자 집합은 영문 대문자와 소문자 |
| `varchar` | 길이는 `[1, 128]` 범위에서 무작위로 정하며, 문자 집합은 영문 대문자와 소문자 |
| `string` | 길이는 `[1, 100000]` 범위에서 무작위로 정하며, 문자 집합은 영문 대문자와 소문자 |

### 테스트 시나리오 한눈에 보기 {#test-scenarios-at-a-glance}

| 시나리오 | 명령어 |
|------|------|
| 무작위 데이터 세트를 사용한 Segment 읽기 테스트 | `./benchmark_tool --operation=SegmentScan --column_type=int,varchar --rows_number=10000 --iterations=0` |
| 무작위 데이터 세트를 사용한 Segment 쓰기 테스트 | `./benchmark_tool --operation=SegmentWrite` |
| 파일에서 가져온 데이터 세트를 사용한 Segment 읽기 테스트 | `./benchmark_tool --operation=SegmentScanByFile --input_file=./sample.dat` |
| 파일에서 가져온 데이터 세트를 사용한 Segment 쓰기 테스트 | `./benchmark_tool --operation=SegmentWriteByFile --input_file=./sample.dat` |
| 무작위 데이터 세트를 사용한 Page 사전 인코딩 테스트 | `./benchmark_tool --operation=BinaryDictPageEncode --rows_number=10000 --iterations=0` |
| 무작위 데이터 세트를 사용한 Page 사전 디코딩 테스트 | `./benchmark_tool --operation=BinaryDictPageDecode` |

### 무작위로 생성한 데이터 세트를 사용한 Segment 읽기 테스트 {#segment-read-test-with-a-randomly-generated-dataset}

먼저 데이터 세트를 사용해 `segment` 파일을 쓴 다음, 전체 `segment`를 스캔하는 데 걸리는 시간을 측정합니다.

```bash
./benchmark_tool --operation=SegmentScan --column_type=int,varchar --rows_number=10000 --iterations=0
```

### 무작위로 생성한 데이터 세트를 사용한 Segment 쓰기 테스트 {#segment-write-test-with-a-randomly-generated-dataset}

데이터 세트를 `segment`에 추가하고 디스크에 쓰는 과정에 걸리는 시간을 측정합니다.

```bash
./benchmark_tool --operation=SegmentWrite
```

### 파일에서 가져온 데이터 세트를 사용한 Segment 읽기 테스트 {#segment-read-test-with-a-dataset-imported-from-a-file}

```bash
./benchmark_tool --operation=SegmentScanByFile --input_file=./sample.dat
```

`input_file`은 가져올 데이터 세트 파일입니다. 파일의 첫 번째 줄은 테이블 스키마를 정의하며, 이후 각 줄은 데이터 한 행에 해당하고 컬럼은 `,`로 구분합니다.

```text
int,char,varchar
123,hello,world
321,good,bye
```

지원되는 타입은 마찬가지로 `int`, `char`, `varchar`, `string`입니다. `char` 타입 데이터의 길이는 `8`을 초과할 수 없습니다.

### 파일에서 가져온 데이터 세트를 사용한 Segment 쓰기 테스트 {#segment-write-test-with-a-dataset-imported-from-a-file}

```bash
./benchmark_tool --operation=SegmentWriteByFile --input_file=./sample.dat
```

### 무작위로 생성한 데이터 세트를 사용한 Page 사전 인코딩 테스트 {#page-dictionary-encoding-test-with-a-randomly-generated-dataset}

```bash
./benchmark_tool --operation=BinaryDictPageEncode --rows_number=10000 --iterations=0
```

`varchar` 값을 길이가 `[1, 8]` 범위가 되도록 무작위로 생성하고 인코딩 시간을 측정합니다.

### 무작위로 생성한 데이터 세트를 사용한 Page 사전 디코딩 테스트 {#page-dictionary-decoding-test-with-a-randomly-generated-dataset}

```bash
./benchmark_tool --operation=BinaryDictPageDecode
```

`varchar` 값을 길이가 `[1, 8]` 범위가 되도록 무작위로 생성한 뒤 인코딩하고, 디코딩 시간을 측정합니다.

## 사용자 정의 테스트 {#custom-tests}

직접 작성한 함수로 성능 테스트를 실행할 수 있습니다. 구현은 `/be/test/tools/benchmark_tool.cpp`에 있습니다.

### 1. 테스트 함수 작성 {#1-write-the-test-function}

```cpp
void custom_run_plus() {
    int p = 100000;
    int q = 0;
    while (p--) {
        q++;
        if (UNLIKELY(q == 1024)) q = 0;
    }
}
void custom_run_mod() {
    int p = 100000;
    int q = 0;
    while (p--) {
        q++;
        if (q %= 1024) q = 0;
    }
}
```

### 2. CustomBenchmark 등록 {#2-register-custombenchmark}

```cpp
benchmarks.emplace_back(
                    new doris::CustomBenchmark("custom_run_plus", 0,
                        custom_init, custom_run_plus));
benchmarks.emplace_back(
                    new doris::CustomBenchmark("custom_run_mod", 0,
                        custom_init, custom_run_mod));
```

여기서 `init`은 각 테스트 회차의 초기화 단계이며, 소요 시간 측정에는 포함되지 않습니다. 객체를 초기화해야 한다면 `CustomBenchmark`의 파생 클래스를 통해 구현하세요.

### 3. 실행 출력 예시 {#3-example-run-output}

```text
2021-08-30T10:29:35+08:00
Running ./benchmark_tool
Run on (96 X 3100.75 MHz CPU s)
CPU Caches:
  L1 Data 32 KiB (x48)
  L1 Instruction 32 KiB (x48)
  L2 Unified 1024 KiB (x48)
  L3 Unified 33792 KiB (x2)
Load Average: 0.55, 0.53, 0.39
----------------------------------------------------------
Benchmark                Time             CPU   Iterations
----------------------------------------------------------
custom_run_plus      0.812 ms        0.812 ms          861
custom_run_mod        1.30 ms         1.30 ms          539
```

## 자주 묻는 질문 {#faq}

**질문: `benchmark_tool` 실행 파일을 찾을 수 없나요?**

먼저 `run-be-ut.sh`를 실행해 BE 단위 테스트를 완전히 빌드하세요. 실행 파일은 `./be/ut_build_ASAN/test/tools/benchmark_tool`에 생성됩니다.

**질문: 사용자 정의 테스트 결과가 예상과 다른가요?**

`custom_init`에 테스트 대상 함수의 로직이 포함되어 있지 않은지 확인하고, 옵티마이저가 제거하지 않도록 각 `custom_run_*` 함수의 본문이 충분히 큰지 확인하세요.

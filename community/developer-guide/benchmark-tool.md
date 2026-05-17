---
title: BE Storage Layer Benchmark Tool
language: en
description: Apache Doris BE storage layer benchmark tool for segment read/write and performance testing.
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

# BE Storage Layer Benchmark Tool

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Storage layer benchmarking -->

## Purpose

`benchmark_tool` tests the performance of the Apache Doris BE storage layer (such as `segment` and `page`). It constructs the specified objects from input data and runs performance tests through [google benchmark](https://github.com/google/benchmark).

## Compilation

1. Make sure you have an environment that can compile Doris itself. See [Compilation and Deployment](/community/source-install/compilation-with-docker) for reference.
2. Run `run-be-ut.sh` in the Doris repository.
3. The compiled executable is located at `./be/ut_build_ASAN/test/tools/benchmark_tool`.

## Usage

### Common Parameters

| Parameter | Meaning | Default |
|------|------|--------|
| `--operation` | Test type. See the scenarios below for details. | None (required) |
| `--column_type` | Column types of the segment table schema. Supports `int`, `char`, `varchar`, `string`. | `int,varchar` |
| `--rows_number` | Number of data rows. | `10000` |
| `--iterations` | Number of test iterations. `0` lets benchmark choose automatically. | `10` |
| `--input_file` | Path of the data file when importing data from a file. | None |

Type length conventions:

| Type | Length |
|------|------|
| `char` | `8` |
| `varchar` | Maximum value |
| `string` | Maximum value |

Random dataset generation rules:

| Type | Rule |
|------|------|
| `int` | Random within `[1, 1000000]` |
| `char` | Random length within `[1, 8]`, character set is uppercase and lowercase English letters |
| `varchar` | Random length within `[1, 128]`, character set is uppercase and lowercase English letters |
| `string` | Random length within `[1, 100000]`, character set is uppercase and lowercase English letters |

### Test Scenarios at a Glance

| Scenario | Command |
|------|------|
| Segment read test with a random dataset | `./benchmark_tool --operation=SegmentScan --column_type=int,varchar --rows_number=10000 --iterations=0` |
| Segment write test with a random dataset | `./benchmark_tool --operation=SegmentWrite` |
| Segment read test with a dataset imported from a file | `./benchmark_tool --operation=SegmentScanByFile --input_file=./sample.dat` |
| Segment write test with a dataset imported from a file | `./benchmark_tool --operation=SegmentWriteByFile --input_file=./sample.dat` |
| Page dictionary encoding test with a random dataset | `./benchmark_tool --operation=BinaryDictPageEncode --rows_number=10000 --iterations=0` |
| Page dictionary decoding test with a random dataset | `./benchmark_tool --operation=BinaryDictPageDecode` |

### Segment Read Test with a Randomly Generated Dataset

First writes a `segment` file using the dataset, then measures the time to scan the entire `segment`.

```bash
./benchmark_tool --operation=SegmentScan --column_type=int,varchar --rows_number=10000 --iterations=0
```

### Segment Write Test with a Randomly Generated Dataset

Measures the time of the process that adds the dataset to a `segment` and writes it to disk.

```bash
./benchmark_tool --operation=SegmentWrite
```

### Segment Read Test with a Dataset Imported from a File

```bash
./benchmark_tool --operation=SegmentScanByFile --input_file=./sample.dat
```

`input_file` is the imported dataset file. The first line of the file defines the table schema, and each subsequent line corresponds to one row of data with columns separated by `,`:

```text
int,char,varchar
123,hello,world
321,good,bye
```

The supported types are also `int`, `char`, `varchar`, and `string`. Note that data of the `char` type cannot exceed a length of `8`.

### Segment Write Test with a Dataset Imported from a File

```bash
./benchmark_tool --operation=SegmentWriteByFile --input_file=./sample.dat
```

### Page Dictionary Encoding Test with a Randomly Generated Dataset

```bash
./benchmark_tool --operation=BinaryDictPageEncode --rows_number=10000 --iterations=0
```

Randomly generates `varchar` values with lengths in `[1, 8]` and measures the encoding time.

### Page Dictionary Decoding Test with a Randomly Generated Dataset

```bash
./benchmark_tool --operation=BinaryDictPageDecode
```

Randomly generates `varchar` values with lengths in `[1, 8]`, encodes them, and measures the decoding time.

## Custom Tests

You can run performance tests with your own functions. The implementation is in `/be/test/tools/benchmark_tool.cpp`.

### 1. Write the Test Function

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

### 2. Register CustomBenchmark

```cpp
benchmarks.emplace_back(
                    new doris::CustomBenchmark("custom_run_plus", 0,
                        custom_init, custom_run_plus));
benchmarks.emplace_back(
                    new doris::CustomBenchmark("custom_run_mod", 0,
                        custom_init, custom_run_mod));
```

Here, `init` is the initialization step for each round of testing (not counted in the elapsed time). If you need to initialize objects, implement it through a derived class of `CustomBenchmark`.

### 3. Example Run Output

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

## FAQ

**Q: Cannot find the `benchmark_tool` executable?**

Run `run-be-ut.sh` first to fully build the BE unit tests. The executable is output to `./be/ut_build_ASAN/test/tools/benchmark_tool`.

**Q: The custom test result does not match expectations?**

Make sure `custom_init` does not contain the logic of the function under test, and that the body of each `custom_run_*` function is large enough to avoid being eliminated by the optimizer.

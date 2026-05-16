---
title: BE 存储层 Benchmark 工具
language: zh-CN
description: Apache Doris BE 存储层 Benchmark 工具：Segment 读写与性能测试。
keywords:
    - Apache Doris
    - BE 存储层
    - Benchmark
    - Segment
    - Page
    - 字典编码
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

# BE 存储层 Benchmark 工具

<!-- 知识类型: 工具使用 -->
<!-- 适用场景: 性能调优 / 存储层基准测试 -->

## 用途

`benchmark_tool` 用于测试 Apache Doris BE 存储层（如 `segment`、`page`）的性能。它根据输入数据构造指定对象，并通过 [google benchmark](https://github.com/google/benchmark) 进行性能测试。

## 编译

1. 确保已具备编译 Doris 本体的环境，可参考 [编译与部署](/docs/install/source-install/compilation-general)。
2. 执行 Doris 仓库下的 `run-be-ut.sh`。
3. 编译输出的可执行文件位于 `./be/ut_build_ASAN/test/tools/benchmark_tool`。

## 使用

### 通用参数

| 参数 | 含义 | 默认值 |
|------|------|--------|
| `--operation` | 测试类型，详见下方各场景 | 无（必填） |
| `--column_type` | Segment 表结构列类型，支持 `int`、`char`、`varchar`、`string` | `int,varchar` |
| `--rows_number` | 数据行数 | `10000` |
| `--iterations` | 测试迭代次数；`0` 表示由 benchmark 自动选择 | `10` |
| `--input_file` | 从文件导入数据时的数据文件路径 | 无 |

类型长度约定：

| 类型 | 长度 |
|------|------|
| `char` | `8` |
| `varchar` | 最大值 |
| `string` | 最大值 |

随机数据集生成规则：

| 类型 | 规则 |
|------|------|
| `int` | 在 `[1, 1000000]` 内随机 |
| `char` | 长度在 `[1, 8]` 内随机，字符集为大小写英文字母 |
| `varchar` | 长度在 `[1, 128]` 内随机，字符集为大小写英文字母 |
| `string` | 长度在 `[1, 100000]` 内随机，字符集为大小写英文字母 |

### 测试场景一览

| 场景 | 命令 |
|------|------|
| 随机数据集进行 Segment 读取测试 | `./benchmark_tool --operation=SegmentScan --column_type=int,varchar --rows_number=10000 --iterations=0` |
| 随机数据集进行 Segment 写入测试 | `./benchmark_tool --operation=SegmentWrite` |
| 文件导入数据集进行 Segment 读取测试 | `./benchmark_tool --operation=SegmentScanByFile --input_file=./sample.dat` |
| 文件导入数据集进行 Segment 写入测试 | `./benchmark_tool --operation=SegmentWriteByFile --input_file=./sample.dat` |
| 随机数据集进行 page 字典编码测试 | `./benchmark_tool --operation=BinaryDictPageEncode --rows_number=10000 --iterations=0` |
| 随机数据集进行 page 字典解码测试 | `./benchmark_tool --operation=BinaryDictPageDecode` |

### 使用随机生成的数据集进行 Segment 读取测试

会先利用数据集写入一个 `segment` 文件，然后统计扫描整个 `segment` 的耗时。

```bash
./benchmark_tool --operation=SegmentScan --column_type=int,varchar --rows_number=10000 --iterations=0
```

### 使用随机生成的数据集进行 Segment 写入测试

对将数据集添加进 `segment` 并写入磁盘的流程进行耗时统计。

```bash
./benchmark_tool --operation=SegmentWrite
```

### 使用从文件导入的数据集进行 Segment 读取测试

```bash
./benchmark_tool --operation=SegmentScanByFile --input_file=./sample.dat
```

`input_file` 为导入的数据集文件。文件第一行为表结构定义，之后每行对应一行数据，列之间用 `,` 分隔：

```text
int,char,varchar
123,hello,world
321,good,bye
```

类型同样支持 `int`、`char`、`varchar`、`string`；注意 `char` 类型数据长度不能超过 `8`。

### 使用从文件导入的数据集进行 Segment 写入测试

```bash
./benchmark_tool --operation=SegmentWriteByFile --input_file=./sample.dat
```

### 使用随机生成的数据集进行 page 字典编码测试

```bash
./benchmark_tool --operation=BinaryDictPageEncode --rows_number=10000 --iterations=0
```

会随机生成长度在 `[1, 8]` 之间的 `varchar`，对编码过程进行耗时统计。

### 使用随机生成的数据集进行 page 字典解码测试

```bash
./benchmark_tool --operation=BinaryDictPageDecode
```

会随机生成长度在 `[1, 8]` 之间的 `varchar` 并编码，对解码过程进行耗时统计。

## Custom 测试

支持用户使用自己编写的函数进行性能测试，具体实现位于 `/be/test/tools/benchmark_tool.cpp`。

### 1. 编写测试函数

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

### 2. 注册 CustomBenchmark

```cpp
benchmarks.emplace_back(
                    new doris::CustomBenchmark("custom_run_plus", 0,
                        custom_init, custom_run_plus));
benchmarks.emplace_back(
                    new doris::CustomBenchmark("custom_run_mod", 0,
                        custom_init, custom_run_mod));
```

其中 `init` 为每轮测试的初始化步骤（不计入耗时）；如需初始化对象，可通过 `CustomBenchmark` 的派生类来实现。

### 3. 运行结果示例

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

**Q：未找到 `benchmark_tool` 可执行文件？**

请先执行 `run-be-ut.sh` 完整构建 BE 单元测试，可执行文件会输出到 `./be/ut_build_ASAN/test/tools/benchmark_tool`。

**Q：自定义测试结果与预期不符？**

请确认 `custom_init` 中不包含被测函数的逻辑，且 `custom_run_*` 函数的执行体足够大以避免被优化器消除。

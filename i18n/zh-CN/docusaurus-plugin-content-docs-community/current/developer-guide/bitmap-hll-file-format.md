---
title: Bitmap 与 HLL 数据二进制格式规范
language: zh-CN
description: Apache Doris Bitmap 与 HLL 数据二进制格式规范、Flag 含义与 C++ / Java 序列化示例。
keywords:
    - Apache Doris Bitmap 格式
    - HLL 序列化
    - Roaring Bitmap
    - Roaring64Map
    - Roaring64NavigableMap
    - HyperLogLog
    - BitmapValue 序列化
    - 二进制格式规范
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

<!-- 知识类型: 数据格式规范 -->
<!-- 适用场景: 内核开发 / 数据解析 / 跨语言序列化 -->

# Bitmap 与 HLL 数据格式

本文面向需要了解或解析 Apache Doris Bitmap / HLL 二进制格式的开发者，给出每种类型的字节布局、Flag 含义，以及 C++ 与 Java 端的序列化 / 反序列化入口。

## 内容导览

- [Bitmap 格式](#bitmap-格式)：5 种 Flag 类型及对应字节布局
- [HLL 格式](#hll-格式)：4 种 Flag 类型及对应字节布局
- [序列化 / 反序列化入口](#序列化--反序列化入口)：C++ 与 Java 的实现位置

---

## Bitmap 格式

### 总体说明

Doris 中的 Bitmap 采用 Roaring Bitmap 存储，BE 端使用 CRoaring。

- `Roaring` 的序列化格式在 C++ / Java / Go 等语言中兼容。
- C++ `Roaring64Map` 的序列化结果与 Java 中 `Roaring64NavigableMap` **不兼容**。

Doris Bitmap 共有 5 种类型，每种用一个字节的 `flag` 表示。整体字节布局如下：

```text
 | flag     | data .....|
 <--1Byte--><--n bytes-->
```

### Flag 取值表

| Flag | 名称 | 数据布局 | 类型说明 |
|------|------|----------|----------|
| 0 | `EMPTY` | 无 data，整个序列化结果只有 1 个字节 | 空 Bitmap |
| 1 | `SINGLE32` | 4 字节，表示一个 32 位无符号整数 | Bitmap 中只有一个 32 位整数值 |
| 2 | `BITMAP32` | `roaring::Roaring` 的序列化结果 | 32 位 Bitmap，Java 端对应 `org.roaringbitmap.RoaringBitmap`，C++ 端对应 `roaring::Roaring`，可直接用上述类型反序列化 |
| 3 | `SINGLE64` | 8 字节，表示一个 64 位无符号整数 | Bitmap 中只有一个 64 位整数值 |
| 4 | `BITMAP64` | 1~8 字节变长编码的 `uint64` 表示 Bitmap 内 size，随后多次重复 `[4 字节高位 + 32 位 Roaring Bitmap 序列化数据]` | 64 位 Bitmap，Java 端对应 `org.roaringbitmap.RoaringBitmap`，C++ 端对应 Doris 中的 `Roaring64Map`。数据结构与 Roaring 库一致，但序列化 / 反序列化方法有所不同 |
| 5 | `SET` | 1 字节表示值的个数，后跟所有值（每个值 8 字节） | 当 Bitmap 的值个数在 1 ~ 32 之间时，实际存储类型为 hashset |

---

## HLL 格式

### 总体说明

HLL 格式的序列化在 Doris 中自行实现。与 Bitmap 类似，HLL 的二进制布局为 1 字节 `flag` 加多字节数据：

```text
 | flag     | data .....|
 <--1Byte--><--n bytes-->
```

### Flag 取值表

| Flag | 名称 | 数据布局 | 类型说明 |
|------|------|----------|----------|
| 0 | `HLL_DATA_EMPTY` | 无 data，整个序列化结果只有 1 个字节 | 空 HLL |
| 1 | `HLL_DATA_EXPLICIT` | 1 字节 explicit 数据块个数，后跟多个数据块；每个数据块由 8 字节长度和数据组成 | 显式存储所有不同值 |
| 2 | `HLL_DATA_SPARSE` | 4 字节表示 register 个数，后跟多个 register；每个 register 由 2 字节 index 和 1 字节值组成 | 稀疏存储，只存非 0 值 |
| 3 | `HLL_DATA_FULL` | 连续 `16 * 1024` 字节的值数据 | 表示所有 `16 * 1024` 个 register 都有值 |

---

## 序列化 / 反序列化入口

<!-- 知识类型: 代码索引 -->

| 类型 | 语言 | 文件 | 方法 |
|------|------|------|------|
| Bitmap | C++ | `be/src/util/bitmap_value.h` | `BitmapValue::write()` / `BitmapValue::deserialize()` |
| Bitmap | Java | `fe/fe-common/src/main/java/org/apache/doris/common/io/BitmapValue.java` | `serialize()` / `deserialize()` |
| HLL | C++ | `be/src/olap/hll.h` | `serialize()` / `deserialize()` |
| HLL | Java | `fe/fe-common/src/main/java/org/apache/doris/common/io/hll.java` | `serialize()` / `deserialize()` |

---

## FAQ

<!-- 知识类型: 故障排查 -->

**Q: 为什么 C++ 端写出的 64 位 Bitmap 无法用 Java 的 `Roaring64NavigableMap` 反序列化？**

A: Doris C++ 端的 `Roaring64Map` 序列化格式与 Java 的 `Roaring64NavigableMap` 不兼容。跨语言交换 64 位 Bitmap 时，请使用 Doris Bitmap 自身定义的格式（`BITMAP64`，Flag = 4），并按上文字节布局解析。

**Q: 怎么判断一段 Bitmap 二进制是 32 位还是 64 位？**

A: 读取第一个字节作为 Flag：`0/1/2` 为 32 位语义（空 / 单值 / Roaring32），`3/4` 为 64 位语义，`5` 为 hashset（值为 64 位）。

**Q: HLL register 总数为什么是 `16 * 1024`？**

A: Doris 的 HLL 实现固定使用 16384 个 register（精度 `2^14`），`HLL_DATA_FULL` 即所有 register 都有值的密集表示。


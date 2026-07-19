---
title: Bitmap and HLL Binary Format Specification
language: en
description: Apache Doris Bitmap and HLL binary format specification, Flag meanings, and C++ / Java serialization examples.
keywords:
    - Apache Doris Bitmap format
    - HLL serialization
    - Roaring Bitmap
    - Roaring64Map
    - Roaring64NavigableMap
    - HyperLogLog
    - BitmapValue serialization
    - binary format specification
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

# Bitmap and HLL Data Format

This document targets developers who need to understand or parse the Apache Doris Bitmap / HLL binary format. It describes the byte layout and Flag meanings for each type, and points to the C++ and Java serialization / deserialization entry points.

## Contents

- [Bitmap Format](#bitmap-format): five Flag types and their byte layouts
- [HLL Format](#hll-format): four Flag types and their byte layouts
- [Serialization / Deserialization Entry Points](#serialization--deserialization-entry-points): implementation locations in C++ and Java

---

## Bitmap Format

### Overview

Doris stores Bitmaps with Roaring Bitmap. The BE side uses CRoaring.

- The `Roaring` serialization format is compatible across C++, Java, Go, and other languages.
- The C++ `Roaring64Map` serialization result is **not** compatible with Java's `Roaring64NavigableMap`.

Doris Bitmap has five types in total. Each type is identified by a one-byte `flag`. The overall byte layout is:

```text
 | flag     | data .....|
 <--1Byte--><--n bytes-->
```

### Flag Values

| Flag | Name | Data Layout | Type Description |
|------|------|-------------|------------------|
| 0 | `EMPTY` | No data. The whole serialization result is a single byte. | Empty Bitmap |
| 1 | `SINGLE32` | 4 bytes representing one 32-bit unsigned integer. | The Bitmap contains a single 32-bit integer value. |
| 2 | `BITMAP32` | The serialization result of `roaring::Roaring`. | 32-bit Bitmap. On the Java side this corresponds to `org.roaringbitmap.RoaringBitmap`, and on the C++ side to `roaring::Roaring`. You can deserialize it directly with these types. |
| 3 | `SINGLE64` | 8 bytes representing one 64-bit unsigned integer. | The Bitmap contains a single 64-bit integer value. |
| 4 | `BITMAP64` | A 1-to-8-byte variable-length-encoded `uint64` representing the size of the Bitmap, followed by repeated `[4-byte high bits + 32-bit Roaring Bitmap serialization data]` entries. | 64-bit Bitmap. On the Java side this corresponds to `org.roaringbitmap.RoaringBitmap`, and on the C++ side to Doris's `Roaring64Map`. The data structure matches the Roaring library, but the serialization / deserialization methods differ. |
| 5 | `SET` | 1 byte representing the number of values, followed by all values (8 bytes per value). | When the number of values in the Bitmap is between 1 and 32, the actual storage type is a hashset. |

---

## HLL Format

### Overview

The HLL serialization format is implemented within Doris. Similar to Bitmap, the binary layout of HLL is a one-byte `flag` followed by multi-byte data:

```text
 | flag     | data .....|
 <--1Byte--><--n bytes-->
```

### Flag Values

| Flag | Name | Data Layout | Type Description |
|------|------|-------------|------------------|
| 0 | `HLL_DATA_EMPTY` | No data. The whole serialization result is a single byte. | Empty HLL |
| 1 | `HLL_DATA_EXPLICIT` | 1 byte for the number of explicit data blocks, followed by the data blocks. Each data block consists of an 8-byte length and the data. | Explicitly stores all distinct values. |
| 2 | `HLL_DATA_SPARSE` | 4 bytes for the number of registers, followed by the registers. Each register consists of a 2-byte index and a 1-byte value. | Sparse storage. Only non-zero values are stored. |
| 3 | `HLL_DATA_FULL` | A contiguous block of `16 * 1024` bytes of value data. | Indicates that all `16 * 1024` registers have values. |

---

## Serialization / Deserialization Entry Points

<!-- Knowledge type: Code index -->

| Type | Language | File | Method |
|------|----------|------|--------|
| Bitmap | C++ | `be/src/util/bitmap_value.h` | `BitmapValue::write()` / `BitmapValue::deserialize()` |
| Bitmap | Java | `fe/fe-common/src/main/java/org/apache/doris/common/io/BitmapValue.java` | `serialize()` / `deserialize()` |
| HLL | C++ | `be/src/olap/hll.h` | `serialize()` / `deserialize()` |
| HLL | Java | `fe/fe-common/src/main/java/org/apache/doris/common/io/hll.java` | `serialize()` / `deserialize()` |

---

## FAQ

<!-- Knowledge type: Troubleshooting -->

**Q: Why can a 64-bit Bitmap written by the C++ side not be deserialized with Java's `Roaring64NavigableMap`?**

A: The serialization format of Doris C++ `Roaring64Map` is not compatible with Java's `Roaring64NavigableMap`. When exchanging 64-bit Bitmaps across languages, use the format defined by Doris Bitmap itself (`BITMAP64`, Flag = 4) and parse it according to the byte layout above.

**Q: How do you tell whether a piece of Bitmap binary is 32-bit or 64-bit?**

A: Read the first byte as the Flag: `0/1/2` indicates 32-bit semantics (empty / single value / Roaring32), `3/4` indicates 64-bit semantics, and `5` indicates a hashset (with 64-bit values).

**Q: Why is the total number of HLL registers `16 * 1024`?**

A: The Doris HLL implementation uses a fixed 16384 registers (precision `2^14`). `HLL_DATA_FULL` is the dense representation where all registers have values.

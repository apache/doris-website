---
title: Bitmap と HLL のバイナリ形式仕様
language: ja
description: Apache Doris の Bitmap と HLL のバイナリ形式仕様、フラグの意味、C++ / Java でのシリアライズ例。
keywords:
    - Apache Doris Bitmap 形式
    - HLL シリアライズ
    - Roaring Bitmap
    - Roaring64Map
    - Roaring64NavigableMap
    - HyperLogLog
    - BitmapValue シリアライズ
    - バイナリ形式仕様
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

# Bitmap と HLL のデータ形式 {#bitmap-and-hll-data-format}

このドキュメントは、Apache Doris の Bitmap / HLL のバイナリ形式を理解または解析する必要がある開発者を対象としています。各形式のバイト配置とフラグの意味を説明し、C++ と Java のシリアライズ / デシリアライズ処理の入口を示します。

## 目次 {#contents}

- [Bitmap 形式](#bitmap-format): 五種類のフラグとそれぞれのバイト配置
- [HLL 形式](#hll-format): 四種類のフラグとそれぞれのバイト配置
- [シリアライズ / デシリアライズ処理の入口](#serialization--deserialization-entry-points): C++ と Java の実装箇所

---

## Bitmap 形式 {#bitmap-format}

### 概要 {#overview}

Doris は Bitmap の保存に Roaring Bitmap を使用します。BE 側では CRoaring を使用します。

- `Roaring` のシリアライズ形式は、C++、Java、Go などの言語間で互換性があります。
- C++ の `Roaring64Map` によるシリアライズ結果は、Java の `Roaring64NavigableMap` と**互換性がありません**。

Doris の Bitmap には合計五種類の型があります。各型は一バイトの `flag` で識別されます。全体のバイト配置は次のとおりです。

```text
 | flag     | data .....|
 <--1Byte--><--n bytes-->
```

### フラグの値 {#flag-values}

| フラグ | 名前 | データの配置 | 型の説明 |
|------|------|-------------|------------------|
| 0 | `EMPTY` | データなし。シリアライズ結果全体で単一のバイトです。 | 空の Bitmap |
| 1 | `SINGLE32` | 単一の 32 ビット符号なし整数を表す 4 バイト。 | Bitmap に単一の 32 ビット整数値が含まれます。 |
| 2 | `BITMAP32` | `roaring::Roaring` のシリアライズ結果。 | 32 ビット Bitmap。Java 側では `org.roaringbitmap.RoaringBitmap`、C++ 側では `roaring::Roaring` に対応します。これらの型で直接デシリアライズできます。 |
| 3 | `SINGLE64` | 単一の 64 ビット符号なし整数を表す 8 バイト。 | Bitmap に単一の 64 ビット整数値が含まれます。 |
| 4 | `BITMAP64` | Bitmap のサイズを表す 1～8 バイトの可変長エンコードされた `uint64` に、`[4-byte high bits + 32-bit Roaring Bitmap serialization data]` のエントリが繰り返し続きます。 | 64 ビット Bitmap。Java 側では `org.roaringbitmap.RoaringBitmap`、C++ 側では Doris の `Roaring64Map` に対応します。データ構造は Roaring ライブラリと一致しますが、シリアライズ / デシリアライズのメソッドは異なります。 |
| 5 | `SET` | 値の個数を表す 1 バイトに、すべての値（各値 8 バイト）が続きます。 | Bitmap 内の値の個数が 1～32 個の場合、実際の保存型はハッシュセットです。 |

---

## HLL 形式 {#hll-format}

### 概要 {#overview-1}

HLL のシリアライズ形式は Doris 内で実装されています。Bitmap と同様に、HLL のバイナリ配置は一バイトの `flag` に複数バイトのデータが続く形式です。

```text
 | flag     | data .....|
 <--1Byte--><--n bytes-->
```

### フラグの値 {#flag-values-1}

| フラグ | 名前 | データの配置 | 型の説明 |
|------|------|-------------|------------------|
| 0 | `HLL_DATA_EMPTY` | データなし。シリアライズ結果全体で単一のバイトです。 | 空の HLL |
| 1 | `HLL_DATA_EXPLICIT` | 明示的なデータブロックの個数を表す 1 バイトに、データブロックが続きます。各データブロックは 8 バイトの長さとデータで構成されます。 | 重複しない値をすべて明示的に保存します。 |
| 2 | `HLL_DATA_SPARSE` | レジスタの個数を表す 4 バイトに、レジスタが続きます。各レジスタは 2 バイトのインデックスと 1 バイトの値で構成されます。 | 疎な保存形式です。ゼロ以外の値だけを保存します。 |
| 3 | `HLL_DATA_FULL` | 値のデータを格納した連続する `16 * 1024` バイトのブロック。 | `16 * 1024` 個のレジスタすべてに値があることを示します。 |

---

## シリアライズ / デシリアライズ処理の入口 {#serialization--deserialization-entry-points}

<!-- Knowledge type: Code index -->

| 型 | 言語 | ファイル | メソッド |
|------|----------|------|--------|
| Bitmap | C++ | `be/src/util/bitmap_value.h` | `BitmapValue::write()` / `BitmapValue::deserialize()` |
| Bitmap | Java | `fe/fe-common/src/main/java/org/apache/doris/common/io/BitmapValue.java` | `serialize()` / `deserialize()` |
| HLL | C++ | `be/src/olap/hll.h` | `serialize()` / `deserialize()` |
| HLL | Java | `fe/fe-common/src/main/java/org/apache/doris/common/io/hll.java` | `serialize()` / `deserialize()` |

---

## よくある質問 {#faq}

<!-- Knowledge type: Troubleshooting -->

**Q: C++ 側で書き込んだ 64 ビット Bitmap を Java の `Roaring64NavigableMap` でデシリアライズできないのはなぜですか？**

A: Doris の C++ `Roaring64Map` のシリアライズ形式は、Java の `Roaring64NavigableMap` と互換性がないためです。言語間で 64 ビット Bitmap をやり取りする場合は、Doris Bitmap 自体が定義する形式（`BITMAP64`、フラグ = 4）を使用し、上記のバイト配置に従って解析してください。

**Q: Bitmap のバイナリデータが 32 ビットか 64 ビットかを見分けるにはどうすればよいですか？**

A: 先頭のバイトをフラグとして読み取ります。`0/1/2` は 32 ビットの意味（空 / 単一値 / Roaring32）、`3/4` は 64 ビットの意味、`5` はハッシュセット（64 ビット値を格納）を示します。

**Q: HLL のレジスタの総数が `16 * 1024` なのはなぜですか？**

A: Doris の HLL 実装では、固定数の 16384 個のレジスタ（精度 `2^14`）を使用します。`HLL_DATA_FULL` は、すべてのレジスタに値がある密な表現です。

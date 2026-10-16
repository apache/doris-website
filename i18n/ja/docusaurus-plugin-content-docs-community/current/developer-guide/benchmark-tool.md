---
title: BE ストレージレイヤーのベンチマークツール
language: ja
description: セグメントの読み書きと性能テストに使用する Apache Doris BE ストレージレイヤーのベンチマークツール。
keywords:
    - Apache Doris
    - BE ストレージレイヤー
    - ベンチマーク
    - セグメント
    - ページ
    - 辞書エンコーディング
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

# BE ストレージレイヤーのベンチマークツール

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Storage layer benchmarking -->

## 目的

`benchmark_tool` は、Apache Doris の BE ストレージレイヤー（`segment` や `page` など）の性能をテストします。入力データから指定されたオブジェクトを構築し、[google benchmark](https://github.com/google/benchmark) を使用して性能テストを実行します。

## コンパイル

1. Doris 本体をコンパイルできる環境を用意します。参考として[コンパイルとデプロイ](/community/source-install/compilation-with-docker)を参照してください。
2. Doris リポジトリで `run-be-ut.sh` を実行します。
3. コンパイルされた実行ファイルは `./be/ut_build_ASAN/test/tools/benchmark_tool` にあります。

## 使用方法

### 共通パラメータ

| パラメータ | 説明 | デフォルト |
|------|------|--------|
| `--operation` | テストの種類。詳細は以下のシナリオを参照してください。 | なし（必須） |
| `--column_type` | セグメントのテーブルスキーマにおける列の型。`int`、`char`、`varchar`、`string` をサポートします。 | `int,varchar` |
| `--rows_number` | データの行数。 | `10000` |
| `--iterations` | テストの反復回数。`0` を指定すると benchmark が自動的に決定します。 | `10` |
| `--input_file` | ファイルからデータを読み込む場合のデータファイルのパス。 | なし |

型ごとの長さに関する規則：

| 型 | 長さ |
|------|------|
| `char` | `8` |
| `varchar` | 最大値 |
| `string` | 最大値 |

ランダムなデータセットの生成規則：

| 型 | 規則 |
|------|------|
| `int` | `[1, 1000000]` の範囲でランダムに生成 |
| `char` | 長さは `[1, 8]` の範囲でランダム、文字には英字の大文字と小文字を使用 |
| `varchar` | 長さは `[1, 128]` の範囲でランダム、文字には英字の大文字と小文字を使用 |
| `string` | 長さは `[1, 100000]` の範囲でランダム、文字には英字の大文字と小文字を使用 |

### テストシナリオ一覧

| シナリオ | コマンド |
|------|------|
| ランダムなデータセットを使用したセグメント読み取りテスト | `./benchmark_tool --operation=SegmentScan --column_type=int,varchar --rows_number=10000 --iterations=0` |
| ランダムなデータセットを使用したセグメント書き込みテスト | `./benchmark_tool --operation=SegmentWrite` |
| ファイルから読み込んだデータセットを使用したセグメント読み取りテスト | `./benchmark_tool --operation=SegmentScanByFile --input_file=./sample.dat` |
| ファイルから読み込んだデータセットを使用したセグメント書き込みテスト | `./benchmark_tool --operation=SegmentWriteByFile --input_file=./sample.dat` |
| ランダムなデータセットを使用したページの辞書エンコーディングテスト | `./benchmark_tool --operation=BinaryDictPageEncode --rows_number=10000 --iterations=0` |
| ランダムなデータセットを使用したページの辞書デコーディングテスト | `./benchmark_tool --operation=BinaryDictPageDecode` |

### ランダムに生成したデータセットを使用したセグメント読み取りテスト

まずデータセットを使用して `segment` ファイルを書き込み、次に `segment` 全体のスキャンにかかる時間を測定します。

```bash
./benchmark_tool --operation=SegmentScan --column_type=int,varchar --rows_number=10000 --iterations=0
```

### ランダムに生成したデータセットを使用したセグメント書き込みテスト

データセットを `segment` に追加してディスクに書き込む処理にかかる時間を測定します。

```bash
./benchmark_tool --operation=SegmentWrite
```

### ファイルから読み込んだデータセットを使用したセグメント読み取りテスト

```bash
./benchmark_tool --operation=SegmentScanByFile --input_file=./sample.dat
```

`input_file` は読み込むデータセットのファイルです。ファイルの先頭行でテーブルスキーマを定義し、以降はデータを一行ずつ記述します。列は `,` で区切ります。

```text
int,char,varchar
123,hello,world
321,good,bye
```

サポートされる型は、ここでも `int`、`char`、`varchar`、`string` です。`char` 型のデータは長さ `8` を超えることができません。

### ファイルから読み込んだデータセットを使用したセグメント書き込みテスト

```bash
./benchmark_tool --operation=SegmentWriteByFile --input_file=./sample.dat
```

### ランダムに生成したデータセットを使用したページの辞書エンコーディングテスト

```bash
./benchmark_tool --operation=BinaryDictPageEncode --rows_number=10000 --iterations=0
```

`varchar` 値を長さ `[1, 8]` の範囲でランダムに生成し、エンコーディングにかかる時間を測定します。

### ランダムに生成したデータセットを使用したページの辞書デコーディングテスト

```bash
./benchmark_tool --operation=BinaryDictPageDecode
```

`varchar` 値を長さ `[1, 8]` の範囲でランダムに生成してエンコードし、デコーディングにかかる時間を測定します。

## カスタムテスト

独自の関数を使って性能テストを実行できます。実装は `/be/test/tools/benchmark_tool.cpp` にあります。

### 1. テスト関数を作成する

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

### 2. CustomBenchmark を登録する

```cpp
benchmarks.emplace_back(
                    new doris::CustomBenchmark("custom_run_plus", 0,
                        custom_init, custom_run_plus));
benchmarks.emplace_back(
                    new doris::CustomBenchmark("custom_run_mod", 0,
                        custom_init, custom_run_mod));
```

ここで、`init` は各テスト回の初期化処理です（経過時間には含まれません）。オブジェクトを初期化する必要がある場合は、`CustomBenchmark` の派生クラスで実装します。

### 3. 実行結果の例

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

**Q: `benchmark_tool` の実行ファイルが見つからない場合は？**

まず `run-be-ut.sh` を実行して、BE の単体テストをすべてビルドしてください。実行ファイルは `./be/ut_build_ASAN/test/tools/benchmark_tool` に出力されます。

**Q: カスタムテストの結果が予想と一致しない場合は？**

`custom_init` にテスト対象関数のロジックが含まれていないこと、また各 `custom_run_*` 関数の本体がオプティマイザによって除去されない程度に十分な処理を行っていることを確認してください。

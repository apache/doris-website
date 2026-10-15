---
title: FE/BE デバッグツール
language: ja
description: "Apache Doris の FE/BE で使用する一般的なデバッグツール。JVM の監視、メモリ分析、BE のデバッグ方法を説明します。"
keywords:
    - Apache Doris
    - FE デバッグ
    - BE デバッグ
    - jmap
    - jstat
    - jstack
    - Jemalloc
    - TCMalloc
    - Heap Profile
    - ASAN
    - LSAN
    - perf
    - FlameGraph
    - メモリリーク
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

# FE/BE デバッグツール

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

Apache Doris の開発や運用では、FE と BE のプロセスをデバッグする機会があります。このドキュメントでは、JVM の監視、ヒープメモリの分析、CPU フレームグラフ、メモリアクセスの正当性の確認に使う一般的なツールをまとめます。

> 注: このドキュメントで参照する BE のバイナリファイル名 `doris_be` は、以前のバージョンでは `palo_be` でした。

## ツール早見表

| 分類 | ツール | 対象プロセス | 主な用途 |
|------|------|---------|---------|
| JVM の監視 | `jmap` / `jstat` / `jstack` | FE | オブジェクトのメモリ使用量、GC、スレッドスタックの確認 |
| ヒーププロファイル | Jemalloc + `jeprof` | BE | ヒープメモリの割り当てをリアルタイムまたは定期的に記録 |
| ヒーププロファイル | TCMalloc + `pprof` | BE（旧バージョン） | ヒープメモリのサンプリングとリモート分析 |
| メモリアクセスの正当性 | LSAN / ASAN | BE | メモリリークや不正なアクセスの検出 |
| CPU 分析 | `pprof` / `perf + FlameGraph` | BE | 関数単位の CPU 使用量とフレームグラフの確認 |

## FE のデバッグ

FE は Java プロセスなので、JDK が提供するコマンドでデバッグできます。

### 1. 現在のメモリ使用量の詳細を表示

```bash
jmap -histo:live pid > 1.jmp
```

`pid` を FE のプロセス ID に置き換えます。このコマンドは、生存中のオブジェクトが占めるメモリを使用量順に一覧表示します。合計使用量はファイルの末尾に表示されます。

出力例:

```text
 num     #instances         #bytes  class name
----------------------------------------------
   1:         33528       10822024  [B
   2:         80106        8662200  [C
   3:           143        4688112  [Ljava.util.concurrent.ForkJoinTask;
   4:         80563        1933512  java.lang.String
   5:         15295        1714968  java.lang.Class
   6:         45546        1457472  java.util.concurrent.ConcurrentHashMap$Node
   7:         15483        1057416  [Ljava.lang.Object;
```

> 注: `:live` パラメータを指定すると FullGC が発生するため、本番環境では慎重に使用してください。

### 2. JVM のメモリ使用量を確認

```bash
jstat -gcutil pid 1000 1000
```

`pid` を FE のプロセス ID に置き換えます。このコマンドは、JVM の各領域のメモリ使用量を毎秒確認します。

出力例:

```text
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.92   3.03  95.74  92.77     68    1.249     5    0.794    2.043
```

Old 世代（O）の使用率に注意してください。高すぎる場合、OOM や FullGC が発生する可能性があります。

### 3. FE のスレッドスタックを出力

```bash
jstack -l pid > 1.js
```

`pid` を FE のプロセス ID に置き換えます。`-l` パラメータではデッドロックも確認できます。FE のスレッドのブロック、デッドロック、負荷の高い関数などの調査に使用できます。

## BE のメモリデバッグ

BE のメモリデバッグでは、主に次の二種類の問題を調べます。

1. **メモリ使用量が妥当かどうか**: 使用量が過大な場合、メモリリークや不適切な使用が原因の可能性があります。
2. **メモリアクセスが正当かどうか**: 範囲外アクセスや未初期化メモリへのアクセスなどがないかを確認します。

### Doris Debug Tools

[Doris Debug Tools](https://github.com/morningman/doris-debug-tools) は、CPU フレームグラフとメモリ分析のツールをまとめて提供します。ダウンロードページ: [リリース](https://github.com/morningman/doris-debug-tools/releases)。

> 注: これは非公式ツールであり、開発時のデバッグのみを目的としています。

### Jemalloc のヒーププロファイル

> 注: Apache Doris はバージョン 1.2.2 以降、デフォルトのメモリアロケータとして Jemalloc を使用します。

ヒーププロファイルの仕組みについては、[ヒーププロファイリングの原理の解説](https://cn.pingcap.com/blog/an-explanation-of-the-heap-profiling-principle/)を参照してください。ヒーププロファイルは仮想メモリを記録する点に注意してください。

Jemalloc はリアルタイムと定期実行の両方のヒープダンプに対応しています。生成されたヒーププロファイルは `jeprof` ツールで解析します。

#### 1. リアルタイムのヒープダンプ（使用中のメモリの分析）

手順:

1. `JEMALLOC_CONF`（`be.conf` 内）を変更します。

    - `prof:false` を `prof:true` に変更します。
    - `prof_active:false` を `prof_active:true` に変更します。

2. Doris BE を再起動します。

3. BE マシンの HTTP インターフェースを呼び出し、ヒーププロファイルファイルを生成します。

    ```bash
    curl http://be_host:be_webport/jeheap/dump
    ```

バージョン別の注意点:

| Doris のバージョン | 動作 |
|-----------|------|
| 2.1.8 / 3.0.4 以降 | `prof`（`JEMALLOC_CONF` 内）はデフォルトで `true` のため、変更は不要 |
| 2.1.8 / 3.0.4 より前 | `JEMALLOC_CONF` に `prof_active` オプションはないため、`prof:false` から `prof:true` への変更のみが必要 |

主な設定項目:

| 設定項目 | 説明 | デフォルト |
|--------|------|--------|
| `jeprofile_dir` | ヒーププロファイルの出力ディレクトリ | `${DORIS_HOME}/log` |
| `lg_prof_sample` | サンプリング間隔（`2^N` バイト） | `19`（つまり 512KB） |

`lg_prof_sample` を小さくすると、ヒーププロファイルは実際のメモリ使用量に近づきますが、性能への負荷は増加します。デフォルトのサンプリングではメモリの約 10% のみが記録され、性能への影響は通常 10% 未満です。

> 性能上の注意: 性能テストでは、ヒープダンプのオーバーヘッドを避けるために `prof:false` のままにしてください。

#### 2. 定期的なヒープダンプ（長期的なメモリの観察）

`prof:false` を `prof:true` に変更します。変更する場所は `JEMALLOC_CONF`（`be.conf` 内）です。デフォルトでは、ヒーププロファイルファイルは `${DORIS_HOME}/log` に保存されます。ファイル名の先頭には `JEMALLOC_PROF_PRFIX` の値（デフォルトは `jemalloc_heap_profile_`）が付きます。

> 注: Doris 2.1.6 より前では `JEMALLOC_PROF_PRFIX` が空のため、プロファイルのファイル名として任意の値を設定する必要があります。

ダンプを開始する方法:

| トリガー条件 | 設定 | 説明 |
|---------|------|------|
| 累積メモリ割り当て量がしきい値に達したとき | `lg_prof_interval=34` | 累積割り当て量が 16GB（`2^34 B`）増えるたびにダンプします。2.1.6 より前のデフォルト値は `32` でした |
| メモリ使用量が過去最高値に達したとき | `prof_gdump=true` | 変更後に BE を再起動します |
| プログラム終了時にダンプし、リークを検出するとき | `prof_leak=true`, `prof_final=true` | 変更後に BE を再起動します |
| 累積値（増加量）をダンプするとき | `prof_accum=true` | `jeprof --alloc_space` で累積値を表示します |

#### 3. jeprof でヒーププロファイルを解析

`be/bin/jeprof` を使用して、ダンプしたヒーププロファイルを解析します。プロセスのメモリ使用量が大きい場合、解析に数分かかることがあります。

`jeprof` バイナリが `be/bin` ディレクトリにない場合は、`jeprof`（`doris/tools` ディレクトリ内）をパッケージ化してサーバーにアップロードできます。

> 注:
> - `addr2line` はバージョン 2.35.2 以降が必要です。詳しくは下記の QA-1 を参照してください。
> - ヒープダンプと `jeprof` による解析は、可能な限り Doris BE を実行する同じマシンで行ってください。詳しくは下記の QA-2 を参照してください。

**(1) 単一のヒーププロファイルファイルを分析する**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file
```

ターミナルのテキスト出力を [オンラインの dot 描画サイト](http://www.webgraphviz.com/)に貼り付けると、メモリ割り当ての関係図を生成できます。

サーバーでファイル転送が許可されている場合は、PDF を直接生成できます。

```bash
yum install ghostscript graphviz
jeprof --pdf ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file > result.pdf
```

[graphviz](http://www.graphviz.org/) をインストールすると、`pprof` で SVG や PDF などの読みやすい形式を出力できます。

**(2) 二つのヒーププロファイルの差分を分析する**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be --base=${DORIS_HOME}/log/profile_file ${DORIS_HOME}/log/profile_file2
```

先の時刻と後の時刻に取得したヒーププロファイルを比較すると、その間に増加したメモリ割り当てを特定できます。

#### 4. よくある質問（QA）

**QA-1: `jeprof` の実行時に `addr2line: Dwarf Error: found dwarf version xxx, this reader only handles version xxx` というエラーが大量に発生する**

原因: GCC 11 以降ではデフォルトで DWARF-v5 が使用され、Binutils 2.35.2 以降が必要です。Doris LDB-toolchain は GCC 11 を使用します。[GCC 11 の変更点](https://gcc.gnu.org/gcc-11/changes.html)を参照してください。

対処方法: `addr2line` をバージョン 2.35.2 に更新します。

```bash
# Download the addr2line source code
wget https://ftp.gnu.org/gnu/binutils/binutils-2.35.tar.bz2

# Install dependencies (if needed)
yum install make gcc gcc-c++ binutils

# Compile & install addr2line
tar -xvf binutils-2.35.tar.bz2
cd binutils-2.35
./configure --prefix=/usr/local
make
make install

# Verify
addr2line -h

# Replace addr2line
chmod +x addr2line
mv /usr/bin/addr2line /usr/bin/addr2line.bak
mv /bin/addr2line /bin/addr2line.bak
cp addr2line /bin/addr2line
cp addr2line /usr/bin/addr2line
hash -r
```

> 注: `addr2line 2.3.9` は使用しないでください。このバージョンには互換性の問題があり、メモリ使用量が増加し続ける可能性があります。

**QA-2: `jeprof` の実行時に `addr2line: DWARF error: invalid or unhandled FORM value: 0x25` と表示され、スタックに関数名ではなくメモリアドレスが表示される**

原因: 通常はヒープダンプと `jeprof` を同じサーバーで実行していないため、`jeprof` がシンボルテーブルを解析できないことが原因です。

対処方法:

- 可能な限り、ヒープダンプと `jeprof` による解析を同じマシンで実行します。
- または、Doris BE を実行するマシンの Linux カーネルバージョンを確認し、`be/bin/doris_be` とヒーププロファイルファイルを同じカーネルバージョンのマシンにダウンロードしてから `jeprof` を実行します。

**QA-3: Doris BE と同じマシンで解析しても、スタックにメモリアドレスが表示される**

以下のスクリプトを使用して、ヒーププロファイルを手動で解析します。次の変数を変更してください。

- `heap`: ヒーププロファイルのファイル名。
- `bin`: `be/bin/doris_be` バイナリのファイル名。
- `llvm_symbolizer`: llvm のシンボルテーブル解析ツールへのパス。`be/bin/doris_be` バイナリのコンパイルに使用したものと同じバージョンが望ましいです。

```bash
#!/bin/bash
## @brief
## @author zhoufei
## @email  gavineaglechou@gmail.com
## @date   2024-02-24-Sat

# 1. jeprof --dot ${bin} ${heap} > heap.dot to generate calling profile
# 2. find base addr and symbol
# 3. get addr to symble table with llvm-symbolizer
# 4. replace the addr with symbol

# heap file name
heap=jeheap_dump.1708694081.3443.945778264.heap
# binary name
bin=doris_be_aws.3.0.5
# path to llvm symbolizer
llvm_symbolizer=$HOME/opt/ldb-toolchain-16/bin/llvm-symbolizer
# output file name
out=out.dot
vaddr_baddr_symbol=vaddr_baddr_symbol.txt
program_name=doris_be

jeprof --dot ${bin} ${heap} > ${out}

baseaddr=$(grep ${program_name} ${heap} | head -n 1 | awk -F'-' '{print $1}')
echo "$baseaddr: ${baseaddr}"

function find_symbol() {
  local addr="$1"
  "${llvm_symbolizer}" --inlining --obj=${bin} ${addr} | head -n 1 | awk -F'(' '{print $1}'
}

if [ -f ${vaddr_baddr_symbol} ]; then
  cat ${vaddr_baddr_symbol} | while read vaddr baddr; do
    symbol=$(find_symbol ${baddr})
    echo "${vaddr} ${baddr} ${symbol}"
    sed -ri.orig "s/${vaddr}/${symbol}/g" ${out}
  done
else # recalculate the addr and
  grep -oP '0x(\d|[a-f])+' ${out} | xargs -I {} python -c "print('{}', '0x{:x}'.format({} - 0x${baseaddr}))" \
    | while read vaddr baddr; do
    symbol=$(find_symbol ${baddr})
    echo "${vaddr} ${baddr} ${symbol}"
    sed -ri.orig "s/${vaddr}/${symbol}/g" ${out}
  done | tee ${vaddr_baddr_symbol}
fi

# vim: et tw=80 ts=2 sw=2 cc=80:
```

**QA-4: 上記の方法がどれも機能しない**

- Doris BE を実行するマシンで `be/bin/doris_be` バイナリを再コンパイルし、コンパイル、実行、`jeprof` による解析をすべて同じマシンで行ってください。
- それでも機能しない場合は、`USE_JEMALLOC=OFF ./build.sh --be` で TCMalloc を使用する BE をコンパイルし、以下の TCMalloc ヒーププロファイルの節に従ってメモリを分析してください。

### TCMalloc のヒーププロファイル

> 注: Apache Doris 1.2.1 以前では TCMalloc を使用します。1.2.2 以降では Jemalloc がデフォルトです。TCMalloc に戻すには、`USE_JEMALLOC=OFF sh build.sh --be` でコンパイルします。

TCMalloc の使用時には、大きなメモリ割り当てのスタックが以下の形式で `be.out` に出力されます。

```text
tcmalloc: large alloc 1396277248 bytes == 0x3f3488000 @  0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

これは、BE がこのスタックで `1396277248 bytes` のメモリを割り当てようとしたことを示します。`addr2line` を使用して、読み取り可能なスタックに復元します。

```bash
addr2line -e lib/doris_be 0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

出力例:

```text
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1335
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1357
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.cpp:267
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.hpp:86
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:239
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:213
thread.cpp:?
```

小さな割り当てが多数積み重なって合計メモリ使用量が増えた場合、一行のログから問題を特定することはできません。その場合は、TCMalloc の [HEAP PROFILE](https://gperftools.github.io/gperftools/heapprofile.html) 機能を有効にするため、BE の起動前に `HEAPPROFILE` 環境変数を設定します。

```bash
export TCMALLOC_SAMPLE_PARAMETER=64000 HEAP_PROFILE_ALLOCATION_INTERVAL=-1 HEAP_PROFILE_INUSE_INTERVAL=-1 HEAP_PROFILE_TIME_INTERVAL=5 HEAPPROFILE=/tmp/doris_be.hprof
./bin/start_be.sh --daemon
```

> 注: `HEAPPROFILE` には絶対パスを指定し、ディレクトリは事前に作成しておく必要があります。

`pprof` で出力を分析します。

```bash
pprof --text lib/doris_be /tmp/doris_be.hprof.0012.heap | head -30
```

出力例:

```text
Using local file lib/doris_be.
Using local file /tmp/doris_be.hprof.0012.heap.
Total: 668.6 MB
   610.6  91.3%  91.3%    610.6  91.3% doris::SystemAllocator::allocate_via_malloc (inline)
    18.1   2.7%  94.0%     18.1   2.7% _objalloc_alloc
     5.6   0.8%  94.9%     63.4   9.5% doris::RowBatch::RowBatch
     5.1   0.8%  95.6%      7.1   1.1% butil::ResourcePool::add_block (inline)
     3.7   0.5%  96.2%      3.7   0.5% butil::iobuf::create_block (inline)
     3.4   0.5%  96.7%      3.4   0.5% butil::FlatMap::init
     3.2   0.5%  97.2%      5.2   0.8% butil::ObjectPool::add_block (inline)
     2.6   0.4%  97.6%      2.6   0.4% __gnu_cxx::new_allocator::allocate (inline)
     2.0   0.3%  97.9%      2.0   0.3% butil::ObjectPool::add_block_group (inline)
     2.0   0.3%  98.2%      2.0   0.3% butil::ResourcePool::add_block_group (inline)
     1.7   0.3%  98.4%      1.7   0.3% doris::SegmentReader::_load_index
```

各列の意味:

| 列 | 意味 |
|----|------|
| 1 列目 | 関数が直接割り当てたメモリ（MB） |
| 2 列目 | 1 列目の割合 |
| 3 列目 | 2 列目の累積値 |
| 4 列目 | 関数と、その関数が呼び出すすべての関数が使用したメモリの合計（MB） |
| 5 列目 | 4 列目の割合 |

SVG の呼び出しグラフを生成します。

```bash
pprof --svg lib/doris_be /tmp/doris_be.hprof.0012.heap > heap.svg
```

> 性能上の注意: このオプションを有効にするとプログラムの性能に影響します。本番環境では慎重に有効にしてください。

#### pprof リモートサーバー

`HEAP PROFILE` ではメモリ使用量の全体を取得できますが、次の制約があります。

1. BE の再起動が必要です。
2. 常時有効にしておく必要があり、プロセスの性能に継続的に影響します。

このため、Doris BE は GPerftools の[リモートサーバーデバッグ](https://gperftools.github.io/gperftools/pprof_remote_servers.html)に標準で対応しています。BE を再起動せずに、メモリ使用量の増分を動的に取得できます。

```bash
pprof --text --seconds=60 http://be_host:be_webport/pprof/heap
```

出力例:

```text
Total: 1296.4 MB
   484.9  37.4%  37.4%    484.9  37.4% doris::StorageByteBuffer::create
   272.2  21.0%  58.4%    273.3  21.1% doris::RowBlock::init
   157.5  12.1%  70.5%    157.5  12.1% doris::RowBatch::RowBatch
    90.7   7.0%  77.5%     90.7   7.0% doris::SystemAllocator::allocate_via_malloc
    66.6   5.1%  82.7%     66.6   5.1% doris::IntegerColumnReader::init
    47.9   3.7%  86.4%     47.9   3.7% __gnu_cxx::new_allocator::allocate
    20.8   1.6%  88.0%     35.4   2.7% doris::SegmentReader::_load_index
    12.7   1.0%  89.0%     12.7   1.0% doris::DecimalColumnReader::init
    12.7   1.0%  89.9%     12.7   1.0% doris::LargeIntColumnReader::init
    12.7   1.0%  90.9%     12.7   1.0% doris::StringColumnDirectReader::init
    12.3   0.9%  91.9%     12.3   0.9% std::__cxx11::basic_string::_M_mutate
    10.4   0.8%  92.7%     10.4   0.8% doris::VectorizedRowBatch::VectorizedRowBatch
    10.0   0.8%  93.4%     10.0   0.8% doris::PlainTextLineReader::PlainTextLineReader
```

このコマンドは実行中にのみ統計を収集するため、プロセスの性能への影響は完全な `HEAP PROFILE` よりも小さくなります。

### LSAN（メモリリークの検出）

[LSAN](https://github.com/google/sanitizers/wiki/AddressSanitizerLeakSanitizer) は GCC に組み込まれており、コンパイル時に有効にするだけで使用できます。Doris BE にはすでにこのツールが統合されています。コンパイルコマンドは次のとおりです。

```bash
BUILD_TYPE=LSAN ./build.sh
```

メモリリークが検出されると、リークが発生したスタックが `be.out` に出力されます。たとえば、`open` 関数（`StorageEngine` 内）に次のリークを発生させるコードを挿入します。

```cpp
char* leak_buf = new char[1024];
strcpy(leak_buf, "hello world");
LOG(INFO) << leak_buf;
```

`be.out` の出力:

```text
=================================================================
==24732==ERROR: LeakSanitizer: detected memory leaks

Direct leak of 1024 byte(s) in 1 object(s) allocated from:
    #0 0xd10586 in operator new (unsigned long) ../../../../gcc-7.3.0/libsanitizer/lsan/lsan_interceptors.cc:164
    #1 0xe333a2 in doris::StorageEngine::open(doris::EngineOptions const&, doris::StorageEngine**) /home/ssd0/zc/palo/doris/core/be/src/olap/storage_engine.cpp:104
    #2 0xd3cc96 in main /home/ssd0/zc/palo/doris/core/be/src/service/doris_main.cpp:159
    #3 0x7f573b5eebd4 in __libc_start_main (/opt/compiler/gcc-4.8.2/lib64/libc.so.6+0x21bd4)

SUMMARY: LeakSanitizer: 1024 byte(s) leaked in 1 allocation(s).
```

> 性能上の注意: LSAN を有効にするとプログラムの性能に影響します。本番環境では慎重に有効にしてください。

> 注: LSAN を有効にすると、TCMalloc は自動的に無効になります。

### ASAN（不正なメモリアクセスの検出）

[ASAN](https://github.com/google/sanitizers/wiki/AddressSanitizer) も GCC に組み込まれており、メモリの範囲外アクセスや不正なアドレスへのアクセスなどを検出するために使用します。コンパイルコマンドは次のとおりです。

```bash
BUILD_TYPE=ASAN ./build.sh
```

ASAN が不正なアクセスを検出すると、プログラムは直ちに終了し、スタックが `be.out` に出力されます。たとえば、`open` 関数（`StorageEngine` 内）に次の不正なアクセスを行うコードを挿入します。

```cpp
char* invalid_buf = new char[1024];
for (int i = 0; i < 1025; ++i) {
    invalid_buf[i] = i;
}
LOG(INFO) << invalid_buf;
```

`be.out` の出力:

```text
=================================================================
==23284==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x61900008bf80 at pc 0x00000129f56a bp 0x7fff546eed90 sp 0x7fff546eed88
WRITE of size 1 at 0x61900008bf80 thread T0
    #0 0x129f569 in doris::StorageEngine::open(doris::EngineOptions const&, doris::StorageEngine**) /home/ssd0/zc/palo/doris/core/be/src/olap/storage_engine.cpp:106
    #1 0xe2c1e3 in main /home/ssd0/zc/palo/doris/core/be/src/service/doris_main.cpp:159
    #2 0x7fa5580fbbd4 in __libc_start_main (/opt/compiler/gcc-4.8.2/lib64/libc.so.6+0x21bd4)
    #3 0xd30794  (/home/ssd0/zc/palo/doris/core/output3/be/lib/doris_be+0xd30794)

0x61900008bf80 is located 0 bytes to the right of 1024-byte region [0x61900008bb80,0x61900008bf80)
allocated by thread T0 here:
    #0 0xdeb040 in operator new[](unsigned long) ../../../../gcc-7.3.0/libsanitizer/asan/asan_new_delete.cc:82
    #1 0x129f50d in doris::StorageEngine::open(doris::EngineOptions const&, doris::StorageEngine**) /home/ssd0/zc/palo/doris/core/be/src/olap/storage_engine.cpp:104
    #2 0xe2c1e3 in main /home/ssd0/zc/palo/doris/core/be/src/service/doris_main.cpp:159
    #3 0x7fa5580fbbd4 in __libc_start_main (/opt/compiler/gcc-4.8.2/lib64/libc.so.6+0x21bd4)

SUMMARY: AddressSanitizer: heap-buffer-overflow /home/ssd0/zc/palo/doris/core/be/src/olap/storage_engine.cpp:106 in doris::StorageEngine::open(doris::EngineOptions const&, doris::StorageEngine**)
```

この出力から、不正にアクセスしたアドレス `0x61900008bf80`、割り当てられた領域 `[0x61900008bb80,0x61900008bf80)`、および割り当て時のスタックを確認できます。

> 性能上の注意: ASAN を有効にするとプログラムの性能に影響します。本番環境では慎重に有効にしてください。

> 注: ASAN を有効にすると、TCMalloc は自動的に無効になります。

`be.out` に出力されたスタックに関数のシンボルが含まれない場合は、[asan_symbolize](https://llvm.org/svn/llvm-project/compiler-rt/trunk/lib/asan/scripts/asan_symbolize.py) スクリプトを使用して手動で解析します。

```bash
cat be.out | python asan_symbolize.py | c++filt
```

## BE の CPU デバッグ

CPU Idle が長時間低い状態にある場合、CPU が主なボトルネックになっています。Doris BE では、CPU 使用量を分析する方法がいくつかあります。

### CPU 分析ツールの比較

| ツール | 物理マシンへのログインが必要か | サンプリング方法 | 出力 |
|------|----------------|---------|------|
| Doris Debug Tools | 不要（パッケージ化されたツール） | リモート取得 | フレームグラフ |
| `pprof` + GPerf REST | 不要 | 時間指定サンプリング | SVG/PDF |
| `perf` + FlameGraph | 必要 | イベントに基づくサンプリング | フレームグラフ |

### Doris Debug Tools（CPU 分析）

[Doris Debug Tools](https://github.com/morningman/doris-debug-tools) は、CPU フレームグラフとメモリ分析のツールをまとめて提供します。ダウンロードページ: [リリース](https://github.com/morningman/doris-debug-tools/releases)。

> 注: これは非公式ツールであり、開発時のデバッグのみを目的としています。

### pprof（リモート REST サンプリング）

[pprof](https://github.com/google/pprof) は gperftools に由来し、その出力を PDF、SVG、テキストなどの読みやすい形式に変換できます。Doris BE は GPerf REST インターフェースに対応しています。

```bash
pprof --svg --seconds=60 http://be_host:be_webport/pprof/profile > be.svg
```

このコマンドは、60 秒間の BE の CPU 使用量をグラフにします。

![CPU の pprof 分析](/images/cpu-pprof-demo.png)

### perf + FlameGraph

これは、より汎用的な CPU 分析方法です。`pprof` と異なり、分析対象の物理マシンにログインする必要があります。一方、`pprof` は時間指定のサンプリングのみを行いますが、`perf` はさまざまなイベントに基づいてスタックを収集できます。

ツールの参照先:

| ツール | リンク |
|------|------|
| `perf` | [perf のホームページ](https://perf.wiki.kernel.org/index.php/Main_Page)、[使用例](http://www.brendangregg.com/perf.html) |
| FlameGraph | [GitHub リポジトリ](https://github.com/brendangregg/FlameGraph) |

手順:

1. BE の CPU データを 60 秒間収集します。

    ```bash
    perf record -g -p be_pid -- sleep 60
    ```

2. 収集したレポートを確認します。

    ```bash
    perf report
    ```

    分析結果の例:

    ![perf のレポート](/images/perf-report-demo.png)

3. FlameGraph を使用して、フレームグラフを生成します。

    ```bash
    perf script | ./FlameGraph/stackcollapse-perf.pl | ./FlameGraph/flamegraph.pl > be.svg
    ```

    出力例:

    ![CPU フレームグラフ](/images/cpu-flame-demo.svg)

## トラブルシューティング

| 症状 | 考えられる原因 | 対処方法 |
|------|---------|---------|
| `addr2line: Dwarf Error` | DWARF-v5 が古い binutils と互換性がない | `addr2line` を 2.35.2 以降に更新します。詳しくは QA-1 を参照してください |
| `jeprof` の出力がメモリアドレスだけになる | ヒープダンプと解析を同じマシンで行っていない、またはシンボルテーブルが一致しない | 同じマシンで解析するか、カーネルバージョンを合わせます。詳しくは QA-2/QA-3 を参照してください |
| FullGC が頻発し、Old 世代の使用率が 100% に近い | FE の JVM ヒープが不足している、または大きなオブジェクトのリークがある | `jmap -histo:live` と `jstat -gcutil` で調査します |
| BE の起動後に性能が低下する | ヒーププロファイル、ASAN、LSAN を誤って有効にしている | 対応する設定を無効にし、デバッグ時だけ使用します |

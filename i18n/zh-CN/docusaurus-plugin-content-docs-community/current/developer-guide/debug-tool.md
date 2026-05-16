---
title: FE/BE 调试工具
language: zh-CN
description: Apache Doris FE/BE 常用调试工具：JVM 监控、内存分析与 BE 调试方法。
keywords:
    - Apache Doris
    - FE 调试
    - BE 调试
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
    - 内存泄漏
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

# FE/BE 调试工具

<!-- 知识类型: 工具使用 -->
<!-- 适用场景: 故障排查 / 性能调优 -->

Apache Doris 在开发与运维过程中，经常需要对 FE 与 BE 进程进行调试。本文档汇总常用的 JVM 监控、堆内存分析、CPU 火焰图与内存合法性检查工具。

> 注：文中出现的 BE 二进制文件名称 `doris_be`，在早期版本中为 `palo_be`。

## 工具速查

| 类别 | 工具 | 适用进程 | 主要用途 |
|------|------|---------|---------|
| JVM 监控 | `jmap` / `jstat` / `jstack` | FE | 查看对象内存、GC、线程堆栈 |
| Heap Profile | Jemalloc + `jeprof` | BE | 实时/定期记录堆内存分配 |
| Heap Profile | TCMalloc + `pprof` | BE（旧版本） | 堆内存采样与远程分析 |
| 内存合法性 | LSAN / ASAN | BE | 检测内存泄漏与非法访问 |
| CPU 分析 | `pprof` / `perf + FlameGraph` | BE | 函数级 CPU 消耗与火焰图 |

## FE 调试

FE 是 Java 进程，可使用 JDK 自带的命令进行调试。

### 1. 统计当前内存使用明细

```bash
jmap -histo:live pid > 1.jmp
```

将 `pid` 替换为 FE 进程 ID。该命令列举存活对象的内存占用并排序，文件末尾给出总占用。

输出示例：

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

> 注意：指定 `:live` 参数会触发 FullGC，请谨慎在线上使用。

### 2. 查看 JVM 内存使用

```bash
jstat -gcutil pid 1000 1000
```

将 `pid` 替换为 FE 进程 ID。该命令每秒查看一次 JVM 各区域内存使用情况。

输出示例：

```text
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.92   3.03  95.74  92.77     68    1.249     5    0.794    2.043
```

重点关注 Old 区（O）的占用百分比。占用过高时可能出现 OOM 或 FullGC。

### 3. 打印 FE 线程堆栈

```bash
jstack -l pid > 1.js
```

将 `pid` 替换为 FE 进程 ID。`-l` 参数会同时检测是否存在死锁。可用于排查 FE 线程阻塞、死锁、热点函数等问题。

## BE 内存调试

BE 内存调试主要关注以下两类问题：

1. **内存使用量是否合理**：用量过大可能是内存泄漏或使用不当。
2. **内存访问是否合法**：是否存在越界、未初始化访问等。

### Doris Debug Tools

[Doris Debug Tools](https://github.com/morningman/doris-debug-tools) 提供了封装好的 CPU 火焰图与内存分析工具，下载页：[Releases](https://github.com/morningman/doris-debug-tools/releases)。

> 注：非官方工具，仅用于开发调试。

### Jemalloc Heap Profile

> 说明：Apache Doris 1.2.2 版本开始默认使用 Jemalloc 作为内存分配器。

Heap Profile 的原理可参考 [Heap Profiling 原理解析](https://cn.pingcap.com/blog/an-explanation-of-the-heap-profiling-principle/)。需要注意的是，Heap Profile 记录的是虚拟内存。

Jemalloc 支持实时和定期两种 Heap Dump 方式，然后使用 `jeprof` 工具解析生成的 Heap Profile。

#### 1. 实时 Heap Dump（用于分析实时内存）

操作步骤：

1. 修改 `be.conf` 中 `JEMALLOC_CONF`：

    - 将 `prof:false` 改为 `prof:true`
    - 将 `prof_active:false` 改为 `prof_active:true`

2. 重启 Doris BE。

3. 在 BE 机器上调用 HTTP 接口生成 Heap Profile 文件：

    ```bash
    curl http://be_host:be_webport/jeheap/dump
    ```

版本说明：

| Doris 版本 | 行为 |
|-----------|------|
| 2.1.8 / 3.0.4 及之后 | `JEMALLOC_CONF` 中 `prof` 已默认为 `true`，无需修改 |
| 2.1.8 / 3.0.4 之前 | `JEMALLOC_CONF` 中没有 `prof_active` 选项，只需将 `prof:false` 改为 `prof:true` |

关键配置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `jeprofile_dir` | Heap Profile 输出目录 | `${DORIS_HOME}/log` |
| `lg_prof_sample` | 采样间隔（`2^N` 字节） | `19`（即 512KB） |

减小 `lg_prof_sample` 会让 Heap Profile 更接近真实内存，但性能损耗更大。默认采样大约只记录 10% 的内存，性能影响通常小于 10%。

> 性能提示：性能测试场景下建议保持 `prof:false`，避免 Heap Dump 的开销。

#### 2. 定期 Heap Dump（用于长时间观测内存）

将 `be.conf` 中 `JEMALLOC_CONF` 的 `prof:false` 修改为 `prof:true`。Heap Profile 文件默认保存在 `${DORIS_HOME}/log`，文件名前缀由 `JEMALLOC_PROF_PRFIX` 指定，默认为 `jemalloc_heap_profile_`。

> 注意：在 Doris 2.1.6 之前，`JEMALLOC_PROF_PRFIX` 为空，需要修改为任意值作为 profile 文件名。

Dump 触发方式：

| 触发方式 | 配置 | 说明 |
|---------|------|------|
| 内存累计申请达到阈值时 Dump | `lg_prof_interval=34` | 每次累计申请 16GB（`2^34 B`）时 Dump 一次；2.1.6 之前默认就是 `32` |
| 内存达到新高时 Dump | `prof_gdump=true` | 修改后重启 BE |
| 程序退出时 Dump 并检测泄漏 | `prof_leak=true`、`prof_final=true` | 修改后重启 BE |
| Dump 累计值（growth） | `prof_accum=true` | 使用 `jeprof --alloc_space` 展示累计值 |

#### 3. 使用 jeprof 解析 Heap Profile

使用 `be/bin/jeprof` 解析 Dump 出的 Heap Profile。如进程内存较大，解析过程可能需要数分钟。

如果 `be/bin` 目录下没有 `jeprof` 二进制文件，可将 `doris/tools` 目录下的 `jeprof` 打包上传到服务器。

> 注意事项：
> - 需要 `addr2line` 版本 2.35.2 及以上，详见下方 QA-1。
> - 尽量在运行 Doris BE 的同一台机器上执行 Heap Dump 与 `jeprof` 解析，详见下方 QA-2。

**(1) 分析单个 Heap Profile 文件**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file
```

将终端输出的文本粘贴到 [在线 dot 绘图网站](http://www.webgraphviz.com/)，即可生成内存分配关系图。

如服务器允许传输文件，也可直接生成 PDF：

```bash
yum install ghostscript graphviz
jeprof --pdf ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file > result.pdf
```

安装 [graphviz](http://www.graphviz.org/) 后，`pprof` 可输出 SVG、PDF 等更易读的格式。

**(2) 分析两个 Heap Profile 的 diff**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be --base=${DORIS_HOME}/log/profile_file ${DORIS_HOME}/log/profile_file2
```

通过对比早晚两个时间点的 Heap Profile，可以定位某段时间内的增量内存分配。

#### 4. 常见问题（QA）

**QA-1：运行 `jeprof` 出现大量 `addr2line: Dwarf Error: found dwarf version xxx, this reader only handles version xxx`**

原因：GCC 11 之后默认使用 DWARF-v5，要求 Binutils 2.35.2 及以上。Doris LDB-toolchain 使用 GCC 11，参考 [GCC 11 changes](https://gcc.gnu.org/gcc-11/changes.html)。

解决方法：升级 `addr2line` 到 2.35.2 版本。

```bash
# 下载 addr2line 源码
wget https://ftp.gnu.org/gnu/binutils/binutils-2.35.tar.bz2

# 安装依赖项（如果需要）
yum install make gcc gcc-c++ binutils

# 编译 & 安装 addr2line
tar -xvf binutils-2.35.tar.bz2
cd binutils-2.35
./configure --prefix=/usr/local
make
make install

# 验证
addr2line -h

# 替换 addr2line
chmod +x addr2line
mv /usr/bin/addr2line /usr/bin/addr2line.bak
mv /bin/addr2line /bin/addr2line.bak
cp addr2line /bin/addr2line
cp addr2line /usr/bin/addr2line
hash -r
```

> 注意：不能使用 `addr2line 2.3.9`，该版本可能不兼容，导致内存一直增长。

**QA-2：运行 `jeprof` 出现 `addr2line: DWARF error: invalid or unhandled FORM value: 0x25`，堆栈展示为内存地址而非函数名**

原因：通常是因为执行 Heap Dump 与执行 `jeprof` 不在同一台服务器，导致 `jeprof` 解析符号表失败。

解决方法：

- 尽可能在同一台机器上完成 Heap Dump 与 `jeprof` 解析。
- 或确认运行 Doris BE 的机器 Linux 内核版本，将 `be/bin/doris_be` 二进制与 Heap Profile 文件下载到相同内核版本的机器后再执行 `jeprof`。

**QA-3：在运行 Doris BE 的同一台机器上解析后，堆栈依然是内存地址**

使用下面的脚本手动解析 Heap Profile，修改这几个变量：

- `heap`：Heap Profile 的文件名。
- `bin`：`be/bin/doris_be` 二进制文件名。
- `llvm_symbolizer`：llvm 符号表解析程序的路径，版本最好是编译 `be/bin/doris_be` 二进制使用的版本。

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

**QA-4：上述方法都不奏效**

- 尝试在运行 Doris BE 的机器上重新编译 `be/bin/doris_be` 二进制，让编译、运行、`jeprof` 解析在同一台机器上。
- 如果仍不奏效，尝试使用 `USE_JEMALLOC=OFF ./build.sh --be` 编译使用 TCMalloc 的 BE，然后参考下方 TCMalloc Heap Profile 章节分析内存。

### TCMalloc Heap Profile

> 说明：Apache Doris 1.2.1 及之前版本使用 TCMalloc，1.2.2 版本开始默认使用 Jemalloc。如需切换回 TCMalloc，可使用 `USE_JEMALLOC=OFF sh build.sh --be` 进行编译。

使用 TCMalloc 时，遇到大内存申请会将堆栈打印到 `be.out`，形式如下：

```text
tcmalloc: large alloc 1396277248 bytes == 0x3f3488000 @  0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

表示 BE 在该堆栈上尝试申请 `1396277248 bytes` 内存。使用 `addr2line` 还原可读堆栈：

```bash
addr2line -e lib/doris_be 0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

输出示例：

```text
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1335
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1357
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.cpp:267
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.hpp:86
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:239
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:213
thread.cpp:?
```

当大量小内存堆积导致总内存膨胀时，单条日志无法定位问题，可启用 TCMalloc 的 [HEAP PROFILE](https://gperftools.github.io/gperftools/heapprofile.html) 功能，在启动 BE 前设置 `HEAPPROFILE` 环境变量：

```bash
export TCMALLOC_SAMPLE_PARAMETER=64000 HEAP_PROFILE_ALLOCATION_INTERVAL=-1 HEAP_PROFILE_INUSE_INTERVAL=-1 HEAP_PROFILE_TIME_INTERVAL=5 HEAPPROFILE=/tmp/doris_be.hprof
./bin/start_be.sh --daemon
```

> 注意：`HEAPPROFILE` 需为绝对路径，且目录必须已存在。

使用 `pprof` 分析输出：

```bash
pprof --text lib/doris_be /tmp/doris_be.hprof.0012.heap | head -30
```

输出示例：

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

各列含义：

| 列 | 含义 |
|----|------|
| 第一列 | 函数直接申请的内存大小（MB） |
| 第二列 | 第一列的百分比 |
| 第三列 | 第二列的累积值 |
| 第四列 | 函数及其所有调用函数总占用内存（MB） |
| 第五列 | 第四列的百分比 |

生成 SVG 调用关系图：

```bash
pprof --svg lib/doris_be /tmp/doris_be.hprof.0012.heap > heap.svg
```

> 性能提示：开启该选项会影响程序的执行性能，请慎重对线上实例开启。

#### pprof Remote Server

`HEAP PROFILE` 虽然能获取完整内存使用信息，但有以下限制：

1. 需要重启 BE；
2. 需要持续开启，对进程性能有持续影响。

为此，Doris BE 内部支持了 GPerftools 的 [远程 server 调试](https://gperftools.github.io/gperftools/pprof_remote_servers.html)，可在不重启 BE 的情况下动态采集内存增量：

```bash
pprof --text --seconds=60 http://be_host:be_webport/pprof/heap
```

输出示例：

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

该命令仅在执行期间开启统计，对进程性能影响小于完整 `HEAP PROFILE`。

### LSAN（内存泄漏检测）

[LSAN](https://github.com/google/sanitizers/wiki/AddressSanitizerLeakSanitizer) 已集成在 GCC 中，编译时开启即可使用。Doris BE 已经集成该工具，编译命令如下：

```bash
BUILD_TYPE=LSAN ./build.sh
```

当检测到内存泄漏时，会在 `be.out` 输出泄漏堆栈。例如，在 `StorageEngine` 的 `open` 函数中插入泄漏代码：

```cpp
char* leak_buf = new char[1024];
strcpy(leak_buf, "hello world");
LOG(INFO) << leak_buf;
```

`be.out` 输出：

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

> 性能提示：开启 LSAN 会影响程序执行性能，请慎重对线上实例开启。

> 注意：开启 LSAN 后，TCMalloc 会被自动关闭。

### ASAN（地址合法性检测）

[ASAN](https://github.com/google/sanitizers/wiki/AddressSanitizer) 同样集成在 GCC 中，用于检测内存越界、非法地址访问等。编译命令：

```bash
BUILD_TYPE=ASAN ./build.sh
```

ASAN 检测到异常访问后会立即退出并将堆栈输出到 `be.out`。例如，在 `StorageEngine` 的 `open` 函数中注入一段非法访问代码：

```cpp
char* invalid_buf = new char[1024];
for (int i = 0; i < 1025; ++i) {
    invalid_buf[i] = i;
}
LOG(INFO) << invalid_buf;
```

`be.out` 输出：

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

可读出非法地址 `0x61900008bf80`、申请区域 `[0x61900008bb80,0x61900008bf80)` 及其申请堆栈。

> 性能提示：开启 ASAN 会影响程序执行性能，请慎重对线上实例开启。

> 注意：开启 ASAN 后，TCMalloc 会被自动关闭。

如 `be.out` 输出的堆栈没有函数符号，可使用 [asan_symbolize](https://llvm.org/svn/llvm-project/compiler-rt/trunk/lib/asan/scripts/asan_symbolize.py) 脚本手动解析：

```bash
cat be.out | python asan_symbolize.py | c++filt
```

## BE CPU 调试

当 CPU Idle 持续偏低时，说明 CPU 已成为主要瓶颈。Doris BE 提供以下几种方式分析 CPU 使用情况。

### CPU 分析工具对比

| 工具 | 是否需登录物理机 | 采样方式 | 输出 |
|------|----------------|---------|------|
| Doris Debug Tools | 否（封装工具） | 远程拉取 | 火焰图 |
| `pprof` + GPerf REST | 否 | 定时采样 | SVG/PDF |
| `perf` + FlameGraph | 是 | 事件驱动采样 | 火焰图 |

### Doris Debug Tools（CPU 分析）

[Doris Debug Tools](https://github.com/morningman/doris-debug-tools) 提供了封装好的 CPU 火焰图与内存分析工具，下载页：[Releases](https://github.com/morningman/doris-debug-tools/releases)。

> 注：非官方工具，仅用于开发调试。

### pprof（远程 REST 采样）

[pprof](https://github.com/google/pprof) 来自 gperftools，可将 gperftools 输出转换为 PDF、SVG、Text 等可读格式。Doris BE 已兼容 GPerf 的 REST 接口：

```bash
pprof --svg --seconds=60 http://be_host:be_webport/pprof/profile > be.svg
```

该命令会生成 60 秒内 BE 执行的 CPU 消耗图：

![CPU Pprof](/images/cpu-pprof-demo.png)

### perf + FlameGraph

这是较通用的 CPU 分析方式。相比 `pprof`，需要登录到分析对象的物理机；但相比 `pprof` 仅定时采样，`perf` 可基于不同事件采集堆栈。

工具说明：

| 工具 | 链接 |
|------|------|
| `perf` | [perf 主页](https://perf.wiki.kernel.org/index.php/Main_Page)、[使用示例](http://www.brendangregg.com/perf.html) |
| FlameGraph | [GitHub 仓库](https://github.com/brendangregg/FlameGraph) |

使用步骤：

1. 采集 60 秒 BE 的 CPU 数据：

    ```bash
    perf record -g -p be_pid -- sleep 60
    ```

2. 查看采集报告：

    ```bash
    perf report
    ```

    分析结果示例：

    ![Perf Report](/images/perf-report-demo.png)

3. 使用 FlameGraph 生成可视化火焰图：

    ```bash
    perf script | ./FlameGraph/stackcollapse-perf.pl | ./FlameGraph/flamegraph.pl > be.svg
    ```

    输出示例：

    ![CPU Flame](/images/cpu-flame-demo.svg)

## Troubleshooting

| 现象 | 可能原因 | 处理方式 |
|------|---------|---------|
| `addr2line: Dwarf Error` | DWARF-v5 与旧版 binutils 不兼容 | 升级 `addr2line` 到 2.35.2+，详见 QA-1 |
| `jeprof` 输出全是内存地址 | Heap Dump 与解析不在同一机器或符号表不匹配 | 同机器解析或对齐内核版本，详见 QA-2/QA-3 |
| FullGC 频繁、Old 区接近 100% | FE JVM 堆内存不足或存在大对象泄漏 | 使用 `jmap -histo:live` 与 `jstat -gcutil` 排查 |
| BE 启动后性能下降 | 误开启 Heap Profile / ASAN / LSAN | 关闭对应配置，仅在调试时使用 |

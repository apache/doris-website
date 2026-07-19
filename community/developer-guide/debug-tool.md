---
title: FE/BE Debug Tools
language: en
description: "Common debug tools for Apache Doris FE/BE: JVM monitoring, memory analysis, and BE debugging methods."
keywords:
    - Apache Doris
    - FE debugging
    - BE debugging
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
    - memory leak
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

# FE/BE Debug Tools

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

During development and operations of Apache Doris, you often need to debug the FE and BE processes. This document summarizes common tools for JVM monitoring, heap memory analysis, CPU flame graphs, and memory legality checks.

> Note: The BE binary file name `doris_be` referenced in this document was named `palo_be` in earlier versions.

## Tool Quick Reference

| Category | Tool | Applicable process | Main purpose |
|------|------|---------|---------|
| JVM monitoring | `jmap` / `jstat` / `jstack` | FE | Inspect object memory, GC, and thread stacks |
| Heap Profile | Jemalloc + `jeprof` | BE | Record heap memory allocation in real time or periodically |
| Heap Profile | TCMalloc + `pprof` | BE (older versions) | Heap memory sampling and remote analysis |
| Memory legality | LSAN / ASAN | BE | Detect memory leaks and illegal access |
| CPU analysis | `pprof` / `perf + FlameGraph` | BE | Function-level CPU consumption and flame graphs |

## FE Debugging

FE is a Java process, so you can debug it with the commands provided by the JDK.

### 1. Show Current Memory Usage Details

```bash
jmap -histo:live pid > 1.jmp
```

Replace `pid` with the FE process ID. This command lists the memory occupied by live objects in sorted order, with the total usage shown at the end of the file.

Example output:

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

> Note: Passing the `:live` parameter triggers a FullGC, so use it with caution in production.

### 2. Inspect JVM Memory Usage

```bash
jstat -gcutil pid 1000 1000
```

Replace `pid` with the FE process ID. This command checks memory usage of each JVM region once per second.

Example output:

```text
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.92   3.03  95.74  92.77     68    1.249     5    0.794    2.043
```

Pay attention to the usage percentage of the Old generation (O). When it is too high, OOM or FullGC may occur.

### 3. Print FE Thread Stacks

```bash
jstack -l pid > 1.js
```

Replace `pid` with the FE process ID. The `-l` parameter also checks for deadlocks. You can use it to investigate FE thread blocking, deadlocks, hot functions, and similar issues.

## BE Memory Debugging

BE memory debugging mainly focuses on two categories of problems:

1. **Whether memory usage is reasonable**: Excessive usage may indicate a memory leak or improper use.
2. **Whether memory access is legal**: Whether there is out-of-bounds access, uninitialized access, and so on.

### Doris Debug Tools

[Doris Debug Tools](https://github.com/morningman/doris-debug-tools) provides packaged CPU flame graph and memory analysis tools. Download page: [Releases](https://github.com/morningman/doris-debug-tools/releases).

> Note: This is an unofficial tool, intended only for development debugging.

### Jemalloc Heap Profile

> Note: Apache Doris uses Jemalloc as the default memory allocator starting from version 1.2.2.

For the principles of Heap Profile, see [Heap Profiling Principles Explained](https://cn.pingcap.com/blog/an-explanation-of-the-heap-profiling-principle/). Note that Heap Profile records virtual memory.

Jemalloc supports both real-time and periodic Heap Dump modes. The resulting Heap Profile is then parsed with the `jeprof` tool.

#### 1. Real-Time Heap Dump (for analyzing live memory)

Steps:

1. Modify `JEMALLOC_CONF` in `be.conf`:

    - Change `prof:false` to `prof:true`
    - Change `prof_active:false` to `prof_active:true`

2. Restart Doris BE.

3. Call the HTTP interface on the BE machine to generate a Heap Profile file:

    ```bash
    curl http://be_host:be_webport/jeheap/dump
    ```

Version notes:

| Doris version | Behavior |
|-----------|------|
| 2.1.8 / 3.0.4 and later | `prof` in `JEMALLOC_CONF` defaults to `true`; no modification needed |
| Before 2.1.8 / 3.0.4 | `JEMALLOC_CONF` has no `prof_active` option; only change `prof:false` to `prof:true` |

Key configurations:

| Configuration | Description | Default |
|--------|------|--------|
| `jeprofile_dir` | Output directory for Heap Profile | `${DORIS_HOME}/log` |
| `lg_prof_sample` | Sampling interval (`2^N` bytes) | `19` (i.e., 512KB) |

Reducing `lg_prof_sample` makes the Heap Profile closer to real memory, but increases the performance cost. The default sampling records only about 10% of memory, and the performance impact is usually less than 10%.

> Performance tip: In performance test scenarios, keep `prof:false` to avoid the overhead of Heap Dump.

#### 2. Periodic Heap Dump (for long-term memory observation)

Change `prof:false` to `prof:true` in `JEMALLOC_CONF` in `be.conf`. By default, Heap Profile files are saved to `${DORIS_HOME}/log`, with file names prefixed by `JEMALLOC_PROF_PRFIX` (default `jemalloc_heap_profile_`).

> Note: Before Doris 2.1.6, `JEMALLOC_PROF_PRFIX` is empty, so you need to set it to any value as the profile file name.

Dump trigger methods:

| Trigger method | Configuration | Description |
|---------|------|------|
| Dump when cumulative memory allocation reaches threshold | `lg_prof_interval=34` | Dump every 16GB (`2^34 B`) of cumulative allocation; the default before 2.1.6 was `32` |
| Dump when memory reaches a new high | `prof_gdump=true` | Restart BE after modification |
| Dump on program exit and detect leaks | `prof_leak=true`, `prof_final=true` | Restart BE after modification |
| Dump cumulative value (growth) | `prof_accum=true` | Use `jeprof --alloc_space` to display the cumulative value |

#### 3. Parse Heap Profile with jeprof

Use `be/bin/jeprof` to parse the dumped Heap Profile. If the process memory is large, parsing may take several minutes.

If there is no `jeprof` binary in the `be/bin` directory, you can package and upload the `jeprof` under the `doris/tools` directory to the server.

> Notes:
> - `addr2line` version 2.35.2 or later is required. See QA-1 below for details.
> - Try to perform Heap Dump and `jeprof` parsing on the same machine that runs Doris BE. See QA-2 below for details.

**(1) Analyze a single Heap Profile file**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file
```

Paste the text output from the terminal into an [online dot rendering site](http://www.webgraphviz.com/) to generate a memory allocation relationship graph.

If the server allows file transfer, you can generate a PDF directly:

```bash
yum install ghostscript graphviz
jeprof --pdf ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file > result.pdf
```

After installing [graphviz](http://www.graphviz.org/), `pprof` can output more readable formats such as SVG and PDF.

**(2) Analyze the diff between two Heap Profiles**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be --base=${DORIS_HOME}/log/profile_file ${DORIS_HOME}/log/profile_file2
```

By comparing Heap Profiles taken at an earlier and a later time, you can locate incremental memory allocations during that interval.

#### 4. Frequently Asked Questions (QA)

**QA-1: Running `jeprof` produces many `addr2line: Dwarf Error: found dwarf version xxx, this reader only handles version xxx` errors**

Cause: GCC 11 and later use DWARF-v5 by default, which requires Binutils 2.35.2 or later. Doris LDB-toolchain uses GCC 11. See [GCC 11 changes](https://gcc.gnu.org/gcc-11/changes.html).

Solution: Upgrade `addr2line` to version 2.35.2.

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

> Note: Do not use `addr2line 2.3.9`. That version may be incompatible and cause memory to keep growing.

**QA-2: Running `jeprof` reports `addr2line: DWARF error: invalid or unhandled FORM value: 0x25`, and the stack shows memory addresses instead of function names**

Cause: Usually because Heap Dump and `jeprof` were not run on the same server, so `jeprof` fails to parse the symbol table.

Solutions:

- Run Heap Dump and `jeprof` parsing on the same machine whenever possible.
- Or check the Linux kernel version of the machine running Doris BE, download `be/bin/doris_be` and the Heap Profile file to a machine with the same kernel version, and then run `jeprof`.

**QA-3: After parsing on the same machine that runs Doris BE, the stack still shows memory addresses**

Use the script below to parse the Heap Profile manually. Modify these variables:

- `heap`: file name of the Heap Profile.
- `bin`: file name of the `be/bin/doris_be` binary.
- `llvm_symbolizer`: path to the llvm symbol-table parser, preferably the same version used to compile the `be/bin/doris_be` binary.

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

**QA-4: None of the methods above work**

- Try recompiling the `be/bin/doris_be` binary on the machine that runs Doris BE, so that compilation, execution, and `jeprof` parsing all happen on the same machine.
- If that still does not work, try compiling a BE that uses TCMalloc with `USE_JEMALLOC=OFF ./build.sh --be`, then analyze memory by following the TCMalloc Heap Profile section below.

### TCMalloc Heap Profile

> Note: Apache Doris 1.2.1 and earlier use TCMalloc; starting from 1.2.2, Jemalloc is the default. To switch back to TCMalloc, compile with `USE_JEMALLOC=OFF sh build.sh --be`.

When using TCMalloc, large memory allocations print the stack to `be.out` in the following form:

```text
tcmalloc: large alloc 1396277248 bytes == 0x3f3488000 @  0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

This indicates that BE tried to allocate `1396277248 bytes` of memory at this stack. Use `addr2line` to restore the readable stack:

```bash
addr2line -e lib/doris_be 0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

Example output:

```text
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1335
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1357
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.cpp:267
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.hpp:86
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:239
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:213
thread.cpp:?
```

When many small allocations accumulate and inflate total memory, a single log line cannot locate the problem. In that case, enable TCMalloc's [HEAP PROFILE](https://gperftools.github.io/gperftools/heapprofile.html) feature by setting the `HEAPPROFILE` environment variable before starting BE:

```bash
export TCMALLOC_SAMPLE_PARAMETER=64000 HEAP_PROFILE_ALLOCATION_INTERVAL=-1 HEAP_PROFILE_INUSE_INTERVAL=-1 HEAP_PROFILE_TIME_INTERVAL=5 HEAPPROFILE=/tmp/doris_be.hprof
./bin/start_be.sh --daemon
```

> Note: `HEAPPROFILE` must be an absolute path, and the directory must already exist.

Analyze the output with `pprof`:

```bash
pprof --text lib/doris_be /tmp/doris_be.hprof.0012.heap | head -30
```

Example output:

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

Column meanings:

| Column | Meaning |
|----|------|
| Column 1 | Memory directly allocated by the function (MB) |
| Column 2 | Percentage of column 1 |
| Column 3 | Cumulative value of column 2 |
| Column 4 | Total memory used by the function and all functions it calls (MB) |
| Column 5 | Percentage of column 4 |

Generate an SVG call graph:

```bash
pprof --svg lib/doris_be /tmp/doris_be.hprof.0012.heap > heap.svg
```

> Performance tip: Enabling this option affects program performance. Enable it on production instances with caution.

#### pprof Remote Server

`HEAP PROFILE` can capture complete memory usage information, but it has the following limitations:

1. It requires a BE restart.
2. It must stay enabled, which continuously impacts process performance.

For this reason, Doris BE has built-in support for GPerftools [remote server debugging](https://gperftools.github.io/gperftools/pprof_remote_servers.html), allowing dynamic capture of memory increments without restarting BE:

```bash
pprof --text --seconds=60 http://be_host:be_webport/pprof/heap
```

Example output:

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

This command only collects statistics during its execution, so its impact on process performance is smaller than a full `HEAP PROFILE`.

### LSAN (Memory Leak Detection)

[LSAN](https://github.com/google/sanitizers/wiki/AddressSanitizerLeakSanitizer) is integrated into GCC and is available simply by enabling it at compile time. Doris BE already integrates this tool. The compile command is:

```bash
BUILD_TYPE=LSAN ./build.sh
```

When a memory leak is detected, the leak stack is printed to `be.out`. For example, insert the following leak code into the `open` function of `StorageEngine`:

```cpp
char* leak_buf = new char[1024];
strcpy(leak_buf, "hello world");
LOG(INFO) << leak_buf;
```

`be.out` output:

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

> Performance tip: Enabling LSAN affects program performance. Enable it on production instances with caution.

> Note: Once LSAN is enabled, TCMalloc is automatically turned off.

### ASAN (Address Legality Detection)

[ASAN](https://github.com/google/sanitizers/wiki/AddressSanitizer) is also integrated into GCC, and is used to detect memory out-of-bounds access, illegal address access, and similar issues. Compile command:

```bash
BUILD_TYPE=ASAN ./build.sh
```

When ASAN detects an illegal access, it exits immediately and prints the stack to `be.out`. For example, inject the following illegal access code into the `open` function of `StorageEngine`:

```cpp
char* invalid_buf = new char[1024];
for (int i = 0; i < 1025; ++i) {
    invalid_buf[i] = i;
}
LOG(INFO) << invalid_buf;
```

`be.out` output:

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

From the output you can read the illegal address `0x61900008bf80`, the allocated region `[0x61900008bb80,0x61900008bf80)`, and its allocation stack.

> Performance tip: Enabling ASAN affects program performance. Enable it on production instances with caution.

> Note: Once ASAN is enabled, TCMalloc is automatically turned off.

If the stack output to `be.out` does not contain function symbols, use the [asan_symbolize](https://llvm.org/svn/llvm-project/compiler-rt/trunk/lib/asan/scripts/asan_symbolize.py) script to parse it manually:

```bash
cat be.out | python asan_symbolize.py | c++filt
```

## BE CPU Debugging

When CPU Idle stays low for an extended period, CPU has become the main bottleneck. Doris BE offers several ways to analyze CPU usage.

### Comparison of CPU Analysis Tools

| Tool | Requires login to physical machine | Sampling method | Output |
|------|----------------|---------|------|
| Doris Debug Tools | No (packaged tool) | Remote pulling | Flame graph |
| `pprof` + GPerf REST | No | Timed sampling | SVG/PDF |
| `perf` + FlameGraph | Yes | Event-driven sampling | Flame graph |

### Doris Debug Tools (CPU Analysis)

[Doris Debug Tools](https://github.com/morningman/doris-debug-tools) provides packaged CPU flame graph and memory analysis tools. Download page: [Releases](https://github.com/morningman/doris-debug-tools/releases).

> Note: This is an unofficial tool, intended only for development debugging.

### pprof (Remote REST Sampling)

[pprof](https://github.com/google/pprof) comes from gperftools and can convert gperftools output into readable formats such as PDF, SVG, and Text. Doris BE is compatible with the GPerf REST interface:

```bash
pprof --svg --seconds=60 http://be_host:be_webport/pprof/profile > be.svg
```

This command generates a graph of BE CPU consumption over a 60-second window:

![CPU Pprof](/images/cpu-pprof-demo.png)

### perf + FlameGraph

This is a more general CPU analysis approach. Compared with `pprof`, it requires you to log in to the physical machine being analyzed; however, while `pprof` only does timed sampling, `perf` can collect stacks based on different events.

Tool references:

| Tool | Link |
|------|------|
| `perf` | [perf homepage](https://perf.wiki.kernel.org/index.php/Main_Page), [usage examples](http://www.brendangregg.com/perf.html) |
| FlameGraph | [GitHub repository](https://github.com/brendangregg/FlameGraph) |

Steps:

1. Collect 60 seconds of BE CPU data:

    ```bash
    perf record -g -p be_pid -- sleep 60
    ```

2. View the collected report:

    ```bash
    perf report
    ```

    Example analysis result:

    ![Perf Report](/images/perf-report-demo.png)

3. Use FlameGraph to generate a visualized flame graph:

    ```bash
    perf script | ./FlameGraph/stackcollapse-perf.pl | ./FlameGraph/flamegraph.pl > be.svg
    ```

    Example output:

    ![CPU Flame](/images/cpu-flame-demo.svg)

## Troubleshooting

| Symptom | Possible cause | Action |
|------|---------|---------|
| `addr2line: Dwarf Error` | DWARF-v5 is incompatible with older binutils | Upgrade `addr2line` to 2.35.2+. See QA-1 for details |
| `jeprof` output is all memory addresses | Heap Dump and parsing are not on the same machine, or the symbol table does not match | Parse on the same machine or align the kernel versions. See QA-2/QA-3 for details |
| Frequent FullGC; Old generation close to 100% | FE JVM heap is insufficient or a large object leak exists | Investigate with `jmap -histo:live` and `jstat -gcutil` |
| Performance degrades after BE startup | Heap Profile / ASAN / LSAN enabled by mistake | Disable the corresponding configuration; use only for debugging |

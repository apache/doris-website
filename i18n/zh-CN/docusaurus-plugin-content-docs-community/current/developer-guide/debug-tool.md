---
{
    "title": "调试工具",
    "language": "zh-CN",
    "description": "介绍 Apache Doris 的常用调试工具和方法，包括 FE 和 BE 的调试技巧，如内存分析、线程分析、性能监控等实用调试手段。"
}
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

# 调试工具

在 Doris 的使用和开发过程中，经常需要对 Doris 进行调试。本文档介绍了一些常用的调试工具和方法。

**注意：文中出现的 BE 二进制文件名称 `doris_be` 在早期版本中为 `palo_be`。**

## FE 调试

FE 是 Java 进程，以下列举一些常用的 Java 调试命令。

### 1. 统计当前内存使用明细

```bash
jmap -histo:live pid > 1.jmp
```

该命令可以列举存活对象的内存占用情况并排序（将 pid 替换为 FE 进程 ID）。

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

通过该方法可以查看当前存活对象占用的总内存（在文件末尾），以及分析哪些对象占用了更多的内存。

**注意：** 该方法因指定了 `:live` 参数，会触发 FullGC。

### 2. 查看 JVM 内存使用

```bash
jstat -gcutil pid 1000 1000
```

该命令可以每隔 1 秒查看一次当前 JVM 各区域的内存使用情况（将 pid 替换为 FE 进程 ID）。

```text
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.92   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.92   3.03  95.74  92.77     68    1.249     5    0.794    2.043
```

重点关注 Old 区（O）的占用百分比（如示例中为 3.03%）。如果占用过高，则可能出现 OOM 或 FullGC。

### 3. 打印 FE 线程堆栈

```bash
jstack -l pid > 1.js
```

该命令可以打印当前 FE 的线程堆栈（将 pid 替换为 FE 进程 ID）。

`-l` 参数会同时检测是否存在死锁。该方法可用于查看 FE 线程运行情况、是否存在死锁、定位阻塞位置等问题。

## BE 调试

### 内存调试

内存调试主要关注两个方面：

1. **内存使用量是否合理**：内存使用量过大可能是系统存在内存泄漏，或程序内存使用不当。
2. **内存访问是否合法**：是否存在内存越界、非法访问等问题，例如访问非法地址或使用未初始化的内存。

针对这些问题，可以使用以下工具进行追踪和分析。

#### Jemalloc Heap Profile

> **说明：** Doris 1.2.2 版本开始默认使用 Jemalloc 作为内存分配器。

Heap Profile 的原理解析可参考 [Heap Profiling 原理解析](https://cn.pingcap.com/blog/an-explanation-of-the-heap-profiling-principle/)。需要注意的是，Heap Profile 记录的是虚拟内存。

Jemalloc 支持实时和定期两种 Heap Dump 方式，然后使用 `jeprof` 工具解析生成的 Heap Profile。

##### 1. 实时 Heap Dump（用于分析实时内存）

将 `be.conf` 中 `JEMALLOC_CONF` 的 `prof:false` 修改为 `prof:true`，将 `prof_active:false` 修改为 `prof_active:true`，然后重启 Doris BE。之后使用 Jemalloc Heap Dump HTTP 接口在 BE 机器上生成 Heap Profile 文件。

> **版本说明：**
> - Doris 2.1.8 和 3.0.4 及之后的版本：`JEMALLOC_CONF` 中 `prof` 已默认为 `true`，无需修改。
> - Doris 2.1.8 和 3.0.4 之前的版本：`JEMALLOC_CONF` 中没有 `prof_active` 选项，只需将 `prof:false` 修改为 `prof:true` 即可。

```bash
curl http://be_host:be_webport/jeheap/dump
```

**配置说明：**

- **Heap Profile 文件目录**：可在 `be.conf` 中通过 `jeprofile_dir` 变量配置，默认为 `${DORIS_HOME}/log`。
- **采样间隔**：默认为 512KB，通常只记录约 10% 的内存，性能影响通常小于 10%。可以修改 `be.conf` 中 `JEMALLOC_CONF` 的 `lg_prof_sample` 参数（默认为 `19`，即 2^19 B = 512KB）。减小 `lg_prof_sample` 可以更频繁采样，使 Heap Profile 更接近真实内存，但会带来更大的性能损耗。

**性能提示：** 如果在做性能测试，建议保持 `prof:false` 以避免 Heap Dump 的性能开销。

##### 2. 定期 Heap Dump（用于长时间观测内存）

将 `be.conf` 中 `JEMALLOC_CONF` 的 `prof:false` 修改为 `prof:true`。Heap Profile 文件默认保存在 `${DORIS_HOME}/log` 目录，文件名前缀由 `be.conf` 中的 `JEMALLOC_PROF_PRFIX` 指定，默认为 `jemalloc_heap_profile_`。

> **注意：** 在 Doris 2.1.6 之前，`JEMALLOC_PROF_PRFIX` 为空，需要修改为任意值作为 profile 文件名。

**Dump 触发方式：**

1. **内存累计申请一定值时 Dump**

   将 `be.conf` 中 `JEMALLOC_CONF` 的 `lg_prof_interval` 修改为 `34`，此时内存累计申请 16GB（2^34 B = 16GB）时会 Dump 一次 profile。可以修改为任意值来调整 Dump 间隔。

   > **注意：** 在 Doris 2.1.6 之前，`lg_prof_interval` 默认就是 `32`。

2. **内存每次达到新高时 Dump**

   将 `be.conf` 中 `JEMALLOC_CONF` 的 `prof_gdump` 修改为 `true` 并重启 BE。

3. **程序退出时 Dump 并检测内存泄漏**

   将 `be.conf` 中 `JEMALLOC_CONF` 的 `prof_leak` 和 `prof_final` 修改为 `true` 并重启 BE。

4. **Dump 内存累计值（growth）而非实时值**

   将 `be.conf` 中 `JEMALLOC_CONF` 的 `prof_accum` 修改为 `true` 并重启 BE。使用 `jeprof --alloc_space` 展示 heap dump 累计值。

##### 3. 使用 `jeprof` 解析 Heap Profile

使用 `be/bin/jeprof` 解析上面 Dump 的 Heap Profile。如果进程内存较大，解析过程可能需要几分钟，请耐心等待。

若 Doris BE 部署路径的 `be/bin` 目录下没有 `jeprof` 二进制文件，可以将 `doris/tools` 目录下的 `jeprof` 打包后上传到服务器。

> **注意事项：**
> - 需要 addr2line 版本为 2.35.2 及以上，详情见下面的 QA-1。
> - 尽可能在运行 Doris BE 的机器上直接执行 Heap Dump 和 `jeprof` 解析，详情见下面的 QA-2。

**1. 分析单个 Heap Profile 文件**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file
```

执行完上述命令后，将终端输出的文本贴到[在线 dot 绘图网站](http://www.webgraphviz.com/)，生成内存分配图进行分析。

如果服务器方便传输文件，也可以直接生成调用关系图 PDF 文件。需要先安装绘图所需的依赖项：

```bash
yum install ghostscript graphviz
jeprof --pdf ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file > result.pdf
```

[graphviz](http://www.graphviz.org/)：在没有这个库时 pprof 只能转换为 text 格式，但这种方式不易查看。安装后，pprof 可以转换为 SVG、PDF 等格式，调用关系更加清晰。

**2. 分析两个 Heap Profile 文件的 diff**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be --base=${DORIS_HOME}/log/profile_file ${DORIS_HOME}/log/profile_file2
```

通过在一段时间内多次执行 Heap Dump，可以生成多个 heap 文件。选取较早时间的 heap 文件作为 baseline，与较晚时间的 heap 文件进行对比分析 diff。生成调用关系图的方法同上。

##### 4. 常见问题（QA）

**QA-1：运行 jeprof 后出现大量错误：`addr2line: Dwarf Error: found dwarf version xxx, this reader only handles version xxx`**

GCC 11 之后默认使用 DWARF-v5，这要求 Binutils 2.35.2 及以上。Doris Ldb_toolchain 使用了 GCC 11。参考：https://gcc.gnu.org/gcc-11/changes.html。

解决方法：升级 addr2line 到 2.35.2 版本。

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

**注意：** 不能使用 addr2line 2.3.9，该版本可能不兼容，导致内存一直增长。

**QA-2：运行 `jeprof` 后出现大量错误：`addr2line: DWARF error: invalid or unhandled FORM value: 0x25`，解析后的 Heap 栈都是代码的内存地址而非函数名称**

通常是因为执行 Heap Dump 和执行 `jeprof` 解析 Heap Profile 不在同一台服务器上，导致 `jeprof` 使用符号表解析函数名称失败。

解决方法：
- 尽可能在同一台机器上完成 Dump Heap 和 `jeprof` 解析的操作，即尽可能在运行 Doris BE 的机器上直接解析 Heap Profile。
- 或者确认运行 Doris BE 的机器 Linux 内核版本，将 `be/bin/doris_be` 二进制文件和 Heap Profile 文件下载到相同内核版本的机器上执行 `jeprof`。

**QA-3：如果在运行 Doris BE 的机器上直接解析 Heap Profile 后，Heap 栈依然是代码的内存地址而非函数名称**

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

**QA-4：如果上面所有的方法都不行**

- 尝试在运行 Doris BE 的机器上重新编译 `be/bin/doris_be` 二进制，让编译、运行、`jeprof` 解析在同一台机器上。
- 如果上述操作后 Heap 栈依然是代码的内存地址，尝试使用 `USE_JEMALLOC=OFF ./build.sh --be` 编译使用 TCMalloc 的 Doris BE，然后参考下面的章节使用 TCMalloc Heap Profile 分析内存。

#### TCMalloc Heap Profile

> **说明：** Doris 1.2.1 及之前版本使用 TCMalloc，Doris 1.2.2 版本开始默认使用 Jemalloc。如需切换回 TCMalloc，可使用 `USE_JEMALLOC=OFF sh build.sh --be` 进行编译。

当使用 TCMalloc 时，遇到大内存申请会将申请的堆栈打印到 `be.out` 文件中，一般的表现形式如下：

```text
tcmalloc: large alloc 1396277248 bytes == 0x3f3488000 @  0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

这表示 Doris BE 在该堆栈上尝试申请 `1396277248 bytes` 的内存。可以通过 `addr2line` 命令将堆栈还原成可读的信息，具体示例如下：

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

有时内存申请并非由大内存申请导致，而是通过小内存不断堆积导致。这种情况下无法通过查看日志定位具体的申请信息，就需要通过其他方式来获取信息。

这时可以利用 TCMalloc 的 [HEAP PROFILE](https://gperftools.github.io/gperftools/heapprofile.html) 功能。设置 HEAPPROFILE 功能后，可以获得进程整体的内存申请使用情况。使用方式是在启动 Doris BE 前设置 `HEAPPROFILE` 环境变量。例如：

```bash
export TCMALLOC_SAMPLE_PARAMETER=64000 HEAP_PROFILE_ALLOCATION_INTERVAL=-1 HEAP_PROFILE_INUSE_INTERVAL=-1 HEAP_PROFILE_TIME_INTERVAL=5 HEAPPROFILE=/tmp/doris_be.hprof
./bin/start_be.sh --daemon
```

> **注意：** HEAPPROFILE 需要是绝对路径，且目录必须已经存在。

这样，当满足 HEAPPROFILE 的 Dump 条件时，就会将内存的整体使用情况写入到指定路径的文件中。后续可以使用 `pprof` 工具对输出的内容进行分析。

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

**各列的含义：**

- **第一列**：函数直接申请的内存大小，单位 MB。
- **第二列**：第一列的百分比。
- **第三列**：第二列的累积值。
- **第四列**：函数及其所有调用的函数总共占用的内存大小，单位 MB。
- **第五列**：第四列的百分比。

当然也可以生成调用关系图片，更加方便分析。例如下面的命令可以生成 SVG 格式的调用关系图：

```bash
pprof --svg lib/doris_be /tmp/doris_be.hprof.0012.heap > heap.svg
```

**性能提示：** 开启该选项会影响程序的执行性能，请慎重对线上实例开启。

##### pprof Remote Server

HEAP PROFILE 虽然能够获得全部的内存使用信息，但也有一些限制：1. 需要重启 BE；2. 需要一直开启该功能，导致对进程性能造成持续影响。

对 Doris BE 可以使用动态开启、关闭 heap profile 的方式来分析进程的内存申请情况。Doris 内部支持了 GPerftools 的[远程 server 调试](https://gperftools.github.io/gperftools/pprof_remote_servers.html)。可以通过 `pprof` 工具直接对远程运行的 Doris BE 进行动态的 HEAP PROFILE。例如，通过以下命令查看 Doris 的内存使用增量：

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

这个命令的输出和查看方式与 HEAP PROFILE 的输出一致。该命令只在执行过程中开启统计，相比 HEAP PROFILE 对进程性能的影响更小。

#### LSAN（内存泄漏检测工具）

[LSAN](https://github.com/google/sanitizers/wiki/AddressSanitizerLeakSanitizer) 是一个地址检查工具，GCC 已经集成。在编译代码时开启相应的编译选项，就能够开启该功能。当程序发生可以确定的内存泄漏时，会将泄漏堆栈打印出来。Doris BE 已经集成了该工具，只需在编译时使用如下命令即可生成带有内存泄漏检测版本的 BE 二进制：

```bash
BUILD_TYPE=LSAN ./build.sh
```

当系统检测到内存泄漏时，就会在 `be.out` 中输出对应的信息。为了演示，我们故意在代码中插入一段内存泄漏代码。在 `StorageEngine` 的 `open` 函数中插入如下代码：

```cpp
char* leak_buf = new char[1024];
strcpy(leak_buf, "hello world");
LOG(INFO) << leak_buf;
```

然后在 `be.out` 中就能获得如下输出：

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

从上述输出中可以看到有 1024 个字节被泄漏，并且打印出了内存申请时的堆栈信息。

**性能提示：** 开启该选项会影响程序的执行性能，请慎重对线上实例开启。

**注意：** 开启 LSAN 后，TCMalloc 会被自动关闭。

#### ASAN（地址合法性检测工具）

除了内存使用不合理、泄漏以外，有时也会发生内存访问非法地址等错误。这时可以借助 [ASAN](https://github.com/google/sanitizers/wiki/AddressSanitizer) 来帮助找到问题的原因。与 LSAN 一样，ASAN 也集成在了 GCC 中。Doris 通过如下方式进行编译就能开启该功能：

```bash
BUILD_TYPE=ASAN ./build.sh
```

执行编译生成的二进制文件后，当检测工具发现异常访问时，就会立即退出，并将非法访问的堆栈输出在 `be.out` 中。对于 ASAN 的输出与 LSAN 使用相同的分析方法。为了演示，我们主动注入一个地址访问错误。仍然在 `StorageEngine` 的 `open` 函数中注入一段非法内存访问代码：

```cpp
char* invalid_buf = new char[1024];
for (int i = 0; i < 1025; ++i) {
    invalid_buf[i] = i;
}
LOG(INFO) << invalid_buf;
```

然后在 `be.out` 中就会获得如下输出：

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

从这段信息中可以看到在 `0x61900008bf80` 这个地址尝试写入一个字节，但该地址是非法的。同时也可以看到 `[0x61900008bb80,0x61900008bf80)` 这个地址区域的申请堆栈。

**性能提示：** 开启该选项会影响程序的执行性能，请慎重对线上实例开启。

**注意：** 开启 ASAN 后，TCMalloc 会被自动关闭。

另外，如果 `be.out` 中输出的堆栈信息没有函数符号，需要手动处理才能获得可读的堆栈信息。可以使用 [asan_symbolize](https://llvm.org/svn/llvm-project/compiler-rt/trunk/lib/asan/scripts/asan_symbolize.py) 脚本来解析 ASAN 的输出，具体使用方式如下：

```bash
cat be.out | python asan_symbolize.py | c++filt
```

通过上述命令就能获得可读的堆栈信息。

### CPU 调试

当系统的 CPU Idle 很低时，说明 CPU 已经成为主要瓶颈，这时需要分析当前的 CPU 使用情况。对于 Doris BE，有以下两种方式来分析 CPU 瓶颈。

#### pprof

[pprof](https://github.com/google/pprof) 来自 gperftools，用于将 gperftools 产生的内容转换成便于阅读的格式，如 PDF、SVG、Text 等。

由于 Doris 内部已集成并兼容了 GPerf 的 REST 接口，可以通过 `pprof` 工具分析远程的 Doris BE。具体使用方式如下：

```bash
pprof --svg --seconds=60 http://be_host:be_webport/pprof/profile > be.svg
```

该命令会生成一张 BE 执行的 CPU 消耗图。

![CPU Pprof](/images/cpu-pprof-demo.png)

#### perf + FlameGraph

这是一种非常通用的 CPU 分析方式。相比 `pprof`，这种方式必须要求能够登录到分析对象的物理机上。但相比 pprof 只能定时采样，perf 能够通过不同的事件来完成堆栈信息采集。

**工具介绍：**

- [perf](https://perf.wiki.kernel.org/index.php/Main_Page)：Linux 内核自带的性能分析工具。[这里](http://www.brendangregg.com/perf.html)有一些 perf 的使用示例。
- [FlameGraph](https://github.com/brendangregg/FlameGraph)：可视化工具，用于将 perf 的输出以火焰图的形式展示。

**使用方法：**

```bash
perf record -g -p be_pid -- sleep 60
```

该命令会统计 60 秒钟 BE 的 CPU 运行情况，并生成 `perf.data` 文件。对于 `perf.data` 的分析，可以通过 perf 命令进行：

```bash
perf report
```

分析得到的示例：

![Perf Report](/images/perf-report-demo.png)

当然也可以使用 FlameGraph 进行可视化展示：

```bash
perf script | ./FlameGraph/stackcollapse-perf.pl | ./FlameGraph/flamegraph.pl > be.svg
```

这样也会生成一张当时运行的 CPU 消耗图。

![CPU Flame](/images/cpu-flame-demo.svg)

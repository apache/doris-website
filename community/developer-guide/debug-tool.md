---
{
    "title": "Debug Tool",
    "language": "en"
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

# Debug Tool

In the process of using and developing Doris, we often encounter scenarios that need to debug Doris. Here are some common debugging tools.

**The name of the BE binary that appears in this doc is `doris_be`, which was `palo_be` in previous versions.**

## FE debugging

Fe is a java process. Here are just a few simple and commonly used java debugging commands.

1. Statistics of current memory usage details

    ```
    jmap -histo:live pid > 1. jmp
    ```

    This command can enumerate and sort the memory occupation of living objects. (replace PID with Fe process ID)

    ```
    num     #instances         #bytes  class name
    ----------------------------------------------
    1:         33528       10822024  [B
    2:         80106        8662200  [C
    3:           143        4688112  [Ljava.util.concurrent.ForkJoinTask;
    4:         80563        1933512  java. lang.String
    5:         15295        1714968  java. lang.Class
    6:         45546        1457472  java. util. concurrent. ConcurrentHashMap$Node
    7:         15483        1057416  [Ljava.lang.Object;
    ```

    You can use this method to view the total memory occupied by the currently living objects (at the end of the file) and analyze which objects occupy more memory.

    Note that this method will trigger fullgc because `: live 'is specified.

2. Check JVM memory usage

    ```
    jstat -gcutil pid 1000 1000
    ```

    This command can scroll through the memory usage of each region of the current JVM. (replace PID with Fe process ID)

    ```
    S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
    0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
    0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
    0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
    0.00   0.00  22.92   3.03  95.74  92.77     68    1.249     5    0.794    2.043
    0.00   0.00  22.92   3.03  95.74  92.77     68    1.249     5    0.794    2.043
    ```

    The main focus is on the percentage of old area (o) (3% in the example). If the occupancy is too high, oom or fullgc may occur.

3. Print Fe thread stack

    ```
    jstack -l pid > 1. js
    ```

    This command can print the thread stack of the current Fe. (replace PID with Fe process ID).
    `-L ` the parameter will detect whether there is deadlock at the same time. This method can check the operation of Fe thread, whether there is deadlock, where it is stuck, etc.

## BE debugging

### Memory

Debugging memory is generally divided into two aspects. One is whether the total amount of memory use is reasonable. On the one hand, the excessive amount of memory use may be due to memory leak in the system, on the other hand, it may be due to improper use of program memory. The second is whether there is a problem of memory overrun and illegal access, such as program access to memory with an illegal address, use of uninitialized memory, etc. For the debugging of memory, we usually use the following ways to track the problems.

#### Jemalloc HEAP PROFILE

> Doris 1.2.2 version starts to use Jemalloc as the memory allocator by default.

For the principle analysis of Heap Profile, refer to [Heap Profiling Principle Analysis](https://cn.pingcap.com/blog/an-explanation-of-the-heap-profiling-principle/). It should be noted that Heap Profile records virtual memory

Supports real-time and periodic Heap Dump, and then uses `jeprof` to parse the generated Heap Profile.

##### 1. Real-time Heap Dump, used to analyze real-time memory

Change `prof:false` in `JEMALLOC_CONF` in `be.conf` to `prof:true`, change `prof_active:false` to `prof_active:true` and restart Doris BE, then use the Jemalloc Heap Dump HTTP interface to generate a Heap Profile file on the corresponding BE machine.

> For Doris 2.1.8 and 3.0.4 and later versions, `prof` in `JEMALLOC_CONF` is already `true` by default, no need to modify.

For Doris versions before 2.1.8 and 3.0.4, there is no `prof_active` in `JEMALLOC_CONF`, just change `prof:false` to `prof:true`.

```shell
curl http://be_host:be_webport/jeheap/dump
```

The directory where the Heap Profile file is located can be configured in `be.conf` through the `jeprofile_dir` variable, which defaults to `${DORIS_HOME}/log`

The default sampling interval is 512K, which usually only records 10% of the memory, and the impact on performance is usually less than 10%. You can modify `lg_prof_sample` in `JEMALLOC_CONF` in `be.conf`, which defaults to `19` (2^19 B = 512K). Reducing `lg_prof_sample` can sample more frequently to make the Heap Profile closer to the real memory, but this will bring greater performance loss.

If you are doing performance testing, keep `prof:false` to avoid the performance loss of Heap Dump.

##### 2. Regular Heap Dump for long-term memory observation

Change `prof:false` of `JEMALLOC_CONF` in `be.conf` to `prof:true`. The directory where the Heap Profile file is located is `${DORIS_HOME}/log` by default. The file name prefix is ​​`JEMALLOC_PROF_PRFIX` in `be.conf`, and the default is `jemalloc_heap_profile_`.

> Before Doris 2.1.6, `JEMALLOC_PROF_PRFIX` is empty and needs to be changed to any value as the profile file name

1. Dump when the cumulative memory application reaches a certain value:

Change `lg_prof_interval` of `JEMALLOC_CONF` in `be.conf` to 34. At this time, the profile is dumped once when the cumulative memory application reaches 16GB (2^35 B = 16GB). You can change it to any value to adjust the dump interval.

> Before Doris 2.1.6, `lg_prof_interval` defaults to 32.

2. Dump every time the memory reaches a new high:

Change `prof_gdump` in `JEMALLOC_CONF` in `be.conf` to `true` and restart BE.

3. Dump when the program exits, and detect memory leaks:

Change `prof_leak` and `prof_final` in `JEMALLOC_CONF` in `be.conf` to `true` and restart BE.

4. Dump the cumulative value (growth) of memory instead of the real-time value:

Change `prof_accum` in `JEMALLOC_CONF` in `be.conf` to `true` and restart BE.

Use `jeprof --alloc_space` to display the cumulative value of heap dump.

##### 3. `jeprof` parses Heap Profile

Use `be/bin/jeprof` to parse the Heap Profile of the above dump. If the process memory is too large, the parsing process may take several minutes. Please wait patiently.

If there is no `jeprof` binary in the `be/bin` directory of the Doris BE deployment path, you can package the `jeprof` in the `doris/tools` directory and upload it to the server.

> The addr2line version is required to be 2.35.2 or above, see QA-1 below for details
> Try to have Heap Dump and `jeprof` analyze Heap Profile on the same server, that is, analyze Heap Profile directly on the machine running Doris BE as much as possible, see QA-2 below for details

1. Analyze a single Heap Profile file

```shell
jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file
```

After executing the above command, paste the text output by the terminal to the [online dot drawing website](http://www.webgraphviz.com/) to generate a memory allocation graph, and then analyze it.

If the server is convenient for file transfer, you can also use the following command to directly generate a call relationship graph. The result.pdf file is transferred to the local computer for viewing. You need to install the dependencies required for drawing.

```shell
yum install ghostscript graphviz
jeprof --pdf ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file > result.pdf
```

[graphviz](http://www.graphviz.org/): Without this library, pprof can only be converted to text format, but this method is not easy to view. After installing this library, pprof can be converted to svg, pdf and other formats, and the call relationship is clearer.

2. Analyze the diff of two heap profile files

```shell
jeprof --dot ${DORIS_HOME}/lib/doris_be --base=${DORIS_HOME}/log/profile_file ${DORIS_HOME}/log/profile_file2
```

Multiple heap files can be generated by running the above command multiple times over a period of time. You can select an earlier heap file as a baseline and compare and analyze their diff with a later heap file. The method for generating a call graph is the same as above.

##### 4. QA

1. Many errors appear after running jeprof: `addr2line: Dwarf Error: found dwarf version xxx, this reader only handles version xxx`.

GCC 11 and later use DWARF-v5 by default, which requires Binutils 2.35.2 and above. Doris Ldb_toolchain uses GCC 11. See: https://gcc.gnu.org/gcc-11/changes.html.

Replace addr2line to 2.35.2, refer to:
```
// Download addr2line source code
wget https://ftp.gnu.org/gnu/binutils/binutils-2.35.tar.bz2

// Install dependencies, if necessary
yum install make gcc gcc-c++ binutils

// Compile & install addr2line
tar -xvf binutils-2.35.tar.bz2
cd binutils-2.35
./configure --prefix=/usr/local
make
make install

// Verify
addr2line -h

// Replace addr2line
chmod +x addr2line
mv /usr/bin/addr2line /usr/bin/addr2line.bak
mv /bin/addr2line /bin/addr2line.bak
cp addr2line /bin/addr2line
cp addr2line /usr/bin/addr2line
hash -r
```
Note that addr2line 2.3.9 cannot be used, which may be incompatible and cause the memory to keep growing.

2. Many errors appear after running `jeprof`: `addr2line: DWARF error: invalid or unhandled FORM value: 0x25`, and the parsed Heap stack is the memory address of the code, not the function name

Usually, it is because the execution of Heap Dump and the execution of `jeprof` to parse Heap Profile are not on the same server, which causes `jeprof` to fail to parse the function name using the symbol table. Try to complete the operation of Dump Heap and `jeprof` parsing on the same machine, that is, try to parse the Heap Profile directly on the machine running Doris BE.

Or confirm the Linux kernel version of the machine running Doris BE, download the `be/bin/doris_be` binary file and the Heap Profile file to the machine with the same kernel version and execute `jeprof`.

3. If the Heap stack after directly parsing the Heap Profile on the machine running Doris BE is still the memory address of the code, not the function name

Use the following script to manually parse the Heap Profile and modify these variables:

- heap: the file name of the Heap Profile.

- bin: the file name of the `be/bin/doris_be` binary

- llvm_symbolizer: the path of the llvm symbol table parser, the version should preferably be the version used to compile the `be/bin/doris_be` binary.

```
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

4. If all the above methods do not work

- Try to recompile the `be/bin/doris_be` binary on the machine running Doris BE, that is, compile, run, and `jeprof` analyze on the same machine.

- After the above operation, if the Heap stack is still the memory address of the code, try `USE_JEMALLOC=OFF ./build.sh --be` to compile Doris BE using TCMalloc, and then refer to the above section to use TCMalloc Heap Profile to analyze memory.

#### TCMalloc HEAP PROFILE

> Doris 1.2.1 and earlier versions use TCMalloc. Doris 1.2.2 version uses Jemalloc by default. To switch to TCMalloc, you can compile like this: `USE_JEMALLOC=OFF sh build.sh --be`.

When using TCMalloc, when a large memory application is encountered, the application stack will be printed to the be.out file, and the general expression is as follows:

```
tcmalloc: large alloc 1396277248 bytes == 0x3f3488000 @  0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

This indicates that Doris be is trying to apply memory of '1396277248 bytes' on this stack. We can use the 'addr2line' command to restore the stack to a letter that we can understand. The specific example is shown below.

```
$ addr2line -e lib/doris_be  0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed

/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1335
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1357
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.cpp:267
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.hpp:86
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:239
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:213
thread.cpp:?
```

Sometimes the application of memory is not caused by the application of large memory, but by the continuous accumulation of small memory. Then there is no way to locate the specific application information by viewing the log, so you need to get the information through other ways.

At this time, we can take advantage of TCMalloc's [heapprofile](https://gperftools.github.io/gperftools/heapprofile.html). If the heapprofile function is set, we can get the overall memory application usage of the process. The usage is to set the 'heapprofile' environment variable before starting Doris be. For example:

```
export HEAPPROFILE=/tmp/doris_be.hprof
./bin/start_be.sh --daemon
```

In this way, when the dump condition of the heapprofile is met, the overall memory usage will be written to the file in the specified path. Later, we can use the 'pprof' tool to analyze the output content.

```
$ pprof --text lib/doris_be /tmp/doris_be.hprof.0012.heap | head -30

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

Contents of each column of the above documents:

* Column 1: the memory size directly applied by the function, in MB
* Column 4: the total memory size of the function and all the functions it calls.
* The second column and the fifth column are the proportion values of the first column and the fourth column respectively.
* The third column is the cumulative value of the second column.

Of course, it can also generate call relation pictures, which is more convenient for analysis. For example, the following command can generate a call graph in SVG format.

```
pprof --svg lib/doris_be /tmp/doris_be.hprof.0012.heap > heap.svg 
```

**NOTE: turning on this option will affect the execution performance of the program. Please be careful to turn on the online instance.**

##### pprof remote server

Although heapprofile can get all the memory usage information, it has some limitations. 1. Restart be. 2. You need to enable this command all the time, which will affect the performance of the whole process.

For Doris be, you can also use the way of opening and closing the heap profile dynamically to analyze the memory application of the process. Doris supports the [remote server debugging of gperftools](https://gperftools.github.io/gperftools/pprof_remote_servers.html). Then you can use 'pprof' to directly perform dynamic head profile on the remote running Doris be. For example, we can check the memory usage increment of Doris through the following command

```
$ pprof --text --seconds=60 http://be_host:be_webport/pprof/heap 

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

The output of this command is the same as the output and view mode of heap profile, which will not be described in detail here. Statistics will be enabled only during execution of this command, which has a limited impact on process performance compared with heap profile.

#### LSAN

[LSAN](https://github.com/google/sanitizers/wiki/AddressSanitizerLeakSanitizer) is an address checking tool, GCC has been integrated. When we compile the code, we can enable this function by turning on the corresponding compilation options. When the program has a determinable memory leak, it prints the leak stack. Doris be has integrated this tool, only need to compile with the following command to generate be binary with memory leak detection version.

```
BUILD_TYPE=LSAN ./build.sh
```

When the system detects a memory leak, it will output the corresponding information in be. Out. For the following demonstration, we intentionally insert a memory leak code into the code. We insert the following code into the `open` function of `StorageEngine`.

```
    char* leak_buf = new char[1024];
    strcpy(leak_buf, "hello world");
    LOG(INFO) << leak_buf;
```

We get the following output in be.out

```
=================================================================
==24732==ERROR: LeakSanitizer: detected memory leaks

Direct leak of 1024 byte(s) in 1 object(s) allocated from:
    #0 0xd10586 in operator new (unsigned long) ../../../../gcc-7.3.0/libsanitizer/lsan/lsan_interceptors.cc:164
    #1 0xe333a2 in doris::StorageEngine::open(doris::EngineOptions const&, doris::StorageEngine**) /home/ssd0/zc/palo/doris/core/be/src/olap/storage_engine.cpp:104
    #2 0xd3cc96 in main /home/ssd0/zc/palo/doris/core/be/src/service/doris_main.cpp:159
    #3 0x7f573b5eebd4 in __libc_start_main (/opt/compiler/gcc-4.8.2/lib64/libc.so.6+0x21bd4)

SUMMARY: LeakSanitizer: 1024 byte(s) leaked in 1 allocation(s).
```

From the above output, we can see that 1024 bytes have been leaked, and the stack information of memory application has been printed out.

**NOTE: turning on this option will affect the execution performance of the program. Please be careful to turn on the online instance.**

**NOTE: if the LSAN switch is turned on, the TCMalloc will be automatically turned off**

#### ASAN

Except for the unreasonable use and leakage of memory. Sometimes there will be memory access illegal address and other errors. At this time, we can use [ASAN](https://github.com/google/sanitizers/wiki/addresssanitizer) to help us find the cause of the problem. Like LSAN, ASAN is integrated into GCC. Doris can open this function by compiling as follows

```
BUILD_TYPE=ASAN ./build.sh
```

Execute the binary generated by compilation. When the detection tool finds any abnormal access, it will immediately exit and output the stack illegally accessed in be.out. The output of ASAN is the same as that of LSAN. Here we also actively inject an address access error to show the specific content output. We still inject an illegal memory access into the 'open' function of 'storageengine'. The specific error code is as follows

```
    char* invalid_buf = new char[1024];
    for (int i = 0; i < 1025; ++i) {
        invalid_buf[i] = i;
    }
    LOG(INFO) << invalid_buf;
```

We get the following output in be.out

```
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

From this message, we can see that at the address of `0x61900008bf80`, we tried to write a byte, but this address is illegal. We can also see the application stack of the address `[0x61900008bb80, 0x61900008bf80]`.

**NOTE: turning on this option will affect the execution performance of the program. Please be careful to turn on the online instance.**

**NOTE: if the ASAN switch is turned on, the TCMalloc will be automatically turned off**

In addition, if stack information is output in be.out, but there is no function symbol, then we need to handle it manually to get readable stack information. The specific processing method needs a script to parse the output of ASAN. At this time, we need to use [asan_symbolize](https://llvm.org/svn/llvm-project/compiler-rt/trunk/lib/asan/scripts/asan_symbolize.py) to help with parsing. The specific usage is as follows:

```
cat be.out | python asan_symbolize.py | c++filt
```

With the above command, we can get readable stack information.

### CPU

When the CPU idle of the system is very low, it means that the CPU of the system has become the main bottleneck. At this time, it is necessary to analyze the current CPU usage. For the be of Doris, there are two ways to analyze the CPU bottleneck of Doris.

#### pprof

[pprof](https://github.com/google/pprof): from gperftools, it is used to transform the content generated by gperftools into a format that is easy for people to read, such as PDF, SVG, text, etc.

Because Doris has integrated and compatible with GPERF rest interface, users can analyze remote Doris be through the 'pprof' tool. The specific usage is as follows:

```
pprof --svg --seconds=60 http://be_host:be_webport/pprof/profile > be.svg 
```

In this way, a CPU consumption graph of be execution can be generated.

![CPU Pprof](/images/cpu-pprof-demo.png)

#### perf + flamegragh

This is a quite common CPU analysis method. Compared with `pprof`, this method must be able to log in to the physical machine of the analysis object. However, compared with pprof, which can only collect points on time, perf can collect stack information through different events. The specific usage is as follows:

[perf](https://perf.wiki.kernel.org/index.php/main_page): Linux kernel comes with performance analysis tool. [here](http://www.brendangregg.com/perf.html) there are some examples of perf usage.

[flamegraph](https://github.com/brendangregg/flamegraph): a visualization tool used to show the output of perf in the form of flame graph.

```
perf record -g -p be_pid -- sleep 60
```

This command counts the CPU operation of be for 60 seconds and generates perf.data. For the analysis of perf.data, the command of perf can be used for analysis.

```
perf report
```

The analysis results in the following pictures

![Perf Report](/images/perf-report-demo.png)

To analyze the generated content. Of course, you can also use flash graph to complete the visual display.

```
perf script | ./FlameGraph/stackcollapse-perf.pl | ./FlameGraph/flamegraph.pl > be.svg
```

This will also generate a graph of CPU consumption at that time.

![CPU Flame](/images/cpu-flame-demo.svg)

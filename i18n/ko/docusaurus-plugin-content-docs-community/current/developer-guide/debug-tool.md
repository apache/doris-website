---
title: FE/BE 디버깅 도구
language: ko
description: "Apache Doris FE/BE에서 자주 사용하는 디버깅 도구: JVM 모니터링, 메모리 분석 및 BE 디버깅 방법."
keywords:
    - Apache Doris
    - FE 디버깅
    - BE 디버깅
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
    - 메모리 누수
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

# FE/BE 디버깅 도구 {#febe-debug-tools}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

Apache Doris를 개발하고 운영하다 보면 FE와 BE 프로세스를 디버깅해야 할 때가 많습니다. 이 문서에서는 JVM 모니터링, 힙 메모리 분석, CPU 플레임 그래프 및 메모리 접근 유효성 검사에 자주 사용하는 도구를 정리합니다.

> 참고: 이 문서에서 언급하는 BE 바이너리 파일 이름인 `doris_be`는 이전 버전에서 `palo_be`라는 이름으로 사용되었습니다.

## 도구 요약 {#tool-quick-reference}

| 분류 | 도구 | 적용 프로세스 | 주요 용도 |
|------|------|---------|---------|
| JVM 모니터링 | `jmap` / `jstat` / `jstack` | FE | 객체 메모리, GC 및 스레드 스택 확인 |
| Heap Profile | Jemalloc + `jeprof` | BE | 힙 메모리 할당을 실시간 또는 주기적으로 기록 |
| Heap Profile | TCMalloc + `pprof` | BE(이전 버전) | 힙 메모리 샘플링 및 원격 분석 |
| 메모리 접근 유효성 검사 | LSAN / ASAN | BE | 메모리 누수 및 잘못된 접근 감지 |
| CPU 분석 | `pprof` / `perf + FlameGraph` | BE | 함수 단위 CPU 사용량 및 플레임 그래프 |

## FE 디버깅 {#fe-debugging}

FE는 Java 프로세스이므로 JDK에서 제공하는 명령어로 디버깅할 수 있습니다.

### 1. 현재 메모리 사용량 상세 조회 {#1-show-current-memory-usage-details}

```bash
jmap -histo:live pid > 1.jmp
```

`pid`를 FE 프로세스 ID로 바꾸세요. 이 명령어는 살아 있는 객체가 점유한 메모리를 정렬하여 나열하고, 파일 끝에 전체 사용량을 표시합니다.

출력 예시:

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

> 참고: `:live` 매개변수를 전달하면 FullGC가 발생하므로 프로덕션 환경에서는 주의해서 사용하세요.

### 2. JVM 메모리 사용량 확인 {#2-inspect-jvm-memory-usage}

```bash
jstat -gcutil pid 1000 1000
```

`pid`를 FE 프로세스 ID로 바꾸세요. 이 명령어는 매초 JVM의 각 영역별 메모리 사용량을 확인합니다.

출력 예시:

```text
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.61   3.03  95.74  92.77     68    1.249     5    0.794    2.043
  0.00   0.00  22.92   3.03  95.74  92.77     68    1.249     5    0.794    2.043
```

Old generation(O)의 사용률에 주의하세요. 사용률이 너무 높으면 OOM이나 FullGC가 발생할 수 있습니다.

### 3. FE 스레드 스택 출력 {#3-print-fe-thread-stacks}

```bash
jstack -l pid > 1.js
```

`pid`를 FE 프로세스 ID로 바꾸세요. `-l` 매개변수를 사용하면 데드락도 확인합니다. 이 명령어로 FE 스레드 블로킹, 데드락, 자주 실행되는 함수 등의 문제를 조사할 수 있습니다.

## BE 메모리 디버깅 {#be-memory-debugging}

BE 메모리 디버깅에서는 주로 다음 두 가지 유형의 문제를 확인합니다.

1. **메모리 사용량이 적절한지**: 사용량이 지나치게 많으면 메모리 누수나 부적절한 사용을 의심할 수 있습니다.
2. **메모리 접근이 유효한지**: 범위를 벗어난 접근, 초기화되지 않은 메모리 접근 등이 있는지 확인합니다.

### Doris Debug Tools {#doris-debug-tools}

[Doris Debug Tools](https://github.com/morningman/doris-debug-tools)는 CPU 플레임 그래프와 메모리 분석 도구를 패키지로 제공합니다. 다운로드 페이지: [릴리스](https://github.com/morningman/doris-debug-tools/releases).

> 참고: 비공식 도구이며 개발 중 디버깅 용도로만 사용해야 합니다.

### Jemalloc Heap Profile {#jemalloc-heap-profile}

> 참고: Apache Doris는 버전 1.2.2부터 Jemalloc을 기본 메모리 할당자로 사용합니다.

Heap Profile의 원리는 [Heap Profiling 원리 설명](https://cn.pingcap.com/blog/an-explanation-of-the-heap-profiling-principle/)을 참고하세요. Heap Profile은 가상 메모리를 기록한다는 점에 유의하세요.

Jemalloc은 실시간 및 주기적 Heap Dump 모드를 모두 지원합니다. 생성된 Heap Profile은 `jeprof` 도구로 분석합니다.

#### 1. 실시간 Heap Dump(현재 사용 중인 메모리 분석용) {#1-real-time-heap-dump-for-analyzing-live-memory}

절차:

1. `JEMALLOC_CONF`를 `be.conf`에서 수정합니다.

    - `prof:false`를 `prof:true`로 변경
    - `prof_active:false`를 `prof_active:true`로 변경

2. Doris BE를 다시 시작합니다.

3. BE 머신에서 HTTP 인터페이스를 호출하여 Heap Profile 파일을 생성합니다.

    ```bash
    curl http://be_host:be_webport/jeheap/dump
    ```

버전별 참고 사항:

| Doris 버전 | 동작 |
|-----------|------|
| 2.1.8 / 3.0.4 이상 | `prof`의 `JEMALLOC_CONF` 내 기본값이 `true`이므로 수정할 필요 없음 |
| 2.1.8 / 3.0.4 이전 | `JEMALLOC_CONF`에 `prof_active` 옵션이 없으므로 `prof:false`만 `prof:true`로 변경 |

주요 설정:

| 설정 | 설명 | 기본값 |
|--------|------|--------|
| `jeprofile_dir` | Heap Profile 출력 디렉터리 | `${DORIS_HOME}/log` |
| `lg_prof_sample` | 샘플링 간격(`2^N`바이트) | `19`(즉, 512KB) |

`lg_prof_sample` 값을 줄이면 Heap Profile이 실제 메모리에 더 가까워지지만 성능 비용이 증가합니다. 기본 샘플링은 메모리의 약 10%만 기록하며, 성능에 미치는 영향은 일반적으로 10% 미만입니다.

> 성능 팁: 성능 테스트 시에는 Heap Dump 오버헤드를 피하도록 `prof:false`를 유지하세요.

#### 2. 주기적 Heap Dump(장기 메모리 관찰용) {#2-periodic-heap-dump-for-long-term-memory-observation}

`prof:false`를 `prof:true`로 변경하세요. 해당 항목은 `JEMALLOC_CONF` 설정에 있으며, 이 설정은 `be.conf`에 있습니다. 기본적으로 Heap Profile 파일은 `${DORIS_HOME}/log`에 저장되며, 파일 이름에는 `JEMALLOC_PROF_PRFIX` 값이 접두사로 붙습니다(기본값: `jemalloc_heap_profile_`).

> 참고: Doris 2.1.6 이전에는 `JEMALLOC_PROF_PRFIX`가 비어 있으므로 프로파일 파일 이름으로 사용할 값을 지정해야 합니다.

Dump 트리거 방식:

| 트리거 방식 | 설정 | 설명 |
|---------|------|------|
| 누적 메모리 할당량이 임계값에 도달하면 Dump | `lg_prof_interval=34` | 누적 할당량이 16GB(`2^34 B`) 증가할 때마다 Dump. 2.1.6 이전 기본값은 `32` |
| 메모리 사용량이 최고치를 갱신하면 Dump | `prof_gdump=true` | 수정 후 BE 재시작 |
| 프로그램 종료 시 Dump 및 누수 감지 | `prof_leak=true`, `prof_final=true` | 수정 후 BE 재시작 |
| 누적값(증가량) Dump | `prof_accum=true` | `jeprof --alloc_space`로 누적값 표시 |

#### 3. jeprof로 Heap Profile 분석 {#3-parse-heap-profile-with-jeprof}

`be/bin/jeprof`로 Dump된 Heap Profile을 분석합니다. 프로세스 메모리가 크면 분석에 몇 분이 걸릴 수 있습니다.

`jeprof` 바이너리가 `be/bin` 디렉터리에 없으면, `jeprof`를 `doris/tools` 디렉터리에서 찾아 패키징한 뒤 서버에 업로드할 수 있습니다.

> 참고:
> - `addr2line` 버전 2.35.2 이상이 필요합니다. 자세한 내용은 아래 QA-1을 참고하세요.
> - Heap Dump와 `jeprof` 분석은 가급적 Doris BE가 실행 중인 머신에서 수행하세요. 자세한 내용은 아래 QA-2를 참고하세요.

**(1) 단일 Heap Profile 파일 분석**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file
```

터미널에 출력된 텍스트를 [온라인 dot 렌더링 사이트](http://www.webgraphviz.com/)에 붙여 넣으면 메모리 할당 관계 그래프를 생성할 수 있습니다.

서버에서 파일 전송이 가능하면 PDF를 직접 생성할 수 있습니다.

```bash
yum install ghostscript graphviz
jeprof --pdf ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file > result.pdf
```

[graphviz](http://www.graphviz.org/)를 설치하면 `pprof`로 SVG, PDF 등 더 읽기 쉬운 형식을 출력할 수 있습니다.

**(2) 두 Heap Profile 간 차이 분석**

```bash
jeprof --dot ${DORIS_HOME}/lib/doris_be --base=${DORIS_HOME}/log/profile_file ${DORIS_HOME}/log/profile_file2
```

서로 다른 시점에 생성한 Heap Profile을 비교하면 해당 기간에 증가한 메모리 할당을 찾을 수 있습니다.

#### 4. 자주 묻는 질문(QA) {#4-frequently-asked-questions-qa}

**QA-1: `jeprof` 실행 시 `addr2line: Dwarf Error: found dwarf version xxx, this reader only handles version xxx` 오류가 다수 발생함**

원인: GCC 11 이상은 기본적으로 DWARF-v5를 사용하며, 이를 처리하려면 Binutils 2.35.2 이상이 필요합니다. Doris LDB-toolchain은 GCC 11을 사용합니다. [GCC 11 변경 사항](https://gcc.gnu.org/gcc-11/changes.html)을 참고하세요.

해결 방법: `addr2line`을 버전 2.35.2로 업그레이드하세요.

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

> 참고: `addr2line 2.3.9`는 사용하지 마세요. 이 버전은 호환성 문제로 메모리 사용량이 계속 증가할 수 있습니다.

**QA-2: `jeprof` 실행 시 `addr2line: DWARF error: invalid or unhandled FORM value: 0x25` 오류가 보고되고, 스택에 함수 이름 대신 메모리 주소가 표시됨**

원인: 일반적으로 Heap Dump와 `jeprof`를 동일한 서버에서 실행하지 않아 `jeprof`가 심볼 테이블을 분석하지 못하기 때문입니다.

해결 방법:

- 가능하면 Heap Dump와 `jeprof` 분석을 동일한 머신에서 실행하세요.
- 또는 Doris BE가 실행 중인 머신의 Linux 커널 버전을 확인한 뒤, `be/bin/doris_be`와 Heap Profile 파일을 동일한 커널 버전의 머신으로 다운로드하고 `jeprof`를 실행하세요.

**QA-3: Doris BE가 실행 중인 머신에서 분석해도 스택에 여전히 메모리 주소가 표시됨**

아래 스크립트로 Heap Profile을 수동으로 분석하세요. 다음 변수를 수정해야 합니다.

- `heap`: Heap Profile 파일 이름.
- `bin`: `be/bin/doris_be` 바이너리의 파일 이름.
- `llvm_symbolizer`: llvm 심볼 테이블 파서의 경로. 가능하면 `be/bin/doris_be` 바이너리를 컴파일할 때 사용한 것과 동일한 버전을 사용하세요.

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

**QA-4: 위 방법으로도 해결되지 않음**

- Doris BE가 실행 중인 머신에서 `be/bin/doris_be` 바이너리를 다시 컴파일하여 컴파일, 실행 및 `jeprof` 분석을 모두 동일한 머신에서 수행해 보세요.
- 그래도 해결되지 않으면 TCMalloc을 사용하는 BE를 `USE_JEMALLOC=OFF ./build.sh --be`로 컴파일한 뒤, 아래 TCMalloc Heap Profile 절에 따라 메모리를 분석해 보세요.

### TCMalloc Heap Profile {#tcmalloc-heap-profile}

> 참고: Apache Doris 1.2.1 이하는 TCMalloc을 사용하며, 1.2.2부터는 Jemalloc이 기본값입니다. TCMalloc으로 다시 전환하려면 `USE_JEMALLOC=OFF sh build.sh --be`로 컴파일하세요.

TCMalloc을 사용할 때 큰 메모리 할당이 발생하면 다음 형식으로 스택이 `be.out`에 출력됩니다.

```text
tcmalloc: large alloc 1396277248 bytes == 0x3f3488000 @  0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

이는 BE가 해당 스택에서 `1396277248 bytes`의 메모리를 할당하려 했음을 나타냅니다. `addr2line`으로 읽을 수 있는 스택 정보를 복원하세요.

```bash
addr2line -e lib/doris_be 0x2af6f63 0x2c4095b 0x134d278 0x134bdcb 0x133d105 0x133d1d0 0x19930ed
```

출력 예시:

```text
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1335
/home/ssd0/zc/palo/doris/core/thirdparty/src/gperftools-gperftools-2.7/src/tcmalloc.cc:1357
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.cpp:267
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_table.hpp:86
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:239
/home/disk0/baidu-doris/baidu/bdg/doris-baidu/core/be/src/exec/hash_join_node.cpp:213
thread.cpp:?
```

작은 할당이 많이 누적되어 전체 메모리 사용량이 커지면 로그 한 줄만으로는 문제를 찾을 수 없습니다. 이 경우 TCMalloc의 [HEAP PROFILE](https://gperftools.github.io/gperftools/heapprofile.html) 기능을 활성화하려면 BE를 시작하기 전에 `HEAPPROFILE` 환경 변수를 설정하세요.

```bash
export TCMALLOC_SAMPLE_PARAMETER=64000 HEAP_PROFILE_ALLOCATION_INTERVAL=-1 HEAP_PROFILE_INUSE_INTERVAL=-1 HEAP_PROFILE_TIME_INTERVAL=5 HEAPPROFILE=/tmp/doris_be.hprof
./bin/start_be.sh --daemon
```

> 참고: `HEAPPROFILE`은 절대 경로여야 하며, 해당 디렉터리가 미리 존재해야 합니다.

출력 결과를 `pprof`로 분석합니다.

```bash
pprof --text lib/doris_be /tmp/doris_be.hprof.0012.heap | head -30
```

출력 예시:

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

각 열의 의미:

| 열 | 의미 |
|----|------|
| 1열 | 함수가 직접 할당한 메모리(MB) |
| 2열 | 1열 값의 백분율 |
| 3열 | 2열 값의 누적값 |
| 4열 | 해당 함수와 이 함수가 호출하는 모든 함수가 사용하는 총 메모리(MB) |
| 5열 | 4열 값의 백분율 |

SVG 호출 그래프를 생성합니다.

```bash
pprof --svg lib/doris_be /tmp/doris_be.hprof.0012.heap > heap.svg
```

> 성능 팁: 이 옵션을 활성화하면 프로그램 성능에 영향을 미칩니다. 프로덕션 인스턴스에서는 주의해서 활성화하세요.

#### pprof 원격 서버 {#pprof-remote-server}

`HEAP PROFILE`은 전체 메모리 사용 정보를 수집할 수 있지만 다음과 같은 제약이 있습니다.

1. BE를 다시 시작해야 합니다.
2. 계속 활성화해 두어야 하므로 프로세스 성능에 지속적으로 영향을 미칩니다.

이러한 이유로 Doris BE에는 GPerftools의 [원격 서버 디버깅](https://gperftools.github.io/gperftools/pprof_remote_servers.html) 지원이 내장되어 있습니다. 이를 통해 BE를 다시 시작하지 않고도 메모리 증가량을 동적으로 수집할 수 있습니다.

```bash
pprof --text --seconds=60 http://be_host:be_webport/pprof/heap
```

출력 예시:

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

이 명령어는 실행 중에만 통계를 수집하므로 전체 `HEAP PROFILE`보다 프로세스 성능에 미치는 영향이 작습니다.

### LSAN(메모리 누수 감지) {#lsan-memory-leak-detection}

[LSAN](https://github.com/google/sanitizers/wiki/AddressSanitizerLeakSanitizer)은 GCC에 통합되어 있으며, 컴파일 시 활성화하기만 하면 사용할 수 있습니다. Doris BE에는 이미 이 도구가 통합되어 있습니다. 컴파일 명령어는 다음과 같습니다.

```bash
BUILD_TYPE=LSAN ./build.sh
```

메모리 누수가 감지되면 누수가 발생한 스택이 `be.out`에 출력됩니다. 예를 들어 `open` 함수(`StorageEngine`의 멤버 함수)에 다음과 같은 누수 코드를 삽입합니다.

```cpp
char* leak_buf = new char[1024];
strcpy(leak_buf, "hello world");
LOG(INFO) << leak_buf;
```

`be.out` 출력:

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

> 성능 팁: LSAN을 활성화하면 프로그램 성능에 영향을 미칩니다. 프로덕션 인스턴스에서는 주의해서 활성화하세요.

> 참고: LSAN을 활성화하면 TCMalloc이 자동으로 비활성화됩니다.

### ASAN(주소 유효성 검사) {#asan-address-legality-detection}

[ASAN](https://github.com/google/sanitizers/wiki/AddressSanitizer)도 GCC에 통합되어 있으며, 메모리 범위를 벗어난 접근, 잘못된 주소 접근 등의 문제를 감지하는 데 사용합니다. 컴파일 명령어:

```bash
BUILD_TYPE=ASAN ./build.sh
```

ASAN은 잘못된 접근을 감지하면 즉시 종료하고 스택을 `be.out`에 출력합니다. 예를 들어 `open` 함수(`StorageEngine`의 멤버 함수)에 다음과 같은 잘못된 접근 코드를 삽입합니다.

```cpp
char* invalid_buf = new char[1024];
for (int i = 0; i < 1025; ++i) {
    invalid_buf[i] = i;
}
LOG(INFO) << invalid_buf;
```

`be.out` 출력:

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

출력에서 잘못 접근한 주소 `0x61900008bf80`, 할당된 영역 `[0x61900008bb80,0x61900008bf80)` 및 해당 메모리의 할당 스택을 확인할 수 있습니다.

> 성능 팁: ASAN을 활성화하면 프로그램 성능에 영향을 미칩니다. 프로덕션 인스턴스에서는 주의해서 활성화하세요.

> 참고: ASAN을 활성화하면 TCMalloc이 자동으로 비활성화됩니다.

스택이 `be.out`에 출력될 때 함수 심볼이 포함되지 않으면 [asan_symbolize](https://llvm.org/svn/llvm-project/compiler-rt/trunk/lib/asan/scripts/asan_symbolize.py) 스크립트로 수동 분석하세요.

```bash
cat be.out | python asan_symbolize.py | c++filt
```

## BE CPU 디버깅 {#be-cpu-debugging}

CPU Idle이 오랫동안 낮게 유지되면 CPU가 주요 병목이 된 것입니다. Doris BE는 CPU 사용량을 분석하는 여러 방법을 제공합니다.

### CPU 분석 도구 비교 {#comparison-of-cpu-analysis-tools}

| 도구 | 물리 머신 로그인 필요 여부 | 샘플링 방식 | 출력 |
|------|----------------|---------|------|
| Doris Debug Tools | 아니요(패키징된 도구) | 원격 수집 | 플레임 그래프 |
| `pprof` + GPerf REST | 아니요 | 시간 기반 샘플링 | SVG/PDF |
| `perf` + FlameGraph | 예 | 이벤트 기반 샘플링 | 플레임 그래프 |

### Doris Debug Tools(CPU 분석) {#doris-debug-tools-cpu-analysis}

[Doris Debug Tools](https://github.com/morningman/doris-debug-tools)는 CPU 플레임 그래프와 메모리 분석 도구를 패키지로 제공합니다. 다운로드 페이지: [릴리스](https://github.com/morningman/doris-debug-tools/releases).

> 참고: 비공식 도구이며 개발 중 디버깅 용도로만 사용해야 합니다.

### pprof(원격 REST 샘플링) {#pprof-remote-rest-sampling}

[pprof](https://github.com/google/pprof)는 gperftools에서 제공하는 도구로, gperftools 출력을 PDF, SVG, Text 등 읽기 쉬운 형식으로 변환할 수 있습니다. Doris BE는 GPerf REST 인터페이스와 호환됩니다.

```bash
pprof --svg --seconds=60 http://be_host:be_webport/pprof/profile > be.svg
```

이 명령어는 60초 동안의 BE CPU 사용량을 그래프로 생성합니다.

![CPU Pprof 분석 결과](/images/cpu-pprof-demo.png)

### perf + FlameGraph {#perf--flamegraph}

이 방법은 더 범용적인 CPU 분석 방식입니다. `pprof`와 비교하면 분석 대상 물리 머신에 로그인해야 합니다. 다만 `pprof`가 시간 기반 샘플링만 수행하는 반면, `perf`는 다양한 이벤트를 기반으로 스택을 수집할 수 있습니다.

도구 참고 자료:

| 도구 | 링크 |
|------|------|
| `perf` | [perf 홈페이지](https://perf.wiki.kernel.org/index.php/Main_Page), [사용 예시](http://www.brendangregg.com/perf.html) |
| FlameGraph | [GitHub 저장소](https://github.com/brendangregg/FlameGraph) |

절차:

1. BE CPU 데이터를 60초 동안 수집합니다.

    ```bash
    perf record -g -p be_pid -- sleep 60
    ```

2. 수집된 보고서를 확인합니다.

    ```bash
    perf report
    ```

    분석 결과 예시:

    ![Perf 보고서](/images/perf-report-demo.png)

3. FlameGraph로 플레임 그래프를 생성하여 시각화합니다.

    ```bash
    perf script | ./FlameGraph/stackcollapse-perf.pl | ./FlameGraph/flamegraph.pl > be.svg
    ```

    출력 예시:

    ![CPU 플레임 그래프](/images/cpu-flame-demo.svg)

## 문제 해결 {#troubleshooting}

| 증상 | 가능한 원인 | 조치 |
|------|---------|---------|
| `addr2line: Dwarf Error` | DWARF-v5가 이전 버전의 binutils와 호환되지 않음 | `addr2line`을 2.35.2+로 업그레이드. 자세한 내용은 QA-1 참고 |
| `jeprof` 출력이 모두 메모리 주소로 표시됨 | Heap Dump와 분석을 서로 다른 머신에서 수행했거나 심볼 테이블이 일치하지 않음 | 동일한 머신에서 분석하거나 커널 버전을 일치시킴. 자세한 내용은 QA-2/QA-3 참고 |
| FullGC가 자주 발생하고 Old generation 사용률이 100%에 가까움 | FE JVM 힙이 부족하거나 큰 객체의 메모리 누수가 있음 | `jmap -histo:live`와 `jstat -gcutil`로 조사 |
| BE 시작 후 성능 저하 | Heap Profile / ASAN / LSAN이 실수로 활성화됨 | 해당 설정을 비활성화하고 디버깅 용도로만 사용 |

---
title: LDB Toolchain으로 Apache Doris 컴파일하기
language: ko
description: Linux에서 LDB Toolchain으로 Apache Doris를 컴파일하는 방법을 설명합니다. 툴체인 설치 및 빌드 절차를 자세히 안내합니다.
keywords:
    - LDB Toolchain
    - Apache Doris
    - 소스 컴파일
    - Linux 컴파일
    - 사전 컴파일된 서드파티 라이브러리
    - AVX2
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

<!-- Knowledge type: Procedure -->
<!-- Use case: First-time compilation / No Docker environment -->

이 문서는 Linux에서 LDB Toolchain으로 Apache Doris를 컴파일하는 방법을 설명합니다. 이 방식은 [Docker 이미지로 컴파일](./compilation-with-docker)하는 방식을 보완하며, Docker 환경이 없는 개발자에게 적합합니다.

:::tip
LDB Toolchain은 **Linux Distribution Based Toolchain Generator**의 약자입니다. 독립적이고 이식성이 뛰어난 최신 C++ 컴파일 툴체인을 제공하여 거의 모든 Linux 배포판에서 최신 C++ 프로젝트를 빌드할 수 있습니다.
:::

기여해 주신 [Amos Bird](https://github.com/amosbird)님께 감사드립니다.

## 버전 매핑 {#version-mapping}

<!-- Knowledge type: Configuration parameters -->

| Doris 버전 | 권장 LDB Toolchain 버전 | 포함된 컴파일러 |
| ---------- | ----------------------- | ---------- |
| master | 0.25 | clang-20, gcc-15 |
| 3.1 / 3.0 / 2.1 | 0.19 | clang-17, gcc-13 |

## 대상 사용자 및 장단점 {#target-audience-pros-and-cons}

| 항목 | 설명 |
| ---- | ---- |
| 대상 사용자 | Docker 환경 없이 물리 머신이나 가상 머신에서 직접 컴파일하려는 개발자 |
| 장점 | Docker에 의존하지 않으며, 툴체인이 독립적으로 구성되어 시스템 컴파일러 환경에 영향을 주지 않음 |
| 단점 | Java, Maven, Node 및 시스템 수준의 의존성을 수동으로 설치해야 함 |

## 1. 컴파일 환경 준비 {#1-prepare-the-compilation-environment}

<!-- Knowledge type: Procedure -->
<!-- Use case: First-time compilation -->

대부분의 Linux 배포판(CentOS, Ubuntu 등)에 적용할 수 있습니다.

### 1.1 `ldb_toolchain_gen.sh` 다운로드 {#11-download-ldb_toolchain_gensh}

[ldb_toolchain_gen 릴리스](https://github.com/amosbird/ldb_toolchain_gen/releases)에서 해당 버전을 다운로드합니다.

- x86_64 아키텍처: `ldb_toolchain_gen.sh` 다운로드
- ARM 아키텍처: `ldb_toolchain_gen.aarch64.sh` 다운로드

:::tip
프로젝트 홈페이지: <https://github.com/amosbird/ldb_toolchain_gen>
:::

### 1.2 LDB Toolchain 생성 {#12-generate-the-ldb-toolchain}

스크립트를 실행하여 툴체인을 생성합니다.

```bash
bash ldb_toolchain_gen.sh /path/to/ldb_toolchain/
```

여기서 `/path/to/ldb_toolchain/`은 설치 대상 디렉터리입니다. 스크립트가 성공적으로 실행되면 해당 디렉터리에 다음 구조가 생성됩니다.

```text
├── bin
├── include
├── lib
├── share
├── test
└── usr
```

### 1.3 기타 컴파일 구성 요소 설치 {#13-install-other-compilation-components}

| 구성 요소 | 권장 버전 | 다운로드 URL |
| ---- | -------- | -------- |
| JDK 8 | 1.8.0_391 | [jdk-8u391-linux-x64.tar.gz](https://doris-thirdparty-1308700295.cos.ap-beijing.myqcloud.com/tools/jdk-8u391-linux-x64.tar.gz) |
| JDK 17 | 17.0.10 | [jdk-17.0.10_linux-x64](https://download.oracle.com/java/17/archive/jdk-17.0.10_linux-x64_bin.tar.gz) |
| Maven | 3.9.9 | [apache-maven-3.9.9-bin.tar.gz](https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz) |
| Node | v12.13.0 | [node-v12.13.0-linux-x64.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/node-v12.13.0-linux-x64.tar.gz) |

JDK 버전 선택 기준:

- Doris 2.1 이하: JDK 8 사용
- Doris 3.0 이상 또는 master 브랜치: JDK 17 사용
- Linux 배포판의 패키지 관리자(`yum`, `apt` 등)를 통해 OpenJDK 8 또는 17을 직접 설치할 수도 있습니다.

Linux 배포판마다 기본으로 제공하는 시스템 구성 요소가 다르므로 도구를 추가로 설치해야 할 수 있습니다. CentOS 6을 예로 들면 다음과 같습니다.

```bash
# Install system dependencies
sudo yum install -y byacc patch automake libtool make which file ncurses-devel gettext-devel unzip bzip2 zip util-linux wget git python2

# Install autoconf-2.69
wget http://ftp.gnu.org/gnu/autoconf/autoconf-2.69.tar.gz && \
    tar zxf autoconf-2.69.tar.gz && \
    cd autoconf-2.69 && \
    ./configure && \
    make && \
    make install

# Install bison-3.8.2
wget http://ftp.gnu.org/gnu/bison/bison-3.8.2.tar.gz && \
    tar xzf bison-3.8.2.tar.gz && \
    cd bison-3.8.2 && \
    ./configure && \
    make && \
    make install
```

### 1.4 Doris 소스 코드 다운로드 및 환경 변수 설정 {#14-download-the-doris-source-code-and-configure-environment-variables}

```bash
git clone https://github.com/apache/doris.git
```

소스 디렉터리로 이동한 후 다음 환경 변수를 포함하는 `custom_env.sh` 파일을 생성합니다.

```bash
export JAVA_HOME=/path/to/java/
export PATH=$JAVA_HOME/bin:$PATH
export PATH=/path/to/maven/bin:$PATH
export PATH=/path/to/node/bin:$PATH
export PATH=/path/to/ldb_toolchain/bin:$PATH
```

## 2. Doris 컴파일 {#2-compile-doris}

<!-- Knowledge type: Procedure -->

:::tip
기본적으로 `build.sh`는 서드파티 라이브러리를 먼저 컴파일합니다. 서드파티 라이브러리 컴파일을 건너뛰려면 [3. 사전 컴파일된 서드파티 라이브러리로 컴파일 속도 높이기](#3-speed-up-with-precompiled-third-party-libraries)를 참조하세요.
:::

### 2.1 AVX2 지원 여부 확인 {#21-check-whether-avx2-is-supported}

```bash
cat /proc/cpuinfo | grep avx2
```

출력이 비어 있지 않으면 CPU가 AVX2를 지원한다는 뜻입니다.

### 2.2 컴파일 실행 {#22-run-the-compilation}

```bash
# By default, build artifacts that support AVX2
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Compile the Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

스크립트는 서드파티 라이브러리, FE, BE, MS를 순서대로 컴파일하고 빌드 결과물을 `output/` 디렉터리에 저장합니다. MS 모듈은 스토리지와 컴퓨팅을 분리하는 모드에서 사용됩니다. 자세한 내용은 관련 문서를 참조하세요.

## 3. 사전 컴파일된 서드파티 라이브러리로 컴파일 속도 높이기 {#3-speed-up-with-precompiled-third-party-libraries}

<!-- Use case: Speed up compilation / Restricted network -->

기본적으로 `build.sh`는 서드파티 라이브러리를 소스에서 컴파일하므로 시간이 오래 걸립니다. 커뮤니티에서 제공하는 사전 컴파일된 버전을 직접 다운로드할 수도 있습니다.

```text
https://github.com/apache/doris-thirdparty/releases
```

커뮤니티는 Linux, macOS, ARM용으로 사전 컴파일된 빌드 결과물을 제공합니다. 패키지를 다운로드하고 압축을 풀면 `installed/` 디렉터리가 생성됩니다. 이 디렉터리를 Doris 소스의 `thirdparty/` 디렉터리에 복사한 후 `build.sh`를 실행하면 서드파티 라이브러리 컴파일을 건너뛸 수 있습니다.

## 자주 묻는 질문 {#faq}

### Q1: LDB Toolchain 버전은 어떻게 선택하나요? {#q1-how-do-i-choose-an-ldb-toolchain-version}

위 테이블에 따라 master 브랜치에는 0.25를, 3.1, 3.0, 2.1 브랜치에는 0.19를 사용하세요. 버전이 맞지 않으면 ABI 불일치와 링크 실패가 발생할 수 있습니다.

### Q2: `cat /proc/cpuinfo | grep avx2` 명령이 아무것도 출력하지 않으면 어떻게 하나요? {#q2-what-if-cat-proccpuinfo--grep-avx2-produces-no-output}

CPU가 AVX2를 지원하지 않는다는 뜻입니다. 컴파일할 때 `USE_AVX2=0`을 추가하고, `-no-avx2` 버전의 사전 컴파일된 서드파티 라이브러리나 컴파일 이미지를 사용하세요.

### Q3: 컴파일 중 `Too many open files` 오류가 발생하면 어떻게 하나요? {#q3-what-if-i-hit-too-many-open-files-during-compilation}

`ulimit -n 65536`으로 파일 핸들 제한을 높이거나, 이 설정을 `/etc/security/limits.conf`에 추가하여 영구적으로 적용하세요.

### Q4: ARM에서 컴파일할 때 주의할 점은 무엇인가요? {#q4-what-should-i-watch-out-for-when-compiling-on-arm}

`ldb_toolchain_gen.aarch64.sh`를 다운로드하고, AVX2, libunwind, Azure 및 기타 호환되지 않는 서드파티 라이브러리를 비활성화하는 방법은 [ARM 플랫폼 컴파일](./compilation-arm)을 참조하세요.

## 관련 문서 {#related-documents}

- [Docker 이미지로 컴파일](./compilation-with-docker)
- [Linux에서 직접 컴파일](./compilation-linux)
- [ARM 플랫폼 컴파일](./compilation-arm)

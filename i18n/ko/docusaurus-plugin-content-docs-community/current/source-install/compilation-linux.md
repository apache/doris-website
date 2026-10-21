---
title: Linux에서 Apache Doris 직접 컴파일하기
language: ko
description: "Linux에서 Apache Doris를 직접 컴파일하는 방법: JDK, 의존성, AVX2 명령어 집합 지원 여부 확인 및 빌드 명령어."
keywords:
    - Linux 컴파일
    - Apache Doris
    - 소스 컴파일
    - Ubuntu
    - JDK 17
    - AVX2
    - build.sh
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
<!-- Applicable scenario: First-time compilation / compiling directly on a physical machine -->

이 문서는 Docker 이미지나 LDB Toolchain을 사용하지 않고 Linux에서 Apache Doris를 직접 컴파일하는 방법을 설명합니다. 예시 환경은 Ubuntu 24.04 이상입니다.

## 대상 독자와 장단점 {#target-audience-pros-and-cons}

| 항목 | 설명 |
| ---- | ---- |
| 대상 독자 | Ubuntu 24.04+와 같은 최신 배포판에서 시스템에 기본 제공되는 GCC를 사용하려는 개발자 |
| 장점 | 필요한 단계가 가장 적으며, 시스템 패키지 관리자로 의존성을 직접 설치할 수 있음 |
| 단점 | 이전 배포판에서는 GCC 또는 glibc 버전이 너무 낮아 컴파일에 실패할 수 있음. 이 경우 [LDB Toolchain](./compilation-with-ldb-toolchain)을 사용 |

## 환경 요구 사항 {#environment-requirements}

<!-- Knowledge type: Hardware requirements -->

| 구성 요소 | 버전 요구 사항 |
| ---- | -------- |
| 운영 체제 | Ubuntu 24.04+ 또는 이에 상응하는 다른 배포판 버전 |
| JDK | 8+ (버전 2.1 이하); 17 (버전 3.0 이상 또는 master 브랜치) |
| GCC | 10+ |
| Python | 2.7+ |
| Apache Maven | 3.5+ |
| CMake | 3.19.2+ |
| Bison | 3.0+ |

## 1. JDK 설치 {#1-install-jdk}

<!-- Knowledge type: Procedure -->

컴파일할 Doris 버전에 맞는 JDK를 선택합니다.

```bash
# To compile Doris 2.1 or earlier, install JDK 8
sudo apt install openjdk-8-jdk

# To compile Doris 3.0 or later, or the master branch, install JDK 17
sudo apt install openjdk-17-jdk
```

## 2. 시스템 의존성 설치 {#2-install-system-dependencies}

```bash
sudo apt install build-essential maven cmake byacc flex automake libtool-bin bison binutils-dev libiberty-dev zip unzip libncurses5-dev curl git ninja-build python
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
sudo apt update
sudo apt install gcc-10 g++-10
sudo apt-get install autoconf automake libtool autopoint
```

## 3. CPU의 AVX2 지원 여부 확인 {#3-check-whether-the-cpu-supports-avx2}

```bash
cat /proc/cpuinfo | grep avx2
```

출력이 비어 있지 않으면 CPU가 AVX2를 지원하므로 기본 컴파일 옵션을 사용할 수 있습니다. 그렇지 않으면 빌드 명령어에 `USE_AVX2=0`을 추가합니다.

## 4. 빌드 실행 {#4-run-the-build}

```bash
# Default build, producing AVX2-enabled artifacts
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Build a Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

## 5. 빌드 결과물 위치 확인 {#5-locate-the-build-artifacts}

빌드가 완료되면 결과물은 소스 루트 디렉터리의 `output/` 아래에 생성됩니다.

## 자주 묻는 질문 {#faq}

### Q1: 이전 버전의 Ubuntu나 CentOS에서도 직접 컴파일할 수 있나요? {#q1-can-older-versions-of-ubuntu-or-centos-compile-directly}

이전 배포판에 기본 제공되는 GCC와 glibc는 대체로 버전이 너무 낮습니다. [LDB Toolchain](./compilation-with-ldb-toolchain)이나 [Docker 이미지](./compilation-with-docker)를 사용하세요.

### Q2: 빌드 중 `AVX2 not supported` 오류가 발생합니다. {#q2-the-build-reports-avx2-not-supported}

CPU가 AVX2 명령어 집합을 지원하지 않습니다. `USE_AVX2=0 sh build.sh`로 다시 실행하고, 미리 빌드된 서드파티 라이브러리 중 `no-avx2` 계열을 다운로드하세요.

### Q3: `Too many open files` 오류로 빌드에 실패합니다. {#q3-the-build-fails-with-too-many-open-files}

`ulimit -n 65536`으로 프로세스별 파일 핸들 제한을 높이거나, `/etc/security/limits.conf`에서 영구적으로 설정하세요.

### Q4: 메모리 부족으로 빌드가 도중에 강제 종료됩니다. {#q4-the-build-is-killed-midway-due-to-insufficient-memory}

`ninja failed with: signal: killed` 메시지는 일반적으로 OOM을 나타냅니다. 메모리가 16 GB 이상인 머신을 사용하거나 병렬 처리 수준(`-j` 매개변수)을 낮추세요.

## 관련 문서 {#related-documents}

- [LDB Toolchain으로 컴파일하기](./compilation-with-ldb-toolchain)
- [Docker 이미지로 컴파일하기](./compilation-with-docker)
- [ARM에서 컴파일하기](./compilation-arm)

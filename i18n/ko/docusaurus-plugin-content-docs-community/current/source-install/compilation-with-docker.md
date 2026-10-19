---
title: Docker 이미지로 Apache Doris 컴파일하기
language: ko
description: thirdparty나 toolchain을 수동으로 구성할 필요 없이 공식 Docker 이미지로 Apache Doris 소스 코드를 컴파일합니다.
keywords:
    - Docker 컴파일
    - Apache Doris
    - 소스 컴파일
    - build-env
    - AVX2
    - JDK 8
    - JDK 17
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
"AS IS" BASIS, WITHOUT WARRANTIES OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: First-time compilation / Environment validation -->

이 문서는 Apache Doris의 공식 빌드 이미지를 사용하여 Doris 소스 코드를 컴파일하는 방법을 설명합니다. 이 이미지는 커뮤니티에서 유지 관리하며 의존성 변경 사항을 신속하게 반영하므로 toolchain과 서드파티 라이브러리를 수동으로 설치할 필요가 없습니다. **가장 권장하는** 컴파일 방법입니다.

:::tip
Docker 이미지를 사용하는 방법은 아직 스토리지와 컴퓨팅을 분리하는 모드의 컴파일 및 배포를 지원하지 않습니다.
:::

## 대상 사용자와 장단점 {#target-audience-pros-and-cons}

| 항목 | 설명 |
| ---- | ---- |
| 대상 사용자 | 의존성을 수동으로 구성하지 않고 빌드 환경을 빠르게 구축하려는 개발자 |
| 장점 | 이미지에 thirdparty, toolchain, JDK가 미리 설치되어 있어 바로 사용 가능 |
| 단점 | 로컬 컴퓨터에서 Docker를 사용할 수 있어야 하며, 이미지 크기가 비교적 큼(약 3.3 GB) |

컴퓨터에서 Docker를 사용할 수 없다면 [LDB Toolchain으로 컴파일하기](./compilation-with-ldb-toolchain)를 이용하세요.

## 1. Docker 설치하기 {#1-install-docker}

CentOS에서는 패키지 관리자로 바로 설치합니다.

```bash
yum install docker
```

다른 배포판은 [Docker 공식 설치 가이드](https://docs.docker.com/engine/install/)를 참고하세요.

## 2. 빌드 이미지 선택 및 다운로드하기 {#2-choose-and-download-the-build-image}

<!-- Knowledge type: Configuration parameters -->

Doris 버전마다 해당하는 빌드 이미지가 다릅니다. `apache/doris:build-env-ldb-toolchain-latest`는 master 브랜치 코드를 컴파일하는 데 사용하며, trunk의 변경 사항에 맞춰 지속적으로 업데이트됩니다.

| 이미지 태그 | 해당 Doris 버전 | 참고 사항 |
| -------- | --------------- | ---- |
| `apache/doris:build-env-for-2.0` | 2.0.x | AVX2 명령어 세트 지원 |
| `apache/doris:build-env-for-2.0-no-avx2` | 2.0.x | AVX2를 지원하지 않는 CPU와 호환 |
| `apache/doris:build-env-for-2.1` | 2.1.x | AVX2 명령어 세트 지원 |
| `apache/doris:build-env-for-2.1-no-avx2` | 2.1.x | AVX2를 지원하지 않는 CPU와 호환 |
| `apache/doris:build-env-for-3.0` | 3.0.x | AVX2 명령어 세트 지원 |
| `apache/doris:build-env-for-3.0-no-avx2` | 3.0.x | AVX2를 지원하지 않는 CPU와 호환 |
| `apache/doris:build-env-for-3.1` | 3.1.x | AVX2 명령어 세트 지원 |
| `apache/doris:build-env-for-3.1-no-avx2` | 3.1.x | AVX2를 지원하지 않는 CPU와 호환 |
| `apache/doris:build-env-ldb-toolchain-latest` | master | trunk의 변경 사항 반영 |
| `apache/doris:build-env-ldb-toolchain-no-avx2-latest` | master | AVX2를 지원하지 않는 CPU와 호환 |

Doris 2.0 컴파일을 예로 들어 이미지를 다운로드하고 확인합니다.

```bash
# You can also use docker.io/apache/doris:build-env-for-2.0
docker pull apache/doris:build-env-for-2.0

# Confirm that the image has been downloaded successfully
docker images
# REPOSITORY      TAG                  IMAGE ID        CREATED       SIZE
# apache/doris    build-env-for-2.0    f29cf1979dba    3 days ago    3.3GB
```

### 이미지 선택 시 참고 사항 {#notes-on-image-selection}

- 이미지 태그는 Doris 버전과 일대일로 대응합니다. 대상 브랜치에 맞는 이미지를 선택하고 서로 다른 버전을 조합하여 컴파일하지 마세요.
- `no-avx2` 이미지의 서드파티 라이브러리는 AVX2를 지원하지 않는 CPU에서도 실행할 수 있습니다. 컴파일할 때는 `USE_AVX2=0` 옵션도 함께 사용해야 합니다.
- 이미지 변경 이력은 [thirdparty CHANGELOG](https://github.com/apache/doris/blob/master/thirdparty/CHANGELOG.md)를 참고하세요.
- 최신 `apache/doris:build-env-ldb-toolchain-latest` 이미지(현재 x86_64 아키텍처만 지원)에는 JDK 8과 JDK 17이 모두 포함되어 있습니다. JDK 8은 2.1 이하 버전에, JDK 17은 3.0 이상 버전이나 master 브랜치에 사용하세요.
- ARM64 아키텍처에서 Docker로 컴파일할 때는 먼저 ARM64와 호환되는 Linux 기본 이미지(예: `apache/doris:base-latest`, Ubuntu 22.04.5 LTS 기반)를 다운로드한 다음, [Linux에서 직접 컴파일하기](./compilation-linux)와 [ARM 플랫폼에서 컴파일하기](./compilation-arm) 문서를 참고하여 의존성을 설치하고 컴파일하세요.

컨테이너 안에서 환경 변수로 JDK를 전환합니다.

```bash
# Switch to JDK 8
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin/:$PATH

# Switch to JDK 17
export JAVA_HOME=/usr/lib/jvm/jdk-17.0.2/
export PATH=$JAVA_HOME/bin/:$PATH
```

## 3. Doris 컴파일하기 {#3-compile-doris}

<!-- Knowledge type: Procedure -->

### 3.1 Doris 소스 코드 다운로드하기 {#31-download-the-doris-source-code}

호스트 컴퓨터에서 대상 브랜치의 코드를 가져옵니다(branch-2.0을 예로 사용).

```bash
git clone -b branch-2.0 https://github.com/apache/doris.git
```

소스 디렉터리는 `~/doris-branch-2.0`이라고 가정합니다.

### 3.2 빌드 컨테이너 시작하기 {#32-start-the-build-container}

```bash
# Prepare the maven .m2 directory on the host in advance so that Java dependencies can be reused across multiple builds
mkdir ~/.m2

# Mount the source code and the .m2 directory, then start the build image
docker run -it --network=host \
    --name mydocker \
    -v ~/.m2:/root/.m2 \
    -v ~/doris-branch-2.0:/root/doris-branch-2.0/ \
    apache/doris:build-env-for-2.0

# After the command runs successfully, it enters the container automatically
```

주요 `docker run` 매개변수 설명:

| 매개변수 | 용도 |
| ---- | ---- |
| `-v` | 호스트 디렉터리를 컨테이너에 마운트하여 소스 코드와 의존성을 영구 보관 |
| `--name` | 이후 관리를 쉽게 할 수 있도록 컨테이너 이름 지정 |
| `--network` | 컨테이너의 네트워크 모드 설정. `host`는 호스트의 네트워크 스택을 공유하므로 포트 매핑이 필요하지 않음 |

권장 사항:

- 컨테이너가 종료되어도 빌드 결과물이 호스트에 남아 있도록 Doris 소스 디렉터리를 항상 마운트하세요.
- 컨테이너를 시작할 때마다 Maven 의존성을 다시 다운로드하지 않도록 `.m2` 디렉터리를 마운트하세요.
- 컨테이너 안에서 서드파티 라이브러리를 다운로드하려면 인터넷에 연결되어 있어야 합니다. `--network=host` 모드를 권장합니다.

### 3.3 빌드 실행하기 {#33-run-the-build}

컨테이너 안에서 소스 디렉터리로 이동한 후 다음 명령을 실행합니다.

```bash
# By default, compile artifacts that support AVX2
sh build.sh

# When the CPU does not support AVX2, append USE_AVX2=0
USE_AVX2=0 sh build.sh

# Compile the Debug version of BE
BUILD_TYPE=Debug sh build.sh
```

빌드가 완료되면 결과물은 소스 디렉터리의 `output/` 아래에 생성됩니다.

:::tip
**컴퓨터의 AVX2 명령어 세트 지원 여부는 어떻게 확인하나요?**

```bash
cat /proc/cpuinfo | grep avx2
```

출력이 비어 있지 않으면 AVX2를 지원한다는 뜻입니다.
:::

## 4. 나만의 개발 이미지 만들기 {#4-build-your-own-development-image}

기본 배포판을 변경하거나 디버깅 도구를 추가하는 등 기본 이미지를 사용자 지정하려면 소스 코드의 `docker/README.md`를 참고하세요.

## 자주 묻는 질문 {#faq}

### Q1: 이미지 버전이 Doris 버전과 일치하지 않으면 어떻게 되나요? {#q1-what-happens-if-the-image-version-does-not-match-the-doris-version}

이미지에 포함된 thirdparty 라이브러리와 toolchain은 Doris 소스 코드와 밀접하게 연관되어 있습니다. 서로 다른 버전을 조합하면 컴파일 중 `undefined reference`나 `incompatible library`와 같은 링커 오류가 발생할 가능성이 매우 높습니다. 반드시 테이블에 따라 선택하세요.

### Q2: 빌드 중 `AVX2 not supported` 오류가 발생하나요? {#q2-the-build-reports-avx2-not-supported}

호스트 또는 실제 실행 대상 컴퓨터의 CPU가 AVX2 명령어 세트를 지원하지 않습니다. 접미사가 `no-avx2`인 이미지로 전환하고 빌드 시 `USE_AVX2=0`을 설정하세요.

### Q3: `docker pull`로 이미지를 다운로드하는 속도가 너무 느린가요? {#q3-docker-pull-is-too-slow-to-pull-the-image}

Docker 이미지 미러 가속 서비스를 설정하거나 전체 경로인 `docker.io/apache/doris:...`를 사용하세요.

### Q4: 컨테이너 안에서 Java 라이브러리 다운로드에 실패하나요? {#q4-java-library-downloads-fail-inside-the-container}

컨테이너를 `--network=host`로 시작했는지, `~/.m2` 디렉터리가 컨테이너에 마운트되어 있는지 확인하세요. 프록시나 네트워크 격리로 인해 Maven 중앙 저장소에 접근하지 못하는 상황을 방지할 수 있습니다.

## 관련 문서 {#related-documents}

- [LDB Toolchain으로 컴파일하기](./compilation-with-ldb-toolchain)
- [Linux에서 직접 컴파일하기](./compilation-linux)
- [ARM 플랫폼에서 컴파일하기](./compilation-arm)

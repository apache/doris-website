---
title: Docker 이미지로 Apache Doris 컴파일하기
language: ko
description: 공식 Docker 이미지로 Apache Doris 소스 코드를 컴파일합니다. thirdparty나 toolchain을 수동으로 구성할 필요가 없습니다.
keywords:
    - Docker compilation
    - Apache Doris
    - source compilation
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

이 문서에서는 공식 Apache Doris 빌드 이미지를 사용하여 Doris 소스 코드를 컴파일하는 방법을 설명합니다. 커뮤니티에서 이 이미지를 유지 관리하고 종속성 변경에 맞춰 신속하게 업데이트하므로 toolchain과 타사 라이브러리를 수동으로 설치할 필요가 없습니다. **가장 권장하는** 컴파일 방법입니다.

:::tip
Docker 이미지를 사용하는 방법은 아직 스토리지·컴퓨팅 분리 모드의 컴파일 및 배포를 지원하지 않습니다.
:::

## 대상 독자와 장단점 {#target-audience-pros-and-cons}

| 항목 | 설명 |
| ---- | ---- |
| 대상 독자 | 종속성을 수동으로 구성하지 않고 빌드 환경을 빠르게 설정하려는 개발자 |
| 장점 | 이미지에 thirdparty, toolchain, JDK가 사전 설치되어 있어 바로 사용할 수 있음 |
| 단점 | 로컬 머신에서 Docker를 사용할 수 있어야 하며, 이미지 크기가 비교적 큼(약 3.3 GB) |

머신에서 Docker를 사용할 수 없다면 [LDB Toolchain으로 컴파일하기](./compilation-with-ldb-toolchain)를 이용하세요.

## 1. Docker 설치 {#1-install-docker}

CentOS에서는 패키지 관리자로 바로 설치합니다.

```bash
yum install docker
```

다른 배포판에서는 [Docker 공식 설치 가이드](https://docs.docker.com/engine/install/)를 참고하세요.

## 2. 빌드 이미지 선택 및 다운로드 {#2-choose-and-download-the-build-image}

<!-- Knowledge type: Configuration parameters -->

Doris 버전마다 대응하는 빌드 이미지가 다릅니다. `apache/doris:build-env-ldb-toolchain-latest`는 master 브랜치 코드를 컴파일할 때 사용하며, 메인 개발 브랜치에 맞춰 지속적으로 업데이트됩니다.

| 이미지 태그 | 적용 가능한 Doris 버전 | 비고 |
| -------- | --------------- | ---- |
| `apache/doris:build-env-for-2.0` | 2.0.x | AVX2 명령어 집합 지원 |
| `apache/doris:build-env-for-2.0-no-avx2` | 2.0.x | AVX2를 지원하지 않는 CPU와 호환 |
| `apache/doris:build-env-for-2.1` | 2.1.x | AVX2 명령어 집합 지원 |
| `apache/doris:build-env-for-2.1-no-avx2` | 2.1.x | AVX2를 지원하지 않는 CPU와 호환 |
| `apache/doris:build-env-for-3.0` | 3.0.x | AVX2 명령어 집합 지원 |
| `apache/doris:build-env-for-3.0-no-avx2` | 3.0.x | AVX2를 지원하지 않는 CPU와 호환 |
| `apache/doris:build-env-for-3.1` | 3.1.x | AVX2 명령어 집합 지원 |
| `apache/doris:build-env-for-3.1-no-avx2` | 3.1.x | AVX2를 지원하지 않는 CPU와 호환 |
| `apache/doris:build-env-ldb-toolchain-latest` | master | 메인 개발 브랜치를 따라 업데이트됨 |
| `apache/doris:build-env-ldb-toolchain-no-avx2-latest` | master | AVX2를 지원하지 않는 CPU와 호환 |

다음 명령은 호스트에서 실행합니다. 이 예시에서는 `master`를 빌드합니다. 릴리스 브랜치를 빌드하려면 위 표에 따라 브랜치와 이미지를 모두 변경하세요. 이 변수들을 계속 사용하려면 이후의 호스트 명령도 같은 셸에서 실행하세요. ARM64와 JDK 관련 내용은 [이미지 선택 시 참고 사항](#notes-on-image-selection)을 참조하세요.

```bash
DORIS_BRANCH=master
DORIS_BUILD_IMAGE=apache/doris:build-env-ldb-toolchain-latest
DORIS_SOURCE_DIR="$PWD/doris"

docker pull "$DORIS_BUILD_IMAGE"
```

## 3. Doris 컴파일 {#3-compile-doris}

<!-- Knowledge type: Procedure -->

### 3.1 Doris 소스 코드 다운로드 {#31-download-the-doris-source-code}

호스트에서 선택한 브랜치를 위에서 설정한 디렉터리에 복제합니다.

```bash
git clone --branch "$DORIS_BRANCH" https://github.com/apache/doris.git "$DORIS_SOURCE_DIR"
```

### 3.2 빌드 컨테이너 시작 {#32-start-the-build-container}

```bash
mkdir -p "$HOME/.m2"

docker run -it --network=host \
    --name doris-build \
    -v "$HOME/.m2:/root/.m2" \
    -v "$DORIS_SOURCE_DIR:/root/doris" \
    --workdir /root/doris \
    "$DORIS_BUILD_IMAGE"
```

이 명령은 컨테이너 안에서 Bash를 열고, 마운트된 소스 디렉터리 `/root/doris`를 작업 디렉터리로 설정합니다.

주요 `docker run` 매개변수의 의미는 다음과 같습니다.

| 매개변수 | 용도 |
| ---- | ---- |
| `-v` | 호스트 디렉터리를 컨테이너에 마운트하여 소스 코드와 종속성을 유지함 |
| `--name` | 나중에 관리하기 쉽도록 컨테이너 이름을 지정함 |
| `--workdir` | 마운트된 소스 디렉터리에서 셸을 시작함 |
| `--network` | 컨테이너의 네트워크 모드를 설정함. `host`는 호스트와 네트워크 스택을 공유하므로 포트 매핑이 필요 없음 |

권장 사항:

- 빌드 결과물이 호스트에 남아 컨테이너가 종료되어도 사라지지 않도록 Doris 소스 디렉터리를 항상 마운트하세요.
- 컨테이너를 시작할 때마다 Maven 종속성을 다시 다운로드하지 않도록 `.m2` 디렉터리를 마운트하세요.
- 컨테이너 안에서 타사 라이브러리를 다운로드하려면 인터넷에 접속할 수 있어야 합니다. `--network=host` 모드를 권장합니다.

### 3.3 빌드 실행 {#33-run-the-build}

컨테이너 안에서 기본 빌드를 실행합니다.

```bash
bash build.sh
```

빌드가 끝나면 결과물은 소스 디렉터리의 `output/` 아래에 있습니다.

:::tip
**머신에서 AVX2 명령어 집합을 지원하는지 확인하려면?**

```bash
cat /proc/cpuinfo | grep avx2
```

출력이 비어 있지 않으면 AVX2를 지원합니다.
:::

### 기타 빌드 옵션 {#other-build-options}

필요에 따라 기본 빌드 명령 대신 다음 명령 중 하나를 사용하세요.

```bash
# For CPUs without AVX2
USE_AVX2=0 bash build.sh

# Build the Debug version of BE
BUILD_TYPE=Debug bash build.sh
```

### 이미지 선택 시 참고 사항 {#notes-on-image-selection}

- 이미지 태그는 Doris 버전과 일대일로 대응합니다. 대상 브랜치에 맞는 이미지를 선택하고 버전이 다른 이미지를 사용해 컴파일하지 마세요.
- `no-avx2` 이미지의 타사 라이브러리는 AVX2를 지원하지 않는 CPU에서도 실행할 수 있습니다. 이 이미지를 사용할 때는 `USE_AVX2=0` 옵션을 함께 지정하여 컴파일해야 합니다.
- 이미지 변경 이력은 [thirdparty CHANGELOG](https://github.com/apache/doris/blob/master/thirdparty/CHANGELOG.md)를 참고하세요.
- 최신 `apache/doris:build-env-ldb-toolchain-latest`는 현재 x86_64 아키텍처만 지원하며 JDK 8과 JDK 17을 모두 포함합니다. 2.1 이하 버전에는 JDK 8을, 3.0 이상 버전이나 master 브랜치에는 JDK 17을 사용하세요.
- ARM64 아키텍처에서 Docker로 컴파일하려면 먼저 ARM64와 호환되는 Linux 기본 이미지(예: Ubuntu 22.04.5 LTS에 해당하는 `apache/doris:base-latest`)를 다운로드하세요. 그런 다음 [Linux에서 직접 컴파일하기](./compilation-linux)와 [ARM 플랫폼에서 컴파일하기](./compilation-arm) 문서를 참고하여 종속성을 설치하고 컴파일하세요.

컨테이너 안에서는 환경 변수로 JDK를 전환합니다.

```bash
# Switch to JDK 8
export JAVA_HOME=/usr/lib/jvm/java-1.8.0
export PATH=$JAVA_HOME/bin/:$PATH

# Switch to JDK 17
export JAVA_HOME=/usr/lib/jvm/jdk-17.0.2/
export PATH=$JAVA_HOME/bin/:$PATH
```

## 4. 자체 개발 이미지 빌드 {#4-build-your-own-development-image}

기본 이미지를 사용자 지정하려면(예: 다른 기본 배포판으로 변경하거나 디버깅 도구를 추가하려면) 소스 코드의 `docker/README.md`를 참고하세요.

## 자주 묻는 질문 {#faq}

### Q1: 이미지 버전과 Doris 버전이 일치하지 않으면 어떻게 되나요? {#q1-what-happens-if-the-image-version-does-not-match-the-doris-version}

이미지의 thirdparty 라이브러리 및 toolchain은 Doris 소스 코드와 밀접하게 연관되어 있습니다. 버전이 다른 조합을 사용하면 컴파일 중 `undefined reference`나 `incompatible library` 같은 링커 오류가 발생할 가능성이 매우 높습니다. 반드시 위 표에 따라 선택하세요.

### Q2: 빌드 중 `AVX2 not supported` 오류가 보고되면 어떻게 하나요? {#q2-the-build-reports-avx2-not-supported}

호스트 또는 대상 실행 머신의 CPU가 AVX2 명령어 집합을 지원하지 않는다는 뜻입니다. `no-avx2` 접미사가 붙은 이미지로 바꾸고 빌드할 때 `USE_AVX2=0`을 설정하세요.

### Q3: `docker pull`로 이미지를 가져오는 속도가 너무 느리면 어떻게 하나요? {#q3-docker-pull-is-too-slow-to-pull-the-image}

Docker 이미지 미러 가속기를 구성하거나 전체 경로인 `docker.io/apache/doris:...`를 사용하세요.

### Q4: 컨테이너 안에서 Java 라이브러리 다운로드가 실패하면 어떻게 하나요? {#q4-java-library-downloads-fail-inside-the-container}

프록시나 네트워크 격리 때문에 Maven 중앙 저장소에 접속하지 못하는 일이 없도록, 컨테이너를 `--network=host`로 시작했는지와 `~/.m2` 디렉터리를 컨테이너에 마운트했는지 확인하세요.

### Q5: Git에서 `detected dubious ownership in repository` 오류가 보고되면 어떻게 하나요? {#q5-git-reports-detected-dubious-ownership-in-repository}

마운트된 소스 디렉터리의 소유자가 호스트의 다른 사용자일 수 있습니다. 소스 저장소를 신뢰할 수 있는지 확인한 뒤, 컨테이너 안에서 마운트 경로를 예외로 추가하세요.

```bash
git config --global --add safe.directory /root/doris
```

컨테이너의 마운트 경로를 변경했다면 `/root/doris`도 그에 맞게 바꾸세요.

## 관련 문서 {#related-documents}

- [LDB Toolchain으로 컴파일하기](./compilation-with-ldb-toolchain)
- [Linux에서 직접 컴파일하기](./compilation-linux)
- [ARM 플랫폼에서 컴파일하기](./compilation-arm)

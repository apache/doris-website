---
title: macOS에서 Apache Doris 컴파일하기
language: ko
description: macOS(Intel / Apple Silicon)에서 Apache Doris를 컴파일하고 로컬 디버깅을 준비합니다.
keywords:
    - macOS 컴파일
    - Apple Silicon
    - Intel Mac
    - Apache Doris
    - 소스 컴파일
    - Homebrew
    - Thrift
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
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Local development / macOS debugging -->

# macOS에서 컴파일하기 {#compiling-on-macos}

이 문서는 macOS(Intel 및 Apple Silicon)에서 Apache Doris의 의존성을 설치하고, 소스를 컴파일하고, 실행하고, 로컬 디버깅을 준비하는 방법을 설명합니다.

:::tip
macOS에서는 아직 컴퓨팅과 스토리지가 분리된 모드의 컴파일 및 배포를 지원하지 않습니다.
:::

## 1. 환경 요구 사항 {#1-environment-requirements}

- macOS 12(Monterey) 이상(Intel 및 Apple Silicon 모두 지원)
- [Homebrew](https://brew.sh/)
- JDK 8 또는 JDK 17(Doris는 현재 이 두 버전만 지원)

## 2. 의존성 설치 {#2-install-dependencies}

Homebrew로 기본 의존성을 설치합니다:

```Shell
brew install automake autoconf libtool pkg-config texinfo coreutils gnu-getopt \
python@3 cmake ninja ccache bison byacc gettext wget pcre maven llvm@22 llvm@20 openjdk@17 npm
```

> 두 LLVM 버전이 모두 필요합니다. `llvm@22`는 BE를 컴파일합니다(LLVM 22.1.8은 macOS 26.4 이상에서 AddressSanitizer 런타임이 시작되는 최초의 릴리스입니다). `llvm@20`는 서드파티 라이브러리를 소스에서 빌드할 때 사용합니다. `thirdparty/build-thirdparty.sh`는 이 버전이 없으면 중단되며, `build.sh`는 `thirdparty/installed`에 필요한 라이브러리가 없으면 해당 빌드를 자동으로 시작합니다. 빌드 스크립트가 Homebrew를 통해 두 버전을 모두 찾으므로 어느 쪽도 `PATH`에 추가할 필요가 없습니다.

> macOS용 arm64 버전의 brew에는 기본적으로 JDK 8이 포함되어 있지 않으므로 `openjdk@17`을 권장합니다. JDK 8이 필요하면 [Zulu JDK 8](https://www.azul.com/downloads/?version=java-8-lts&os=macos&package=jdk#zulu)을 수동으로 설치합니다. Maven도 [Maven 웹사이트](https://maven.apache.org/download.cgi)에서 별도로 다운로드하여 환경 변수로 설정할 수 있습니다.

Apple Silicon에서는 일부 의존성에 대해 환경 변수를 수동으로 설정해야 합니다:

```Shell
export PATH="/opt/homebrew/opt/bison/bin:$PATH"
export PATH="/opt/homebrew/opt/texinfo/bin:$PATH"
ln -s -f /opt/homebrew/bin/python3 /opt/homebrew/bin/python
```

## 3. 소스 코드 가져오기 및 DORIS_HOME 설정 {#3-pull-the-source-code-and-set-doris_home}

```Shell
cd ~
mkdir DorisDev && cd DorisDev
git clone https://github.com/apache/doris.git

export DORIS_HOME=~/DorisDev/doris
export PATH=$DORIS_HOME/bin:$PATH
```

## 4. (선택 사항) Thrift 별도 설치 {#4-optional-install-thrift-separately}

FE만 디버깅하는 경우에만 Thrift를 별도로 설치해야 합니다. BE와 FE를 모두 디버깅하는 경우에는 BE 서드파티 라이브러리에 이미 Thrift가 포함되어 있습니다.

```Shell
brew install thrift@0.16.0

mkdir -p ./thirdparty/installed/bin

# Apple Silicon
ln -s /opt/homebrew/Cellar/thrift@0.16.0/0.16.0/bin/thrift ./thirdparty/installed/bin/thrift

# Intel
ln -s /usr/local/Cellar/thrift@0.16.0/0.16.0/bin/thrift ./thirdparty/installed/bin/thrift
```

`brew install thrift@0.16.0` 실행 시 해당 버전을 찾을 수 없다는 메시지가 표시되면 다음과 같이 처리합니다:

```Shell
brew tap homebrew/core --force
brew tap-new $USER/local-tap
brew extract --version='0.16.0' thrift $USER/local-tap
brew install thrift@0.16.0
```

참고: <https://gist.github.com/tonydeng/02e571f273d6cce4230dc8d5f394493c>

## 5. 미리 빌드된 서드파티 라이브러리로 빌드 속도 높이기(권장) {#5-speed-up-the-build-with-prebuilt-third-party-libraries-recommended}

커뮤니티에서 제공하는 미리 빌드된 서드파티 라이브러리를 직접 다운로드하면 서드파티 라이브러리 컴파일 과정을 건너뛸 수 있습니다:

```Shell
cd thirdparty
rm -rf installed

# Intel chip
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-x86_64.tar.xz \
    -o - | tar -Jxf -

# Apple Silicon chip
curl -L https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-prebuilt-darwin-arm64.tar.xz \
    -o - | tar -Jxf -

# Verify that protoc and thrift run correctly
cd installed/bin
./protoc --version
./thrift --version
```

> `protoc`와 `thrift`를 실행할 때 **개발자를 확인할 수 없기 때문에 열 수 없습니다**라는 메시지가 표시되면 `Security & Privacy → General`로 이동하여 `Open Anyway`를 클릭합니다. 참고: <https://support.apple.com/zh-cn/HT202491>

서드파티 라이브러리 소스인 [doris-thirdparty-source.tgz](https://github.com/apache/doris-thirdparty/releases/download/automation/doris-thirdparty-source.tgz)를 [Apache Doris 서드파티 사전 빌드](https://github.com/apache/doris-thirdparty/releases/tag/automation) 페이지에서 다운로드하여 직접 컴파일할 수도 있습니다.

## 6. 파일 핸들 제한 조정 {#6-adjust-the-file-handle-limit}

```Shell
ulimit -n 65536

# Write to the startup script so it takes effect automatically next time the terminal opens
# bash
echo 'ulimit -n 65536' >>~/.bashrc
# zsh
echo 'ulimit -n 65536' >>~/.zshrc
```

## 7. 컴파일 {#7-compile}

```Shell
cd $DORIS_HOME
bash build.sh
```

## 8. BE / FE 시작 {#8-start-be--fe}

```Shell
cd output/be/bin && ./start_be.sh --daemon
cd output/fe/bin && ./start_fe.sh --daemon
```

## 9. 로컬 디버깅 환경 설정 {#9-configure-the-local-debugging-environment}

```Shell
# Copy the build output to use as the runtime directory
cp -r output ../doris-run
```

그런 다음 FE / BE의 `conf`에서 다음 항목을 수정합니다:

1. IP 및 디렉터리 설정
2. BE에 `min_file_descriptor_number = 10000`도 설정

이어서 IDE에서 디버깅을 설정합니다:

- [FE 개발 환경 설정 - IntelliJ IDEA](../developer-guide/fe-idea-dev)
- [BE 개발 환경 설정 - CLion](../developer-guide/be-clion-dev)("옵션 2: macOS에서 로컬 개발" 참조)

## 자주 묻는 질문 {#faq}

### CMake가 OpenMP를 찾지 못하는 경우 {#cmake-cannot-find-openmp}

BE를 컴파일할 때 CMake가 OpenMP를 찾지 못해 다음 오류가 발생할 수 있습니다:

```text
Could NOT find OpenMP_C (missing: OpenMP_C_FLAGS OpenMP_C_LIB_NAMES)
fatal error: 'omp.h' file not found
```

`libomp`를 설치한 다음 Homebrew로 설치된 경로에 `omp.h`가 있는지 확인합니다:

```Shell
brew install libomp
LIBOMP_PREFIX="$(brew --prefix libomp)"
test -f "${LIBOMP_PREFIX}/include/omp.h"
```

Doris 소스 루트의 `custom_env.sh`에 다음 환경 변수를 추가합니다:

```Shell
LIBOMP_PREFIX="$(brew --prefix libomp)"
export CPPFLAGS="-I${LIBOMP_PREFIX}/include ${CPPFLAGS:-}"
export CFLAGS="-I${LIBOMP_PREFIX}/include ${CFLAGS:-}"
export CXXFLAGS="-I${LIBOMP_PREFIX}/include ${CXXFLAGS:-}"
export LDFLAGS="-L${LIBOMP_PREFIX}/lib ${LDFLAGS:-}"
export EXTRA_CXX_FLAGS="-I${LIBOMP_PREFIX}/include ${EXTRA_CXX_FLAGS:-}"
```

`be/CMakeLists.txt` 파일이 `CMAKE_C_FLAGS`와 `CMAKE_CXX_FLAGS`를 재설정하므로 CMake의 OpenMP 검사에 `CPPFLAGS`, `CFLAGS` 또는 `CXXFLAGS`가 전달되지 않을 수 있습니다. `EXTRA_CXX_FLAGS`는 `libomp`의 include 경로를 BE 빌드에 전달하며, 이 해결 방법을 적용하려면 반드시 설정해야 합니다.

`custom_env.sh`는 로컬 빌드 설정 파일입니다. 저장소에 커밋하지 마세요.

### Node.js 버전이 너무 높아 컴파일에 실패하는 경우 {#compilation-fails-due-to-nodejs-version-too-high}

오류 메시지:

```
opensslErrorStack: ['error:03000086:digital envelope routines::initialization error']
library: 'digital envelope routines'
reason: 'unsupported'
code: 'ERR_OSSL_EVP_UNSUPPORTED'
```

해결 방법:

```Shell
export NODE_OPTIONS=--openssl-legacy-provider
```

참고: <https://stackoverflow.com/questions/74726224/opensslerrorstack-error03000086digital-envelope-routinesinitialization-e>

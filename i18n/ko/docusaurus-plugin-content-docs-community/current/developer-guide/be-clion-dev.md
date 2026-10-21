---
title: BE 개발 환경 설정 - CLion
language: ko
description: 원격 개발 또는 macOS 로컬 개발 방식으로 CLion을 사용하는 Apache Doris BE 개발 환경을 설정합니다.
keywords:
    - CLion
    - Apache Doris BE
    - BE 개발 환경
    - 원격 개발
    - macOS BE 디버깅
    - CMake
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

# CLion으로 BE 개발 환경 설정하기 {#setting-up-a-be-development-environment-with-clion}

이 문서에서는 BE(Backend)를 위한 두 가지 일반적인 CLion 개발 방식을 설명합니다.

- **옵션 1: 원격 개발**(권장). 로컬 CLion에서 SSH/SFTP를 통해 원격 Linux 서버에 연결하고, 코드를 원격 서버에 동기화하여 컴파일하고 실행합니다. BE는 완전한 Linux 툴체인을 필요로 하므로, 이 방식이 가장 일반적인 Doris BE 개발 환경 구성입니다.
- **옵션 2: macOS 로컬 개발**. 원격 서버 없이 macOS에서 직접 BE를 컴파일하고 디버깅합니다.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: IDE configuration / Debug setup -->

## 옵션 1: 원격 개발(Linux) {#option-1-remote-development-linux}

### 1. 원격 서버에서 코드 다운로드 및 컴파일 {#1-download-and-compile-the-code-on-the-remote-server}

원격 Linux 서버에서 Doris를 다운로드하고 컴파일합니다.

```bash
git clone https://github.com/apache/doris.git
cd doris
```

`env.sh`를 편집하여 파일 상단에 `DORIS_HOME` 설정을 추가합니다. 예를 들면 다음과 같습니다.

```bash
DORIS_HOME=/mnt/datadisk0/chenqi/doris
```

빌드를 실행합니다. 자세한 과정은 [LDB Toolchain으로 컴파일](../source-install/compilation-with-ldb-toolchain)을 참조하세요.

```bash
./build.sh
```

### 2. 로컬 CLion에서 원격 개발 환경 구성 {#2-configure-the-remote-development-environment-in-local-clion}

1. 로컬에 CLion을 다운로드하여 설치한 다음, Doris BE 코드를 가져옵니다.

2. CLion에서 **환경 설정 → 빌드, 실행, 배포 → 배포**를 열고 **SFTP**를 사용하여 원격 개발 서버의 로그인 정보를 추가합니다. **매핑** 경로를 설정합니다. 예를 들면 다음과 같습니다.
    - 로컬 경로: `/User/kaka/Programs/doris/be`
    - 배포 경로: `/mnt/datadisk0/chenqi/clion/doris/be`

    ![배포1](/images/clion-deployment1.png)

    ![배포2](/images/clion-deployment2.png)

3. 원격 서버에서 컴파일 중 생성된 `gensrc` 디렉터리를 **배포 경로**의 상위 디렉터리에 복사합니다.

    ```bash
    cp -R /mnt/datadisk0/chenqi/doris/gensrc /mnt/datadisk0/chenqi/clion/doris/gensrc
    ```

4. **환경 설정 → 빌드, 실행, 배포 → 툴체인**을 열고 원격 환경의 툴체인(CMake, GCC, G++, GDB 등)을 추가합니다.

    :::caution 중요
    **환경 파일** 필드에 원격 서버의 Doris 코드에 있는 `env.sh` 파일 경로를 입력합니다.
    :::

    ![툴체인](/images/clion-toolchains.png)

5. **환경 설정 → 빌드, 실행, 배포 → CMake**를 열고 CMake 옵션에 다음을 추가합니다.

    ```bash
    -DDORIS_JAVA_HOME=/path/to/remote/JAVA_HOME
    ```

    이 값을 원격 서버의 `JAVA_HOME` 경로로 설정합니다. 그렇지 않으면 `jni.h`를 찾을 수 없습니다.

6. CLion에서 마우스 오른쪽 버튼을 클릭하고 **CMake 프로젝트 불러오기**를 선택합니다. 이 작업은 코드를 원격 서버에 동기화하고 CMake 빌드 파일을 생성합니다.

### 3. 로컬 CLion에서 원격 BE 실행 및 디버깅 {#3-run-and-debug-remote-be-from-local-clion}

1. **환경 설정 → 빌드, 실행, 배포 → CMake**에서 CMake를 구성합니다. Debug 또는 Release 같은 다양한 타깃을 구성하고, **툴체인**을 앞서 구성한 원격 툴체인으로 설정할 수 있습니다.

    단위 테스트를 실행하고 디버깅하려면 CMake 옵션에 `-DMAKE_TEST=ON`을 추가합니다. 기본적으로는 비활성화되어 있습니다.

2. 원격 서버에서 `output` 디렉터리를 별도의 경로에 복사합니다.

    ```bash
    cp -R /mnt/datadisk0/chenqi/doris/output /mnt/datadisk0/chenqi/clion/doris/doris_be
    ```

    ![출력 디렉터리 트리](/images/doris-dist-output-tree.png)

3. CLion에서 `doris_be` 타깃(Debug 또는 Release)을 선택하고 구성합니다. `be/bin/start_be.sh`에서 내보내는 환경 변수를 참고하여 각 변수가 원격 서버의 해당 경로를 가리키도록 설정합니다.

    ![실행 및 디버그 구성1](/images/clion-run-debug-conf1.png)
    ![실행 및 디버그 구성2](/images/clion-run-debug-conf2.png)

4. **실행**을 클릭하여 BE를 컴파일하고 시작하거나, **디버그**를 클릭하여 BE를 컴파일하고 디버깅합니다.

## 옵션 2: macOS 로컬 개발 {#option-2-macos-local-development}

macOS에서는 원격 서버 없이 로컬에서 BE를 컴파일하고 디버깅할 수 있습니다. 시작하기 전에 [macOS에서 컴파일](../source-install/compilation-mac)에 설명된 의존성 설치와 코드 체크아웃을 완료하세요.

### 1. Doris 소스 루트 디렉터리 열기 {#1-open-the-doris-source-root-directory}

![배포1](/images/mac-clion-deployment1.png)

### 2. CLion 구성 {#2-configure-clion}

**툴체인 구성**: 아래 그림에 따라 구성합니다. 모든 항목이 정상적으로 감지되어야 합니다.

![배포2](/images/mac-clion-deployment2.png)

**CMake 구성**: 아래 그림에 따라 구성합니다.

![배포3](/images/mac-clion-deployment3.png)

구성을 확인하면 CLion이 처음에 CMake 파일을 자동으로 불러옵니다. 자동으로 불러오지 않으면 `$DORIS_HOME/be/CMakeLists.txt`를 마우스 오른쪽 버튼으로 클릭하고 불러오기를 선택합니다.

### 3. BE 디버그 구성 {#3-configure-debug-be}

구성 편집을 선택합니다.

![배포4](/images/mac-clion-deployment4.png)

<!-- Knowledge type: Configuration parameters -->

`doris_be`의 환경 변수를 추가합니다. `be/bin/start_be.sh`에서 내보내는 환경 변수를 참고하세요. 환경 변수의 Doris 디렉터리 값은 별도로 복사해 둔 런타임 디렉터리를 가리켜야 합니다. 참고할 환경 변수는 다음과 같습니다.

| 환경 변수 | 값 예시                                                                                                                                       | 설명           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `JAVA_OPTS`          | `-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000` | JVM 시작 인수 |
| `LOG_DIR`            | `~/DorisDev/doris-run/be/log`                                                                                                                       | BE 로그 디렉터리      |
| `NLS_LANG`           | `AMERICAN_AMERICA.AL32UTF8`                                                                                                                         | Oracle JDBC 인코딩  |
| `ODBCSYSINI`         | `~/DorisDev/doris-run/be/conf`                                                                                                                      | ODBC 설정 디렉터리 |
| `PID_DIR`            | `~/DorisDev/doris-run/be/log`                                                                                                                       | PID 파일 디렉터리    |
| `UDF_RUNTIME_DIR`    | `~/DorisDev/doris-run/be/lib/udf-runtime`                                                                                                           | UDF 런타임 디렉터리 |
| `DORIS_HOME`         | `~/DorisDev/doris-run/be`                                                                                                                           | BE 런타임 디렉터리  |

```bash
JAVA_OPTS=-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000
LOG_DIR=~/DorisDev/doris-run/be/log
NLS_LANG=AMERICAN_AMERICA.AL32UTF8
ODBCSYSINI=~/DorisDev/doris-run/be/conf
PID_DIR=~/DorisDev/doris-run/be/log
UDF_RUNTIME_DIR=~/DorisDev/doris-run/be/lib/udf-runtime
DORIS_HOME=~/DorisDev/doris-run/be
```

![배포5](/images/mac-clion-deployment5.png)
![배포6](/images/mac-clion-deployment6.png)

### 4. 디버깅 시작 {#4-start-debugging}

**실행** 또는 **디버그**를 클릭합니다. CLion이 컴파일을 시작하고, 컴파일이 완료되면 BE가 시작됩니다.

![배포7](/images/mac-clion-deployment7.png)

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

### Q1: 원격 컴파일 시 `jni.h not found` 오류 발생 {#q1-remote-compilation-reports-jnih-not-found}

CMake 옵션의 `-DDORIS_JAVA_HOME`이 원격 서버의 `JAVA_HOME`으로 올바르게 설정되지 않았습니다. 옵션 1의 2절에 있는 5단계를 참조하세요.

### Q2: CLion에서 심볼을 찾지 못하거나 빨간 밑줄이 많이 표시됨 {#q2-clion-cannot-find-symbols-or-shows-a-lot-of-red-underlines}

`gensrc` 디렉터리를 배포 경로의 상위 디렉터리에 복사하지 않았거나, **CMake 프로젝트 불러오기**를 클릭하여 다시 불러오지 않았습니다.

### Q3: BE가 시작 직후 종료됨 {#q3-be-exits-immediately-after-startup}

환경 변수 `DORIS_HOME`, `PID_DIR` 또는 `LOG_DIR`이 설정되지 않았거나 경로가 존재하지 않습니다. 위의 환경 변수 테이블을 확인하세요. 모든 경로를 미리 생성해야 합니다.

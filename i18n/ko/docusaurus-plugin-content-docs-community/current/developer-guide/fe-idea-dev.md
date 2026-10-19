---
title: FE 개발 환경 설정 - IntelliJ IDEA
language: ko
description: IntelliJ IDEA를 사용해 Linux, macOS, Windows에서 Apache Doris FE 개발 및 디버깅 환경을 설정하는 방법을 설명합니다.
keywords:
    - IntelliJ IDEA
    - Apache Doris FE
    - FE 개발 환경
    - FE 디버깅
    - Thrift
    - generated-source
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

# IntelliJ IDEA로 FE 개발 환경 설정하기 {#setting-up-the-fe-development-environment-with-intellij-idea}

이 문서는 Linux, macOS, Windows에서 IntelliJ IDEA를 사용해 Doris FE(Frontend) 개발 및 디버깅 환경을 설정하는 방법을 설명합니다.

<!-- Knowledge type: Procedure -->
<!-- Applies to: IDE configuration / Debugging setup -->

## 1. 환경 준비 {#1-environment-preparation}

필수 사항: JDK 1.8+, IntelliJ IDEA.

### 1.1 소스 코드 가져오기 {#11-pull-the-source-code}

GitHub에서 Doris 소스 코드를 로컬 머신으로 다운로드합니다:

```bash
git clone https://github.com/apache/doris.git
```

:::tip macOS 사용자 참고 사항
**IDEA에서 프로젝트를 열 때는 전체 Doris 저장소의 루트 대신 소스 트리 아래의 `fe` 하위 디렉터리를 직접 여는 것이 좋습니다.** 이렇게 하면 나중에 `be` 디렉터리를 여는 CLion과의 충돌을 방지할 수 있습니다.
:::

### 1.2 Thrift 설치 {#12-install-thrift}

FE 개발만 진행하고 `thirdparty` 전체를 빌드하지 않았다면, Thrift를 별도로 설치한 후 `thirdparty/installed/bin` 디렉터리에 복사하거나 심볼릭 링크를 만들어야 합니다.

| Doris 버전 | 호환되는 Thrift 버전 |
| ------------- | ----------------------- |
| 0.15 ~ 1.2    | 0.13.0                  |
| 1.2+          | 0.16.0                  |

아래에서는 0.16.0을 예로 설명합니다. 0.13.0도 절차는 같습니다.

#### macOS {#macos}

```bash
brew tap homebrew/core --force
brew tap-new $USER/local-tap
brew extract --version='0.16.0' thrift $USER/local-tap
brew install thrift@0.16.0
```

다운로드에 실패하면 다음 파일을 수정할 수 있습니다:

`/usr/local/Homebrew/Library/Taps/$USER/homebrew-local-tap/Formula/thrift@0.16.0.rb`

다음 항목을:

`url "https://www.apache.org/dyn/closer.lua?path=thrift/0.16.0/thrift-0.16.0.tar.gz"`

아래와 같이 변경합니다:

`url "https://archive.apache.org/dist/thrift/0.16.0/thrift-0.16.0.tar.gz"`

참고: <https://gist.github.com/tonydeng/02e571f273d6cce4230dc8d5f394493c>

#### Linux {#linux}

```bash
wget https://archive.apache.org/dist/thrift/0.16.0/thrift-0.16.0.tar.gz
yum install -y autoconf automake libtool cmake ncurses-devel openssl-devel lzo-devel zlib-devel gcc gcc-c++
tar zxvf thrift-0.16.0.tar.gz
cd thrift-0.16.0
./configure --without-tests
make
make install
```

설치 후 버전을 확인합니다:

```bash
thrift --version
```

#### Windows {#windows}

1. 다운로드: <http://archive.apache.org/dist/thrift/0.16.0/thrift-0.16.0.exe>
2. `./thirdparty/installed/bin`에 복사합니다.

> 이미 Doris 전체를 빌드했다면 Thrift를 다시 설치할 필요가 없습니다. `$DORIS_HOME/thirdparty/installed/bin/thrift`를 그대로 재사용할 수 있습니다.

## 2. 코드 생성 {#2-generate-code}

### Linux / macOS {#linux--macos}

소스 코드의 루트 디렉터리에서 다음 명령을 실행합니다:

```bash
sh generated-source.sh
```

`Done`이 표시될 때까지 기다립니다.

> 1.2 이하 버전에서는 `cd fe && mvn generate-sources`를 사용합니다. 오류가 발생하면 `cd fe && mvn clean install -DskipTests`를 실행합니다.

IDEA UI에서 해당 Maven 명령을 실행할 수도 있습니다:

![](/images/gen_code.png)

### Windows {#windows-1}

Windows에서는 `make`나 셸 스크립트를 실행할 수 없는 경우가 있습니다. 다음 방법 중 하나를 사용합니다:

- Linux 머신에서 생성한 `fe/fe-core/target/generated-sources` 디렉터리를 Windows의 해당 위치로 복사합니다.
- 로컬 디렉터리를 Docker에 마운트하고 Docker 안에서 코드를 자동 생성합니다([소스 코드로 컴파일](../source-install/compilation-with-docker) 참조).

## 3. 도움말 문서 생성 {#3-generate-the-help-documentation}

아직 도움말 문서를 생성하지 않았다면 다음 명령을 실행합니다:

```bash
cd doris/docs
sh build_help_zip.sh
cp build/help-resource.zip ../fe/fe-core/target/classes
```

## 4. IDEA에서 디버깅 설정 {#4-configure-debugging-in-idea}

### 4.1 프로젝트 가져오기 {#41-import-the-project}

IDEA에서 `fe` 프로젝트를 가져옵니다.

### 4.2 디렉터리 준비 {#42-prepare-the-directories}

디버깅에 필요한 디렉터리를 `fe` 디렉터리 아래에 만듭니다(최신 버전에서는 이 디렉터리가 이미 존재할 수 있습니다):

![](/images/DEBUG4.png)

### 4.3 UI 빌드(선택 사항) {#43-build-the-ui-optional}

`ui` 프로젝트를 빌드하고 `ui/dist/` 디렉터리의 파일을 `webroot`에 복사합니다. Doris UI를 볼 필요가 없다면 이 단계를 건너뛸 수 있습니다.

### 4.4 fe.conf 설정 {#44-configure-feconf}

아래는 필요에 맞게 조정할 수 있는 `conf/fe.conf` 설정 예시입니다:

```bash
LOG_DIR = ${DORIS_HOME}/log

DATE = `date +%Y%m%d-%H%M%S`
JAVA_OPTS="-Xmx2048m -XX:+UseMembar -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xloggc:$DORIS_HOME/log/fe.gc.log.$DATE"

# For jdk 9+, this JAVA_OPTS will be used as default JVM options
JAVA_OPTS_FOR_JDK_9="-Xmx4096m -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xlog:gc*:$DORIS_HOME/log/fe.gc.log.$DATE:time"

sys_log_level = INFO

http_port = 8030
rpc_port = 9020
query_port = 9030
arrow_flight_sql_port = -1
edit_log_port = 9010

# priority_networks = 10.10.10.0/24;192.168.0.0/16
```

:::tip macOS에서 Docker로 BE 실행
macOS에서 Docker for Mac을 통해 BE를 실행할 때는 `docker for Mac`이 Host 모드를 지원하지 않으므로 `-p`로 BE 포트를 노출해야 합니다. 또한 `priority_networks`를 `fe.conf`에 설정할 때는 컨테이너 내부에서 접근할 수 있는 IP(예: Wi-Fi IP)를 지정해야 합니다.
:::

### 4.5 IDEA 실행 환경 변수 설정 {#45-set-the-idea-run-environment-variables}

IDEA에서 실행 환경 변수를 설정합니다:

![](/images/DEBUG5.png)

<!-- Knowledge type: Configuration parameters -->

macOS의 설정 예시입니다(`DORIS_HOME` 환경 변수는 따로 복사해 둔 Doris 런타임 디렉터리를 가리킵니다):

| 환경 변수 | 예시 값                 | 설명                                |
| -------------------- | ----------------------------- | ------------------------------------------ |
| `JAVA_OPTS`          | `-Xmx8092m`                   | JVM 힙 매개변수                        |
| `LOG_DIR`            | `~/DorisDev/doris-run/fe/log` | FE 로그 디렉터리                           |
| `PID_DIR`            | `~/DorisDev/doris-run/fe/log` | PID 파일 디렉터리                         |
| `DORIS_HOME`         | `~/DorisDev/doris-run/fe`     | FE 런타임 디렉터리(소스 디렉터리가 아님)  |

```bash
JAVA_OPTS=-Xmx8092m
LOG_DIR=~/DorisDev/doris-run/fe/log
PID_DIR=~/DorisDev/doris-run/fe/log
DORIS_HOME=~/DorisDev/doris-run/fe
```

![mac-idea-deployment5](/images/mac-idea-deployment5.png)

### 4.6 옵션 수정 설정 {#46-configure-modify-options}

일부 의존성은 범위가 `provided`로 지정되어 있으므로 IDEA에서 별도 설정이 필요합니다. `Run/Debug Configurations`에서 오른쪽의 `Modify options`를 클릭하고 `Add dependencies with "provided" scope to classpath`를 선택합니다.

![](/images/idea_options.png)

## 5. FE 시작 {#5-start-fe}

`Run` 또는 `Debug`를 클릭합니다. IDEA가 컴파일을 시작하고, 컴파일이 완료되면 FE가 시작됩니다.

![mac-idea-deployment6](/images/mac-idea-deployment6.png)

이제 FE 개발 및 디버깅을 시작할 수 있습니다.

## 6. 자주 묻는 질문(FAQ) {#6-frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->

### Q1: 시작 시 `ClassNotFoundException`이 발생하거나 일부 의존성을 찾을 수 없음 {#q1-startup-throws-classnotfoundexception-or-some-dependencies-cannot-be-found}

`Add dependencies with "provided" scope to classpath`가 `Run/Debug Configurations`에서 선택되어 있지 않습니다. [4.6절](#46-configure-modify-options)을 참고해 해결합니다.

### Q2: `generated-source.sh`에서 thrift 버전 불일치를 보고함 {#q2-generated-sourcesh-reports-thrift-version-mismatch}

`thirdparty/installed/bin/thrift`의 버전이 Doris 버전과 일치하지 않습니다. [1.2절](#12-install-thrift)의 버전 매핑 테이블에 따라 다시 설치합니다.

### Q3: 시작 후 BE 또는 클라이언트에서 FE에 접근할 수 없음 {#q3-fe-cannot-be-accessed-by-be-or-clients-after-startup}

`priority_networks`가 `fe.conf`에서 로컬 머신이나 컨테이너가 접근할 수 있는 서브넷으로 설정되어 있는지 확인합니다. macOS + Docker BE 환경에서는 4.4절의 참고 사항을 확인합니다.

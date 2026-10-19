---
title: FE 개발 환경 설정 - Visual Studio Code (VSCode)
language: ko
description: Java 확장 프로그램 설정, JDK 전환, 원격 디버깅을 포함하여 VSCode로 Apache Doris FE 개발 환경을 설정하는 방법을 안내합니다.
keywords:
    - VSCode
    - Apache Doris FE
    - FE 개발 환경
    - Java 확장 프로그램
    - 원격 디버깅
    - JDWP
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

# VSCode로 FE 개발 환경 설정하기 {#set-up-an-fe-development-environment-with-vscode}

이 문서에서는 VSCode를 사용하여 개발용 컴퓨터, WSL 또는 Docker에서 Doris FE 개발 환경을 설정하는 방법을 설명합니다. VSCode를 선호하는 개발자는 Remote 확장 프로그램을 사용하여 원격으로 개발하고 디버깅할 수 있습니다.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: IDE configuration / Debugging setup -->

## 1. 사전 요구 사항 {#1-prerequisites}

| 구성 요소               | 버전 요구 사항                                                                                 | 용도                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| JDK                     | 11+ (Java 확장 프로그램에 필요); 컴파일에는 JDK 8 사용 가능                             | 두 버전을 모두 설치하고 설정을 통해 전환 |
| VSCode                  | 최신 안정 버전                                                                               | 편집기                                   |
| Extension Pack for Java | 최신 버전                                                                                      | Java 언어 지원                    |
| Remote 확장 프로그램       | Remote - SSH / Remote - WSL / Remote - Containers                                                   | 원격 개발                       |

[JDK 11](https://github.com/adoptium/temurin11-binaries/releases/)과 JDK 8을 `~/lib`와 같은 별도의 디렉터리 아래에 각각 설치하여, IDE 확장 프로그램용과 소스 컴파일용으로 사용하는 것을 권장합니다.

## 2. 소스 코드 복제 및 열기 {#2-clone-and-open-the-source-code}

1. GitHub에서 소스 코드를 다운로드합니다.

    ```bash
    git clone https://github.com/apache/doris.git
    ```

2. VSCode에서 소스 트리의 `fe` 디렉터리를 엽니다(저장소 루트 전체를 열지 마세요).

## 3. VSCode 설정 {#3-configure-vscode}

`settings.json`을 `fe/.vscode/` 아래에 생성하고 Java 런타임과 Maven 경로를 설정합니다.

<!-- Knowledge type: Configuration parameters -->

| 설정 항목              | 설명                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `java.configuration.runtimes`   | Java 확장 프로그램이 프로젝트별로 사용할 수 있는 JDK 목록을 등록합니다 |
| `java.jdt.ls.java.home`         | JDK 11+ 디렉터리를 지정하며, `vscode-java` 확장 프로그램 자체에서 사용합니다 |
| `maven.executable.path`         | 로컬 Maven 실행 파일을 지정하며, `maven-language-server` 확장 프로그램에서 사용합니다 |

예시:

```json
{
    "java.configuration.runtimes": [
        {
            "name": "JavaSE-1.8",
            "path": "/!!!path!!!/jdk-1.8.0_191"
        },
        {
            "name": "JavaSE-11",
            "path": "/!!!path!!!/jdk-11.0.14.1+1",
            "default": true
        }
    ],
    "java.jdt.ls.java.home": "/!!!path!!!/jdk-11.0.14.1+1",
    "maven.executable.path": "/!!!path!!!/maven/bin/mvn"
}
```

## 4. FE 컴파일 {#4-compile-fe}

전체 컴파일 절차는 다음 문서를 참고하세요.

- [LDB Toolchain으로 컴파일](/community/source-install/compilation-with-ldb-toolchain)
- [Docker 개발 이미지로 컴파일](/community/source-install/compilation-with-docker)

## 5. 원격 디버깅 설정 {#5-configure-remote-debugging}

<!-- Knowledge type: Configuration parameters -->

VSCode에서 FE를 원격으로 디버깅하려면 FE를 시작할 때 JDWP 매개변수를 추가합니다.

```shell
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005
```

이를 위해 `doris/output/fe/bin/start_fe.sh`를 편집하고 `$JAVA $final_java_opt` 뒤에 위 매개변수를 추가합니다.

| JDWP 매개변수   | 값             | 설명                                       |
| ---------------- | ----------------- | ------------------------------------------------- |
| `transport`      | `dt_socket`       | Socket 전송 사용                              |
| `server`         | `y`               | 디버그 서버로 시작하고 디버거가 연결될 때까지 대기 |
| `suspend`        | `n`               | 시작 시 실행을 일시 중단하지 않고 정상 실행           |
| `address`        | `5005`            | 수신 대기 포트; 변경 가능                      |

FE를 시작한 후 VSCode의 Java Debug 확장 프로그램에서 **연결** 기능으로 `host:5005`에 연결하여 중단점 디버깅을 수행합니다.

## 6. 자주 묻는 질문(FAQ) {#6-frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->

### Q1: Java 확장 프로그램에서 JDK 버전이 너무 낮다는 오류가 발생하는 경우 {#q1-the-java-extension-reports-that-the-jdk-version-is-too-low}

`java.jdt.ls.java.home`은 JDK 11+를 가리켜야 합니다. 컴파일에 JDK 8을 사용하더라도 확장 프로그램 자체를 실행하려면 JDK 11+가 필요합니다.

### Q2: Maven 작업이 실패하거나 `mvn`을 찾을 수 없는 경우 {#q2-maven-tasks-fail--mvn-is-not-found}

`maven.executable.path`가 유효한 `mvn` 실행 파일을 가리키는지 확인하거나, 해당 실행 파일이 있는 경로를 시스템 `PATH`에 추가합니다.

### Q3: 원격 디버깅에 연결할 수 없는 경우 {#q3-remote-debugging-cannot-connect}

- FE 프로세스에 JDWP 매개변수가 실제로 적용되었는지 확인합니다(`ps -ef | grep java`로 명령줄을 확인).
- `address` 포트가 방화벽에 의해 차단되지 않았는지 확인합니다.
- `suspend=y`를 사용하면 FE는 디버거가 연결될 때까지 실행을 멈추고 대기합니다. `suspend=n`으로 변경하거나 디버거를 직접 연결합니다.

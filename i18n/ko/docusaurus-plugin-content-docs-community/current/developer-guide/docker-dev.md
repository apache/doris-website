---
title: Docker로 빠르게 구성하는 Doris 개발 환경
language: ko
description: Dockerfile 예제와 VSCode Remote 설정을 포함하여 Docker로 Apache Doris 개발 환경을 빠르게 구성하는 방법을 설명합니다.
keywords:
    - Apache Doris
    - Docker
    - 개발 환경
    - Dockerfile
    - VSCode Remote
    - SYS_PTRACE
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

# Docker로 빠르게 구성하는 Doris 개발 환경 {#quick-doris-development-environment-with-docker}

이 문서에서는 Docker로 Doris 개발 이미지를 빌드하고, FE/BE를 컴파일하고 실행하며, VSCode Remote와 연동하여 개발 및 디버깅하는 방법을 설명합니다.

<!-- Knowledge type: Procedure -->
<!-- Use case: IDE configuration / Containerized development environment -->

## 관련 상세 문서 {#related-detailed-documents}

- [Docker 개발 이미지로 컴파일하기](/community/source-install/compilation-with-docker)
- [배포](/docs/dev/install/deploy-manually/integrated-storage-compute-deploy-manually)
- [VSCode로 BE 개발 및 디버깅하기](./be-vscode-dev)

## 1. 환경 준비 {#1-environment-preparation}

| 구성 요소     | 설명                              |
| ------------- | --------------------------------- |
| Docker        | 설치되어 실행 중인 상태            |
| VSCode        | 최신 안정 버전                     |
| Remote 플러그인 | VSCode Remote - Containers / SSH  |

## 2. 이미지 빌드 {#2-build-the-image}

### 2.1 Dockerfile 생성 {#21-create-the-dockerfile}

작업 디렉터리에 `Dockerfile`을 생성합니다. VSCode에서는 Ctrl+D를 사용하여 다음 자리 표시자를 바꿀 수 있습니다.

| 자리 표시자                     | 의미                          |
| ------------------------------- | ----------------------------- |
| `<!!! your user !!!>`           | 컨테이너에 생성할 사용자 이름 |
| `<!!! your user password !!!>`  | 해당 사용자의 비밀번호        |
| `<!!! root password !!!>`       | root 사용자의 비밀번호        |
| `<!!! your git email !!!>`      | git 설정에 사용할 이메일      |
| `<!!! your git username !!!>`   | git 설정에 사용할 사용자 이름 |

```dockerfile
FROM apache/incubator-doris:build-env-latest

USER root
WORKDIR /root
RUN echo '<!!! root password !!!>' | passwd root --stdin

RUN yum install -y vim net-tools man wget git mysql lsof bash-completion \
        && cp /var/local/thirdparty/installed/bin/thrift /usr/bin

# For better safety, create a user instead of using root
RUN yum install -y sudo \
        && useradd -ms /bin/bash <!!! your user !!!> && echo <!!! your user password !!!> | passwd <!!! your user !!!> --stdin \
        && usermod -a -G wheel <!!! your user !!!>

USER <!!! your user !!!>
WORKDIR /home/<!!! your user !!!>
RUN git config --global color.ui true \
        && git config --global user.email "<!!! your git email !!!>" \
        && git config --global user.name "<!!! your git username !!!>"

# Optionally install zsh and oh my zsh for easier use; remove if not needed
USER root
RUN yum install -y zsh \
        && chsh -s /bin/zsh <!!! your user !!!>
USER <!!! your user !!!>
RUN wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh \
        && git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions \
        && git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

### 2.2 이미지 빌드 {#22-build-the-image}

```shell
docker build -t doris .
```

### 2.3 이미지 실행 {#23-run-the-image}

<!-- Knowledge type: Configuration parameters -->

마운트 옵션은 [Docker 컴파일 마운트 참고 사항](../source-install/compilation-with-docker)을 참조하세요. 로컬 Doris 소스 디렉터리를 마운트하여 이미지를 실행하는 것을 권장합니다.

:::caution Windows 사용자
Windows에서는 마운트 시 서로 다른 파일 시스템 간의 접근 문제가 발생할 수 있습니다. 환경에 맞게 판단하여 설정하세요.
:::

`--cap-add SYS_PTRACE` 매개변수는 Docker 내부에서 ptrace를 사용할 수 있도록 허용하여 ptrace 및 GDB 원격 디버깅에 도움이 됩니다.

```shell
docker run -it --cap-add SYS_PTRACE doris:latest /bin/bash
```

| 매개변수              | 용도                                             |
| --------------------- | ------------------------------------------------ |
| `--cap-add SYS_PTRACE` | 컨테이너 내부에서 ptrace 호출 허용(GDB에 필요)    |
| `-it`                 | 대화형 TTY                                       |
| `-v <local>:<container>` | 로컬 소스 디렉터리 마운트(필요한 경우)          |

### 2.4 zsh 설정(선택 사항) {#24-configure-zsh-optional}

zsh를 설치한 경우 `~/.zshrc`의 plugins 줄을 다음과 같이 바꿉니다.

```bash
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
```

### 2.5 Doris 소스 코드 가져오기 {#25-pull-the-doris-source-code}

```shell
su <your user>
mkdir code && cd code
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive
```

## 3. 컴파일 {#3-compile}

:::caution 첫 컴파일
첫 컴파일 시에는 다음 명령으로 클린 빌드를 강제 실행합니다.

```shell
sh build.sh --clean --be --fe --ui
```

`build-env-for-0.15.0` 이미지에서는 thrift가 업그레이드되었으므로(0.9에서 0.13으로), `--clean`을 사용하여 새 버전의 thrift로 코드 파일을 강제로 생성해야 합니다. 그렇지 않으면 호환되지 않는 코드가 생성됩니다.
:::

이후에는 일반적인 방법으로 Doris를 컴파일합니다.

```shell
sh build.sh
```

## 4. 실행 {#4-run}

### 4.1 메타데이터 디렉터리 준비 {#41-prepare-the-metadata-directory}

메타데이터를 저장할 `meta_dir` 디렉터리를 수동으로 생성합니다. 기본값은 `${DORIS_HOME}/doris-meta`입니다.

```shell
mkdir meta_dir
```

### 4.2 FE 시작 {#42-start-fe}

```shell
cd output/fe
sh bin/start_fe.sh --daemon
```

### 4.3 BE 시작 {#43-start-be}

```shell
cd output/be
sh bin/start_be.sh --daemon
```

### 4.4 mysql-client로 연결 {#44-connect-with-mysql-client}

```shell
mysql -h 127.0.0.1 -P 9030 -u root
```

## 5. 자주 묻는 질문 {#5-faq}

<!-- Knowledge type: Troubleshooting -->

### Q1: GDB에서 `ptrace: Operation not permitted` 오류 발생 {#q1-gdb-reports-ptrace-operation-not-permitted}

컨테이너를 시작할 때 `--cap-add SYS_PTRACE`를 지정하지 않았습니다. 해당 매개변수를 추가하여 컨테이너를 다시 시작하세요.

### Q2: 컴파일 시 thrift 버전 불일치 오류 발생 {#q2-compilation-reports-thrift-version-mismatch}

첫 컴파일 시 `--clean`을 지정하지 않았습니다. 정리한 후 3절의 명령으로 다시 컴파일하세요.

### Q3: FE / BE가 시작 직후 종료됨 {#q3-fe--be-exits-immediately-after-starting}

`meta_dir`과 `storage_root_path`가 생성되었는지, 포트가 다른 프로세스에서 사용 중이지 않은지, `priority_networks`에 컨테이너 IP가 포함되는지 확인하세요.

### Q4: VSCode Remote 컨테이너에서 디버깅할 프로세스에 연결할 수 없음 {#q4-vscode-remote-container-cannot-attach-to-a-process-for-debugging}

`SYS_PTRACE` 기능이 추가되지 않았거나, VSCode C/C++ 플러그인에 적절한 `miDebuggerPath`가 지정되지 않았습니다.

---
title: Windows(WSL2)에서 Apache Doris 컴파일하기
language: ko
description: WSL2를 사용하여 Windows에서 Apache Doris를 컴파일하는 절차.
keywords:
    - Windows 컴파일
    - WSL2
    - WSL
    - Apache Doris
    - 소스 컴파일
    - Linux 하위 시스템
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
<!-- Applicable scenario: Windows development machine / WSL2 compilation -->

이 문서는 Windows 플랫폼에서 Apache Doris 소스 코드를 컴파일하는 방법을 설명합니다. Doris는 Windows에서의 네이티브 컴파일을 직접 지원하지 않지만, WSL2(Windows Subsystem for Linux 2)를 사용하면 Windows에서 Linux 하위 시스템을 실행한 뒤 Linux 컴파일 절차에 따라 빌드를 완료할 수 있습니다.

:::tip
현재 Windows + WSL2 환경에서는 스토리지·컴퓨팅 분리 모드의 컴파일과 배포를 지원하지 않습니다.
:::

## 대상 사용자와 장단점 {#target-users-pros-and-cons}

| 구분 | 설명 |
| ---- | ---- |
| 대상 사용자 | Windows 개발 환경에서 Doris를 컴파일하고 디버깅해야 하는 개발자 |
| 장점 | 듀얼 부팅 시스템이나 별도의 Linux 서버 없이 로컬에서 컴파일 가능 |
| 단점 | Windows 10 2004+ 또는 Windows 11이 필요하며 일정량의 디스크 공간 사용 |

## 1. 환경 요구 사항 {#1-environment-requirements}

<!-- Knowledge type: Hardware requirements -->

| 항목 | 요구 사항 |
| ---- | ---- |
| Windows 버전 | Windows 10 2004(빌드 19041) 이상 또는 Windows 11 |
| WSL 버전 | WSL2(Ubuntu 22.04 또는 Ubuntu 24.04 배포판 권장) |
| 디스크 공간 | 최소 50 GB의 여유 공간 권장(소스 코드, 서드파티 라이브러리, 빌드 결과물 저장용) |

## 2. 컴파일 절차 {#2-compilation-steps}

### 2.1 WSL2 설치 {#21-install-wsl2}

Microsoft 공식 문서인 [WSL 설치 가이드](https://learn.microsoft.com/en-us/windows/wsl/install)를 참고하여 PowerShell에서 다음 명령을 실행합니다.

```powershell
wsl --install
```

설치가 완료되면 시스템을 다시 시작하고 안내에 따라 Linux 하위 시스템을 초기화합니다(사용자 이름과 비밀번호 설정).

### 2.2 WSL2에서 Doris 컴파일 {#22-compile-doris-in-wsl2}

WSL2로 실행한 Linux 하위 시스템에 접속하여 다음 컴파일 방법 중 하나를 선택합니다.

- [LDB Toolchain으로 컴파일(권장)](./compilation-with-ldb-toolchain)
- [Docker 이미지로 컴파일(권장)](./compilation-with-docker)
- [Linux에서 직접 컴파일](./compilation-linux)

## 3. 참고 사항 {#3-notes}

- **저장 드라이브**: WSL2 배포판 데이터는 기본적으로 C 드라이브에 저장됩니다. C 드라이브의 공간이 부족하다면 시스템 드라이브가 가득 차지 않도록 설치 전에 WSL2 데이터를 다른 드라이브로 옮기세요. 이전 방법은 [WSL 내보내기 및 가져오기](https://learn.microsoft.com/en-us/windows/wsl/basic-commands#export-a-distribution-to-a-tar-file) 명령을 참고하세요.
- **리소스 제한**: WSL2는 기본적으로 호스트 메모리를 사용합니다. 메모리 부족으로 컴파일 프로세스가 자주 강제 종료된다면 `memory` 및 `processors` 제한값을 `%UserProfile%\.wslconfig`에서 늘리세요.
- **파일 시스템**: 소스 코드는 WSL2 내부의 ext4 파일 시스템(예: `~/doris`)에 두세요. 마운트된 `/mnt/c/...` 경로에 두면 파일 시스템 간 접근으로 인해 컴파일 속도가 매우 느려집니다.

## 자주 묻는 질문 {#faq}

### Q1: WSL2 설치가 "Windows를 업데이트해야 합니다"라는 메시지와 함께 실패하나요? {#q1-wsl2-installation-fails-with-windows-needs-to-be-updated}

Windows를 10 2004(빌드 19041) 이상으로 업그레이드하거나 Windows 11을 사용하세요.

### Q2: WSL2에서 컴파일 속도가 매우 느린가요? {#q2-wsl2-compilation-is-extremely-slow}

소스 코드가 WSL2 내부 파일 시스템(예: `~/doris`)에 있고 `/mnt/c/...` 아래에 있지 않은지 확인하세요. 파일 시스템 간 접근은 컴파일 속도를 크게 떨어뜨립니다.

### Q3: WSL2가 호스트 메모리를 모두 사용하나요? {#q3-wsl2-uses-up-all-the-host-memory}

`%UserProfile%\.wslconfig`에서 WSL2의 리소스 사용량을 제한하세요.

```ini
[wsl2]
memory=12GB
processors=8
```

파일을 수정한 후 `wsl --shutdown`을 실행하고 WSL2를 다시 시작하면 변경 사항이 적용됩니다.

## 관련 문서 {#related-documents}

- [LDB Toolchain으로 컴파일](./compilation-with-ldb-toolchain)
- [Docker 이미지로 컴파일](./compilation-with-docker)
- [Linux에서 직접 컴파일](./compilation-linux)

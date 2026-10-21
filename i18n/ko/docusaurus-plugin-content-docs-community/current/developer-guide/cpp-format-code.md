---
title: C++ 코드 포맷 규칙
language: ko
description: "Apache Doris C++ 코드 포맷: clang-format 도구 설정과 명령줄 및 IDE에서의 사용 방법."
keywords:
    - Apache Doris
    - C++ 코드 포맷
    - clang-format
    - LDB toolchain
    - Clion
    - VS Code
    - BE 개발
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

# C++ 코드 포맷 규칙 {#c-code-formatting-specification}

<!-- Knowledge type: Code specification -->
<!-- Applicable scenario: BE development / Pull Request submission -->

Apache Doris는 `clang-format`을 사용하여 C++ 코드의 포맷을 지정합니다. 개발자가 코드를 제출하기 전에 포맷을 통일할 수 있도록 `build-support` 디렉터리에 래퍼 스크립트를 제공합니다.

## 래퍼 스크립트 {#wrapper-scripts}

| 스크립트 | 용도 |
|------|------|
| `build-support/clang-format.sh` | `be/src`와 `be/test` 아래의 C/C++ 코드 포맷을 지정합니다 |
| `build-support/check-format.sh` | `be/src`와 `be/test`의 코드 포맷을 검사하고 파일을 수정하지 않은 채 diff를 출력합니다 |

## 코드 스타일 사용자 지정 {#code-style-customization}

- Apache Doris의 코드 스타일은 Google Style을 바탕으로 일부 조정한 것입니다. 설정 파일 `.clang-format`은 Doris 루트 디렉터리에 있습니다.
- `.clang-format`은 `clang-format-16.0.0` 이상 버전과 호환됩니다.
- `.clang-format-ignore` 파일에는 포맷을 지정하지 않을 코드가 나열되어 있습니다. 일반적으로 원래 스타일을 유지해야 하는 서드파티 라이브러리가 여기에 해당합니다.

## 환경 설정 {#environment-setup}

`clang-format`을 설치하거나 IDE/편집기에서 제공하는 `clang-format` 플러그인을 사용해야 합니다. Doris는 현재 코드 포맷 지정에 `clang-format 16`을 사용합니다(`clang-format` 버전에 따라 결과가 달라질 수 있습니다).

### clang-format 설치 {#install-clang-format}

| 시스템 | 권장 방법 |
|------|---------|
| Linux | 호환되는 버전이 이미 포함된 [LDB toolchain](/community/source-install/compilation-with-ldb-toolchain)을 사용하거나 바이너리를 직접 빌드/설치합니다 |
| macOS | `brew install clang-format@16` |

LDB toolchain 참고 사항: 최신 버전(>= v0.18)에는 사전 빌드된 `clang-format 16.0.0` 바이너리가 이미 포함되어 있습니다. 다운로드는 [ldb_toolchain_gen 릴리스](https://github.com/amosbird/ldb_toolchain_gen/releases)를 참고하세요.

### IDE 플러그인 사용 {#use-an-ide-plugin}

| IDE | 플러그인 | 참고 사항 |
|-----|------|---------|
| CLion | `ClangFormat` (`File -> Setting -> Plugins`에서 검색하여 다운로드) | `clang-format` 버전이 16인지 확인하세요 |
| VS Code | `Clang-Format` 확장 프로그램 | `clang-format` 실행 파일의 경로를 직접 지정해야 합니다 |

## 사용 방법 {#usage}

### 명령줄에서 실행 {#run-from-the-command-line}

1. Doris 루트 디렉터리로 이동합니다.

    ```bash
    cd ${DORIS_HOME}
    ```

2. 포맷 지정 스크립트를 실행합니다.

    ```bash
    build-support/clang-format.sh
    ```

> 참고: `clang-format.sh` 스크립트를 실행하려면 컴퓨터에 Python 3이 설치되어 있어야 합니다.

### CLion에서 clang-format 사용 {#use-clang-format-in-clion}

`ClangFormat` 플러그인을 설치한 후 `Reformat Code`를 클릭하면 현재 파일의 포맷을 지정할 수 있습니다.

### VS Code에서 clang-format 사용 {#use-clang-format-in-vs-code}

1. `Clang-Format` 확장 프로그램을 설치합니다.
2. VS Code 설정 페이지를 열고 `clang_format`을 검색한 다음 아래 설정을 입력합니다.

    ```json
    {
        "clang_format_path": "$clang-format path$",
        "clang_format_style": "file"
    }
    ```

3. 마우스 오른쪽 버튼을 클릭하고 `Format Document`를 선택하여 파일의 포맷을 지정합니다.

## 자주 묻는 질문 {#faq}

**질문: `clang-format` 버전이 다르면 포맷이 달라질 수 있나요?**

네. 반드시 `clang-format 16` 계열을 사용하세요. 다른 버전을 사용하면 프로젝트에서 요구하는 포맷과 달라져 CI가 실패할 수 있습니다.

**질문: 서드파티 코드의 포맷도 변경되나요?**

아니요. `.clang-format-ignore`에 나열된 디렉터리는 건너뛰므로 서드파티 의존성의 원래 코드 스타일이 유지됩니다.

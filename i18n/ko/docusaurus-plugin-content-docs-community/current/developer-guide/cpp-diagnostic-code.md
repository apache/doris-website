---
title: C++ 정적 코드 분석
language: ko
description: "Apache Doris C++ 정적 코드 분석: Clang-Tidy 및 Clangd 설정(VSCode 통합 포함)."
keywords:
    - Apache Doris
    - C++ 정적 분석
    - Clang-Tidy
    - Clangd
    - VSCode
    - LDB toolchain
    - compile_commands.json
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

# C++ 정적 코드 분석 {#c-static-code-analysis}

<!-- Knowledge type: Code conventions -->
<!-- Applicable scenarios: BE development / Code quality checks -->

Apache Doris는 [Clangd](https://clangd.llvm.org/)와 [Clang-Tidy](https://clang.llvm.org/extra/clang-tidy/)를 사용한 C++ 코드 정적 분석을 지원합니다. 두 도구는 모두 [LDB-toolchain](/community/source-install/compilation-with-ldb-toolchain)에 포함되어 있으며, 직접 설치하거나 빌드할 수도 있습니다.

## 도구 비교 {#tool-comparison}

| 도구 | 용도 | 설정 파일 |
|------|---------|--------------------|
| Clangd | 코드 탐색, 자동 완성, 마우스를 올렸을 때 표시되는 도움말 등의 IDE 기능 제공 | `clangd.arguments`를 통해 전달 |
| Clang-Tidy | 정적 분석 및 코드 품질 검사(Clangd에서 호출 가능) | Doris 루트 디렉터리의 `.clang-tidy` |

`vscode-cpptools`와 비교하면 Clangd는 더 정확한 코드 탐색 기능을 제공하며, Clang-Tidy의 진단 및 빠른 수정 기능을 통합합니다.

## Clang-Tidy 설정 {#clang-tidy-configuration}

Clang-Tidy 검사 규칙은 Doris 루트 디렉터리의 `.clang-tidy` 파일에서 일괄 관리합니다. 이 파일을 편집하여 특정 검사를 활성화하거나 비활성화할 수 있습니다.

## VSCode에서 Clangd 설정하기 {#configuring-clangd-in-vscode}

<!-- Knowledge type: Tool usage -->

### 설정 절차 {#steps}

1. `clangd` 플러그인을 설치합니다.
2. 사용하기 전에 `be(RELEASE)`와 `be-ut(ASAN)`을 각각 한 번 컴파일하여 해당 `compile_commands.json` 파일을 생성합니다.
3. `settings.json`을 편집하거나 기본 설정에서 플러그인 설정을 직접 변경합니다.

### 설정 예시 {#configuration-example}

```json
{
    "clangd.path": "ldb_toolchain/bin/clangd",
    "clangd.arguments": [
        "--background-index",
        "--clang-tidy",
        "--compile-commands-dir=doris/be/build_Release/",
        "--completion-style=detailed",
        "-j=5",
        "--all-scopes-completion",
        "--pch-storage=memory",
        "--pretty",
        "--query-driver=ldb_toolchain/bin/*"
    ],
    "clangd.trace": "output/clangd-server.log"
}
```

### 주요 매개변수 {#key-parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `clangd.path` | Clangd 실행 파일의 경로 |
| `--background-index` | 심볼 검색 속도를 높이기 위해 전체 프로젝트를 백그라운드에서 인덱싱 |
| `--clang-tidy` | Clang-Tidy 정적 검사 활성화 |
| `--compile-commands-dir` | `compile_commands.json`이 있는 디렉터리 지정 |
| `--completion-style=detailed` | 자동 완성 시 상세 정보 표시 |
| `-j=5` | Clangd가 파일 분석에 사용하는 병렬 작업 수 |
| `--query-driver` | 시스템 헤더 파일을 찾는 데 사용하는 컴파일러의 경로 |

## 자주 묻는 질문 {#faq}

**질문: `clangd`가 헤더 파일이나 심볼을 찾을 수 없다고 보고하면 어떻게 해결하나요?**

BE를 한 번 이상 컴파일하여 `compile_commands.json`이 생성되었는지, `--compile-commands-dir`이 올바른 디렉터리를 가리키는지 확인합니다.

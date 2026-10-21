---
title: Java 코드 서식 규칙
language: ko
description: "Apache Doris의 Java 코드 서식 규칙: import 순서, Checkstyle 및 IDE 설정."
keywords:
    - Apache Doris
    - Java 코드 서식
    - Checkstyle
    - IDEA
    - VS Code
    - import 순서
    - formatter-check
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

# Java 코드 서식 규칙 {#java-code-formatting-specification}

<!-- Knowledge type: Code specification -->
<!-- Applicable scenarios: FE development / Pull Request submission -->

Apache Doris의 Java 코드(주로 FE 모듈)는 보통 IDE의 자동 서식 기능으로 정리합니다. 이 문서에서는 일반적인 서식 규칙과 IDE별 설정 방법을 설명합니다. CI 파이프라인은 `formatter-check`로 코드 서식을 검증합니다.

## import 순서 규칙 {#import-order-rules}

<!-- Knowledge type: Code specification -->

import 문은 다음 그룹 순서대로 배치하고, 각 그룹 사이에 빈 줄을 하나씩 넣어야 합니다:

```text
org.apache.doris
<blank line>
third party package
<blank line>
standard java package
<blank line>
```

추가 규칙:

| 규칙 | 설명 |
|------|-------------|
| `import *` 금지 | 모든 클래스를 명시적으로 import해야 함 |
| `import static` 금지 | 정적 import는 허용되지 않음 |

## 컴파일 시 Checkstyle 검사 {#checkstyle-check-at-compile-time}

`maven`으로 컴파일하면 기본적으로 `Checkstyle` 검사가 실행되므로 컴파일 속도가 약간 느려집니다. 검사를 건너뛰려면 다음 명령을 사용합니다:

```bash
mvn clean install -DskipTests -Dcheckstyle.skip
```

CI의 `formatter-check`는 코드 서식 검증을 강제합니다. 로컬에서 검사를 건너뛰는 것은 개발 및 디버깅 용도로만 사용합니다. PR을 제출하기 전에 코드가 서식 규칙을 준수하는지 확인하세요.

## Checkstyle 플러그인 설정 {#checkstyle-plugin-configuration}

### IDEA에서 Checkstyle 설정 {#configure-checkstyle-in-idea}

1. 설정에서 `Checkstyle-IDEA` 플러그인을 설치합니다.
2. `Tools -> Checkstyle`로 이동하여 `Configuration File`을 찾고 `Use a local Checkstyle file`을 클릭합니다.
3. 프로젝트 루트 디렉터리에서 `fe/check/checkstyle/checkstyle.xml` 파일을 선택합니다.
4. `Checkstyle` 버전이 9.3 이상인지 확인합니다(최신 버전 권장).

![](/images/idea-checkstyle-version.png)

설정이 완료되면 `Checkstyle-IDEA` 플러그인으로 코드에 대한 Checkstyle 검사를 실행할 수 있습니다:

![](/images/idea-checkstyle-plugin-cn.png)

### VS Code에서 Checkstyle 설정 {#configure-checkstyle-in-vs-code}

1. `Checkstyle for Java` 플러그인을 설치합니다.
2. [Java 린팅 공식 문서](https://code.visualstudio.com/docs/java/java-linting)의 안내와 애니메이션을 따라 설정을 완료합니다.

## IDEA 코드 서식 {#idea-code-formatting}

### 자동 서식 설정 {#auto-formatting-configuration}

IDEA의 자동 서식 기능을 사용하는 것이 좋습니다:

1. `Preferences -> Editor -> Code Style -> Java`로 이동합니다.
2. 설정 아이콘의 `Import Scheme`을 클릭하고 `IntelliJ IDEA code style XML`을 선택합니다.
3. 프로젝트 루트 디렉터리에서 `build-support/IntelliJ-code-format.xml` 파일을 선택합니다.

### 코드 재정렬 {#rearrange-code}

Checkstyle은 [클래스 및 인터페이스 선언](https://www.oracle.com/java/technologies/javase/codeconventions-fileorganization.html#1852)에 따라 코드 선언 순서를 검사합니다.

위의 `build-support/IntelliJ-code-format.xml`을 가져온 후 `Code/Rearrange Code`를 사용하면 자동으로 정렬할 수 있습니다:

![](/images/idea-rearrange-code.png)

## 사용하지 않는 import 자동 제거 {#automatically-remove-unused-imports}

| 목적 | 작업 |
|---------|--------|
| 사용하지 않는 import만 제거 | 기본 단축키 `CTRL + ALT + O` 사용 |
| 저장 시 자동으로 제거하고 재정렬 | `Preferences -> Editor -> General -> Auto Import -> Optimize Imports on the Fly` 선택 |

## 자주 묻는 질문 {#faq}

**질문: CI에서 `formatter-check`가 실패하면 어떻게 해결하나요?**

로컬에서 IDEA나 Checkstyle 플러그인으로 검사를 실행하세요. import 순서, 명명 규칙, 선언 순서가 모두 `fe/check/checkstyle/checkstyle.xml`의 요구 사항을 충족하는지 확인한 후 다시 제출하세요.

**질문: 로컬에서 Checkstyle 검사를 건너뛰면 PR 병합에 영향을 주나요?**

네. CI에서는 여전히 `formatter-check`를 실행합니다. 로컬의 `-Dcheckstyle.skip` 옵션은 개발 빌드 속도를 높이는 데만 사용합니다. 최종 코드는 Checkstyle 검사를 통과해야 합니다.

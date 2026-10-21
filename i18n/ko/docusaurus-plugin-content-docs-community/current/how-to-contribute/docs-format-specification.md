---
title: 문서 형식 규격
language: ko
description: "Apache Doris 문서 형식 규격: 파일 명명, 영어 대문자 표기, SQL 함수 및 약어 표기 규칙."
keywords:
    - Apache Doris
    - 문서 형식 규격
    - 파일 명명 규칙
    - SQL 함수 명명
    - Markdown 규격
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

<!-- Knowledge Type: Rules and Specifications -->
<!-- Applicable Scenarios: Documentation Contribution / Documentation Review -->

이 문서는 Apache Doris 문서의 형식 규격을 설명합니다. 다음 내용을 다룹니다.

1. 파일 이름, URL 및 레이아웃의 기본 형식 규칙
2. 문서 콘텐츠에 권장되는 렌더링 요소

:::caution 참고

- 이전 버전 문서를 수정하든 최신 버전 문서를 수정하든, PR은 [apache/doris-website](https://github.com/apache/doris-website) 저장소에 제출하세요.
- 문서 변경 사항을 제출하기 전에 [문서 기여 가이드](./contribute-doc)를 읽어 주세요.

:::

## 기본 형식 규격 {#basic-format-specifications}

### 파일 및 URL 명명 {#file-and-url-naming}

문서 이름은 문서 내용을 간략하게 요약해야 하며 너무 길지 않아야 합니다. Doris 웹사이트에서는 파일 이름을 URL로도 사용하므로, 파일 명명 규칙은 `sidebars.json`의 항목 이름과 연결됩니다.

| 규칙 | 설명 | 예시 |
| --- | --- | --- |
| 사이드바와 일치 | 파일 이름은 `sidebars.json`의 문서 이름과 일치해야 합니다 | `quick-start` |
| 모두 소문자 사용 | 파일 이름의 단어는 모두 소문자로 작성합니다. 대소문자를 섞거나 문장 부호를 추가하지 마세요 | `standard-deployment` |
| 하이픈으로 구분 | 여러 영어 단어는 하이픈 `-`으로 구분합니다. 밑줄 `_`은 권장하지 않습니다 | `bloom-filter-index` |
| 함수의 예외 | 특정 함수 이름에 밑줄이 사용되는 경우 해당 함수의 명명 규칙을 따릅니다 | `array_max` |

### 영어 대문자 표기 규칙 {#english-capitalization-specifications}

| 상황 | 규칙 |
| --- | --- |
| 제목 | 제목의 첫 단어 첫 글자는 대문자로 씁니다. 고유 명사를 제외한 나머지 단어는 모두 소문자로 씁니다 |
| 중국어 문장 안의 영어 | 주로 CamelCase를 따릅니다. 고유 명사는 통상적인 표기를 따릅니다 |
| 중국어와 영어 혼용 | 중국어 문서에서는 가능한 한 중국어 표현을 사용합니다. 특정 구문이나 단어에만 영어를 사용합니다. 영어 문서에도 같은 원칙이 적용됩니다 |

### 영어 고유 명사 표기 규칙 {#english-proper-noun-specifications}

중국어 문서에서 공식 중국어 번역이 없는 외국 기업의 브랜드, 제품 이름 또는 기술 용어를 언급할 때는 올바른 대소문자로 표기한 영어 이름을 그대로 사용합니다. 아래 테이블은 지속적으로 업데이트됩니다. PR에서 항목을 추가해 주세요.

| 공식 중국어 번역이 없는 용어 |
| --- |
| GitHub |
| SQL |
| CPU |
| FE |
| BE |
| HTTP |
| MySQL |
| MongoDB |
| Elasticsearch |
| Azure |
| AWS |
| S3 |
| Doris Manager |
| WebUI |
| Flink Doris Connector |

### SQL 함수 및 SQL 매뉴얼 작성 규칙 {#sql-function-and-sql-manual-specifications}

| 상황 | 규칙 | 예시 |
| --- | --- | --- |
| SQL 함수 이름 | 모두 대문자로 씁니다. 구문 규칙에 따라 밑줄 `_`로 문자를 구분합니다 | `ARRAY_MAX`, `DIGITAL_MASKING` |
| DML / DDL / 데이터 타입 / 클러스터 관리 | 대문자로 씁니다. 반각 공백으로 문자를 구분합니다 | `ALTER CATALOG`, `SELECT * FROM` |
| 예시 및 참조 | 소문자를 사용할 수 있습니다 | `col_name1`, `sample_value` |

SQL 함수 문서의 구성은 [문서 기여 가이드 - 명령어 도움말 매뉴얼 작성 방법](./contribute-doc#how-to-write-the-command-help-manual)을 참고하세요.

### 약어 표기 규칙 {#abbreviation-specifications}

약어는 중국어 약어와 영어 약어로 나뉩니다. 다음 규칙을 따라 주세요.

**중국어 약어**: 약어는 이해하기 쉽고 의미가 모호하지 않아야 합니다. 용어가 처음 등장할 때 전체 의미를 설명하고, 이후에는 약어를 사용한다는 점을 독자에게 알리는 것이 좋습니다.

**영어 약어**:

- 제목에서는 영어 약어를 풀어서 설명하지 마세요
- 본문에서 약어가 처음 등장할 때 전체 의미를 설명하는 것이 좋습니다. 예를 들어 `Tablet & Partition`은 이후 문서에서 "파티션과 버킷"으로 지칭한다고 설명할 수 있습니다
- 비표준 약어는 사용하지 마세요

:::tip

| 잘못된 표기 | 올바른 표기 |
| --- | --- |
| 16c32g | 16코어, 32 GB |
| 10w | 100,000 |

:::

## 문서 구조 규칙 {#document-structure-specifications}

### 제목 {#headings}

적절한 제목 수준과 제목 문구는 독자가 문서 전체의 논리적 흐름을 이해하고 글의 구조를 한눈에 파악하는 데 도움이 됩니다.

**1. 제목 수준**

기술 문서의 제목 수준은 최대 두 단계입니다. **본문 제목은 `##`부터 시작하여 수준을 한 단계씩 늘립니다. 중간 수준을 건너뛰지 마세요.**

| 수준 | 구문 | 설명 |
| --- | --- | --- |
| 1단계 제목 | `{ "title": "", "language": "" }` | 문서 제목입니다. **문서 제목을 정의할 때 `#`을 사용하지 마세요** |
| 2단계 제목 | `##` | 문서 본문의 제목입니다 |
| 3단계 제목 | `###` | 2단계 제목 아래의 하위 제목입니다 |

```markdown
{
    "title": "Document title (the # level 1 heading)",
    "language": "en"
}


## Level 2 heading

### Level 3 heading
```

**2. 제목 문구의 구조**

기술 문서의 제목에는 다음과 같은 문구를 사용할 수 있으며, 이에 국한되지는 않습니다.

- 명사구: 예를 들어 "고동시성 포인트 쿼리 원리"
- 주제 + 동사: 예를 들어 "Docker 배포"
- 동사 + 주제: 예를 들어 "설정 파일 디렉터리"
- 수식어 + 주제: 예를 들어 "Schema Change" 또는 "Flink Doris Connector 사용자 가이드"
- 전치사 + 수식어 + 주제: 예를 들어 "Doris Operator를 사용한 배포"

**3. 기타 참고 사항**

제목 문구에는 엄격한 템플릿이 없습니다. 다음 원칙을 따르면 됩니다.

- 해당 섹션의 핵심 내용을 간결하게 요약하세요
- 같은 수준의 제목은 가능한 한 같은 구조로 작성하세요
- **하위 제목에서 상위 제목의 내용을 반복하지 마세요**
- **제목 끝에 문장 부호를 붙이지 마세요**
- 제목에서 약어를 풀어서 설명하지 마세요

### 도입 문단 {#lead-paragraph}

도입 문단은 본문 앞에 배치합니다. 문서의 전반적인 내용을 요약해야 하며, 가능한 한 150단어 이내로 작성합니다.

다음 두 가지 작성 방식을 참고할 수 있습니다.

- XXX가 무엇인지 설명: 예를 들어 "Data Export는 데이터를 내보내는 Doris 기능입니다. 이 기능을 사용하면..."
- 이 문서에서 XXX를 소개한다고 설명: 예를 들어 "이 문서는 Data Export의 기본 원리, 사용법, 모범 사례 및 유의 사항을 소개합니다"

## 문서 콘텐츠 요소(참고용) {#document-content-elements-for-reference}

### Tab 사용 {#tab-usage}

기술 문서에서는 들여쓰기와 정렬에 Tab 키와 스페이스 키를 자주 사용합니다. 따라서 다음을 권장합니다.

- 들여쓰기에는 Tab을 사용하세요. 들여쓰기에 Tab과 공백을 섞어 사용하지 마세요
- Visual Studio Code 등의 편집기에서는 Tab 하나가 반각 공백 네 개에 해당하도록 통일하여 설정하세요
- 들여쓰기는 문서의 렌더링에 영향을 줍니다. **VS Code와 같은 리치 텍스트 편집기의 렌더링 결과를 기준으로 삼으세요**. 예를 들어 여러 단계로 들여쓴 구조 안에 있는 코드 블록도 올바르게 렌더링하려면 들여쓰기가 없어야 하는 경우가 있습니다

### 공백 사용 {#space-usage}

- 영어 텍스트나 숫자가 중국어와 맞닿아 있을 때는 앞뒤에 반각 공백을 추가하세요
- 코드 상자가 중국어와 맞닿아 있을 때는 앞뒤에 반각 공백을 추가하세요
- **괄호 안쪽**에는 공백을 넣지 마세요. **괄호 바깥쪽**의 앞뒤에는 반각 공백을 추가하세요

:::tip

반각 공백 일괄 추가 도구: https://github.com/huacnlee/autocorrect

:::

### 순서 있는 목록과 순서 없는 목록 {#ordered-and-unordered-lists}

기술 문서의 본문에서는 순서 있는 목록과 순서 없는 목록을 자주 사용합니다. 순서 있는 목록은 일반적으로 항목 간의 우선순위를 강조합니다.

- **순서 있는 텍스트에는 `1. **Bold ordered text**` 형식을 사용하는 것이 좋습니다**. 이렇게 하면 들여쓰기 없이 상위 수준에 맞춰 텍스트를 정렬할 수 있습니다
- 순서 있는 텍스트 안에 순서 없는 텍스트가 포함되면 순서 있는 텍스트는 굵게 표시하고, 순서 없는 텍스트는 굵게 표시하지 마세요

### 링크 {#links}

문서의 링크는 독자를 관련 문서나 외부 사이트로 안내합니다. 다음 규칙을 따르는 것이 좋습니다.

- **링크 설명**: 같은 유형의 링크에는 일관된 설명 방식을 사용하세요. 한 문서 안에서 "자세한 내용 보기", "자세한 내용 참고", "자세한 내용은 다음에서 확인" 같은 문구를 반복해서 사용하지 마세요
- **링크 형식**:
    - 같은 문서의 다른 제목으로 연결하는 링크: `[Inverted Index]`
    - 인접한 문서로 연결하는 링크: `[BITMAP Index]`
    - 외부 사이트로 연결하는 링크: `[Wikipedia - Inverted Index](https://en.wikipedia.org/wiki/Inverted_index)`
- **링크 경로**:
    - 한 문서 안에서는 상대 경로나 절대 경로 중 하나를 일관되게 사용하는 것이 좋습니다. 둘을 섞어 사용하지 마세요
    - 외부 페이지의 오류가 독자의 이용 경험에 영향을 주지 않도록 외부 사이트로 이동하는 횟수를 줄이는 것이 좋습니다. 독자를 외부 사이트로 안내해야 한다면 "클릭하여 XXX로 이동"과 같이 외부 사이트로 이동한다는 점을 알리는 것이 좋습니다

### 코드 블록 및 코드 주석 {#code-blocks-and-code-comments}

코드 블록을 삽입할 때는 다음 규칙을 따르세요.

- 인라인 코드에는 백틱 하나(`` ` ``)를 사용합니다. 여러 줄 코드에는 백틱 세 개를 사용합니다
- 인라인 코드 블록 앞뒤에 공백을 추가합니다. 여러 줄 코드와 본문 사이에는 빈 줄을 둡니다
- **코드 블록의 들여쓰기에 주의하세요**. 코드 블록이 순서 있는 목록 항목이나 일반 목록 항목 등의 콘텐츠 아래에 있으면 해당 항목의 들여쓰기 수준에서 한 단계 더 들여씁니다
- 여러 줄 코드를 사용할 때는 해당 구문 강조를 지원할 수 있도록 **코드 펜스를 추가하고 코드 블록의 언어를 지정**하는 것이 좋습니다

자주 사용하는 언어와 코드 펜스 지정자는 다음과 같습니다.

| 코드 유형 | 코드 펜스 지정자 |
| --- | --- |
| Shell 스크립트 | ` ```shell ` |
| Python 코드 | ` ```python ` |
| JSON 코드 | ` ```json ` |
| XML 문서 | ` ```xml ` |
| SQL 쿼리(소문자 `sql`을 사용해야 하며, 그렇지 않으면 렌더링에 실패합니다) | ` ```sql ` |
| YAML 파일 | ` ```yaml ` 또는 ` ```yml ` |
| Markdown 텍스트 | ` ```markdown ` 또는 ` ```md ` |
| JavaScript 코드 | ` ```js ` 또는 ` ```javascript ` |
| Java 코드 | ` ```java ` |
| C++ 코드 | ` ```cpp ` |
| C 코드 | ` ```c ` |
| Ruby 코드 | ` ```ruby ` |
| HTML 코드 | ` ```html ` |
| CSS 코드 | ` ```css ` |
| PHP 코드 | ` ```php ` |

`shell` 코드를 사용할 때는 입력 명령어와 출력 결과를 따로 작성하세요. 다음 예시는 Kubernetes 클러스터 접근 문서에서 가져온 것입니다.

- 다음 명령어로 해당 Service를 확인합니다.

    ```shell
    kubectl get pod --namespace doris
    ```

- 반환 결과는 다음과 같습니다.

    ```shell
    NAME                     READY   STATUS    RESTARTS   AGE
    doriscluster-helm-fe-0   1/1     Running   0          1m39s
    doriscluster-helm-fe-1   1/1     Running   0          1m39s
    doriscluster-helm-fe-2   1/1     Running   0          1m39s
    doriscluster-helm-be-0   1/1     Running   0          16s
    doriscluster-helm-be-1   1/1     Running   0          16s
    doriscluster-helm-be-2   1/1     Running   0          16s
    ```

### 알림 블록 {#admonition-notes}

알림 블록은 기술 문서에서 내용을 강조할 때 사용합니다. 사용할 때는 다음 규칙을 따르세요.

| 유형 | 사용 상황 | 구문 |
| --- | --- | --- |
| 팁 | 주로 작업 요령을 안내할 때 사용합니다 | `:::tip Tip` |
| 정보 | 보충 내용이나 설명을 추가할 때 사용합니다 | `:::info Note` |
| 주의 | 작업에 대한 경고나 주의할 사항을 안내할 때 사용합니다 | `:::caution Caution` |

알림 블록의 내용에는 순서 있는 목록, 순서 없는 목록 및 코드 블록을 포함할 수 있습니다.

다음은 Markdown 문서에서 알림 블록을 사용하는 예시입니다.

```markdown
:::tip Tip
This is a tip
:::

:::info Note
This is a note
:::

:::caution Caution
This is a caution
:::
```

### 이미지 {#images}

이미지를 삽입할 때는 다음 규칙을 따르세요.

- 이미지 이름에는 `Broadcast Join Principle`과 같이 내용을 설명하는 텍스트를 사용하세요
- 이미지를 삽입할 때는 **대체 텍스트를 추가하세요**. 권장 구문은 `![Alt text description](https://example.com/your-image.png)`입니다
- 이미지를 가운데 정렬하려면 다음을 사용하세요.

    ```markdown
    <div style={{textAlign:'center'}}>
    <img src="image URL" alt="text description" style={{display: 'inline-block'}}/>
    </div >
    ```

### 테이블 {#tables}

테이블 셀 안에서 줄을 바꾸려면 `<p>XXXX</p>`를 사용하세요.

### 접기 상자 {#collapsible-boxes}

접기 상자는 3단계 제목 뒤에 사용합니다. 콘텐츠의 계층이 너무 많으면 접기 상자를 사용하여 내용을 구분할 수 있습니다.

다음 규칙을 따르세요.

- `<details><summary>Collapsible box title</summary> Collapsible box content</details>` 구문을 사용하세요
- 접기 상자의 들여쓰기에 주의하세요. 3단계 제목 아래에서는 맨 왼쪽 열부터 시작하세요

다음은 Markdown에서 접기 상자를 사용하는 예시입니다.

```markdown
<details>
<summary>Fill in the title here</summary>
This is the collapsible box content
<p>To add a line break, use an HTML tag</p>
<p>XXXXXXXX</p>
</details>
```

### 탭 선택기 {#tab-selector}

탭 선택기는 3단계 제목 뒤에 사용합니다. 문서 콘텐츠의 계층이 너무 많으면 탭 선택기 컨테이너를 사용할 수 있습니다.

다음 규칙을 따르세요.

- 탭 선택기의 들여쓰기에 주의하세요. 3단계 제목 아래에서는 맨 왼쪽 열부터 시작하세요
- 구문은 다음과 같습니다.

```markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="Content title 1" label="Content title 1" default>
    <p>Content 1 </p>
    <p>Content 2 </p>
  </TabItem>
  <TabItem value="Content title 2" label="Content title 2" default>
    <p>Content 1 </p>
    <p>Content 2 </p>
  </TabItem>
</Tabs>
```

### 버전 태그 {#version-tags}

새 문서에서는 **버전 태그로 여러 문서 버전을 구분하는 방식을 권장하지 않습니다**. 기능을 버전별로 구분해야 한다면 `:::tip :::` 알림 블록으로 표시할 수 있습니다.

### 인용문 {#blockquotes}

새 문서에서는 내용을 설명하거나 중첩하기 위해 **`>` 인용문 기호를 사용하는 것을 권장하지 않습니다**. 참고 사항을 추가해야 한다면 `:::info :::` 알림 블록을 사용하세요.

## 관련 문서 {#related-documents}

- [문서 기여 가이드](./contribute-doc)
- [블로그 공유 방법](./how-to-share-blogs)

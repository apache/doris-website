---
{
    "title": "TOKENIZE",
    "language": "ko",
    "description": "TOKENIZE 함수는 지정된 분석기로 문자열을 토큰화하고 토큰화 결과를 JSON 형식의 문자열 배열로 반환합니다."
}
---

## 설명 {#description}

`TOKENIZE` 함수는 지정된 분석기로 문자열을 토큰화하고 토큰화 결과를 JSON 형식의 문자열 배열로 반환합니다. 이 함수는 전문 검색 기능을 갖춘 역색인을 사용할 때 텍스트가 어떻게 분석되는지 확인하는 데 특히 유용합니다.

## 구문 {#syntax}

```sql
VARCHAR TOKENIZE(VARCHAR str, VARCHAR properties)
```

## 매개변수 {#parameters}

- `str`: 토큰화할 입력 문자열입니다. 유형: `VARCHAR`
- `properties`: 분석기 설정을 지정하는 속성 문자열입니다. 유형: `VARCHAR`

`properties` 매개변수는 다음 키-값 쌍을 지원합니다(형식: `"key1"="value1", "key2"="value2"`).

### 공통 속성 {#common-properties}

| 속성 | 설명 | 예시 값 |
|----------|-------------|----------------|
| `built_in_analyzer` | 내장 분석기 유형 | `"english"`, `"chinese"`, `"unicode"`, `"icu"`, `"basic"`, `"ik"`, `"standard"`, `"none"` |
| `analyzer` | 사용자 정의 분석기 이름(`CREATE INVERTED INDEX ANALYZER`로 생성) | `"my_custom_analyzer"` |
| `parser_mode` | 파서 모드(중국어 분석기용) | `"fine_grained"`, `"coarse_grained"` |
| `support_phrase` | 구문 검색 지원 활성화(위치 정보 저장) | `"true"`, `"false"` |
| `lower_case` | 토큰을 소문자로 변환 | `"true"`, `"false"` |
| `char_filter_type` | 문자 필터 유형 | 필터에 따라 다름 |
| `stop_words` | 불용어 설정 | 구현에 따라 다름 |

## 반환값 {#return-value}

토큰화 결과의 JSON 배열을 담은 `VARCHAR`를 반환합니다. 배열의 각 요소는 다음 구조를 갖는 객체입니다.

- `token`: 토큰화된 항목
- `position`: (선택 사항) `support_phrase`가 활성화된 경우 토큰의 위치 인덱스

## 예제 {#examples}

### 예제 1: 내장 분석기 사용 {#example-1-using-built-in-analyzers}

```sql
-- Using the standard analyzer
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard"');
```
```
[{ "token": "hello" }, { "token": "world" }]
```

```sql
-- Using the english analyzer
SELECT TOKENIZE("running quickly", '"built_in_analyzer"="english"');
```
```
[{ "token": "run" }, { "token": "quick" }]
```

```sql
-- Using the unicode analyzer with Chinese text
SELECT TOKENIZE("Apache Doris数据库", '"built_in_analyzer"="unicode"');
```
```
[{ "token": "apache" }, { "token": "doris" }, { "token": "数" }, { "token": "据" }, { "token": "库" }]
```

```sql
-- Using the chinese analyzer
SELECT TOKENIZE("我来到北京清华大学", '"built_in_analyzer"="chinese"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华大学" }]
```

```sql
-- Using the icu analyzer for multilingual text
SELECT TOKENIZE("Hello World 世界", '"built_in_analyzer"="icu"');
```
```
[{ "token": "hello" }, { "token": "world" }, {"token": "世界"}]
```

```sql
-- Using the basic analyzer
SELECT TOKENIZE("GET /images/hm_bg.jpg HTTP/1.0", '"built_in_analyzer"="basic"');
```
```
[{ "token": "get" }, { "token": "images" }, {"token": "hm"}, {"token": "bg"}, {"token": "jpg"}, {"token": "http"}, {"token": "1"}, {"token": "0"}]
```

```sql
-- Using the ik analyzer for Chinese text
SELECT TOKENIZE("中华人民共和国国歌", '"built_in_analyzer"="ik"');
```
```
[{ "token": "中华人民共和国" }, { "token": "国歌" }]
```

### 예제 2: 사용자 정의 분석기 사용 {#example-2-using-custom-analyzers}

먼저 사용자 정의 분석기를 생성합니다.

```sql
CREATE INVERTED INDEX ANALYZER lowercase_delimited
PROPERTIES (
    "tokenizer" = "standard",
    "token_filter" = "asciifolding, lowercase"
);
```

그런 다음 `TOKENIZE`에서 사용합니다.

```sql
SELECT TOKENIZE("FOO-BAR", '"analyzer"="lowercase_delimited"');
```
```
[{ "token": "foo" }, { "token": "bar" }]
```

### 예제 3: 구문 검색 지원(위치 정보) {#example-3-with-phrase-support-position-information}

```sql
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard", "support_phrase"="true"');
```
```
[{ "token": "hello", "position": 0 }, { "token": "world", "position": 1 }]
```

## 참고 사항 {#notes}

1. **분석기 설정**: `properties` 매개변수는 유효한 속성 문자열이어야 합니다. 사용자 정의 분석기를 사용하는 경우 `CREATE INVERTED INDEX ANALYZER`로 미리 생성해야 합니다.

2. **지원되는 분석기**: 현재 지원되는 내장 분석기는 다음과 같습니다.
   - `standard`: 일반 텍스트용 표준 분석기
   - `english`: 어간 추출 기능을 갖춘 영어 분석기
   - `chinese`: 중국어 텍스트 분석기
   - `unicode`: 다국어 텍스트용 Unicode 기반 분석기
   - `icu`: 고급 Unicode 처리용 ICU 기반 분석기
   - `basic`: 기본 토큰화
   - `ik`: 중국어 텍스트용 IK 분석기
   - `none`: 토큰화하지 않음(원본 문자열을 단일 토큰으로 반환)

3. **성능**: `TOKENIZE` 함수는 주로 분석기 설정을 테스트하고 디버깅하는 데 사용됩니다. 프로덕션 환경에서 전문 검색을 수행하려면 역색인과 함께 `MATCH` 또는 `SEARCH` 연산자를 사용하세요.

4. **JSON 출력**: 출력은 서식이 지정된 JSON 문자열이며, 필요하면 JSON 함수를 사용해 추가로 처리할 수 있습니다.

5. **역색인과의 호환성**: `TOKENIZE`에서 사용한 것과 동일한 분석기 설정을 테이블 생성 시 역색인에 적용할 수 있습니다.
   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("analyzer"="my_analyzer")
   )
   ```

6. **분석기 동작 테스트**: `TOKENIZE`를 사용하면 역색인을 생성하기 전에 텍스트가 어떻게 토큰화되는지 미리 확인하여 데이터에 가장 적합한 분석기를 선택할 수 있습니다.

## 관련 함수 {#related-functions}

- [MATCH](../../../../sql-manual/basic-element/operators/conditional-operators/full-text-search-operators): 역색인을 사용한 전문 검색
- [SEARCH](../../../../table-design/index/inverted-index/search-function.md): DSL을 지원하는 고급 검색

## 키워드 {#keywords}

TOKENIZE, STRING, FULL-TEXT SEARCH, INVERTED INDEX, ANALYZER

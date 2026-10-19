---
{
    "title": "전문 검색 연산자",
    "language": "ko",
    "description": "전문 검색 연산자는 컬럼이 지정된 전문 검색 조건(키워드, 구문 등)을 충족하는지 판단하며, 결과는 TRUE,"
}
---

## 설명 {#description}

전문 검색 연산자는 컬럼이 지정된 전문 검색 조건(키워드, 구문 등)을 충족하는지 판단하며, 결과는 TRUE, FALSE 또는 UNKNOWN입니다.

제약 사항:

1. 왼쪽 피연산자는 컬럼 이름이어야 하며, 오른쪽 피연산자는 문자열 리터럴이어야 합니다.
2. WHERE 절에서만 사용할 수 있으며 SELECT, GROUP BY, ORDER BY 등의 다른 절에서는 사용할 수 없습니다. WHERE 절에서 AND, OR, NOT 논리 연산을 사용하여 다른 조건과 결합할 수 있습니다.

## 연산자 소개 {#operator-introduction}

| 연산자 | 기능 | 예제 |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| MATCH | MATCH_ANY와 동일 | `SELECT * FROM t WHERE column1 MATCH 'word1 word2'` |
| `<column_name>` MATCH_ANY `<string_literal>` | column_name의 인덱스 토크나이저에 따라 column_name과 string_literal을 토큰화합니다. column_name의 토큰 중 하나라도 string_literal을 토큰화한 후의 단어 중 하나를 포함하면 결과는 TRUE이며, 그렇지 않으면 FALSE입니다. | `SELECT * FROM t WHERE column1 MATCH_ANY 'word1 word2'` |
| `<column_name>` MATCH_ALL `<string_literal>` | column_name의 인덱스 토크나이저에 따라 column_name과 string_literal을 토큰화합니다. column_name의 모든 토큰이 string_literal을 토큰화한 후의 모든 단어를 포함하면 결과는 TRUE이며, 그렇지 않으면 FALSE입니다. | `SELECT * FROM t WHERE column1 MATCH_ALL 'word1 word2'` |
| `<column_name>` MATCH_PHRASE `<string_literal>` | column_name의 인덱스 토크나이저에 따라 column_name과 string_literal을 토큰화합니다. column_name의 모든 토큰이 string_literal을 토큰화한 후의 모든 단어를 포함하고 단어의 순서도 일치하면(즉, 하나의 구문을 이루면) 결과는 TRUE이며, 그렇지 않으면 FALSE입니다. | `SELECT * FROM t WHERE column1 MATCH_PHRASE 'word1 word2'` |
| `<column_name>` MATCH_PHRASE_PREFIX `<string_literal>` | MATCH_PHRASE의 확장으로, string_literal을 토큰화한 후의 마지막 단어는 전체 단어가 아닌 접두사만 일치해도 됩니다. 웹 검색 엔진의 검색어 제안 기능과 유사합니다. | `SELECT * FROM t WHERE column1 MATCH_PHRASE_PREFIX 'word1 wor'` |
| `<column_name>` MATCH_PHRASE_EDGE `<string_literal>` | MATCH_PHRASE_PREFIX의 확장으로, string_literal을 토큰화한 후의 첫 번째 단어는 접미사와 일치하고 마지막 단어는 접두사와 일치할 수 있습니다. | `SELECT * FROM t WHERE column1 MATCH_PHRASE_EDGE 'rd wor'` |
| `<column_name>` MATCH_REGEXP `<string_literal>` | MATCH_ANY의 확장으로, string_literal에 정규 표현식을 지정하며 column_name의 토큰이 해당 정규 표현식과 일치하는지 확인합니다. | `SELECT * FROM t WHERE column1 MATCH_REGEXP 'word.'` |

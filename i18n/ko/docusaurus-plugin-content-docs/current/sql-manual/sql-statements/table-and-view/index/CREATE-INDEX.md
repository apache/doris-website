---
{
    "title": "CREATE INDEX",
    "language": "ko",
    "description": "테이블에 새 인덱스를 생성합니다. 테이블 이름과 인덱스 이름은 반드시 지정해야 합니다. 인덱스 유형, 속성, 주석은 선택적으로 지정할 수 있습니다."
}
---

## 설명 {#description}

테이블에 새 인덱스를 생성합니다. 테이블 이름과 인덱스 이름은 반드시 지정해야 합니다. 인덱스 유형, 속성, 주석은 선택적으로 지정할 수 있습니다.

## 구문 {#syntax}


```sql
CREATE INDEX [IF NOT EXISTS] <index_name>
             ON <table_name> (<column_name> [, ...])
             [USING {INVERTED | NGRAM_BF | ANN}]
             [PROPERTIES ("<key>" = "<value>"[ , ...])]
             [COMMENT '<index_comment>']
```

## 필수 매개변수 {#required-parameters}

**1. `<index_name>`**

> 인덱스의 식별자(즉, 이름)를 지정합니다. 이 이름은 해당 테이블 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 합니다(Unicode 이름 지원이 활성화된 경우 모든 언어의 문자로 시작할 수 있습니다). 식별자 전체를 백틱으로 감싸지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자에는 예약어를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 및 예약어 요구 사항을 참조하세요.

**2. `<table_name>`**

> 테이블의 식별자(즉, 이름)를 지정합니다. 이 이름은 해당 데이터베이스 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 합니다(Unicode 이름 지원이 활성화된 경우 모든 언어의 문자로 시작할 수 있습니다). 식별자 전체를 백틱으로 감싸지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자에는 예약어를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 및 예약어 요구 사항을 참조하세요.

**3. `<column_name> [, ...]`**

> 인덱스를 생성할 열을 지정합니다(현재는 열 하나만 지원합니다). 열은 해당 테이블 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 합니다(Unicode 이름 지원이 활성화된 경우 모든 언어의 문자로 시작할 수 있습니다). 식별자 전체를 백틱으로 감싸지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자에는 예약어를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 및 예약어 요구 사항을 참조하세요.

## 선택적 매개변수 {#optional-parameters}

**1. `USING {INVERTED | NGRAM_BF}`**

> 인덱스 유형을 지정합니다. 현재 두 가지 유형을 지원합니다. **INVERTED**(역인덱스)와 **NGRAM_BF**(ngram BloomFilter 인덱스)입니다.

**2. `PROPERTIES ("<key>" = "<value>"[ ,  ...])`**

> 일반적인 PROPERTIES 형식으로 인덱스 매개변수를 지정합니다. 각 인덱스가 지원하는 매개변수와 그 의미는 해당 인덱스 유형의 문서를 참조하세요.

**3. `COMMENT '<index_comment>'`**

> 유지보수에 도움이 되도록 인덱스에 주석을 지정합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 필요합니다.

| 권한 | 객체 | 설명 |
| ---------- | ------ | ---------------------------------------------------------- |
| ALTER_PRIV | 테이블 | CREATE INDEX는 테이블에 대한 ALTER 작업으로 간주됩니다. |

## 사용 시 참고 사항 {#usage-notes}

- 일반 **INVERTED** 인덱스에서 기존 데이터에 인덱스를 생성하는 방법은 [역인덱스 관리](../../../../table-design/index/inverted-index/overview.md#managing-inverted-indexes)를 참조하세요.
- Doris 4.2부터는 `variant_index_scope = "values"`를 사용하여 [기존 테이블에 VARIANT 값 인덱스를 추가](../../../../table-design/index/inverted-index/variant-values-index.md#add-to-existing-table)할 수 있습니다. 인덱스가 없는 기존 데이터도 쿼리에서 스캔할 수 있습니다.
- **NGRAM_BF** NGram BloomFilter 인덱스를 생성하면 모든 데이터에 대해 백그라운드에서 schema change가 수행되어 인덱스 구축이 완료됩니다. 진행 상황은 SHOW ALTER TABLE COLUMN으로 확인할 수 있습니다.

## 예시 {#examples}

- `table1`에 역인덱스 `index1` 생성



  ```sql
  CREATE INDEX index1 ON table1(col1) USING INVERTED;
  ```

- `table1`에 NGram BloomFilter 인덱스 `index2` 생성



  ```sql
  CREATE INDEX index2 ON table1(col1) USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024");
  ```


- `table1`의 벡터 열(`embedding`)에 ANN 인덱스 `index3` 생성


  ```sql
  CREATE INDEX index3 ON table1 (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128"
  );
    ```

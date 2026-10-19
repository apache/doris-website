---
{
    "title": "CREATE INDEX",
    "language": "ko",
    "description": "테이블에 새 인덱스를 생성합니다. 테이블 이름과 인덱스 이름을 반드시 지정해야 합니다. 선택적으로 인덱스 유형, 속성 및 주석을 지정할 수 있습니다."
}
---

## 설명 {#description}

테이블에 새 인덱스를 생성합니다. 테이블 이름과 인덱스 이름을 반드시 지정해야 합니다. 선택적으로 인덱스 유형, 속성 및 주석을 지정할 수 있습니다.

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

> 인덱스의 식별자(즉, 이름)를 지정합니다. 식별자는 해당 테이블 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 합니다(Unicode 이름 지원이 활성화된 경우 어느 언어의 문자든 사용할 수 있습니다). 공백이나 특수 문자를 포함하려면 식별자 문자열 전체를 백틱으로 감싸야 합니다(예: `My Object`).
>
> 식별자로 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 및 예약 키워드에 대한 요구 사항을 참조하세요.

**2. `<table_name>`**

> 테이블의 식별자(즉, 이름)를 지정합니다. 식별자는 해당 데이터베이스 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 합니다(Unicode 이름 지원이 활성화된 경우 어느 언어의 문자든 사용할 수 있습니다). 공백이나 특수 문자를 포함하려면 식별자 문자열 전체를 백틱으로 감싸야 합니다(예: `My Object`).
>
> 식별자로 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 및 예약 키워드에 대한 요구 사항을 참조하세요.

**3. `<column_name> [, ...]`**

> 인덱스를 생성할 열을 지정합니다(현재 하나의 열만 지원). 열은 해당 테이블 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 합니다(Unicode 이름 지원이 활성화된 경우 어느 언어의 문자든 사용할 수 있습니다). 공백이나 특수 문자를 포함하려면 식별자 문자열 전체를 백틱으로 감싸야 합니다(예: `My Object`).
>
> 식별자로 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 및 예약 키워드에 대한 요구 사항을 참조하세요.

## 선택적 매개변수 {#optional-parameters}

**1. `USING {INVERTED | NGRAM_BF}`**

> 인덱스 유형을 지정합니다. 현재 **INVERTED**(역색인)와 **NGRAM_BF**(ngram bloomfilter 인덱스)의 두 가지 유형을 지원합니다.

**2. `PROPERTIES ("<key>" = "<value>"[ ,  ...])`**

> 일반적인 PROPERTIES 형식으로 인덱스의 매개변수를 지정합니다. 각 인덱스에서 지원하는 매개변수와 그 의미는 해당 인덱스 유형의 문서를 참조하세요.

**3. `COMMENT '<index_comment>'`**

> 유지보수를 돕기 위해 인덱스에 주석을 지정합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한  | 객체 | 참고                                                |
| ---------- | ------ | ---------------------------------------------------------- |
| ALTER_PRIV | 테이블  | CREATE INDEX는 테이블에 대한 ALTER 작업으로 간주됩니다 |

## 사용 시 참고 사항 {#usage-notes}

- **INVERTED** 역색인은 새로 삽입된 데이터에 즉시 적용됩니다. 기존 데이터의 경우 BUILD INDEX 작업으로 인덱스를 빌드해야 합니다.
- **NGRAM_BF** NGram BloomFilter 인덱스는 생성 후 모든 데이터에 대해 백그라운드에서 스키마 변경을 수행하여 인덱스 구축을 완료합니다. SHOW ALTER TABLE COLUMN으로 진행 상황을 확인할 수 있습니다.

## 예제 {#examples}

- 역색인 `index1`을 `table1`에 생성합니다.

  

  ```sql
  CREATE INDEX index1 ON table1(col1) USING INVERTED;
  ```

- NGram BloomFilter 인덱스 `index2`를 `table1`에 생성합니다.

  

  ```sql
  CREATE INDEX index2 ON table1(col1) USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024");
  ```


- ANN 인덱스 `index3`을 `table1`의 `embedding` 벡터 열에 생성합니다.


  ```sql
  CREATE INDEX index3 ON table1 (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128"
  );
    ```

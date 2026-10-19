---
{
    "title": "MySQL Load",
    "language": "ko",
    "description": "MySQL 표준 LOAD DATA 구문을 사용하여 로컬 CSV 파일을 Doris에 동기식으로 적재합니다. 10 GB 미만의 파일에 적합하며 배치 단위의 원자성을 보장합니다.",
    "keywords": [
        "MySQL Load",
        "LOAD DATA",
        "로컬 파일 데이터 적재",
        "CSV 데이터 적재",
        "Doris 동기식 데이터 적재",
        "local-infile",
        "allowLoadLocalInfile",
        "Stream Load"
    ]
}
---

<!-- Knowledge type: Operational steps + Configuration parameters -->
<!-- Applicable scenarios: Client-side local CSV file import / Program data stream import -->

Doris는 MySQL 프로토콜과 호환되므로 MySQL 표준 [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) 구문을 사용하여 로컬 파일을 적재할 수 있습니다. MySQL Load는 **동기식 데이터 적재 방식**입니다. 데이터 적재가 완료되는 즉시 결과가 반환되며, LOAD DATA 문의 반환값으로 적재 성공 여부를 확인할 수 있습니다.

일반적으로 MySQL Load를 사용하여 10 GB 미만의 파일을 적재할 수 있습니다. 파일이 너무 크면 먼저 분할한 다음 MySQL Load로 나누어 적재하세요. MySQL Load는 배치 데이터 적재 작업의 **원자성**을 보장합니다. 모든 행이 성공적으로 적재되거나 아무 행도 적재되지 않습니다.

## 사용 사례 {#use-cases}

### 적용 시나리오 {#applicable-scenarios}

MySQL Load는 주로 다음과 같은 시나리오에 적합합니다.

- 클라이언트의 **로컬 CSV 파일**을 Doris에 적재하는 경우
- 프로그램을 통해 **데이터 스트림**의 데이터를 적재하는 경우

### 제한 사항 {#limitations}

CSV 파일을 적재할 때는 **null 값(null)**과 **빈 문자열(`''`)**을 명확히 구분해야 합니다.

| 데이터 유형    | 표기 방법     | 데이터 예시 | 설명                                |
| ------------ | ------------------ | ------------ | ------------------------------------------ |
| null 값(null)  | `\N`               | `a,\N,b`     | 가운데 열은 null 값입니다.         |
| 빈 문자열 | 비워 두기     | `a, ,b`      | 가운데 열은 빈 문자열입니다.      |

## 기본 원리 {#basic-principles}

MySQL Load는 기능 면에서 Stream Load와 유사합니다. 두 방식 모두 로컬 파일을 Doris 클러스터에 적재합니다. 따라서 MySQL Load의 구현은 Stream Load의 기본 데이터 적재 기능을 재사용합니다.

MySQL Load의 주요 실행 흐름은 다음과 같습니다.

1. 사용자가 FE에 LOAD DATA 요청을 제출합니다. FE는 요청을 구문 분석하고 Stream Load 요청으로 구성합니다.
2. FE는 BE 노드를 선택하여 Stream Load 요청을 전송합니다.
3. FE는 요청을 전송하는 동안 MySQL 클라이언트에서 로컬 파일 데이터를 비동기 스트리밍 방식으로 읽어 Stream Load의 HTTP 요청으로 실시간 전송합니다.
4. MySQL 클라이언트가 데이터 전송을 마치면 FE는 Stream Load가 완료될 때까지 기다린 후 데이터 적재의 성공 또는 실패 정보를 클라이언트에 반환합니다.

## 빠른 시작 {#quick-start}

### 사전 확인 사항 {#pre-checks}

MySQL Load를 실행하기 전에 다음 조건을 충족하는지 확인하세요.

- 현재 사용자에게 대상 테이블에 대한 **INSERT 권한**이 있어야 합니다. INSERT 권한이 없다면 `GRANT` 명령으로 부여할 수 있습니다.

### 데이터 적재 작업 생성 {#create-an-import-job}

아래 네 단계에 따라 MySQL Load 데이터 적재를 완료합니다.

#### 1. 테스트 데이터 준비 {#1-prepare-test-data}

다음 예시 데이터로 `client_local.csv` 파일을 생성합니다.

```sql
1,10
2,20
3,30
4,40
5,50
6,60
```

#### 2. 클라이언트 연결 {#2-connect-the-client}

LOAD DATA 명령을 실행하기 전에 먼저 MySQL 클라이언트로 연결합니다.

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

:::caution
MySQL Load를 실행할 때는 클라이언트 연결에 지정된 매개변수 옵션을 사용해야 합니다.

1. MySQL 클라이언트로 연결할 때는 반드시 `--local-infile` 옵션을 사용해야 합니다. 그렇지 않으면 오류가 발생할 수 있습니다.
2. JDBC로 연결할 때는 URL에 `allowLoadLocalInfile=true`를 지정해야 합니다.
:::

#### 3. 테스트 테이블 생성 {#3-create-a-test-table}

Doris에 다음 테이블을 생성합니다.

```sql
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

#### 4. LOAD DATA 데이터 적재 명령 실행 {#4-run-the-load-data-import-command}

MySQL 클라이언트로 연결한 후 다음 명령으로 데이터 적재 작업을 생성합니다.

```sql
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### 데이터 적재 작업 결과 확인 {#view-the-import-job-result}

MySQL Load는 동기식 데이터 적재 방식이므로 적재 결과가 명령줄에서 사용자에게 바로 반환됩니다. 데이터 적재가 실패하면 구체적인 오류 메시지가 표시됩니다.

데이터 적재가 **성공**하면 적재된 행 수가 반환됩니다.

```sql
Query OK, 6 rows affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```

데이터 적재가 **실패**하면 클라이언트에 해당 오류가 표시됩니다.

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = [DATA_QUALITY_ERROR]too many filtered rows with load id b612907c-ccf4-4ac2-82fe-107ece655f0f
```

오류 메시지에는 해당 데이터 적재의 `loadId`가 포함되어 있습니다. `show load warnings` 명령으로 세부 정보를 확인할 수 있습니다.

```sql
show load warnings where label='b612907c-ccf4-4ac2-82fe-107ece655f0f';
```

### 데이터 적재 작업 취소 {#cancel-an-import-job}

사용자는 MySQL Load를 **수동으로 취소할 수 없습니다**. 제한 시간을 초과하거나 데이터 적재 오류가 발생하면 시스템이 MySQL Load를 자동으로 취소합니다.

## 참조 {#reference}

### 데이터 적재 구문 {#import-syntax}

전체 LOAD DATA 구문은 다음과 같습니다.

```SQL
LOAD DATA LOCAL
INFILE '<load_data_file>'
INTO TABLE [<db_name>.]<table_name>
[PARTITION (partition_name [, partition_name] ...)]
[COLUMNS TERMINATED BY '<column_terminated_operator>']
[LINES TERMINATED BY '<line_terminated_operator>']
[IGNORE <ignore_lines> LINES]
[(col_name_or_user_var[, col_name_or_user_var] ...)]
[SET col_name={expr | DEFAULT}[, col_name={expr | DEFAULT}] ...]
[PROPERTIES (key1 = value1 [, key2=value2]) ]
```

각 절에 대한 설명은 다음과 같습니다.

| 절                | 설명                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| INFILE                | 로컬 파일 경로를 지정합니다. 상대 경로 또는 절대 경로를 사용할 수 있습니다. 현재 `load_data_file`은 단일 파일 적재만 지원합니다. |
| INTO TABLE            | 데이터베이스 이름과 테이블 이름을 지정합니다. 데이터베이스 이름은 생략할 수 있습니다.                                                            |
| PARTITION             | 데이터를 적재할 파티션을 지정합니다. 각 행이 속한 파티션을 알 수 있다면 지정하는 것이 좋습니다. 지정한 파티션에 속하지 않는 행은 필터링됩니다. |
| COLUMNS TERMINATED BY | 데이터 적재에 사용할 열 구분자를 지정합니다.                                                                                           |
| LINES TERMINATED BY    | 데이터 적재에 사용할 줄 구분자를 지정합니다.                                                                                             |
| IGNORE num LINES      | 적재할 CSV에서 건너뛸 줄 수를 지정합니다. 일반적으로 헤더를 건너뛰기 위해 1로 설정합니다.                                |
| col_name_or_user_var  | 열 매핑 구문을 지정합니다. 데이터 변환에 대해서는 [열 매핑](../../../data-operate/import/load-data-convert#column-mapping) 섹션을 참조하세요. |
| PROPERTIES            | 데이터 적재 매개변수입니다.                                                                                                                       |

### 데이터 적재 매개변수 {#import-parameters}

`PROPERTIES (key1 = value1 [, key2=value2])` 구문으로 데이터 적재 매개변수를 설정할 수 있습니다.

| 매개변수          | 설명                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| max_filter_ratio   | 허용되는 최대 필터링 비율입니다. 0 이상 1 이하여야 합니다. 기본값은 0으로, 오류가 있는 행을 허용하지 않습니다.                                                                                   |
| timeout            | 데이터 적재 제한 시간이며 단위는 초입니다. 기본값은 600초입니다. 유효 범위는 1s~259200s입니다.                                                                                                                            |
| strict_mode        | 이번 데이터 적재에서 엄격 모드를 활성화할지 여부입니다. 기본적으로 비활성화되어 있습니다.                                                                                                                                                     |
| timezone           | 이번 데이터 적재에 사용할 시간대입니다. 기본값은 현재 클러스터 시간대입니다. 이 매개변수는 데이터 적재에 사용되는 모든 시간대 관련 함수의 결과에 영향을 줍니다.                                          |
| exec_mem_limit     | 데이터 적재의 메모리 한도입니다. 기본값은 2 GB이며 단위는 바이트입니다.                                                                                                                                                 |
| trim_double_quotes | Boolean 유형입니다. 기본값은 false입니다. true로 설정하면 적재할 파일의 각 필드에서 가장 바깥쪽 큰따옴표를 제거합니다.                                                                                  |
| enclose            | 필드를 감싸는 문자를 지정합니다. CSV 데이터 필드에 줄 구분자나 열 구분자가 포함되어 있으면 단일 바이트 문자를 감싸는 문자로 지정하여 의도치 않게 데이터가 잘리는 것을 방지할 수 있습니다. 예를 들어 열 구분자가 `,`이고 감싸는 문자가 `'`이며 데이터가 `a,'b,c'`이면 `b,c`는 하나의 필드로 해석됩니다. |
| escape             | 이스케이프 문자를 지정합니다. 필드 안에서 감싸는 문자와 동일한 문자를 이스케이프하는 데 사용합니다. 예를 들어 데이터가 `a,'b,'c'`이고 감싸는 문자가 `'`이며 `b,'c`를 하나의 필드로 해석하려면, `\`와 같은 단일 바이트 이스케이프 문자를 지정하고 데이터를 `a,'b,\'c'`로 수정해야 합니다. |

## 데이터 적재 예시 {#import-examples}

다음 예시는 일반적인 데이터 적재 시나리오를 다룹니다.

### 데이터 적재 제한 시간 지정 {#specify-the-import-timeout}

PROPERTIES 매개변수 `timeout`으로 데이터 적재 제한 시간을 조정합니다. 다음 예시는 제한 시간을 100초로 설정합니다.

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timeout"="100");
```

### 허용되는 데이터 적재 오류 비율 지정 {#specify-the-allowed-import-error-ratio}

PROPERTIES 매개변수 `max_filter_ratio`로 데이터 적재 시 허용되는 오류 비율을 조정합니다. 다음 예시는 허용 오류 비율을 20%로 설정합니다.

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("max_filter_ratio"="0.2");
```

### 데이터 적재 열 매핑 {#map-import-columns}

다음 예시는 CSV의 열 순서를 조정합니다.

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
(k2, k1, v1);
```

### 열 구분자와 줄 구분자 지정 {#specify-the-column-and-line-delimiters}

`COLUMNS TERMINATED BY` 절과 `LINES TERMINATED BY` 절은 데이터 적재에 사용할 열 구분자와 줄 구분자를 지정합니다. 다음 예시는 쉼표(`,`)와 줄바꿈(`\n`)을 각각 열 구분자와 줄 구분자로 사용합니다.

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### 데이터 적재 대상 파티션 지정 {#specify-the-import-partitions}

`PARTITION` 절은 데이터를 적재할 파티션을 지정합니다. 다음 예시는 데이터를 `p1`과 `p2` 파티션에 적재합니다. `p1` 또는 `p2` 파티션에 속하지 않는 데이터는 필터링됩니다.

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PARTITION (p1, p2);
```

### 데이터 적재 시간대 지정 {#specify-the-import-time-zone}

PROPERTIES 매개변수 `timezone`으로 시간대를 지정합니다. 다음 예시는 시간대를 `Africa/Abidjan`으로 설정합니다.

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timezone"="Africa/Abidjan");
```

### 데이터 적재 메모리 제한 {#limit-the-import-memory}

PROPERTIES 매개변수 `exec_mem_limit`으로 데이터 적재의 메모리 한도를 지정합니다. 다음 예시는 데이터 적재 메모리 한도를 10 GB로 설정합니다.

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("exec_mem_limit"="10737418240");
```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

### Q1: LOAD DATA 실행 시 `The used command is not allowed with this MySQL version` 오류가 발생하면 어떻게 해야 하나요? {#q1-when-running-load-data-the-error-the-used-command-is-not-allowed-with-this-mysql-version-is-reported-what-should-i-do}

이 오류는 보통 클라이언트에서 `local-infile` 옵션을 활성화하지 않아 발생합니다. 다음과 같이 해결하세요.

- 명령줄 연결: 연결할 때 `--local-infile` 매개변수를 명시적으로 추가합니다.
- JDBC 연결: URL에 `allowLoadLocalInfile=true`를 추가합니다.

### Q2: MySQL Load로 적재할 수 있는 파일 크기는 얼마인가요? {#q2-how-large-a-file-can-mysql-load-import}

**10 GB 미만**의 파일을 적재하는 것을 권장합니다. 파일이 너무 크면 먼저 분할한 다음 MySQL Load로 나누어 적재하세요.

### Q3: MySQL Load는 수동 취소를 지원하나요? {#q3-does-mysql-load-support-manual-cancellation}

**지원하지 않습니다.** 제한 시간을 초과하거나 데이터 적재 오류가 발생하면 시스템이 MySQL Load를 자동으로 취소합니다.

### Q4: 데이터 적재가 실패했을 때 구체적인 원인을 어떻게 확인하나요? {#q4-how-do-i-find-the-specific-cause-when-an-import-fails}

오류 메시지에서 `loadId`를 확인한 후 다음 명령을 실행하여 자세한 오류 정보를 확인합니다.

```sql
show load warnings where label='<loadId>';
```

### Q5: CSV에서 null 값과 빈 문자열을 어떻게 구분하나요? {#q5-how-do-i-distinguish-null-values-from-empty-strings-in-csv}

- null 값(null): `\N`을 사용합니다. 예: `a,\N,b`.
- 빈 문자열: 비워 둡니다. 예: `a, ,b`.

### Q6: 데이터 적재의 원자성이 보장되나요? {#q6-does-the-import-guarantee-atomicity}

네. MySQL Load는 배치 데이터 적재 작업의 원자성을 보장합니다. 모든 행이 성공적으로 적재되거나 아무 행도 적재되지 않습니다.

## 추가 도움말 {#more-help}

MySQL Load의 자세한 구문과 권장 사용 방법은 [MySQL Load](../../../sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD) 명령 참조를 확인하세요.

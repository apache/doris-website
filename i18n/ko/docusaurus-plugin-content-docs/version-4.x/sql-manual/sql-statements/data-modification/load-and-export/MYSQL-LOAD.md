---
{
    "title": "MYSQL LOAD",
    "language": "ko",
    "description": "MySQL 클라이언트를 사용하여 로컬 데이터 파일을 Doris에 적재합니다. MySQL Load는 동기식 데이터 적재 방식입니다."
}
---

## 설명 {#description}

MySQL 클라이언트를 사용하여 로컬 데이터 파일을 Doris에 적재합니다. MySQL Load는 실행 직후 적재 결과를 반환하는 동기식 데이터 적재 방식입니다. `LOAD DATA` 문의 반환 결과로 적재 성공 여부를 판단할 수 있습니다. MySQL Load는 일괄 적재 작업의 원자성을 보장하므로, 모든 적재가 성공하거나 모두 실패합니다.

## 구문 {#syntax}

```sql
LOAD DATA
[ LOCAL ]
INFILE "<file_name>"
INTO TABLE "<tbl_name>"
[ PARTITION (<partition_name> [, ... ]) ]
[ COLUMNS TERMINATED BY "<column_separator>" ]
[ LINES TERMINATED BY "<line_delimiter>" ]
[ IGNORE <number> {LINES | ROWS} ]
[ (<col_name_or_user_var> [, ... ] ) ]
[ SET (col_name={<expr> | DEFAULT} [, col_name={<expr> | DEFAULT}] ...) ]
[ PROPERTIES ("<key>" = "<value>" [ , ... ]) ]
```

## 필수 매개변수 {#required-parameters}

**1. `<file_name>`**

> 로컬 파일 경로를 지정합니다. 상대 경로와 절대 경로를 모두 사용할 수 있습니다. 현재는 단일 파일만 지원하며, 여러 파일은 지원하지 않습니다.

**2. `<tbl_name>`**

> 예제와 같이 테이블 이름에 데이터베이스 이름을 포함할 수 있습니다. 데이터베이스 이름을 생략하면 현재 사용자의 데이터베이스를 사용합니다.

## 선택적 매개변수 {#optional-parameters}

**1. `LOCAL`**

> `LOCAL`을 지정하면 클라이언트에서 파일을 읽습니다. 생략하면 FE 서버의 로컬 저장소에서 파일을 읽습니다. FE 서버에서 파일을 적재하는 기능은 기본적으로 비활성화되어 있습니다. 이 기능을 활성화하려면 FE 노드에서 `mysql_load_server_secure_path`를 설정하여 안전한 경로를 지정해야 합니다.

**2. `<partition_name>`**

> 적재할 파티션을 쉼표로 구분하여 여러 개 지정할 수 있습니다.

**3. `<column_separator>`**

> 열 구분자를 지정합니다.

**4. `<line_delimiter>`**

> 줄 구분자를 지정합니다.

**5. `IGNORE <number> { LINES | ROWS }`**

> CSV 파일의 헤더나 원하는 수의 줄을 건너뛸 수 있습니다. 이 구문은 `IGNORE num ROWS`로 대체할 수도 있습니다.

**6. `<col_name_or_user_var>`**

> 열 매핑 구문입니다. 구체적인 매개변수는 [데이터 적재 중 데이터 변환](../../../../data-operate/import/import-way/mysql-load-manual.md)의 열 매핑 절을 참조하세요.

**7.  `properties ("<key>"="<value>",...)`**  

| 매개변수 | 매개변수 설명 |
| ---------------------- | ------------------------------------------------------------ |
| max_filter_ratio | 데이터 형식 오류 등의 이유로 필터링되는 데이터의 최대 허용 비율입니다. 기본적으로는 이러한 데이터를 전혀 허용하지 않습니다. |
| timeout | 데이터 적재 제한 시간을 초 단위로 지정합니다. 기본값은 600초이며, 유효 범위는 1초부터 259,200초까지입니다. |
| strict_mode | 이번 데이터 적재에 엄격 모드를 활성화할지 지정할 수 있습니다. 기본적으로 비활성화되어 있습니다. |
| timezone | 이번 데이터 적재에 사용할 시간대를 지정합니다. 기본값은 현재 클러스터의 시간대입니다. 이 매개변수는 데이터 적재에 사용되는 모든 시간대 관련 함수의 결과에 영향을 줍니다. |
| exec_mem_limit | 데이터 적재 시 메모리 제한입니다. 바이트 단위로 지정하며 기본값은 2GB입니다. |
| trim_double_quotes | 불리언 형식이며 기본값은 `false`입니다. `true`로 설정하면 적재할 파일의 각 필드에서 가장 바깥쪽 큰따옴표를 제거합니다. |
| enclose | 감싸기 문자입니다. CSV 데이터 필드에 줄 구분자나 열 구분자가 포함된 경우, 필드가 잘못 분리되지 않도록 단일 바이트 문자를 감싸기 문자로 지정하여 보호할 수 있습니다. 예를 들어 열 구분자가 ",", 감싸기 문자가 "'"이고 데이터가 "a,'b,c'"이면 "b,c"를 하나의 필드로 해석합니다. 참고: `enclose`를 `""`로 설정하면 `trim_double_quotes`를 `true`로 설정해야 합니다. |
| escape | 이스케이프 문자입니다. CSV 필드에서 감싸기 문자와 동일한 문자를 이스케이프하는 데 사용합니다. 예를 들어 데이터가 "a,'b,'c'"이고 감싸기 문자가 "'"일 때 "b,'c"를 하나의 필드로 해석하려면, ""와 같은 단일 바이트 이스케이프 문자를 지정한 다음 데이터를 "a,'b,'c'"로 수정해야 합니다. |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 설명 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | 테이블 | 지정한 데이터베이스 테이블에 대한 데이터 적재 권한입니다. |

## 사용 시 참고 사항 {#usage-notes}

- MySQL Load 문은 `LOAD DATA` 구문으로 시작하며 LABEL을 지정할 필요가 없습니다.

## 예제 {#examples}

로컬 파일 적재, 파티션 선택, 열 매핑, 엄격 모드 등을 다루는 전체 예제는 데이터 적재 가이드의 [MySQL Load](../../../../data-operate/import/import-way/mysql-load-manual.md)를 참조하세요.

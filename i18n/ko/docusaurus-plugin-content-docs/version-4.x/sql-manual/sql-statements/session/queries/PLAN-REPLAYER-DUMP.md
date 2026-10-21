---
{
    "title": "PLAN REPLAYER DUMP",
    "language": "ko",
    "description": "PLAN REPLAYER DUMP는 Doris 사용자가 실행 계획 진단 파일을 생성하는 데 사용하는 도구입니다. 쿼리 옵티마이저의 상태와 입력 데이터를 캡처합니다."
}
---

## 설명 {#description}

PLAN REPLAYER DUMP는 Doris 사용자가 실행 계획 진단 파일을 생성하는 데 사용하는 도구입니다. 쿼리 옵티마이저의 상태와 입력 데이터를 캡처하여 쿼리 최적화 문제를 디버깅하고 분석하는 데 도움을 줍니다. 출력 결과는 해당 진단 파일의 http 주소입니다.


## 구문 {#syntax}

```sql
PLAN REPLAYER DUMP <query>
```


## 필수 매개변수 {#required-parameters}

`<query>`


- 해당 DML 내의 쿼리 문을 의미합니다.
- 쿼리 문이 아니면 구문 분석 오류가 발생합니다.
- 자세한 내용은 [SELECT](https://doris.apache.org/docs/dev/sql-manual/sql-statements/data-query/SELECT) 구문을 참조하세요.


## 권한 제어 {#permission-control}


이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:


| 권한 | 객체 | 설명 |
| :--: | :--: | :--: |
| SELECT_PRIV | 테이블, 뷰 | <query_sql_statement>를 실행하려면 조회 대상 테이블, 뷰 또는 구체화된 뷰에 대한 SELECT_PRIV 권한이 필요합니다. |


## 예제 {#examples}


### 기본 예제 {#basic-example}

```sql
create database test_replayer;
use database test_replayer;
create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
plan replayer dump select * from t1;
```


실행 결과 예시:

```sql
+-------------------------------------------------------------------------------+
| Plan Replayer dump url                                                        |
+-------------------------------------------------------------------------------+
| http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec |
+-------------------------------------------------------------------------------+
```


curl 또는 wget을 사용하여 해당 파일을 다운로드할 수 있습니다. 예를 들면 다음과 같습니다:

```sql
wget http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec
```


권한이 필요한 경우 다음과 같이 사용자 이름과 비밀번호를 포함할 수 있습니다:

```sql
wget --header="Authorization: Basic $(echo -n 'root:' | base64)" http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec
```
```


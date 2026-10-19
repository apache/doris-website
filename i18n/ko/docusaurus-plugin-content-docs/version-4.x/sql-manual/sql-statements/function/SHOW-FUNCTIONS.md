---
{
    "title": "SHOW FUNCTIONS",
    "language": "ko",
    "description": "데이터베이스의 모든 사용자 정의 함수와 시스템 제공 함수를 조회합니다."
}
---

## 설명 {#description}

데이터베이스의 모든 사용자 정의 함수와 시스템 제공 함수를 조회합니다.

## 구문 {#syntax}

```sql
SHOW [ FULL ] [ BUILTIN ] FUNCTIONS [ { IN | FROM } <db> ]  [ LIKE '<function_pattern>' ]
```
## 대체 구문 {#varaint-syntax}

```sql
SHOW GLOBAL [ FULL ] FUNCTIONS [ LIKE '<function_pattern>' ]
```

## 필수 매개변수 {#required-parameters}

**1. `<function_pattern>`**

> 함수 이름을 필터링하는 데 사용하는 패턴 매칭 규칙입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `FULL`**

> FULL은 선택적 매개변수입니다.
>
> 함수의 상세 정보를 표시하도록 지정합니다.

**2. `BUILTIN`**

> BUILTIN은 선택적 매개변수입니다.
>
> 시스템에서 제공하는 함수를 표시하도록 지정합니다.

**3. `<db>`**

> db는 선택적 매개변수입니다.
>
> 지정된 데이터베이스에서 쿼리를 수행하도록 지정합니다.

## 반환 값 {#return-value}

| 열 | 설명         |
| -- |------------|
| 시그니처 | 함수 이름과 매개변수 타입   |
| 반환 타입 | 함수가 반환하는 값의 데이터 타입 |
| 함수 유형 | 함수의 유형      |
| 중간 결과 타입 | 중간 결과의 타입     |
| 속성 | 함수의 상세 속성    |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한  | 객체   | 참고 사항       |
|:--------------|:---------|:--------------|
| SHOW_PRIV    | 함수 | 해당 함수에 대한 조회 권한이 필요합니다. |

## 예시 {#examples}

```sql
show full functions in testDb
```

```text
*************************** 1. row ***************************
Signature: my_add(INT,INT)
Return Type: INT
Function Type: Scalar
Intermediate Type: NULL
Properties: {"symbol":"_ZN9doris_udf6AddUdfEPNS_15FunctionContextERKNS_6IntValES4_","object_file":"http://host:port/libudfsample.so","md5":"cfe7a362d10f3aaf6c49974ee0f1f878"}
*************************** 2. row ***************************
Signature: my_count(BIGINT)
Return Type: BIGINT
Function Type: Aggregate
Intermediate Type: NULL
Properties: {"object_file":"http://host:port/libudasample.so","finalize_fn":"_ZN9doris_udf13CountFinalizeEPNS_15FunctionContextERKNS_9BigIntValE","init_fn":"_ZN9doris_udf9CountInitEPNS_15FunctionContextEPNS_9BigIntValE","merge_fn":"_ZN9doris_udf10CountMergeEPNS_15FunctionContextERKNS_9BigIntValEPS2_","md5":"37d185f80f95569e2676da3d5b5b9d2f","update_fn":"_ZN9doris_udf11CountUpdateEPNS_15FunctionContextERKNS_6IntValEPNS_9BigIntValE"}
*************************** 3. row ***************************
Signature: id_masking(BIGINT)
Return Type: VARCHAR
Function Type: Alias
Intermediate Type: NULL
Properties: {"parameter":"id","origin_function":"concat(left(`id`, 3), `****`, right(`id`, 4))"}
```

```sql
show builtin functions in testDb like 'year%';
```

```text
+---------------+
| Function Name |
+---------------+
| year          |
| years_add     |
| years_diff    |
| years_sub     |
+---------------+
```

```sql
show global full functions
```

```text
*************************** 1. row ***************************
        Signature: decimal(ALL, INT, INT)
      Return Type: VARCHAR
    Function Type: Alias
Intermediate Type: NULL
       Properties: {"parameter":"col, precision, scale","origin_function":"CAST(`col` AS decimal(`precision`, `scale`))"}
*************************** 2. row ***************************
        Signature: id_masking(BIGINT)
      Return Type: VARCHAR
    Function Type: Alias
Intermediate Type: NULL
       Properties: {"parameter":"id","origin_function":"concat(left(`id`, 3), `****`, right(`id`, 4))"}
```

```sql
show global functions
```

```text
+---------------+
| Function Name |
+---------------+
| decimal       |
| id_masking    |
+---------------+
```

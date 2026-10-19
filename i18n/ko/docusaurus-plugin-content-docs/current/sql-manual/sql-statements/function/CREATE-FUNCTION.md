---
{
    "title": "CREATE FUNCTION",
    "language": "ko",
    "description": "이 문은 사용자 정의 함수를 생성하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 사용자 정의 함수를 생성하는 데 사용됩니다.

## 구문 {#syntax}


```sql
CREATE [ GLOBAL ] 
    [{AGGREGATE | TABLES | ALIAS }] FUNCTION <function_name>
    (<arg_type> [, ...])
    [ RETURNS <ret_type> ]
    [ INTERMEDIATE <inter_type> ]
    [ WITH PARAMETER(<param> [,...]) AS <origin_function> ]
    [ PROPERTIES ("<key>" = "<value>" [, ...]) ]
```

## 필수 매개변수 {#required-parameters}

**1. `<function_name>`**

> `function_name`에 `db1.my_func`와 같이 데이터베이스 이름이 포함되어 있으면 해당 데이터베이스에 사용자 정의 함수가 생성됩니다. 그렇지 않으면 현재 세션의 데이터베이스에 함수가 생성됩니다. 새 함수의 이름과 매개변수 조합은 현재 네임스페이스의 기존 함수와 같아서는 안 됩니다. 같으면 생성에 실패합니다.

**2. `<arg_type>`**

> 함수의 입력 매개변수 타입입니다. 고정 인수를 하나 이상 선언할 수 있습니다. **4.1.5 버전부터는 `...`을 사용한 가변 인자 함수 선언이 더 이상 지원되지 않습니다. 가변 개수의 값을 받으려면 대신 `ARRAY` 매개변수를 사용하세요.**

**3. `<ret_type>`**

> 함수의 반환 매개변수 타입입니다. 새 함수를 생성할 때 반드시 필요한 매개변수입니다. 기존 함수의 별칭을 생성하는 경우에는 필요하지 않습니다.

## 선택적 매개변수 {#optional-parameters}

**1. `GLOBAL`**

> 지정하면 생성된 함수가 전역 범위에서 유효합니다.

**2. `AGGREGATE`**

> 지정하면 집계 함수가 생성됩니다.

**3. `TABLES`**

> 지정하면 테이블 함수가 생성됩니다.

**4. `ALIAS`**

> 지정하면 별칭 함수가 생성됩니다.

> 함수 유형을 나타내는 위 매개변수를 하나도 선택하지 않으면 스칼라 함수가 생성됩니다.

**5. `<inter_type>`**

> 집계 함수의 중간 단계에서 사용하는 데이터 타입을 지정합니다.

**6. `<param>`**

> 별칭 함수의 매개변수를 지정하며, 하나 이상의 매개변수가 필요합니다.

**7. `<origin_function>`**

> 별칭 함수에 대응하는 원본 함수를 지정합니다.

**8. `<properties>`**

> - `file`: 사용자 정의 함수(UDF)가 포함된 JAR 패키지를 지정합니다. 여러 머신으로 구성된 환경에서는 HTTP를 통해 다운로드할 수도 있습니다. 필수 매개변수입니다.
> - `symbol`: UDF 클래스가 포함된 클래스 이름을 지정합니다. 필수 매개변수입니다.
> - `type`: UDF 호출 유형을 지정합니다. 기본값은 Native입니다. Java UDF를 사용할 때는 JAVA_UDF를 사용하세요.
> - `always_nullable`: UDF 결과에 NULL 값이 포함될 수 있는지 지정합니다. 선택적 매개변수이며 기본값은 true입니다.
> - `volatility`: 함수 결과의 안정성을 지정합니다. 선택적 매개변수입니다. 기본값은 스칼라 UDF의 경우 `volatile`이며, UDAF/UDTF의 경우 `immutable`입니다. 유효한 값은 다음과 같습니다.
>   - `immutable`: 같은 입력은 항상 같은 출력을 생성합니다. 대부분의 결정적 UDF에는 `immutable`을 지정하여 옵티마이저가 더 많은 실행 계획 최적화를 적용할 수 있도록 해야 합니다.
>   - `stable`: `now()`와 마찬가지로 하나의 SQL 문 내에서는 결과가 일정하지만, SQL 문이 달라지면 결과가 바뀔 수 있습니다. 이 유형의 함수에는 SQL 캐시와 구체화된 뷰 재작성이 비활성화됩니다.
>   - `volatile`: `random()`과 마찬가지로 호출할 때마다 결과가 바뀔 수 있습니다. 이 유형의 함수에는 SQL 캐시, 구체화된 뷰 재작성 및 여러 옵티마이저 재작성 규칙이 비활성화됩니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 명령을 실행하려면 사용자에게 `ADMIN_PRIV` 권한이 있어야 합니다.

## 예제 {#example}

1. 사용자 정의 UDF 함수를 생성합니다. 자세한 내용은 [JAVA-UDF](../../../query-data/udf/java-user-defined-function)를 참조하세요.

   

   ```sql
   CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
       "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
       "symbol"="org.apache.doris.udf.AddOne",
       "always_nullable"="true",
       "type"="JAVA_UDF",
       "volatility"="immutable"
   );
   ```

2. 사용자 정의 UDAF 함수를 생성합니다.

   

   ```sql
   CREATE AGGREGATE FUNCTION simple_sum(INT) RETURNS INT PROPERTIES (
       "file"="file:///pathTo/java-udaf.jar",
       "symbol"="org.apache.doris.udf.demo.SimpleDemo",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```

3. 사용자 정의 UDTF 함수를 생성합니다.

   

   ```sql
   CREATE TABLES FUNCTION java_udtf(string, string) RETURNS array<string> PROPERTIES (
       "file"="file:///pathTo/java-udaf.jar",
       "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```

4. 사용자 정의 별칭 함수를 생성합니다. 자세한 내용은 [별칭 함수](../../../query-data/udf/alias-function)를 참조하세요.

   

   ```sql
   CREATE ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
   ```

5. 전역 사용자 정의 별칭 함수를 생성합니다.

   

   ```sql
   CREATE GLOBAL ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
   ```

6. volatile Python UDF를 생성합니다. `uuid.uuid4()`와 같이 무작위성에 의존하는 함수는 기본값인 `volatility = volatile`을 유지해야 하며, `immutable`로 잘못 지정해서는 안 됩니다.

   ```sql
   CREATE TABLE cte_uuid_seed (id INT) ENGINE=OLAP DUPLICATE KEY(id)
   DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES ("replication_num" = "1");
   INSERT INTO cte_uuid_seed VALUES (1),(2),(3);

   DROP FUNCTION IF EXISTS py_uuid_token(INT);
   CREATE FUNCTION py_uuid_token(INT)
   RETURNS STRING
   PROPERTIES (
       "type" = "PYTHON_UDF",
       "symbol" = "py_uuid_token_impl",
       "always_nullable" = "false",
       "runtime_version" = "3.12.11",
       "volatility" = "volatile"
   )
   AS $$
   import uuid
   def py_uuid_token_impl(x):
       return f"{x}-{uuid.uuid4()}"
   $$;

   SET enable_cte_materialize = true;
   SET inline_cte_referenced_threshold = 10;

   WITH cte AS (SELECT id, py_uuid_token(id) AS token FROM cte_uuid_seed)
   SELECT id, COUNT(DISTINCT token) AS distinct_tokens
   FROM (SELECT id, token FROM cte UNION ALL SELECT id, token FROM cte) u
   GROUP BY id ORDER BY id;
   ```

   올바른 결과:

   ```text
   +------+-----------------+
   | id   | distinct_tokens |
   +------+-----------------+
   |    1 |               1 |
   |    2 |               1 |
   |    3 |               1 |
   +------+-----------------+
   ```

   이 함수에 대해 다음 정의는 올바르지 않습니다.

   ```sql
   DROP FUNCTION IF EXISTS py_uuid_token(INT);
   CREATE FUNCTION py_uuid_token(INT)
   RETURNS STRING
   PROPERTIES (
       "type" = "PYTHON_UDF",
       "symbol" = "py_uuid_token_impl",
       "always_nullable" = "false",
       "runtime_version" = "3.12.11",
       "volatility" = "immutable"
   )
   AS $$
   import uuid
   def py_uuid_token_impl(x):
       return f"{x}-{uuid.uuid4()}"
   $$;
   ```

   같은 쿼리를 다시 실행합니다.

   ```sql
   WITH cte AS (SELECT id, py_uuid_token(id) AS token FROM cte_uuid_seed)
   SELECT id, COUNT(DISTINCT token) AS distinct_tokens
   FROM (SELECT id, token FROM cte UNION ALL SELECT id, token FROM cte) u
   GROUP BY id ORDER BY id;
   ```

   잘못된 결과:

   ```text
   +------+-----------------+
   | id   | distinct_tokens |
   +------+-----------------+
   |    1 |               2 |
   |    2 |               2 |
   |    3 |               2 |
   +------+-----------------+
   ```

   잘못된 이유:
   `py_uuid_token`은 volatile 함수이므로 `uuid.uuid4()`를 호출할 때마다 새로운 값이 생성됩니다. 함수를 `volatility = immutable`로 잘못 지정하면 옵티마이저는 반복되는 참조를 안전하게 재작성할 수 있다고 판단하여 `UNION ALL`의 양쪽에서 UDF를 각각 평가하는 실행 계획을 선택할 수 있습니다. 그 결과 같은 `id`에 대해 서로 다른 두 개의 `token` 값이 생성될 수 있으며, `COUNT(DISTINCT token)`의 결과가 `1`에서 `2`로 바뀝니다.

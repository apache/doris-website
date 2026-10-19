---
{
    "title": "CREATE SQL_BLOCK_RULE",
    "language": "ko",
    "description": "이 문은 SQL 차단 규칙을 생성하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 SQL 차단 규칙을 생성하는 데 사용됩니다.

SQL_BLOCK_RULE을 사용하면 대량의 데이터 스캔을 방지하는 등 사용자가 특정 작업을 수행하지 못하도록 제한할 수 있습니다.

## 구문 {#syntax}

```sql
CREATE SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```

## 필수 매개변수 {#required-parameters}

**1. `<rule_name>`**

> 규칙의 이름입니다.

**2. `<property>`**

> 규칙의 속성은 SQL 실행, 스캔 제한, 스위치의 세 가지 범주로 나뉩니다.

> SQL 실행 범주와 스캔 제한 범주는 상호 배타적이므로, 하나의 SQL 차단 규칙에서는 둘 중 하나만 제한할 수 있습니다.

> **SQL 실행 범주**

> 정규식 일치와 완전 일치의 두 가지 유형이 있으며, 이 중 하나만 선택할 수 있습니다.
>
> - sql: 일치 규칙입니다(정규식 일치를 기반으로 하며, 특수 문자는 이스케이프해야 합니다. 예를 들어 `select *`는 `select \\*`로 작성해야 합니다). 사용자가 SQL 문을 실행하면 시스템은 여기에 설정한 SQL을 정규식으로 사용하여 사용자가 제출한 SQL과 일치하는지 확인합니다. 일치하면 해당 SQL의 실행이 차단됩니다.
> - sqlHash: SQL의 MD5 해시 값입니다. 주로 슬로우 로그와 함께 사용합니다. 사용자가 직접 해시 값을 계산할 필요는 없습니다. 예를 들어 슬로우 로그에서 특정 SQL이 느리게 실행되는 것을 확인했다면, `SqlHash` 값을 `fe.audit.log`에서 복사한 후 SQL_BLOCK_RULE을 생성하여 해당 SQL의 실행을 제한할 수 있습니다.
>
> **스캔 제한 범주**
> 사용자가 쿼리를 시작하면 쿼리 옵티마이저는 각 테이블에서 스캔해야 하는 파티션 수, 태블릿 수, 데이터 행 수를 계산합니다. 다음 속성으로 이 세 가지 수치를 모두 또는 일부만 제한할 수 있습니다.
> - partition_num: 테이블이 스캔할 수 있는 최대 파티션 수입니다.
> - tablet_num: 테이블이 스캔할 수 있는 최대 태블릿 수입니다.
> - cardinality: 테이블이 스캔할 데이터 행 수입니다.
> - require_partition_filter: 파티션이 있는 내부 테이블 또는 Hive 테이블의 쿼리에 유효한 파티션 필터가 반드시 포함되어야 하는지 여부입니다. `true`로 설정하면 지원되는 파티션 테이블에서 파티션 열에 대한 필터 없이 스캔하는 쿼리가 차단됩니다. 기본값은 `false`입니다. 이 속성은 Doris 4.0.7 및 그 이후의 4.0 시리즈 버전과 Doris 4.1.4 및 그 이후의 4.1 시리즈 버전에서 지원됩니다. 현재 내부 테이블과 Hive 테이블에만 적용됩니다.
>
> **스위치 범주**
>
> - global: 규칙을 모든 사용자에게 적용할지 여부입니다. 기본값은 false입니다. true로 설정하지 않으면 `set property` 명령으로 특정 사용자에게 규칙을 적용해야 합니다.
> - enable: 차단 규칙을 활성화할지 여부입니다. 기본값은 true입니다.


## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한    | 객체 | 참고 |
| ------------ | ------ | ----- |
| ADMIN_PRIV | 전역 |       |

## 예제 {#example}

1. 모든 사용자가 `select * from order_analysis`를 실행하지 못하도록 하는 규칙을 생성합니다.

   ```sql
   CREATE SQL_BLOCK_RULE test_rule 
   PROPERTIES(
   "sql"="select \\* from order_analysis",
   "global"="true",
   "enable"="true"
   );
   ```

   규칙에 정의된 SQL을 실행하면 다음과 같이 예외 오류가 반환됩니다:


   ```sql
   mysql> select * from order_analysis;
   ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: test_rule
   ```

2. 동일한 테이블에서 30개가 넘는 파티션을 스캔하지 못하도록 하고, 쿼리 데이터 양을 10십억 행 이하로 제한하는 규칙을 생성합니다.


   ```sql
   CREATE SQL_BLOCK_RULE test_rule2 
   PROPERTIES
   (
       "partition_num" = "30",
       "cardinality" = "10000000000",
       "global" = "true",
       "enable" = "true"
   );
   ```

3. SQL 일치는 정규식을 기반으로 합니다. 더 다양한 SQL 패턴을 일치시키려면 해당 정규식을 작성해야 합니다. 예를 들어 다음과 같이 SQL의 공백을 무시하고 "order"로 시작하는 테이블에 대한 쿼리를 차단할 수 있습니다:


   ```sql
   CREATE SQL_BLOCK_RULE test_rule3
   PROPERTIES(
     "sql"="\\s*select\\s*\\*\\s*from order_\\w*\\s*",
     "global"="true",
     "enable"="true"
   );
   ```

4. 특정 사용자에게만 적용되는 규칙을 생성합니다.


   ```sql
   CREATE SQL_BLOCK_RULE test_rule4
   PROPERTIES(
       "sql"="select \\* from order_analysis",
       "global"="false",
       "enable"="true"
   );
   ```

   규칙을 사용자 jack에게 적용합니다.


   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'test_rule4';
   ```

5. 파티션이 있는 내부 테이블과 Hive 테이블의 쿼리에 파티션 필터를 포함하도록 요구하는 규칙을 생성합니다.

   ```sql
   CREATE SQL_BLOCK_RULE test_rule5
   PROPERTIES(
       "require_partition_filter"="true",
       "global"="true",
       "enable"="true"
   );
   ```

   규칙을 활성화하면 지원되는 파티션 테이블에 대한 쿼리에 파티션 열 필터가 없는 경우 쿼리가 차단됩니다:

   ```sql
   SELECT * FROM partitioned_table;
   ERROR 1105 (HY000): errCode = 2, detailMessage = sql hits sql block rule: test_rule5, missing partition filter
   ```

   유효한 파티션 필터가 포함된 쿼리는 계속 실행할 수 있습니다:

   ```sql
   SELECT * FROM partitioned_table WHERE dt = '2024-01-01';
   ```

## 기타 {#others}

자주 사용하는 정규식은 다음과 같습니다:

텍스트 복사

```text
. : Matches any single character except the newline character `\n`.

* : Matches the preceding element zero or more times. For example, a* matches zero or more 'a's.

+ : Matches the preceding element one or more times. For example, a+ matches one or more 'a's.

? : Matches the preceding element zero or one time. For example, a? matches zero or one 'a'.

[] : Defines a character set. For example, [aeiou] matches any vowel.

[^] : When used in a character set, ^ indicates negation, matching characters not in the set. For example, [^0-9] matches any non-digit character.

() : Groups expressions, allowing quantifiers to be applied to them. For example, (ab)+ matches consecutive 'ab's.

| : Indicates logical OR. For example, a|b matches 'a' or 'b'.

^ : Matches the beginning of a string. For example, ^abc matches strings starting with 'abc'.

$ : Matches the end of a string. For example, xyz$ matches strings ending with 'xyz'.

\ : Escapes special characters, making them ordinary characters. For example, \\. matches the period character '.'.

\s : Matches any whitespace character, including spaces, tabs, newlines, etc.

\d : Matches any digit character, equivalent to [0-9].

\w : Matches any word character, including letters, digits, and underscores, equivalent to [a-zA-Z0-9_].
```

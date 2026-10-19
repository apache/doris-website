---
{
    "title": "ALTER SQL_BLOCK_RULE",
    "language": "ko",
    "description": "이 문은 SQL 차단 규칙을 수정하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 SQL 차단 규칙을 수정하는 데 사용됩니다.

## 구문 {#syntax}


```sql
ALTER SQL_BLOCK_RULE <rule_name>
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

자세한 내용은 [CREATE SQL_BLOCK_RULE](../data-governance/CREATE-SQL_BLOCK_RULE.md)의 설명을 참조하세요.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한   | 객체 | 참고 사항 |
| ------------ | ------ | ----------- |
| ADMIN_PRIV | 전역 |             |

## 예제 {#example}

1. SQL을 수정하고 규칙을 활성화합니다.


  ```sql
  ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
  ```

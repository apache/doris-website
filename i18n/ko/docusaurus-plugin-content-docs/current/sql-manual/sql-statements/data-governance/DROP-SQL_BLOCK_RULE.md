---
{
    "title": "DROP SQL_BLOCK_RULE",
    "language": "ko",
    "description": "하나 이상의 SQL 차단 규칙을 삭제합니다. 규칙을 쉼표로 구분하면 여러 규칙을 한 번에 삭제할 수 있습니다."
}
---

## 설명 {#description}

하나 이상의 SQL 차단 규칙을 삭제합니다. 규칙을 쉼표로 구분하면 여러 규칙을 한 번에 삭제할 수 있습니다.

## 구문 {#syntax}

```sql
DROP SQL_BLOCK_RULE <rule_name>[, ...]
```

## 필수 매개변수 {#required-parameters}

<rule_name>
삭제할 SQL 차단 규칙의 이름입니다. 여러 규칙 이름을 쉼표로 구분하여 지정할 수 있습니다. 

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:
| 권한 | 대상 | 설명                |
| :---------------- | :------------- | :---------------------------- |
| ADMIN        | 사용자 또는 역할   | ADMIN 권한이 있는 사용자 또는 역할만 DROP 작업을 수행할 수 있습니다. |


## 예제 {#example}

`test_rule1` 및 `test_rule2` 차단 규칙을 삭제합니다.

```sql
DROP SQL_BLOCK_RULE test_rule1, test_rule2;
```

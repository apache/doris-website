---
{
    "title": "DROP CATALOG",
    "language": "ko",
    "description": "이 문은 외부 Catalog를 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 외부 Catalog를 삭제하는 데 사용됩니다.

## 구문 {#syntax}

```sql
DROP CATALOG [IF EXISTS] <catalog_name>;
```

## 필수 매개변수 {#required-parameters}

**1. `<catalog_name>`**
삭제할 Catalog의 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}
| 권한 | 객체  | 비고                                                               |
|:----------|:--------|:--------------------------------------------------------------------|
| DROP_PRIV | Catalog | 해당 Catalog에 대한 DROP_PRIV 권한이 필요합니다. |


## 예제 {#example}

1. hive Catalog 삭제

   ```sql
   DROP CATALOG hive;
   ```

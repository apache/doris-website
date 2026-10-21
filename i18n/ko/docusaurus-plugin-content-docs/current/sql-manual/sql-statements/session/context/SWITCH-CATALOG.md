---
{
    "title": "SWITCH CATALOG",
    "language": "ko",
    "description": "이 문은 Catalog를 전환하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 Catalog를 전환하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SWITCH <catalog_name>
```

## 필수 매개변수 {#required-parameters}

**1. `<catalog_name>`**
> 전환할 Catalog의 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한  | 객체     | 참고 사항                                  |
|------------|------------|----------------------------------------|
| SELECT_PRIV  | Catalog    | 전환할 Catalog에 대한 SELECT_PRIV 권한이 필요합니다. |

## 예제 {#examples}

1. Catalog를 `hive`로 전환합니다.

   ```sql
   SWITCH hive;
   ```

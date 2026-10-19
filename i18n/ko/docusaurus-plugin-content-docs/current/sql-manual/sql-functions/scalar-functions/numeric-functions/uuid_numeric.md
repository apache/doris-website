---
{
    "title": "UUID_NUMERIC",
    "language": "ko",
    "description": "LARGEINT 타입의 uuid를 반환합니다"
}
---

## 설명 {#description}

LARGEINT 타입의 uuid를 반환합니다.

이 함수는 계속 LARGEINT를 반환하며, 네이티브 [UUID 타입](../../../basic-element/sql-data-types/uuid.md)은 이 동작에 영향을 주지 않습니다. 네이티브 UUID 값이 필요한 경우 [UUID_V4](../uuid-functions/uuid-v4.md) 또는 [UUID_V7](../uuid-functions/uuid-v7.md)을 사용하세요.

## 구문 {#syntax}

```sql
UUID_NUMERIC()
```

## 반환 값 {#return-value}

LARGEINT 타입의 uuid를 반환합니다. LARGEINT는 Int128이므로 uuid_numeric()이 음수를 생성할 수 있습니다.

## 예제 {#example}

```sql
select uuid_numeric()
```

```text
+----------------------------------------+
| uuid_numeric()                         |
+----------------------------------------+
| 82218484683747862468445277894131281464 |
+----------------------------------------+
```

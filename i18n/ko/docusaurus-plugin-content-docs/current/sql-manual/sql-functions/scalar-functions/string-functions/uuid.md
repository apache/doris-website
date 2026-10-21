---
{
    "title": "UUID",
    "language": "ko",
    "description": "UUID 함수는 무작위 Universally Unique Identifier(UUID)를 생성합니다. 생성된 UUID는 RFC 4122 표준을 따릅니다."
}
---

## 설명 {#description}

UUID 함수는 무작위 Universally Unique Identifier(UUID)를 생성합니다. 생성된 UUID는 RFC 4122 표준을 따르며, 형식은 8-4-4-4-12(하이픈을 포함하여 36자)입니다.

기존 `UUID()`는 계속 `VARCHAR`를 반환합니다. [UUID_V4](../uuid-functions/uuid-v4.md)와 [UUID_V7](../uuid-functions/uuid-v7.md) 함수는 네이티브 [UUID 타입](../../../basic-element/sql-data-types/uuid.md)을 반환합니다.

## 구문 {#syntax}

```sql
UUID()
```

## 매개변수 {#parameters}

매개변수가 없습니다.

## 반환값 {#return-value}

무작위로 생성된 UUID 문자열을 VARCHAR 타입으로 반환합니다.

특이 사항:
- 호출할 때마다 서로 다른 UUID를 생성합니다.
- UUID 형식: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- 생성된 UUID는 전역적으로 고유합니다.

## 예제 {#examples}

1. 기본 사용법: 단일 UUID 생성
```sql
SELECT UUID();
```
```text
+--------------------------------------+
| UUID()                               |
+--------------------------------------+
| 29077778-fc5e-4603-8368-6b5f8fd55c24 |
+--------------------------------------+
```

2. 여러 번 호출하면 서로 다른 UUID 생성
```sql
SELECT UUID(), UUID();
```
```text
+--------------------------------------+--------------------------------------+
| UUID()                               | UUID()                               |
+--------------------------------------+--------------------------------------+
| a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6 | f7e8d9c0-b1a2-4938-8756-c4d3e2f1a0b9 |
+--------------------------------------+--------------------------------------+
```

### 키워드 {#keywords}

    UUID

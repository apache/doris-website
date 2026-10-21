---
{
    "title": "UUID_VERSION",
    "language": "ko",
    "description": "네이티브 UUID의 네 비트 버전 필드를 TINYINT로 추출하며, NULL 입력과 모든 비트가 영인 UUID 및 모든 비트가 일인 UUID의 동작을 설명합니다."
}
---

## 설명 {#description}

UUID의 네 비트 버전 필드를 추출하며, `NULL` 입력에는 `NULL`을 반환합니다.

## 구문 {#syntax}

```sql
UUID_VERSION(<uuid>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<uuid>` | UUID 타입의 값입니다. |

## 반환값 {#return-value}

0–15 범위의 `TINYINT`를 반환합니다. variant나 UUID 버전 명세 준수 여부를 검증하지 않고 버전 비트를 읽습니다. 모든 비트가 영인 UUID는 0을 반환하고, 모든 비트가 일인 UUID는 15를 반환합니다. `NULL` 입력에는 `NULL`을 반환합니다.

## 예제 {#example}

```sql
SELECT UUID_VERSION(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID)) AS v4,
       UUID_VERSION(CAST('018f0f59-1010-7abc-9234-001122334455' AS UUID)) AS v7,
       UUID_VERSION(CAST('00000000-0000-0000-0000-000000000000' AS UUID)) AS zero_version,
       UUID_VERSION(CAST('ffffffff-ffff-ffff-ffff-ffffffffffff' AS UUID)) AS max_version,
       UUID_VERSION(CAST(NULL AS UUID)) AS null_version;
```

```text
+----+----+--------------+-------------+--------------+
| v4 | v7 | zero_version | max_version | null_version |
+----+----+--------------+-------------+--------------+
| 4  | 7  | 0            | 15          | NULL         |
+----+----+--------------+-------------+--------------+
```

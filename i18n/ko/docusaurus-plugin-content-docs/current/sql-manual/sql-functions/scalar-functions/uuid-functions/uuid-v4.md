---
{
    "title": "UUID_V4",
    "language": "ko",
    "description": "네이티브 UUID 타입의 임의 버전 4 값을 생성하며, 별칭과 행별 컬럼 기본값을 지원합니다."
}
---

## 설명 {#description}

네이티브 UUID 타입의 버전 4 UUID를 생성합니다. 버전 4는 임의의 값을 사용합니다.

## 별칭 {#alias}

`GENERATE_UUID_V4`, `GENERATEUUIDV4`.

## 사용 시 참고 사항 {#usage-notes}

각 행마다 독립적으로 값을 생성합니다. 인수를 받지 않으므로 `NULL`을 전달하면 유효하지 않습니다. `CREATE TABLE`에서 UUID 컬럼의 동적 기본값으로 사용할 수 있습니다. `ALTER TABLE ADD COLUMN`은 이 동적 기본값을 지원하지 않습니다. [UUID 타입](../../../basic-element/sql-data-types/uuid.md)을 참조하세요.

## 구문 {#syntax}

```sql
UUID_V4()
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| 없음 | 인수를 받지 않습니다. |

## 반환 값 {#return-value}

`UUID` 타입을 반환하며, `NULL`은 반환하지 않습니다. 값은 36자 길이의 소문자 표준 형식으로 표시됩니다.

## 예제 {#example}

```sql
SELECT UUID_VERSION(UUID_V4()) AS version,
       LENGTH(CAST(UUID_V4() AS STRING)) AS text_length;
```

```text
+---------+-------------+
| version | text_length |
+---------+-------------+
| 4       | 36          |
+---------+-------------+
```

```sql
SELECT UUID_VERSION(GENERATE_UUID_V4()) AS alias_version,
       UUID_VERSION(GENERATEUUIDV4()) AS compact_alias_version;
```

```text
+---------------+-----------------------+
| alias_version | compact_alias_version |
+---------------+-----------------------+
| 4             | 4                     |
+---------------+-----------------------+
```

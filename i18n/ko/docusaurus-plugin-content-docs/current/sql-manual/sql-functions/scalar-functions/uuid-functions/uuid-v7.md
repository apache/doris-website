---
{
    "title": "UUID_V7",
    "language": "ko",
    "description": "밀리초 단위 타임스탬프를 포함하는 네이티브 UUID v7을 생성하며, 별칭, 컬럼 기본값 및 정렬 시 제약 사항을 설명합니다."
}
---

## 설명 {#description}

네이티브 UUID 타입의 버전 7 UUID를 생성합니다. 버전 7에는 밀리초 단위의 Unix 타임스탬프가 포함되어 있어, 생성 시간순으로 대략 정렬되는 식별자가 필요할 때 유용합니다.

## 별칭 {#alias}

`GENERATE_UUID_V7`, `GENERATEUUIDV7`.

## 사용 시 참고 사항 {#usage-notes}

각 행에 대해 독립적으로 값을 생성합니다. 인수를 받지 않으므로 `NULL`을 전달하면 유효하지 않습니다. `CREATE TABLE`에서 UUID 컬럼의 동적 기본값으로 사용할 수 있습니다. `ALTER TABLE ADD COLUMN`은 이 동적 기본값을 지원하지 않습니다. [UUID 타입](../../../basic-element/sql-data-types/uuid.md)을 참조하세요.

생성기는 각 BE 프로세스 내에서 증가하는 타임스탬프와 카운터를 사용합니다. 여러 BE에 걸친 전역 생성 순서는 보장하지 않습니다. 시스템 시계가 뒤로 조정되거나 카운터 오버플로가 발생하면 인코딩된 타임스탬프가 실제 시각보다 앞설 수 있습니다. 정확한 이벤트 타임스탬프나 전역 시퀀스 번호로 사용하지 마세요.

## 구문 {#syntax}

```sql
UUID_V7()
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| 없음 | 인수를 받지 않습니다. |

## 반환 값 {#return-value}

`UUID` 타입을 반환하며, `NULL`은 반환하지 않습니다. 값은 소문자로 된 36자 정규 형식으로 표시됩니다.

## 예제 {#example}

```sql
SELECT UUID_VERSION(UUID_V7()) AS version,
       LENGTH(CAST(UUID_V7() AS STRING)) AS text_length;
```

```text
+---------+-------------+
| version | text_length |
+---------+-------------+
| 7       | 36          |
+---------+-------------+
```

```sql
SELECT UUID_VERSION(GENERATE_UUID_V7()) AS alias_version,
       UUID_VERSION(GENERATEUUIDV7()) AS compact_alias_version;
```

```text
+---------------+-----------------------+
| alias_version | compact_alias_version |
+---------------+-----------------------+
| 7             | 7                     |
+---------------+-----------------------+
```

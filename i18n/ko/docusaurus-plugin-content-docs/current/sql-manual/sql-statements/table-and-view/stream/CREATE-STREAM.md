---
{
    "title": "CREATE STREAM",
    "language": "ko",
    "description": "changelog가 활성화된 내부 테이블에 Table Stream을 생성하여 테이블의 변경 사항을 증분 방식으로 소비합니다."
}
---

## 설명 {#description}

changelog가 활성화된 내부 테이블에 Table Stream을 생성합니다. Table Stream은 기본 테이블의 각 파티션에 대한 소비 오프셋을 기록합니다. `SELECT ... FROM <stream>`은 마지막 소비 이후의 변경 사항을 읽고, `INSERT INTO ... SELECT ... FROM <stream>`은 이를 소비하고 오프셋을 전진시킵니다. 기능에 대한 설명은 [Table Stream 기본 개념](../../../../data-operate/incremental/table-stream)을 참조하세요.

이 기능은 5.0.0 버전부터 사용할 수 있으며 실험적 기능입니다. FE 설정에 `enable_feature_changelog = true`와 `enable_table_stream = true`가 필요합니다.

## 구문 {#syntax}

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES ("<key>" = "<value>" [, ...])]
```

## 필수 매개변수 {#required-parameters}

**1. `<stream_name>`**
> Stream의 식별자(이름)입니다. 해당 데이터베이스 내에서 고유해야 하며 테이블이나 뷰의 이름과 중복될 수 없습니다. 식별자 규칙은 테이블 이름과 동일합니다.

**2. `<table_name>`**
> 기본 테이블입니다. [changelog](../../../../data-operate/incremental/changelog)가 활성화된 내부 테이블(`"changelog.enable" = "true"`)이어야 하며, Stream과 다른 데이터베이스에 있을 수 있습니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**
> Stream 또는 기본 테이블이 속한 데이터베이스입니다. 기본값은 현재 데이터베이스입니다.

**2. `IF NOT EXISTS`**
> 같은 이름의 Stream이 이미 존재하면 오류를 보고하지 않습니다.

**3. `<comment>`**
> Stream의 설명입니다. 나중에 `ALTER STREAM ... SET COMMENT`로 변경할 수 있습니다.

**4. `PROPERTIES`**

| 속성 | 값 / 기본값 | 설명 |
|---|---|---|
| `type` | `append_only` / `min_delta` / `detail`<br />기본값 `min_delta` | 소비 유형입니다. `append_only`는 삽입된 행만 출력합니다. `min_delta`는 두 소비 시점 사이에 발생한 각 키의 순변경 사항을 출력합니다. `detail`은 모든 변경 사항을 행 단위로 출력합니다. `min_delta`와 `detail`을 사용하려면 기본 테이블이 `changelog.need_historical_value`가 활성화된 Unique Key Merge-on-Write 테이블이어야 합니다. Duplicate Key 테이블에서 `min_delta`는 `append_only`로 처리됩니다 |
| `show_initial_rows` | `true` / `false`<br />기본값 `false` | Stream 생성 시 이미 존재하는 데이터를 변경 사항으로 출력할지 여부입니다. `true`이면 첫 번째 읽기에서 기본 테이블의 현재 데이터 전체(변경 유형 `APPEND`)를 반환하며, 해당 소비 이후 Stream은 증분 방식으로 전환됩니다 |

어느 속성도 생성 후에는 변경할 수 없습니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다.

| 권한 | 객체 | 참고 사항 |
| :-------- | :----- | :---- |
| CREATE_PRIV | Stream이 속한 데이터베이스 | |
| SELECT_PRIV | 기본 테이블 | |

## 사용 시 참고 사항 {#usage-notes}

- 기본 테이블에 changelog가 활성화되어 있지 않으면 `Base Olap table ... need to enable changelog for table stream` 오류와 함께 문이 실패합니다.
- `type`이 `min_delta`이거나 생략되었고 기본 테이블이 요구 사항을 충족하지 않으면 `MIN_DELTA table stream requires base mow table to enable changelog.need_historical_value=true` 오류와 함께 실패합니다.
- `type` 값이 유효하지 않으면 `not supported type: <value>` 오류와 함께 실패합니다.
- `CREATE OR REPLACE STREAM`은 아직 지원되지 않습니다.
- Stream의 컬럼은 기본 테이블의 현재 표시되는 컬럼이며, 기본 테이블에서 `ADD COLUMN` / `DROP COLUMN`을 실행하면 자동으로 동기화됩니다.

## 예제 {#examples}

1. 기본 유형(`min_delta`)의 Stream을 `orders` 테이블에 생성하여 생성 이후의 변경 사항만 소비합니다.

    ```sql
    CREATE STREAM orders_stream ON TABLE orders;
    ```

2. `append_only` Stream을 생성하고 기본 테이블의 기존 데이터를 초기 변경 사항으로 출력합니다.

    ```sql
    CREATE STREAM IF NOT EXISTS events_stream ON TABLE events
    COMMENT 'append-only events'
    PROPERTIES (
        "type" = "append_only",
        "show_initial_rows" = "true"
    );
    ```

3. `etl` 데이터베이스에 Stream을 생성합니다. 기본 테이블은 `ods` 데이터베이스에 있습니다.

    ```sql
    CREATE STREAM etl.orders_stream ON TABLE ods.orders
    PROPERTIES ("type" = "detail");
    ```

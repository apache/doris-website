---
{
    "title": "ALTER ASYNC MATERIALIZED VIEW",
    "language": "ko",
    "description": "이 문은 비동기 구체화된 뷰를 수정하는 데 사용합니다."
}
---

## 설명 {#description}

이 문은 비동기 구체화된 뷰를 수정하는 데 사용합니다.

#### 구문 {#syntax}

```sql
ALTER MATERIALIZED VIEW mvName=multipartIdentifier ((RENAME newName=identifier)
       | (REFRESH (refreshMethod | refreshTrigger | refreshMethod refreshTrigger))
       | REPLACE WITH MATERIALIZED VIEW newName=identifier propertyClause?
       | (SET  LEFT_PAREN fileProperties=propertyItemList RIGHT_PAREN))
```

#### 상세 설명 {#illustrate}

##### RENAME {#rename}

구체화된 뷰의 이름을 변경하는 데 사용합니다.

예를 들어 mv1의 이름을 mv2로 변경합니다.
```sql
ALTER MATERIALIZED VIEW mv1 rename mv2;
```

##### refreshMethod {#refreshmethod}

[비동기 구체화된 뷰 생성](./CREATE-ASYNC-MATERIALIZED-VIEW)과 동일합니다.

일반 비동기 구체화된 뷰를 `INCREMENTAL`로 변경하는 데 `ALTER MATERIALIZED VIEW`를 사용할 수 없으며, IVM의 기본 새로 고침 방식을 다른 방식으로 변경할 수도 없습니다. 전환하려면 구체화된 뷰를 다시 생성해야 합니다.

##### refreshTrigger {#refreshtrigger}

[비동기 구체화된 뷰 생성](./CREATE-ASYNC-MATERIALIZED-VIEW)과 동일합니다.

##### SET {#set}
구체화된 뷰에 고유한 속성을 수정합니다.

예를 들어 mv1의 grace_period를 3000ms로 변경합니다.
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```

IVM 속성 중 `ivm_use_full_keys`는 생성 시에만 설정할 수 있으며 수정할 수 없습니다. `ivm_partition_window_limit`는 수정할 수 있습니다. 윈도우를 넓히거나 제한을 제거하면 구체화된 뷰의 기준 상태가 무효화되며, 다음 새로 고침 시 구체화된 뷰 전체를 다시 빌드합니다. [증분 뷰 유지 관리(IVM)](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#ivm-properties)를 참조하세요.

##### REPLACE {#replace}
```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
두 구체화된 뷰를 원자적으로 교체합니다.

swap의 기본값은 TRUE입니다.
- swap 매개변수를 TRUE로 설정하면 구체화된 뷰 mv1의 이름을 mv2로 변경하는 동시에 mv2의 이름을 mv1로 변경하는 것과 같습니다.
- swap 매개변수를 FALSE로 설정하면 mv2의 이름을 mv1로 변경하고 기존 mv1을 삭제하는 것과 같습니다.

예를 들어 mv1과 mv2의 이름을 서로 바꾸려면 다음과 같이 실행합니다.
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```

예를 들어 mv2의 이름을 mv1로 변경하고 기존 mv1을 삭제하려면 다음과 같이 실행합니다.
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```

## 키워드 {#keywords}

    ALTER, ASYNC, MATERIALIZED, VIEW

---
{
    "title": "ALTER ASYNC MATERIALIZED VIEW",
    "language": "ko",
    "description": "이 문은 비동기 구체화된 뷰를 수정하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 비동기 구체화된 뷰를 수정하는 데 사용됩니다.

#### 구문 {#syntax}

```sql
ALTER MATERIALIZED VIEW mvName=multipartIdentifier ((RENAME newName=identifier)
       | (REFRESH (refreshMethod | refreshTrigger | refreshMethod refreshTrigger))
       | REPLACE WITH MATERIALIZED VIEW newName=identifier propertyClause?
       | (SET  LEFT_PAREN fileProperties=propertyItemList RIGHT_PAREN))
```

#### 상세 설명 {#illustrate}

##### RENAME {#rename}

구체화된 뷰의 이름을 변경하는 데 사용됩니다.

예를 들어, mv1의 이름을 mv2로 변경합니다.
```sql
ALTER MATERIALIZED VIEW mv1 rename mv2;
```

##### refreshMethod {#refreshmethod}

[비동기 구체화된 뷰 생성](./CREATE-ASYNC-MATERIALIZED-VIEW)과 동일합니다.

##### refreshTrigger {#refreshtrigger}

[비동기 구체화된 뷰 생성](./CREATE-ASYNC-MATERIALIZED-VIEW)과 동일합니다.

##### SET {#set}
구체화된 뷰에만 적용되는 속성을 수정합니다.

예를 들어, mv1의 grace_period를 3000ms로 변경합니다.
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```

##### REPLACE {#replace}
```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
두 구체화된 뷰를 원자적으로 교체합니다.

swap의 기본값은 TRUE입니다.
- swap 매개변수를 TRUE로 설정하면 구체화된 뷰 mv1의 이름을 mv2로 변경하는 동시에 mv2의 이름을 mv1로 변경하는 것과 같습니다.
- swap 매개변수를 FALSE로 설정하면 mv2의 이름을 mv1로 변경하고 기존 mv1을 삭제하는 것과 같습니다.

예를 들어, mv1과 mv2의 이름을 서로 바꾸려면 다음과 같이 실행합니다.
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```

예를 들어, mv2의 이름을 mv1로 변경하고 기존 mv1을 삭제하려면 다음과 같이 실행합니다.
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```

## 키워드 {#keywords}

    ALTER, ASYNC, MATERIALIZED, VIEW

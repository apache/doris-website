---
{
    "title": "ALTER TABLE REPLACE",
    "language": "ko",
    "description": "두 테이블을 원자적으로 교체합니다. 이 작업은 OLAP 테이블에만 적용됩니다."
}
---

## 설명 {#description}

두 테이블을 원자적으로 교체합니다. 이 작업은 OLAP 테이블에만 적용됩니다.

```sql
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')];
```

테이블 tbl1을 테이블 tbl2로 교체합니다.

`swap` 매개변수가 `true`이면 교체 후 `tbl1`이라는 이름의 테이블에는 원래 `tbl2`라는 이름의 테이블에 있던 데이터가 들어갑니다. `tbl2`라는 이름의 테이블에는 원래 `tbl1` 테이블에 있던 데이터가 들어갑니다. 즉, 두 테이블의 데이터가 서로 바뀝니다.

`swap` 매개변수가 `false`이면 교체 후 `tbl1` 테이블에는 `tbl2` 테이블에 있던 데이터가 들어갑니다. `tbl2`라는 이름의 테이블은 삭제됩니다.

#### 원리 {#theory}

테이블 교체 기능은 실제로 다음 일련의 작업을 하나의 원자적 작업으로 수행합니다.

테이블 A를 테이블 B로 교체하고 `swap`이 `true`이면 다음 작업을 수행합니다.

1. 테이블 B의 이름을 테이블 A로 변경합니다.
2. 테이블 A의 이름을 테이블 B로 변경합니다.

`swap`이 `false`이면 다음 작업을 수행합니다.

1. 테이블 A를 삭제합니다.
2. 테이블 B의 이름을 테이블 A로 변경합니다.

#### 주의 사항 {#notice}
1. `swap` 매개변수의 기본값은 `true`입니다. 즉, 테이블 교체 작업은 두 테이블의 데이터를 서로 교환하는 것과 같습니다.
2. `swap` 매개변수를 false로 설정하면 교체 대상 테이블(테이블 A)이 삭제되며 복구할 수 없습니다.
3. 교체 작업은 두 OLAP 테이블 간에만 수행할 수 있으며, 두 테이블의 구조가 일치하는지는 확인하지 않습니다.
4. 권한 검사는 테이블 이름을 기준으로 수행하므로 기존 권한 설정은 변경되지 않습니다.

## 예제 {#example}

1. 테이블을 삭제하지 않고 `tbl1`과 `tbl2`를 원자적으로 교환합니다(참고: 삭제하는 경우에는 실제로 tbl1을 삭제하고 tbl2의 이름을 tbl1로 변경합니다.)

```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2;
```
또는
```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2 PROPERTIES('swap' = 'true');
```

2. `tbl1`과 `tbl2`를 원자적으로 교환하고 `tbl2` 테이블을 삭제합니다(`tbl1`과 원래 `tbl2`의 데이터는 유지합니다.)

```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2 PROPERTIES('swap' = 'false');
```



## 키워드 {#keywords}

```text
ALTER, TABLE, REPLACE, ALTER TABLE
```

## 모범 사례 {#best-practice}
1. 원자적 덮어쓰기 작업

  특정 테이블의 데이터를 덮어쓰려는 경우, 먼저 데이터를 삭제한 뒤 새 데이터를 적재하면 그 사이에는 데이터를 조회할 수 없는 시간이 발생합니다. 이때 `CREATE TABLE LIKE` 문으로 구조가 동일한 새 테이블을 먼저 생성하고, 새 데이터를 해당 테이블에 적재한 다음, 교체 작업으로 기존 테이블을 원자적으로 교체하면 원하는 결과를 얻을 수 있습니다. 파티션 수준의 원자적 덮어쓰기 작업은 [임시 파티션 문서](../../../../data-operate/delete/table-temp-partition)를 참조하세요.

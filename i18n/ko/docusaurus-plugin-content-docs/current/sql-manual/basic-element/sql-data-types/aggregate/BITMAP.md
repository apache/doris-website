---
{
    "title": "BITMAP",
    "language": "ko",
    "description": "BITMAP"
}
---

## BITMAP {#bitmap}
### 설명 {#description}
BITMAP

BITMAP 타입의 컬럼은 Aggregate 테이블, Unique 테이블 또는 Duplicate 테이블에서 사용할 수 있습니다.
Unique 테이블이나 Duplicate 테이블에서 사용할 때는 키가 아닌 컬럼으로 사용해야 합니다.
Aggregate 테이블에서 사용할 때는 키가 아닌 컬럼으로 사용해야 하며, 테이블 생성 시 집계 타입을 BITMAP_UNION으로 지정해야 합니다.
사용자는 길이와 기본값을 지정할 필요가 없습니다. 길이는 데이터 집계 정도에 따라 시스템 내부에서 제어됩니다.
또한 BITMAP 컬럼은 bitmap_union_count, bitmap_union, bitmap_hash 및 bitmap_hash64와 같이 이를 지원하는 함수를 통해서만 쿼리하거나 사용할 수 있습니다.

오프라인 환경에서 BITMAP을 사용하면 데이터 적재 속도에 영향을 줍니다. 데이터 양이 많을 경우 쿼리 속도는 HLL보다 느리지만 Count Distinct보다 빠릅니다.
참고: 실시간 환경에서 BITMAP이 전역 사전을 사용하지 않는 경우, bitmap_hash()를 사용하면 약 천분의 일의 오차가 발생할 수 있습니다. 이 오차율을 허용할 수 없다면 bitmap_hash64를 대신 사용할 수 있습니다.

### 예제 {#example}

테이블 생성 예제:

    create table metric_table (
      datekey int,
      hour int,
      device_id bitmap BITMAP_UNION
    )
    aggregate key (datekey, hour)
    distributed by hash(datekey, hour) buckets 1
    properties(
      "replication_num" = "1"
    );

데이터 삽입 예제:

    insert into metric_table values
    (20200622, 1, to_bitmap(243)),
    (20200622, 2, bitmap_from_array([1,2,3,4,5,434543])),
    (20200622, 3, to_bitmap(287667876573));

데이터 쿼리 예제:

    select hour, BITMAP_UNION_COUNT(pv) over(order by hour) uv from(
       select hour, BITMAP_UNION(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200622
    group by hour order by 1
    ) final;

[세션 변수](../../../sql-statements/session/variable/SET-VARIABLE) `return_object_data_as_binary`를 `true`로 설정할 수 있습니다. 이렇게 설정하면 bitmap이 바이너리 형식으로 반환됩니다.

### 키워드 {#keywords}
BITMAP

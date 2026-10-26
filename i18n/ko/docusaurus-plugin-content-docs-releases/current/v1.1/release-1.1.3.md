---
{
    "title": "릴리스 1.1.3",
    "language": "ko",
    "description": "이번 릴리스에서 Doris 팀은 1.1.2 이후 80건이 넘는 문제를 수정하거나 성능을 개선했습니다. 이 릴리스는 1.1 버전의 버그 수정 릴리스입니다."
}
---

이번 릴리스에서 Doris 팀은 1.1.2 이후 80건이 넘는 문제를 수정하거나 성능을 개선했습니다. 이 릴리스는 1.1 버전의 버그 수정 릴리스이며, 모든 사용자에게 업그레이드를 권장합니다.


# 기능 {#features}

- ODBC 테이블에서 sqlserver와 postgresql의 이스케이프된 식별자를 지원합니다.

- Parquet을 출력 파일 형식으로 사용할 수 있습니다.

# 개선 사항 {#improvements}

- 작은 세그먼트가 생성되지 않도록 flush 정책을 최적화했습니다. [#12706](https://github.com/apache/doris/pull/12706) [#12716](https://github.com/apache/doris/pull/12716)

- 준비 시간을 줄이도록 runtime filter를 리팩터링했습니다. [#13127](https://github.com/apache/doris/pull/13127)

- 쿼리 또는 데이터 적재 과정에서 발생하는 여러 메모리 제어 관련 문제를 해결했습니다. [#12682](https://github.com/apache/doris/pull/12682) [#12688](https://github.com/apache/doris/pull/12688) [#12708](https://github.com/apache/doris/pull/12708) [#12776](https://github.com/apache/doris/pull/12776) [#12782](https://github.com/apache/doris/pull/12782) [#12791](https://github.com/apache/doris/pull/12791) [#12794](https://github.com/apache/doris/pull/12794) [#12820](https://github.com/apache/doris/pull/12820) [#12932](https://github.com/apache/doris/pull/12932) [#12954](https://github.com/apache/doris/pull/12954) [#12951](https://github.com/apache/doris/pull/12951)

# 버그 수정 {#bugfix}

- largeint를 사용하는 compaction 중 코어 덤프가 발생하는 문제를 수정했습니다. [#10094](https://github.com/apache/doris/pull/10094)

- Grouping sets를 사용하면 BE에서 코어 덤프가 발생하거나 잘못된 결과가 반환되는 문제를 수정했습니다. [#12313](https://github.com/apache/doris/pull/12313)

- orthogonal_bitmap_union_count 연산자의 PREAGGREGATION 플래그가 잘못 설정되는 문제를 수정했습니다. [#12581](https://github.com/apache/doris/pull/12581)

- Level1Iterator가 힙의 iterator를 해제하지 않아 메모리 누수가 발생할 수 있는 문제를 수정했습니다. [#12592](https://github.com/apache/doris/pull/12592)

- BE가 2개이고 기존 colocation 테이블이 있을 때 decommission이 실패하는 문제를 수정했습니다. [#12644](https://github.com/apache/doris/pull/12644)

- TBrokerOpenReaderResponse가 너무 클 때 stack-buffer-overflow로 인해 BE에서 코어 덤프가 발생할 수 있는 문제를 수정했습니다. [#12658](https://github.com/apache/doris/pull/12658)

- 데이터 적재 중 오류 코드 -238이 발생하면 BE의 메모리가 부족해질 수 있는 문제를 수정했습니다. [#12666](https://github.com/apache/doris/pull/12666)

- lead 함수의 자식 표현식이 잘못되는 문제를 수정했습니다. [#12587](https://github.com/apache/doris/pull/12587)

- 행 저장소 코드에서 intersect 쿼리가 실패하는 문제를 수정했습니다. [#12712](https://github.com/apache/doris/pull/12712)

- curdate()/current_date() 함수가 잘못된 결과를 반환하는 문제를 수정했습니다. [#12720](https://github.com/apache/doris/pull/12720)

- 임시 테이블에서 lateral view explode_split을 사용할 때 발생하는 버그를 수정했습니다. [#13643](https://github.com/apache/doris/pull/13643)

- 동일한 테이블 두 개를 사용하는 경우 bucket shuffle join 계획이 잘못 생성되는 문제를 수정했습니다. [#12930](https://github.com/apache/doris/pull/12930)

- alter와 데이터 적재를 수행할 때 tablet 버전이 잘못될 수 있는 문제를 수정했습니다. [#13070](https://github.com/apache/doris/pull/13070)

- broker를 사용해 md5sum()/sm3sum()으로 데이터를 적재할 때 BE에서 코어 덤프가 발생하는 문제를 수정했습니다. [#13009](https://github.com/apache/doris/pull/13009)

# 업그레이드 참고 사항 {#upgrade-notes}

메모리 사용량을 줄이기 위해 PageCache와 ChunkAllocator는 기본적으로 비활성화됩니다. 설정 항목 `disable_storage_page_cache`와 `chunk_reserved_bytes_limit`을 수정하면 다시 활성화할 수 있습니다.

Storage Page Cache는 사용자 데이터 청크를 캐시하고, Chunk Allocator는 메모리를 미리 할당합니다.

이 두 기능이 사용하는 메모리는 일정 비율을 차지하며 해제되지 않습니다. 이 메모리를 다른 작업에 유연하게 할당할 수 없어, 일부 상황에서는 다른 작업에 사용할 메모리가 부족해지고 시스템의 안정성과 가용성이 영향을 받을 수 있습니다. 따라서 버전 1.1.3부터 두 기능을 기본적으로 비활성화했습니다.

그러나 지연 시간에 민감한 일부 보고서 조회 환경에서는 이 기능을 끄면 쿼리 지연 시간이 늘어날 수 있습니다. 업그레이드 후 비즈니스에 미칠 영향이 우려된다면 be.conf에 다음 매개변수를 추가해 이전 버전과 동일한 동작을 유지할 수 있습니다.

```
disable_storage_page_cache=false
chunk_reserved_bytes_limit=10%
```

* ``disable_storage_page_cache``: Storage Page Cache를 비활성화할지 여부입니다. 버전 1.1.2까지는 기본값이 false로 활성화되어 있으며, 버전 1.1.3부터는 기본값이 true로 비활성화됩니다.
* `chunk_reserved_bytes_limit`: Chunk Allocator가 예약하는 메모리 크기입니다. 버전 1.1.2 이전까지는 전체 메모리의 10%가 기본값이며, 버전 1.1.3의 기본값은 209715200(200MB)입니다.

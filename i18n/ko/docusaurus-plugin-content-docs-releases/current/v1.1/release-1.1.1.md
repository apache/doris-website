---
{
    "title": "릴리스 1.1.1",
    "language": "ko",
    "description": "1.1에서는 non-vectorized engine에서 이 기능을 사용할 수 있었지만 vectorized engine에는 빠져 있었습니다. 1.1.1에서 이 기능을 다시 추가했습니다."
}
---

## 기능 {#features}

### Vectorized Engine에서 ODBC Sink 지원 {#support-odbc-sink-in-vectorized-engine}

1.1에서는 non-vectorized engine에서 이 기능을 사용할 수 있었지만 vectorized engine에는 빠져 있었습니다. 1.1.1에서 이 기능을 다시 추가했습니다.

### Vectorized Engine을 위한 간단한 memtracker {#simple-memtracker-for-vectorized-engine}

1.1의 vectorized engine에는 BE에 memtracker가 없어 메모리 사용량을 제어할 수 없었고, 이로 인해 OOM이 발생했습니다. 1.1.1에서는 BE에 간단한 memtracker를 추가해 메모리 사용량을 제어하고, 한도를 초과하면 쿼리를 취소할 수 있도록 했습니다.

## 개선 사항 {#improvements}

### 압축 해제한 데이터를 page cache에 캐싱 {#cache-decompressed-data-in-page-cache}

일부 데이터는 bitshuffle로 압축되어 있어 쿼리 중 압축을 해제하는 데 많은 시간이 걸립니다. 1.1.1에서는 Doris가 bitshuffle로 인코딩된 데이터를 압축 해제하여 쿼리 속도를 높입니다. ssb-flat의 일부 쿼리에서 지연 시간이 30% 줄어드는 것을 확인했습니다.

## 버그 수정 {#bug-fix}

### 1.0에서 롤링 업그레이드를 할 수 없는 문제 수정(심각) {#fix-the-problem-that-could-not-do-rolling-upgrade-from-10serious}

이 문제는 1.1에서 발생하기 시작했으며, FE를 업그레이드하지 않고 BE만 업그레이드하면 BE가 비정상 종료될 수 있습니다.

이 문제가 발생하면 [#10833](https://github.com/apache/doris/pull/10833)을 적용해 해결할 수 있습니다.

### 일부 쿼리가 non-vectorized engine으로 전환되지 않아 BE가 비정상 종료되는 문제 수정 {#fix-the-problem-that-some-query-not-fall-back-to-non-vectorized-engine-and-be-will-core}

현재 vectorized engine은 모든 SQL 쿼리를 처리할 수 없으므로 일부 쿼리(예: left outer join)는 non-vectorized engine에서 실행됩니다. 하지만 1.1에서는 일부 경우가 이 전환 과정에서 누락되어 BE가 비정상 종료될 수 있었습니다.

### compaction이 올바르게 작동하지 않아 -235 오류가 발생하는 문제 수정 {#compaction-not-work-correctly-and-cause--235-error}

uniq key compaction 중 하나의 rowset에 여러 segment가 있으면 generic_iterator에서 segment의 행이 병합되지만 merged_rows 값은 증가하지 않습니다. 그 결과 check_correctness 검사에서 compaction이 실패하고 tablet에 버전이 지나치게 많이 쌓여 -235 데이터 적재 오류가 발생합니다.

### 쿼리 실행 중 발생하는 일부 세그멘테이션 폴트 수정 {#some-segment-fault-cases-during-query}

[#10961](https://github.com/apache/doris/pull/10961)
[#10954](https://github.com/apache/doris/pull/10954)
[#10962](https://github.com/apache/doris/pull/10962)

# 감사의 말 {#thanks}

이번 릴리스에 기여해 주신 모든 분께 감사드립니다:

```
@jacktengg
@mrhhsg
@xinyiZzz
@yixiutt
@starocean999
@morrySnow
@morningman
@HappenLee
```

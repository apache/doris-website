---
{
    "title": "SHOW CACHE HOTSPOT",
    "language": "ko",
    "description": "이 문은 파일 캐시의 핫스팟 정보를 표시하는 데 사용됩니다."
}
---

## 설명 {#description}


이 문은 파일 캐시의 핫스팟 정보를 표시하는 데 사용됩니다.

:::info 참고

3.0.4 이전 버전에서는 `SHOW CACHE HOTSPOT` 문을 사용하여 캐시 핫스팟 정보 통계를 쿼리할 수 있었습니다. 3.0.4 버전부터는 캐시 핫스팟 정보 통계를 조회하는 데 `SHOW CACHE HOTSPOT` 문을 사용하는 것이 더 이상 지원되지 않습니다. 시스템 테이블 `__internal_schema.cloud_cache_hotspot`을 직접 쿼리하세요. 자세한 사용법은 [파일 캐시 관리](../../../../compute-storage-decoupled/file-cache/file-cache)를 참조하세요.

:::

## 구문 {#syntax}


```sql
   SHOW CACHE HOTSPOT '/[<compute_group_name>/<table_name>]';
```

## 매개변수 {#parameters}


| 매개변수 이름	                  | 설명                                                         |
|---------------------------|--------------------------------------------------------------|
| <compute_group_name>        | 컴퓨팅 그룹의 이름입니다.                                               |
| <table_name>                | 테이블의 이름입니다.                                                   |
## 예제 {#examples}

1. 전체 시스템의 캐시 핫스팟 정보를 표시합니다:

```sql
SHOW CACHE HOTSPOT '/';
```

2. 특정 컴퓨팅 그룹 my_compute_group의 캐시 핫스팟 정보를 표시합니다:

```sql
SHOW CACHE HOTSPOT '/my_compute_group/';
```

## 참고 자료 {#references}

- [WARMUP CACHE](../../../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP)
- [파일 캐시 관리](../../../../compute-storage-decoupled/file-cache/file-cache)

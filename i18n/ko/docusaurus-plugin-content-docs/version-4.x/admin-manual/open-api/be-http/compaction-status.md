---
{
    "title": "Compaction 상태 조회",
    "language": "ko",
    "description": "BE 노드의 전체 compaction 상태와 지정된 tablet의 compaction 상태를 조회하는 데 사용됩니다."
}
---

# Compaction 상태 조회 {#view-compaction-status}

## 요청 {#request}

`GET /api/compaction/run_status`
`GET /api/compaction/show?tablet_id={int}`

## 설명 {#description}

BE 노드의 전체 compaction 상태와 지정된 tablet의 compaction 상태를 조회하는 데 사용됩니다.

## 쿼리 매개변수 {#query-parameters}

* `tablet_id`
    tablet의 ID

## 요청 본문 {#request-body}

없음

## 응답 {#response}

### 노드의 전체 compaction 상태 {#the-overall-compaction-status-of-the-node}

```
{
  "CumulativeCompaction": {
         "/home/disk1" : [10001, 10002],
         "/home/disk2" : [10003]
  },
  "BaseCompaction": {
         "/home/disk1" : [10001, 10002],
         "/home/disk2" : [10003]
  }
}
```

이 구조는 특정 데이터 디렉터리에서 compaction 작업을 수행 중인 tablet의 ID와 compaction 유형을 나타냅니다.

### 지정된 tablet의 compaction 상태 {#specify-the-compaction-status-of-the-tablet}

```
{
    "cumulative policy type": "SIZE_BASED",
    "cumulative point": 50,
    "last cumulative failure time": "2019-12-16 18:13:43.224",
    "last base failure time": "2019-12-16 18:13:23.320",
    "last cumu success time": ,
    "last base success time": "2019-12-16 18:11:50.780",
    "rowsets": [
        "[0-48] 10 DATA OVERLAPPING 574.00 MB",
        "[49-49] 2 DATA OVERLAPPING 574.00 B",
        "[50-50] 0 DELETE NONOVERLAPPING 574.00 B",
        "[51-51] 5 DATA OVERLAPPING 574.00 B"
    ],
    "missing_rowsets": [],
    "stale version path": [
        {
            "path id": "2",
            "last create time": "2019-12-16 18:11:15.110 +0800",
            "path list": "2-> [0-24] -> [25-48]"
        }, 
        {
            "path id": "1",
            "last create time": "2019-12-16 18:13:15.110 +0800",
            "path list": "1-> [25-40] -> [40-48]"
        }
    ]
}
```

결과 설명:

* cumulative policy type: 현재 tablet에서 사용하는 cumulative compaction 정책 유형입니다.
* cumulative point: base compaction과 cumulative compaction을 구분하는 버전 경계입니다. 경계 이전 버전(경계 버전 제외)은 base compaction이 처리합니다. 경계 이후 버전(경계 버전 포함)은 cumulative compaction이 처리합니다.
* last cumulative failure time: 마지막 cumulative compaction이 실패한 시각입니다. 기본적으로 10분 후에 이 tablet에서 cumulative compaction을 다시 시도합니다.
* last base failure time: 마지막 base compaction이 실패한 시각입니다. 기본적으로 10분 후에 이 tablet에서 base compaction을 다시 시도합니다.
* rowsets: 이 tablet의 현재 rowset 컬렉션입니다. [0-48]은 버전이 0-48인 rowset을 의미합니다. 두 번째 숫자는 rowset의 segment 수입니다. DELETE는 삭제 버전을 나타냅니다. OVERLAPPING과 NONOVERLAPPING은 segment 간 데이터의 중복 여부를 나타냅니다.
* missing_rowset: 누락된 rowset입니다.
* stale version path: tablet에서 현재 병합된 rowset 컬렉션의 병합 버전 경로입니다. 배열 구조이며, 각 요소는 하나의 병합 경로를 나타냅니다. 각 요소에는 세 가지 속성이 있습니다. path id는 버전 경로 ID를 나타내고, last create time은 해당 경로에서 가장 최근에 생성된 rowset의 생성 시각을 나타냅니다. 기본적으로 이 경로의 모든 rowset은 last create time으로부터 반 시간이 지나면 삭제됩니다.

## 예제 {#examples}

```
curl http://192.168.10.24:8040/api/compaction/show?tablet_id=10015
```

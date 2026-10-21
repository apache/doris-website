---
{
    "title": "SYNC",
    "language": "ko",
    "description": "이 문은 마스터가 아닌 Frontend (FE) 노드의 메타데이터를 동기화하는 데 사용됩니다. Apache Doris에서는 마스터 FE 노드만 메타데이터를 쓸 수 있으며,"
}
---

## 설명 {#description}

이 문은 마스터가 아닌 Frontend (FE) 노드의 메타데이터를 동기화하는 데 사용됩니다. Apache Doris에서는 마스터 FE 노드만 메타데이터를 쓸 수 있으며, 다른 FE 노드는 메타데이터 쓰기 작업을 마스터로 전달합니다. 마스터가 메타데이터 쓰기 작업을 완료한 후, 마스터가 아닌 노드에서 메타데이터를 재적용하는 데 약간의 지연이 발생할 수 있습니다. 이 문을 사용하여 메타데이터를 강제로 동기화할 수 있습니다.

## 구문 {#syntax}

```sql
SYNC;
```

## 접근 제어 요구 사항 {#access-control-requirements}

어떤 사용자나 역할이든 이 작업을 수행할 수 있습니다.


## 예제 {#examples}

메타데이터 동기화:

    ```sql
    SYNC;
    ```

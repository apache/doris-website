---
{
    "title": "EXPLAIN",
    "language": "ko",
    "description": "EXPLAIN 문은 주어진 쿼리에 대한 Doris의 쿼리 실행 계획을 표시합니다."
}
---

## 설명 {#description}

EXPLAIN 문은 주어진 쿼리에 대한 Doris의 쿼리 실행 계획을 표시합니다. Doris의 쿼리 옵티마이저는 통계 데이터, 데이터 특성, HASH JOIN, 파티셔닝, 버키팅 등의 기능을 활용하여 효율적인 계획을 생성하는 것을 목표로 합니다. 그러나 이론적·실무적 제약으로 인해 계획의 성능이 기대에 미치지 못할 때도 있습니다.

성능을 개선하려면 현재 계획을 분석해야 합니다. 이 문서에서는 EXPLAIN 문을 사용하여 최적화하는 방법을 설명합니다.



## 구문 {#syntax}

```plain text
{EXPLAIN | DESC} [VERBOSE] <query_block>
```

## 필수 매개변수 {#required-parameters}

**<query_block>**

> 실행 계획을 확인하려는 쿼리 문입니다.

## 선택적 매개변수 {#optional-parameters}

**[VERBOSE]**

> 상세 정보의 표시 여부는 `VERBOSE` 지정 여부에 따라 결정됩니다. `VERBOSE`를 지정하면 각 연산자의 세부 정보, 사용하는 튜플 ID, 각 튜플에 대한 상세 설명 등 포괄적인 정보가 표시됩니다. 지정하지 않으면 간략한 정보가 제공됩니다.


## 반환 결과 {#return-results}

### 기본 개념 {#basic-concepts}

`EXPLAIN`이 표시하는 정보를 더 잘 이해할 수 있도록 Doris 실행 계획의 핵심 개념 몇 가지를 소개합니다.

| 이름      | 설명                                                  |
| :-------- | :----------------------------------------------------------- |
| PLAN      | 실행 계획입니다. 실행 계획기가 쿼리를 실행 계획으로 변환하면 실행 엔진이 이를 실행합니다. |
| FRAGMENT  | 실행 프래그먼트입니다. Doris는 분산 실행 엔진이므로 전체 실행 계획을 여러 단일 노드 실행 프래그먼트로 나눕니다. FRAGMENT 테이블은 하나의 완전한 단일 노드 실행 프래그먼트를 나타냅니다. 여러 FRAGMENT가 결합하여 하나의 완전한 PLAN을 구성합니다. |
| PLAN NODE | 연산자입니다. 실행 계획의 가장 작은 단위입니다. FRAGMENT는 여러 연산자로 구성됩니다. 각 연산자는 집계, 조인 등 특정 실행 로직을 담당합니다. |

### 반환 결과 구조 {#return-result-structure}

Doris `EXPLAIN` 문의 결과는 하나의 완전한 PLAN입니다. PLAN 내에서 FRAGMENT는 실행 순서의 역순으로 배치됩니다. 각 FRAGMENT 내에서도 연산자(PLAN NODE)는 실행 순서의 역순으로 배치됩니다.

아래는 예시입니다.


```sql
+--------------------------------------------------+
| Explain String(Nereids Planner)                  |
+--------------------------------------------------+
| PLAN FRAGMENT 0                                  |
|   OUTPUT EXPRS:                                  |
|     cnt[#10]                                     |
|     cnt[#11]                                     |
|   PARTITION: UNPARTITIONED                       |
|                                                  |
|   HAS_COLO_PLAN_NODE: false                      |
|                                                  |
|   VRESULT SINK                                   |
|      MYSQL_PROTOCAL                              |
|                                                  |
|   7:VEXCHANGE                                    |
|      offset: 0                                   |
|      distribute expr lists:                      |
|                                                  |
| PLAN FRAGMENT 1                                  |
|                                                  |
|   PARTITION: RANDOM                              |
|                                                  |
|   HAS_COLO_PLAN_NODE: false                      |
|                                                  |
|   STREAM DATA SINK                               |
|     EXCHANGE ID: 07                              |
|     UNPARTITIONED                                |
|                                                  |
|   6:VHASH JOIN(354)                              |
|   |  join op: INNER JOIN(BROADCAST)[]            |
|   |  equal join conjunct: cnt[#7] = cnt[#5]      |
|   |  cardinality=1                               |
|   |  vec output tuple id: 8                      |
|   |  vIntermediate tuple ids: 7                  |
|   |  hash output slot ids: 5 7                   |
|   |  distribute expr lists:                      |
|   |  distribute expr lists:                      |
|   |                                              |
|   |----4:VEXCHANGE                               |
|   |       offset: 0                              |
|   |       distribute expr lists:                 |
|   |                                              |
|   5:VEXCHANGE                                    |
|      offset: 0                                   |
|      distribute expr lists:                      |
|                                                  |
| PLAN FRAGMENT 2                                  |
|   ...                                            |
|                                                  |
| PLAN FRAGMENT 3                                  |
|   ...                                            |
+--------------------------------------------------+
```

연산자는 점선으로 자식 노드에 연결됩니다. 연산자에 자식이 여러 개 있으면 세로로 배치되며, 이는 오른쪽에서 왼쪽으로의 순서를 나타냅니다. 위 예시에서 연산자 6(VHASH JOIN)의 왼쪽 자식은 연산자 5(EXCHANGE)이고 오른쪽 자식은 연산자 4(EXCHANGE)입니다.


### Fragment 필드 설명 {#fragment-field-descriptions}


| 이름               | 설명                                                  |
| :----------------- | :----------------------------------------------------------- |
| PARTITION          | 현재 Fragment의 데이터 분포를 표시합니다.       |
| HAS_COLO_PLAN_NODE | Fragment에 colocate 연산자가 포함되어 있는지 나타냅니다.        |
| Sink               | Fragment의 데이터 출력 방식입니다. 자세한 내용은 아래 표를 참조하세요. |



**Sink 방식**



| 이름               | 설명                                                  |
| :----------------- | :----------------------------------------------------------- |
| STREAM DATA SINK   | 데이터를 다음 Fragment로 출력합니다. 두 줄의 정보가 포함됩니다.<br />첫 번째 줄: 데이터를 전송할 다운스트림 EXCHANGE NODE입니다.<br />두 번째 줄: 데이터 분산 방식입니다. <br />  - UNPARTITIONED는 각 다운스트림 인스턴스가 전체 데이터 집합을 수신함을 의미합니다. 일반적으로 브로드캐스트 조인이나 전역 limit 또는 order by처럼 단일 인스턴스 로직이 필요한 경우에 사용됩니다.<br /> - RANDOM은 각 다운스트림 인스턴스가 중복 없이 무작위 데이터 부분집합을 수신함을 의미합니다.<br /> - HASH_PARTITIONED는 나열된 슬롯을 키로 해싱하여 데이터 샤드를 동일한 다운스트림 인스턴스로 전송합니다. 주로 파티션 해시 조인의 업스트림이나 두 단계 집계의 두 번째 단계에서 사용됩니다. |
| RESULT SINK        | 결과 데이터를 FE로 전송합니다. 첫 번째 줄은 데이터 전송에 사용되는 프로토콜을 나타내며, 현재 MySQL 및 arrow 프로토콜을 지원합니다. |
| OLAP TABLE SINK    | 데이터를 OLAP 테이블에 씁니다.                                |
| MultiCastDataSinks | 여러 STREAM DATA SINK를 포함하는 멀티캐스트 연산자입니다. 각 STREAM DATA SINK는 전체 데이터 집합을 해당 다운스트림으로 전송합니다. |



### 튜플 정보 설명 {#tuple-information-description}

VERBOSE 모드를 사용하면 튜플 정보가 출력됩니다. 튜플 정보는 데이터 행 내의 SLOT 세부 정보를 설명하며, SLOT 유형, null 허용 여부 등을 포함합니다.

출력에는 여러 TupleDescriptor가 포함되며, 각 TupleDescriptor는 여러 SlotDescriptor를 포함합니다. 아래는 예시입니다.

```sql
Tuples:
TupleDescriptor{id=0, tbl=t1}
  SlotDescriptor{id=0, col=c1, colUniqueId=0, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
  SlotDescriptor{id=2, col=c3, colUniqueId=2, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
```

#### TupleDescriptor {#tupledescriptor}



| 이름 | 설명                                                  |
| :--- | :----------------------------------------------------------- |
| id   | 튜플 디스크립터의 ID입니다.                               |
| tbl  | 튜플에 해당하는 테이블이며, 해당 사항이 없으면 `null`입니다.  |



#### SlotDescriptor {#slotdescriptor}

| 이름            | 설명                                                  |
| :-------------- | :----------------------------------------------------------- |
| id              | 슬롯 디스크립터의 ID입니다.                                |
| col             | 슬롯에 해당하는 컬럼이며, 해당 사항이 없으면 비어 있습니다. |
| colUniqueId     | 해당 컬럼의 고유 ID이며, 해당 사항이 없으면 -1입니다. |
| type            | 슬롯의 유형입니다.                                         |
| nullable        | 해당 데이터가 null일 수 있는지 나타냅니다.              |
| isAutoIncrement | 컬럼이 자동 증가하는지 나타냅니다.                  |
| subColPath      | 컬럼 내 하위 컬럼의 경로이며, 현재는 variant 유형에만 적용됩니다. |

### 연산자 설명 {#operator-descriptions}

#### 연산자 목록 {#operator-list}

| 이름                  | 설명                                                  |
| :-------------------- | :----------------------------------------------------------- |
| AGGREGATE             | 집계 연산자                                         |
| ANALYTIC              | 윈도우 함수 연산자                                     |
| ASSERT NUMBER OF ROWS | 다운스트림 출력 행 수를 검사하는 연산자       |
| EXCHANGE              | 데이터 교환 수신 연산자                              |
| MERGING-EXCHANGE      | 정렬 및 행 수 제한 기능을 갖춘 데이터 교환 수신 연산자 |
| HASH JOIN             | 해시 조인 연산자                                           |
| NESTED LOOP JOIN      | 중첩 루프 조인 연산자                                    |
| PartitionTopN         | 파티션 내 데이터 사전 필터링 연산자                  |
| REPEAT_NODE           | 데이터 복제 연산자                                    |
| DataGenScanNode       | 테이블 반환 함수 연산자                               |
| EsScanNode            | ES 테이블 스캔 연산자                                       |
| HIVE_SCAN_NODE        | Hive 테이블 스캔 연산자                                     |
| HUDI_SCAN_NODE        | Hudi 테이블 스캔 연산자                                     |
| ICEBERG_SCAN_NODE     | Iceberg 테이블 스캔 연산자                                  |
| PAIMON_SCAN_NODE      | Paimon 테이블 스캔 연산자                                   |
| JdbcScanNode          | Jdbc 테이블 스캔 연산자                                     |
| OlapScanNode          | Olap 테이블 스캔 연산자                                     |
| SELECT                | 필터링 연산자                                           |
| UNION                 | 집합의 합집합 연산자                                           |
| EXCEPT                | 집합의 차집합 연산자                                      |
| INTERSECT             | 집합의 교집합 연산자                                    |
| SORT                  | 정렬 연산자                                             |
| TOP-N                 | 정렬 후 상위 N개 결과를 반환하는 연산자                       |
| TABLE FUNCTION NODE   | 테이블 함수 연산자(lateral view)                       |



#### 공통 필드 {#common-fields}



| 이름                    | 설명                                                  |
| :---------------------- | :----------------------------------------------------------- |
| limit                   | 출력 행 수를 제한합니다.                             |
| offset                  | 출력 전에 건너뛸 행 수입니다.                     |
| conjuncts               | 현재 노드의 결과를 필터링합니다. projections 전에 실행됩니다. |
| projections             | 현재 연산자 이후의 프로젝션 연산입니다. conjuncts 이후에 실행됩니다. |
| project output tuple id | 프로젝션 이후의 출력 튜플입니다. 데이터 튜플 내 슬롯 배치는 tuple desc에서 확인할 수 있습니다. |
| cardinality             | 옵티마이저가 추정한 행 수입니다.                         |
| distribute expr lists   | 현재 노드의 자식 노드에 대한 원래 데이터 분산 방식입니다. |
| 표현식의 slot id    | slot id에 해당하는 슬롯은 verbose 모드의 튜플 목록에서 확인할 수 있습니다. 이 목록은 슬롯 유형과 null 허용 속성 등의 정보를 제공합니다. 표현식 뒤에 `[#5]`로 표시됩니다. |



#### AGGREGATE {#aggregate}



| 이름                | 설명                                                  |
| :------------------ | :----------------------------------------------------------- |
| (집계 단계) | 집계 단계는 두 용어로 표시됩니다.<br /> 첫 번째 용어는 update(로컬 집계) 또는 merge(전역 집계)입니다.<br /> 두 번째 용어는 현재 데이터가 직렬화된 상태인지(serialize), 최종 계산을 완료한 상태인지(finalize) 나타냅니다. |
| STREAMING           | 다단계 집계 절단 과정의 로컬 집계 연산자에만 이 플래그가 있습니다. 현재 집계 노드가 STREAMING 모드를 사용할 수 있음을 나타냅니다. 이 모드에서는 실제 계산 없이 입력 데이터를 다음 집계 단계로 직접 전달합니다. |
| output              | 현재 집계 연산자의 출력입니다. 모든 로컬 사전 집계 함수에는 partial 접두사가 붙습니다. |
| group by            | 집계에 사용하는 키입니다.                                      |



#### ANALYTIC {#analytic}



| 이름         | 설명                                                  |
| :----------- | :----------------------------------------------------------- |
| functions    | 현재 윈도우 함수의 이름입니다.                      |
| partition by | 윈도우 함수의 over 절에 있는 partition by 절에 해당합니다. 윈도우 지정 표현식입니다. |
| order by     | 윈도우 내 정렬 표현식과 정렬 순서입니다.               |
| window       | 윈도우 범위입니다.                                                 |



#### ASSERT NUMBER OF ROWS {#assert-number-of-rows}



| 이름 | 설명                                                |
| :--- | :--------------------------------------------------------- |
| EQ   | 다운스트림 출력은 이 행 수 제약 조건을 충족해야 합니다. |



#### HASH JOIN {#hash-join}



| 이름                  | 설명                                                  |
| :-------------------- | :----------------------------------------------------------- |
| join op               | 조인 유형입니다.                                                 |
| equal join conjunct   | 조인 조건의 동등 조건입니다.                     |
| other join predicates | 조인 조건 중 동등 조건을 제외한 조건입니다.         |
| mark join predicates  | 마크 조인에 사용되는 조건입니다.                                 |
| other predicates      | 조인 실행 이후의 필터링 조건입니다.                    |
| runtime filters       | 생성된 런타임 필터입니다.                                    |
| output slot ids       | 최종 출력 슬롯 목록입니다.                                   |
| hash output slot ids  | 해시 조인 실행 후 다른 조인 조건을 적용하기 전의 출력 슬롯 목록입니다. |
| isMarkJoin            | 마크 조인인지 나타냅니다.                          |


#### NESTED LOOP JOIN {#nested-loop-join}



| 이름                 | 설명                  |
| :------------------- | :--------------------------- |
| join op              | 조인 연산 유형입니다.       |
| join conjuncts       | 조인 조건입니다.       |
| mark join predicates | 마크 조인에 사용되는 조건입니다. |
| predicates           | 조인 이후의 필터 조건입니다. |
| runtime filters      | 생성된 런타임 필터입니다.    |
| output slot ids      | 최종 출력 슬롯 목록입니다.   |
| isMarkJoin           | 마크 조인인지 나타냅니다.    |



#### PartitionTopN {#partitiontopn}



| 이름                 | 설명                                                  |
| :------------------- | :----------------------------------------------------------- |
| functions            | 그룹별 필터 최적화가 적용되는 윈도우 함수입니다.        |
| has global limit     | 행 수에 대한 전역 제한이 있는지 나타냅니다.             |
| partition limit      | 각 파티션 내 행 수 제한입니다.            |
| partition topn phase | 현재 단계입니다. TWO_PHASE_GLOBAL_PTOPN은 파티션 키로 셔플한 이후의 전역 단계이고, TWO_PHASE_LOCAL_PTOPN은 파티션 키로 셔플하기 전의 로컬 단계입니다. |



#### REPEAT_NODE {#repeat_node}



| 이름   | 설명                                                  |
| :----- | :----------------------------------------------------------- |
| repeat | 각 행의 반복 횟수와 집계 컬럼에 해당하는 슬롯 ID입니다. |
| exprs  | 반복 이후 출력 데이터의 표현식 목록입니다.         |



#### DataGenScanNode {#datagenscannode}



| 이름                 | 설명         |
| :------------------- | :------------------ |
| table value function | 테이블 함수 이름입니다. |



#### EsScanNode {#esscannode}



| 이름              | 설명                    |
| :---------------- | :----------------------------- |
| SORT COLUMN       | 결과 정렬에 사용하는 컬럼입니다.    |
| LOCAL_PREDICATES  | Doris 내에서 실행되는 필터입니다.  |
| REMOTE_PREDICATES | ES 내에서 실행되는 필터입니다.     |
| ES index/type     | 쿼리에 사용하는 ES 인덱스와 유형입니다. |



#### HIVE_SCAN_NODE {#hive_scan_node}



| 이름          | 설명                                |
| :------------ | :----------------------------------------- |
| inputSplitNum | 스캔 분할 수입니다.                      |
| totalFileSize | 스캔하는 파일의 전체 크기입니다.              |
| scanRanges    | 스캔 분할 정보입니다.                 |
| partition     | 스캔하는 파티션 수입니다.         |
| backends      | 각 BE가 스캔할 데이터의 세부 정보입니다.     |
| cardinality   | 옵티마이저가 추정한 행 수입니다.      |
| avgRowSize    | 옵티마이저가 추정한 평균 행 크기입니다.    |
| numNodes      | 현재 연산자가 사용하는 BE 수입니다. |
| pushdown agg  | 스캔으로 푸시다운된 집계입니다.           |



#### HUDI_SCAN_NODE {#hudi_scan_node}



| 이름                 | 설명                                |
| :------------------- | :----------------------------------------- |
| inputSplitNum        | 스캔 분할 수입니다.                      |
| totalFileSize        | 스캔하는 파일의 전체 크기입니다.              |
| scanRanges           | 스캔 분할 정보입니다.                 |
| partition            | 스캔하는 파티션 수입니다.         |
| backends             | 각 BE가 스캔할 데이터의 세부 정보입니다.     |
| cardinality          | 옵티마이저가 추정한 행 수입니다.      |
| avgRowSize           | 옵티마이저가 추정한 평균 행 크기입니다.    |
| numNodes             | 현재 연산자가 사용하는 BE 수입니다. |
| pushdown agg         | 스캔으로 푸시다운된 집계입니다.           |
| hudiNativeReadSplits | 네이티브 방식으로 읽는 분할 수입니다.  |



#### ICEBERG_SCAN_NODE {#iceberg_scan_node}



| 이름                     | 설명                                |
| :----------------------- | :----------------------------------------- |
| inputSplitNum            | 스캔 분할 수입니다.                      |
| totalFileSize            | 스캔하는 파일의 전체 크기입니다.              |
| scanRanges               | 스캔 분할 정보입니다.                 |
| partition                | 스캔하는 파티션 수입니다.         |
| backends                 | 각 BE가 스캔할 데이터의 세부 정보입니다.     |
| cardinality              | 옵티마이저가 추정한 행 수입니다.      |
| avgRowSize               | 옵티마이저가 추정한 평균 행 크기입니다.    |
| numNodes                 | 현재 연산자가 사용하는 BE 수입니다. |
| pushdown agg             | 스캔으로 푸시다운된 집계입니다.           |
| icebergPredicatePushdown | iceberg API로 푸시다운된 필터입니다.         |



#### PAIMON_SCAN_NODE {#paimon_scan_node}

| 이름                   | 설명                                |
| :--------------------- | :----------------------------------------- |
| inputSplitNum          | 스캔 분할 수입니다.                      |
| totalFileSize          | 스캔하는 파일의 전체 크기입니다.              |
| scanRanges             | 스캔 분할 정보입니다.                 |
| partition              | 스캔하는 파티션 수입니다.         |
| backends               | 각 BE가 스캔할 데이터의 세부 정보입니다.     |
| cardinality            | 옵티마이저가 추정한 행 수입니다.      |
| avgRowSize             | 옵티마이저가 추정한 평균 행 크기입니다.    |
| numNodes               | 현재 연산자가 사용하는 BE 수입니다. |
| pushdown agg           | 스캔으로 푸시다운된 집계입니다.           |
| paimonNativeReadSplits | 네이티브 방식으로 읽는 분할 수입니다.  |


#### NESTED LOOP JOIN {#nested-loop-join-1}



| 이름                 | 설명                  |
| :------------------- | :--------------------------- |
| join op              | 조인 연산 유형입니다.       |
| join conjuncts       | 조인 조건입니다.       |
| mark join predicates | 마크 조인에 사용되는 조건입니다. |
| predicates           | 조인 이후의 필터 조건입니다. |
| runtime filters      | 생성된 런타임 필터입니다.    |
| output slot ids      | 최종 출력 슬롯 목록입니다.   |
| isMarkJoin           | 마크 조인인지 나타냅니다.    |



#### PartitionTopN {#partitiontopn-1}



| 이름                 | 설명                                                  |
| :------------------- | :----------------------------------------------------------- |
| functions            | 그룹별 필터 최적화가 적용되는 윈도우 함수입니다.        |
| has global limit     | 행 수에 대한 전역 제한이 있는지 나타냅니다.             |
| partition limit      | 각 파티션 내 행 수 제한입니다.            |
| partition topn phase | 현재 단계입니다. TWO_PHASE_GLOBAL_PTOPN은 파티션 키로 셔플한 이후의 전역 단계이고, TWO_PHASE_LOCAL_PTOPN은 파티션 키로 셔플하기 전의 로컬 단계입니다. |



#### REPEAT_NODE {#repeat_node-1}



| 이름   | 설명                                                  |
| :----- | :----------------------------------------------------------- |
| repeat | 각 행의 반복 횟수와 집계 컬럼에 해당하는 슬롯 ID입니다. |
| exprs  | 반복 이후 출력 데이터의 표현식 목록입니다.         |



#### DataGenScanNode {#datagenscannode-1}



| 이름                 | 설명         |
| :------------------- | :------------------ |
| table value function | 테이블 함수 이름입니다. |



#### EsScanNode {#esscannode-1}



| 이름              | 설명                    |
| :---------------- | :----------------------------- |
| SORT COLUMN       | 결과 정렬에 사용하는 컬럼입니다.    |
| LOCAL_PREDICATES  | Doris 내에서 실행되는 필터입니다.  |
| REMOTE_PREDICATES | ES 내에서 실행되는 필터입니다.     |
| ES index/type     | 쿼리에 사용하는 ES 인덱스와 유형입니다. |



#### HIVE_SCAN_NODE {#hive_scan_node-1}



| 이름          | 설명                                |
| :------------ | :----------------------------------------- |
| inputSplitNum | 스캔 분할 수입니다.                      |
| totalFileSize | 스캔하는 파일의 전체 크기입니다.              |
| scanRanges    | 스캔 분할 정보입니다.                 |
| partition     | 스캔하는 파티션 수입니다.         |
| backends      | 각 BE가 스캔할 데이터의 세부 정보입니다.     |
| cardinality   | 옵티마이저가 추정한 행 수입니다.      |
| avgRowSize    | 옵티마이저가 추정한 평균 행 크기입니다.    |
| numNodes      | 현재 연산자가 사용하는 BE 수입니다. |
| pushdown agg  | 스캔으로 푸시다운된 집계입니다.           |



#### HUDI_SCAN_NODE {#hudi_scan_node-1}



| 이름                 | 설명                                |
| :------------------- | :----------------------------------------- |
| inputSplitNum        | 스캔 분할 수입니다.                      |
| totalFileSize        | 스캔하는 파일의 전체 크기입니다.              |
| scanRanges           | 스캔 분할 정보입니다.                 |
| partition            | 스캔하는 파티션 수입니다.         |
| backends             | 각 BE가 스캔할 데이터의 세부 정보입니다.     |
| cardinality          | 옵티마이저가 추정한 행 수입니다.      |
| avgRowSize           | 옵티마이저가 추정한 평균 행 크기입니다.    |
| numNodes             | 현재 연산자가 사용하는 BE 수입니다. |
| pushdown agg         | 스캔으로 푸시다운된 집계입니다.           |
| hudiNativeReadSplits | 네이티브 방식으로 읽는 분할 수입니다.  |



#### ICEBERG_SCAN_NODE {#iceberg_scan_node-1}



| 이름                     | 설명                                |
| :----------------------- | :----------------------------------------- |
| inputSplitNum            | 스캔 분할 수입니다.                      |
| totalFileSize            | 스캔하는 파일의 전체 크기입니다.              |
| scanRanges               | 스캔 분할 정보입니다.                 |
| partition                | 스캔하는 파티션 수입니다.         |
| backends                 | 각 BE가 스캔할 데이터의 세부 정보입니다.     |
| cardinality              | 옵티마이저가 추정한 행 수입니다.      |
| avgRowSize               | 옵티마이저가 추정한 평균 행 크기입니다.    |
| numNodes                 | 현재 연산자가 사용하는 BE 수입니다. |
| pushdown agg             | 스캔으로 푸시다운된 집계입니다.           |
| icebergPredicatePushdown | iceberg API로 푸시다운된 필터입니다.         |



#### PAIMON_SCAN_NODE {#paimon_scan_node-1}



| 이름                   | 설명                                |
| :--------------------- | :----------------------------------------- |
| inputSplitNum          | 스캔 분할 수입니다.                      |
| totalFileSize          | 스캔하는 파일의 전체 크기입니다.              |
| scanRanges             | 스캔 분할 정보입니다.                 |
| partition              | 스캔하는 파티션 수입니다.         |
| backends               | 각 BE가 스캔할 데이터의 세부 정보입니다.     |
| cardinality            | 옵티마이저가 추정한 행 수입니다.      |
| avgRowSize             | 옵티마이저가 추정한 평균 행 크기입니다.    |
| numNodes               | 현재 연산자가 사용하는 BE 수입니다. |
| pushdown agg           | 스캔으로 푸시다운된 집계입니다.           |
| paimonNativeReadSplits | 네이티브 방식으로 읽는 분할 수입니다.  |

#### JdbcScanNode {#jdbcscannode}



| 이름  | 설명                  |
| :---- | :--------------------------- |
| TABLE | 스캔할 JDBC 측 테이블 이름입니다. |
| QUERY | 스캔에 사용하는 쿼리입니다.      |



#### OlapScanNode {#olapscannode}



| 이름           | 설명                                                  |
| :------------- | :----------------------------------------------------------- |
| TABLE          | 스캔하는 테이블입니다. 괄호 안에는 쿼리에 활용된 동기식 구체화된 뷰의 이름이 표시됩니다. |
| SORT INFO      | SCAN 사전 정렬이 계획된 경우 표시됩니다. SCAN 출력의 부분 사전 정렬 및 사전 절단을 나타냅니다. |
| SORT LIMIT     | SCAN 사전 정렬이 계획된 경우 표시됩니다. 사전 절단 시 유지할 길이를 나타냅니다. |
| TOPN OPT       | TOP-N Runtime Filter가 계획된 경우 표시됩니다.                |
| PREAGGREGATION | 사전 집계가 활성화되어 있는지 나타냅니다. MOR 집계 모델 및 기본 키 모델과 관련이 있습니다. ON은 스토리지 계층의 데이터가 추가 집계 없이 상위 계층의 요구 사항을 충족함을 의미합니다. OFF는 추가 집계가 수행됨을 의미합니다. |
| partitions     | 현재 스캔하는 파티션 수, 전체 파티션 수, 스캔하는 파티션 이름 목록입니다. |
| tablets        | 스캔하는 태블릿 수와 테이블의 전체 태블릿 수입니다.    |
| tabletList     | 스캔하는 태블릿 목록입니다.                                     |
| avgRowSize     | 옵티마이저가 추정한 행 크기입니다.                         |
| numNodes       | 현재 스캔에 할당된 BE 수입니다.                  |
| pushAggOp      | zonemap 메타데이터를 읽어 결과를 반환합니다. MIN, MAX, COUNT 집계 정보를 지원합니다. |



#### UNION {#union}



| 이름           | 설명                                                  |
| :------------- | :----------------------------------------------------------- |
| constant exprs | 출력에 포함할 상수 표현식 목록입니다.   |
| child exprs    | 이 표현식 목록을 통해 자식 노드의 출력에 프로젝션을 적용하고, 그 결과를 집합 연산자의 입력으로 사용합니다. |



#### EXCEPT {#except}



| 이름        | 설명                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | 이 표현식 목록을 통해 자식 노드의 출력에 프로젝션을 적용하고, 그 결과를 집합 연산자의 입력으로 사용합니다. |



#### INTERSECT {#intersect}



| 이름        | 설명                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | 이 표현식 목록을 통해 자식 노드의 출력에 프로젝션을 적용하고, 그 결과를 집합 연산자의 입력으로 사용합니다. |



#### SORT {#sort}



| 이름     | 설명                          |
| :------- | :----------------------------------- |
| order by | 정렬 키와 구체적인 정렬 순서입니다. |



#### TABLE FUNCTION NODE {#table-function-node}



| 이름                  | 설명                                               |
| :-------------------- | :-------------------------------------------------------- |
| table function        | 사용하는 테이블 함수의 이름입니다.                          |
| lateral view tuple id | 새로 생성된 컬럼에 해당하는 튜플 ID입니다.        |
| output slot id        | 컬럼 가지치기 이후 출력되는 컬럼의 슬롯 ID 목록입니다. |



#### TOP-N {#top-n}



| 이름          | 설명                                            |
| :------------ | :----------------------------------------------------- |
| order by      | 정렬 키와 구체적인 정렬 순서입니다.                   |
| TOPN OPT      | TOP-N 런타임 필터 최적화가 적용된 경우 표시됩니다. |
| OPT TWO PHASE | TOP-N 지연 구체화가 적용된 경우 표시됩니다.    |

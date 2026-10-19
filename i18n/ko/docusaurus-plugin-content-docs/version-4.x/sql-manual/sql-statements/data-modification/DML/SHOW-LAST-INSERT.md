---
{
    "title": "SHOW LAST INSERT",
    "language": "ko",
    "description": "현재 세션 연결에서 가장 최근에 수행한 insert 작업의 결과를 확인하는 데 사용하는 구문입니다"
}
---

## 설명 {#description}

현재 세션 연결에서 가장 최근에 수행한 insert 작업의 결과를 확인하는 데 사용하는 구문입니다

## 구문 {#syntax}

```sql
SHOW LAST INSERT
```

반환 결과 예시:

```
     TransactionId: 64067
             Label: insert_ba8f33aea9544866-8ed77e2844d0cc9b
          Database: default_cluster:db1
             Table: t1
TransactionStatus: VISIBLE
        LoadedRows: 2
      FilteredRows: 0
```

## 반환 값 {#return-value}

* TransactionId: 트랜잭션 ID
* Label: insert 작업에 해당하는 레이블
* Database: insert 작업에 해당하는 데이터베이스
* Table: insert 작업에 해당하는 테이블
* TransactionStatus: 트랜잭션 상태
   * PREPARE: 준비 단계
   * PRECOMMITTED: 사전 커밋 단계
   * COMMITTED: 트랜잭션이 성공했지만 데이터가 아직 보이지 않는 상태
   * VISIBLE: 트랜잭션이 성공하고 데이터가 보이는 상태
   * ABORTED: 트랜잭션 실패
* LoadedRows: 데이터 적재 행 수
* FilteredRows: 필터링된 행 수

## 예제 {#example}

## 키워드 {#keywords}

    SHOW, LAST, INSERT

## 모범 사례 {#best-practice}

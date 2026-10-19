---
{
    "title": "BEGIN",
    "language": "ko",
    "description": "사용자는 Label을 지정할 수 있습니다. 지정하지 않으면 시스템이 Label을 자동으로 생성합니다."
}
---

## 설명 {#description}

사용자는 Label을 지정할 수 있습니다. 지정하지 않으면 시스템이 Label을 자동으로 생성합니다.

## 구문 {#syntax}

```sql
BEGIN [ WITH LABEL <label> ]
```

## 선택적 매개변수 {#optional-parameter}

`[ WITH LABEL <label> ]`

> 트랜잭션에 연결된 Label을 명시적으로 지정합니다. 지정하지 않으면 시스템이 [label](../../../data-operate/transaction)을 자동으로 생성합니다.

## 참고 사항 {#notes}

- 명시적 트랜잭션을 시작한 후 커밋하거나 롤백하지 않은 상태에서 BEGIN 명령을 다시 실행해도 효과가 없습니다.

## 예제 {#examples}

시스템이 생성한 Label로 명시적 트랜잭션 시작

```sql
mysql> BEGIN;
{'label':'txn_insert_624a0e16ef4c43d4-9814c7fa3e83a705', 'status':'PREPARE', 'txnId':''}
```

지정한 Label로 명시적 트랜잭션 시작

```sql
mysql> BEGIN WITH LABEL load_1;
{'label':'load_1', 'status':'PREPARE', 'txnId':''}
```

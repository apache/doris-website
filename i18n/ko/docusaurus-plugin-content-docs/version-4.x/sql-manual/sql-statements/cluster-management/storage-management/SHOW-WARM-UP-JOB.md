---
{
    "title": "SHOW WARM UP JOB",
    "language": "ko",
    "description": "Doris의 워밍업 작업을 표시하는 명령입니다."
}
---

## 설명 {#description}

Doris의 워밍업 작업을 표시하는 명령입니다.

## 구문 {#syntax}

```sql
   SHOW WARM UP JOB [ WHERE id = 'id' ] ;
```

## 매개변수 {#parameters}


| 매개변수 이름                  | 설명                                                         |
|---------------------------|--------------------------------------------------------------|
| id                        | 워밍업 작업의 ID                                                |
## 예제 {#examples}

1. 모든 워밍업 작업 조회:

 ```sql
    SHOW WARM UP JOB;
```

2. ID가 13418인 워밍업 작업 조회:

```sql
    SHOW WARM UP JOB WHERE id = 13418;
```

## 관련 명령 {#related-commands}

 - [WARMUP COMPUTE GROUP](./WARM-UP.md)

---
{
    "title": "USE COMPUTE GROUP",
    "language": "ko",
    "description": "스토리지와 컴퓨트가 분리된 버전에서 사용할 컴퓨트 클러스터를 지정합니다."
}
---

## 설명 {#description}

스토리지와 컴퓨트가 분리된 버전에서 사용할 컴퓨트 클러스터를 지정합니다.

## 구문 {#syntax}


```sql
USE { [ <catalog_name>. ]<database_name>[ @<compute_group_name> ] | @<compute_group_name> }
```

## 필수 매개변수 {#required-parameters}

`<compute_group_name>`： 컴퓨트 클러스터의 이름입니다.

## 반환 값 {#return-value}

컴퓨트 클러스터 전환에 성공하면 "Database changed"를 반환하고, 전환에 실패하면 해당 오류 메시지를 반환합니다.

## 예제 {#examples}

1. 사용할 컴퓨트 클러스터를 `compute_cluster`로 지정합니다:

    ```sql
    use @compute_cluster;
    Database changed
    ```

2. 사용할 데이터베이스를 `mysql`로, 컴퓨트 클러스터를 `compute_cluster`로 함께 지정합니다:

    ```sql
    use mysql@compute_cluster
    Database changed
    ```

## 권한 제어 {#permission-control}

이 SQL 명령을 성공적으로 실행하려면 컴퓨트 그룹에 대한 USAGE_PRIV 권한이 있어야 합니다. 권한 문서를 참조하세요.

| 권한       | 객체          | 설명                                  |
| :--------- | :------------ | :------------------------------------ |
| USAGE_PRIV | 컴퓨트 그룹   | 컴퓨트 클러스터를 사용할 수 있는 권한 |

사용자가 컴퓨트 그룹 권한 없이 컴퓨트 그룹을 지정하려고 하면 오류가 발생합니다. 예를 들어, `test`는 컴퓨트 그룹 권한이 없는 일반 사용자입니다:

```sql
mysql -utest -h175.40.1.1 -P9030

use @compute_cluster;
ERROR 5042 (42000): errCode = 2, detailMessage = USAGE denied to user test'@'127.0.0.1' for compute group 'compute_cluster'
```


## 참고 사항 {#notes}

1. 데이터베이스 이름이나 컴퓨트 그룹 이름이 예약어인 경우 다음과 같이 백틱으로 감싸야 합니다:

    ```sql
    use @`create`
    ```

2. 컴퓨트 그룹이 존재하지 않으면 오류 메시지를 반환합니다:

    ```sql
    mysql> use @compute_group_not_exist;
    ERROR 5098 (42000): errCode = 2, detailMessage = Compute Group compute_group_not_exist not exist
    ```

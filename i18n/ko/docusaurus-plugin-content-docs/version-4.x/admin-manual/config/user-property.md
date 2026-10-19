---
{
    "title": "사용자 속성",
    "language": "ko",
    "description": "이 문서는 사용자 수준의 구성 항목을 소개합니다."
}
---

# 사용자 구성 항목 {#user-configuration-item}

이 문서는 사용자 수준의 구성 항목을 소개합니다. 사용자 수준의 설정은 개별 사용자에게 적용됩니다. 각 사용자는 자신의 사용자 속성을 설정할 수 있으며, 서로 영향을 주지 않습니다.

## 구성 항목 조회 {#view-configuration-items}

FE가 시작된 후 MySQL 클라이언트에서 다음 명령을 사용하여 사용자 구성 항목을 조회합니다.

`SHOW PROPERTY [FOR user] [LIKE key pattern]`

자세한 구문은 `help show property;` 명령으로 확인할 수 있습니다.

## 구성 항목 설정 {#set-configuration-items}

FE가 시작된 후 MySQL 클라이언트에서 다음 명령을 사용하여 사용자 구성 항목을 수정합니다.

`SET PROPERTY [FOR'user'] 'key' = 'value' [,'key' ='value']`

자세한 구문은 `help set property;` 명령으로 확인할 수 있습니다.

사용자 수준의 구성 항목은 지정된 사용자에게만 적용되며, 다른 사용자의 설정에는 영향을 주지 않습니다.

## 사용 예 {#application-examples}

1. Billie 사용자의 max_user_connections 수정

    `SHOW PROPERTY FOR 'Billie' LIKE '%max_user_connections%';` 명령을 사용하여 Billie 사용자의 현재 최대 연결 수가 100임을 확인합니다.

    `SET PROPERTY FOR 'Billie' 'max_user_connections' = '200';` 명령을 사용하여 Billie 사용자의 현재 최대 연결 수를 200으로 변경합니다.

## 구성 항목 목록 {#configuration-item-list}

### max_user_connections {#max_user_connections}

    The maximum number of user connections, the default value is 100 In general, this parameter does not need to be changed unless the number of concurrent queries exceeds the default value.

### max_query_instances {#max_query_instances}

    The maximum number of instances that the user can use at a certain point in time, The default value is -1, negative number means use default_max_query_instances config.

### resource {#resource}

### quota {#quota}

### default_load_cluster {#default_load_cluster}

### load_cluster {#load_cluster}

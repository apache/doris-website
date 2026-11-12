---
{
    "title": "workload_policy",
    "language": "en",
    "description": "Records the configuration information of Workload Policies."
}
---

## Overview

Records the configuration information of Workload Policies.

## Database


`information_schema`


## Table Information

| Column Name    | Type         | Description                                    |
| -------------- | ------------ | ---------------------------------------------- |
| ID             | bigint       | ID of the Workload Policy                      |
| NAME           | varchar(256) | Name of the Workload Policy                    |
| CONDITION      | text         | Condition of the Workload Policy               |
| ACTION         | text         | Action of the Workload Policy                  |
| PRIORITY       | int          | Priority of the Workload Policy                |
| ENABLED        | boolean      | Whether the Workload Policy is enabled         |
| VERSION        | int          | Version of the Workload Policy                 |
| WORKLOAD_GROUP | text         | Name of the Workload Group bound to the Policy |
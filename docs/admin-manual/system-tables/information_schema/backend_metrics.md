---
{
    "title": "backend_metrics",
    "language": "en"
}
---

## Overview

Used to view metrics of Backend nodes

## Database


`information_schema`


## Table Information

| Column Name       | Type         | Description                                                  |
| ----------------- | ------------ | ------------------------------------------------------------ |
| BE_ID             | varchar(256) | The ID of the Backend instance                               |
| BE_IP             | varchar(256) | The IP address of the Backend instance                       |
| METRIC_NAME       | varchar(256) | The name of the metric                                       |
| METRIC_TYPE       | varchar(256) | The type of the metric                                       |
| METRIC_VALUE      | varchar(256) | The value of the metric                                      |
| TAG               | varchar(256) | The tag of the metric                                        |

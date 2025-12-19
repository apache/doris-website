---
{
    "title": "frontend_metrics",
    "language": "en"
}
---

## Overview

Used to view metrics of Frontend nodes

## Database


`information_schema`


## Table Information

| Column Name       | Type         | Description                                                  |
| ----------------- | ------------ | ------------------------------------------------------------ |
| FE                | varchar(256) | The IP address of the Frontend instance                      |
| METRIC_NAME       | varchar(256) | The name of the metric                                       |
| METRIC_TYPE       | varchar(256) | The type of the metric                                       |
| METRIC_VALUE      | varchar(256) | The value of the metric                                      |
| TAG               | varchar(256) | The tag of the metric                                        |

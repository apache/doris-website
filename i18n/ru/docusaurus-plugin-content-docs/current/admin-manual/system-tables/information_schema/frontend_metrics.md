---
{
    "title": "frontend_metrics",
    "language": "ru"
}
---

## Обзор {#overview}

Используется для просмотра метрик узлов Frontend

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца       | Тип          | Описание                                                     |
| ----------------- | ------------ | ------------------------------------------------------------ |
| FE                | varchar(256) | IP-адрес экземпляра Frontend                                  |
| METRIC_NAME       | varchar(256) | Название метрики                                             |
| METRIC_TYPE       | varchar(256) | Тип метрики                                                  |
| METRIC_VALUE      | varchar(256) | Значение метрики                                             |
| TAG               | varchar(256) | Тег метрики                                                  |

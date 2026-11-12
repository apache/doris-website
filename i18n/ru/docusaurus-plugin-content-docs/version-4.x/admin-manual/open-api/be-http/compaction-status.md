---
{
    "title": "Просмотр состояния компактации",
    "language": "ru",
    "description": "Позволяет просмотреть общее состояние компактации узла BE и состояние компактации указанного tablet."
}
---

# Просмотр состояния компактации {#view-compaction-status}

## Запрос {#request}

`GET /api/compaction/run_status`
`GET /api/compaction/show?tablet_id={int}`

## Описание {#description}

Позволяет просмотреть общее состояние компактации узла BE и состояние компактации указанного tablet.

## Параметры запроса {#query-parameters}

* `tablet_id`
    Идентификатор tablet

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

### Общее состояние компактации узла {#the-overall-compaction-status-of-the-node}

```
{
  "CumulativeCompaction": {
         "/home/disk1" : [10001, 10002],
         "/home/disk2" : [10003]
  },
  "BaseCompaction": {
         "/home/disk1" : [10001, 10002],
         "/home/disk2" : [10003]
  }
}
```

Эта структура содержит идентификаторы tablet, для которых выполняются задачи компактации в определённом каталоге данных, и указывает тип компактации.

### Состояние компактации указанного tablet {#specify-the-compaction-status-of-the-tablet}

```
{
    "cumulative policy type": "SIZE_BASED",
    "cumulative point": 50,
    "last cumulative failure time": "2019-12-16 18:13:43.224",
    "last base failure time": "2019-12-16 18:13:23.320",
    "last cumu success time": ,
    "last base success time": "2019-12-16 18:11:50.780",
    "rowsets": [
        "[0-48] 10 DATA OVERLAPPING 574.00 MB",
        "[49-49] 2 DATA OVERLAPPING 574.00 B",
        "[50-50] 0 DELETE NONOVERLAPPING 574.00 B",
        "[51-51] 5 DATA OVERLAPPING 574.00 B"
    ],
    "missing_rowsets": [],
    "stale version path": [
        {
            "path id": "2",
            "last create time": "2019-12-16 18:11:15.110 +0800",
            "path list": "2-> [0-24] -> [25-48]"
        }, 
        {
            "path id": "1",
            "last create time": "2019-12-16 18:13:15.110 +0800",
            "path list": "1-> [25-40] -> [40-48]"
        }
    ]
}
```

Пояснения к результатам:

* cumulative policy type: Тип политики cumulative compaction, используемой текущим tablet.
* cumulative point: Граница версий между base compaction и cumulative compaction. Версии до этой границы, не включая её, обрабатываются с помощью base compaction. Версии начиная с этой границы включительно обрабатываются с помощью cumulative compaction.
* last cumulative failure time: Время последнего сбоя cumulative compaction. По умолчанию через 10 минут выполняется повторная попытка cumulative compaction для этого tablet.
* last base failure time: Время последнего сбоя base compaction. По умолчанию через 10 минут выполняется повторная попытка base compaction для этого tablet.
* rowsets: Текущая коллекция rowset этого tablet. [0-48] обозначает rowset с версией 0-48. Второе число — количество сегментов в rowset. DELETE обозначает версию удаления. OVERLAPPING и NONOVERLAPPING указывают, перекрываются ли данные между сегментами.
* missing_rowset: Отсутствующие rowset.
* stale version path: Путь объединения версий коллекции rowset, уже объединённых в этом tablet. Это массив, каждый элемент которого представляет отдельный путь объединения. Каждый элемент содержит три атрибута: path id указывает идентификатор пути версий, а last create time — время создания самого последнего rowset на этом пути. По умолчанию все rowset на этом пути удаляются через полчаса после времени, указанного в last create time.

## Примеры {#examples}

```
curl http://192.168.10.24:8040/api/compaction/show?tablet_id=10015
```

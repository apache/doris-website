---
{
    "title": "Локальная отладка tablet",
    "language": "ru",
    "description": "При эксплуатации Doris по разным причинам могут возникать различные ошибки. Например, несогласованность реплик,"
}
---

# Локальная отладка tablet {#tablet-local-debug}

При эксплуатации Doris по разным причинам могут возникать различные ошибки. Например, несогласованность реплик, расхождения данных между версиями и т. д.

В таком случае необходимо скопировать данные реплики tablet из рабочей среды в локальную, чтобы воспроизвести проблему и затем определить её причину.

## 1. Получение информации о tablet {#1-get-information-about-the-tablet}

Идентификатор tablet можно определить по журналу BE, а затем получить информацию следующей командой (предположим, что идентификатор tablet равен 10020).

Получите такие сведения, как DbId/TableId/PartitionId, определяющие расположение tablet.

```
mysql> show tablet 10020\G
*************************** 1. row ***************************
       DbName: default_cluster:db1
    TableName: tbl1
PartitionName: tbl1
    IndexName: tbl1
         DbId: 10004
      TableId: 10016
  PartitionId: 10015
      IndexId: 10017
       IsSync: true
        Order: 1
    DetailCmd: SHOW PROC '/dbs/10004/10016/partitions/10015/10017/10020';
```

Выполните `DetailCmd` из предыдущего шага, чтобы получить такие сведения, как BackendId/SchemaHash.

```
mysql>  SHOW PROC '/dbs/10004/10016/partitions/10015/10017/10020'\G
*************************** 1. row ***************************
        ReplicaId: 10021
        BackendId: 10003
          Version: 3
LstSuccessVersion: 3
 LstFailedVersion: -1
    LstFailedTime: NULL
       SchemaHash: 785778507
    LocalDataSize: 780
   RemoteDataSize: 0
         RowCount: 2
            State: NORMAL
            IsBad: false
     VersionCount: 3
         PathHash: 7390150550643804973
          MetaUrl: http://192.168.10.1:8040/api/meta/header/10020
 CompactionStatus: http://192.168.10.1:8040/api/compaction/show?tablet_id=10020
```

Создайте снимок tablet и получите оператор создания таблицы.

```
mysql> admin copy tablet 10020 properties("backend_id" = "10003", "version" = "2")\G
*************************** 1. row ***************************
         TabletId: 10020
        BackendId: 10003
               Ip: 192.168.10.1
             Path: /path/to/be/storage/snapshot/20220830101353.2.3600
ExpirationMinutes: 60
  CreateTableStmt: CREATE TABLE `tbl1` (
  `k1` int(11) NULL,
  `k2` int(11) NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`, `k2`)
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES (
"replication_num" = "1",
"version_info" = "2"
);
```

Команда `admin copy tablet` позволяет создать файл снимка указанного tablet для соответствующей реплики и версии. Файлы снимка хранятся в каталоге `Path` на узле BE, указанном в поле `Ip`.

Внутри этого каталога находится каталог с именем, совпадающим с идентификатором tablet. Упакуйте его целиком для дальнейшего использования. (Обратите внимание, что каталог хранится не более 60 минут, после чего автоматически удаляется).

```
cd /path/to/be/storage/snapshot/20220830101353.2.3600
tar czf 10020.tar.gz 10020/
```

Команда также создаёт оператор создания таблицы, соответствующий tablet. Обратите внимание, что этот оператор отличается от исходного оператора создания таблицы: число бакетов и реплик в нём равно 1, а также задано поле `versionInfo`. Этот оператор понадобится позже при локальной загрузке tablet.

Теперь у нас есть вся необходимая информация:

1. Архив с данными tablet, например 10020.tar.gz.
2. Оператор создания таблицы.

## 2. Локальная загрузка tablet {#2-load-tablet-locally}

1. Подготовка локальной среды отладки

     Разверните локально одноузловой кластер Doris (1FE, 1BE) той же версии, что и рабочий кластер. Если в рабочей среде развёрнута версия DORIS-1.1.1, в локальной среде также необходимо развернуть DORIS-1.1.1.

2. Создание таблицы

     Создайте таблицу в локальной среде с помощью оператора создания таблицы, полученного на предыдущем шаге.

3. Получение информации о tablet созданной таблицы

     Поскольку число бакетов и реплик созданной таблицы равно 1, у неё будет только один tablet с одной репликой:
    
    ```
    mysql> show tablets from tbl1\G
    *************************** 1. row ***************************
                   TabletId: 10017
                  ReplicaId: 10018
                  BackendId: 10003
                 SchemaHash: 44622287
                    Version: 1
          LstSuccessVersion: 1
           LstFailedVersion: -1
              LstFailedTime: NULL
              LocalDataSize: 0
             RemoteDataSize: 0
                   RowCount: 0
                      State: NORMAL
    LstConsistencyCheckTime: NULL
               CheckVersion: -1
               VersionCount: -1
                   PathHash: 7390150550643804973
                    MetaUrl: http://192.168.10.1:8040/api/meta/header/10017
           CompactionStatus: http://192.168.10.1:8040/api/compaction/show?tablet_id=10017
    ```
    
    ```
    mysql> show tablet 10017\G
    *************************** 1. row ***************************
           DbName: default_cluster:db1
        TableName: tbl1
    PartitionName: tbl1
        IndexName: tbl1
             DbId: 10004
          TableId: 10015
      PartitionId: 10014
          IndexId: 10016
           IsSync: true
            Order: 0
        DetailCmd: SHOW PROC '/dbs/10004/10015/partitions/10014/10016/10017';
    ```
    
    Запишите следующие сведения:
    
    * TableId
    * PartitionId
    * TabletId
    * SchemaHash

    Также необходимо перейти в каталог данных узла BE в среде отладки и определить идентификатор шарда, в котором находится новый tablet:
    
    ```
    cd /path/to/storage/data/*/10017 && pwd
    ```
    
    Эта команда перейдёт в каталог, в котором находится tablet 10017, и выведет путь. Вы увидите путь примерно следующего вида:
    
    ```
    /path/to/storage/data/0/10017
    ```
    
    Здесь `0` обозначает идентификатор шарда.
        
4. Изменение данных tablet

    Распакуйте архив с данными tablet, полученный на первом шаге. Откройте в редакторе файл 10017.hdr.json и замените значения следующих полей на полученные на предыдущем шаге:
    
    ```
    "table_id":10015
    "partition_id":10014
    "tablet_id":10017
    "schema_hash":44622287
    "shard_id":0
    ```

5. Загрузка tablet

     Сначала остановите процесс BE в среде отладки (./bin/stop_be.sh). Затем скопируйте все файлы .dat, находящиеся в том же каталоге, что и файл 10017.hdr.json, в каталог `/path/to/storage/data/0/10017/44622287`. Это каталог tablet в среде отладки, расположение которого мы определили на шаге 3. Компоненты пути `10017/44622287` обозначают идентификатор tablet и хеш схемы соответственно.
    
     Удалите исходные метаданные tablet с помощью инструмента `meta_tool`. Инструмент находится в каталоге `be/lib`.
    
    ```
    ./lib/meta_tool --root_path=/path/to/storage --operation=delete_meta --tablet_id=10017 --schema_hash=44622287
    ```
    
    Здесь `/path/to/storage` обозначает корневой каталог данных BE. Если удаление прошло успешно, в журнале появится сообщение delete successfully.
    
    Загрузите новые метаданные tablet с помощью инструмента `meta_tool`.
        
    ```
    ./lib/meta_tool --root_path=/path/to/storage --operation=load_meta --json_meta_path=/path/to/10017.hdr.json
    ```
    
    Если загрузка прошла успешно, в журнале появится сообщение load successfully.
    
6. Проверка

     Снова запустите процесс BE в среде отладки (./bin/start_be.sh). Выполните запрос к таблице. Если всё сделано правильно, вы сможете получить данные загруженного tablet или воспроизвести проблему из рабочей среды.

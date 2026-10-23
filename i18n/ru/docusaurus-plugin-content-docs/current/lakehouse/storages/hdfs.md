---
{
    "title": "HDFS | Хранилища",
    "language": "ru",
    "description": "В этом документе описаны параметры, необходимые для доступа к HDFS. Эти параметры применяются к:",
    "sidebar_label": "HDFS"
}
---

# HDFS {#hdfs}

В этом документе описаны параметры, необходимые для доступа к HDFS. Эти параметры применяются к:

* Свойствам Catalog
* Свойствам Table Valued Function
* Свойствам Broker Load
* Свойствам Export
* Свойствам Outfile
* Резервному копированию и восстановлению

## Обзор параметров {#parameter-overview}

|Имя свойства | Прежнее имя | Описание | Значение по умолчанию | Обязательное |
| --- | --- | --- | --- | --- |
| hdfs.authentication.type | hadoop.security.authentication | Задаёт тип аутентификации. Допустимые значения: kerberos и simple. При выборе kerberos система использует аутентификацию Kerberos для взаимодействия с HDFS; при выборе simple аутентификация не используется. Этот вариант подходит для открытых кластеров HDFS. При выборе kerberos необходимо настроить соответствующие principal и keytab. | simple | Нет |
| hdfs.authentication.kerberos.principal | hadoop.kerberos.principal | Если выбран тип аутентификации kerberos, задаёт principal Kerberos. Principal Kerberos — это уникальная строка идентификации, которая обычно включает имя службы, имя хоста и доменное имя. | - | Нет |
| hdfs.authentication.kerberos.keytab | hadoop.kerberos.keytab | Этот параметр задаёт путь к файлу keytab для аутентификации Kerberos. Файл keytab хранит зашифрованные учётные данные и позволяет системе проходить аутентификацию автоматически, без ручного ввода пароля пользователем. | - | Нет |
| hdfs.impersonation.enabled | - | При значении true включает выполнение операций HDFS от имени другого пользователя. Использует прокси-пользователя, настроенного в core-site.xml, для выполнения операций HDFS от имени пользователей, вошедших в Doris | Пока не поддерживается | - |
| hadoop.username | - | Если выбран тип аутентификации simple, для доступа к HDFS используется этот пользователь. По умолчанию доступ выполняется от имени системного пользователя Linux, от которого запущен процесс Doris | - | - |
| hadoop.config.resources | - | Задаёт каталог файлов конфигурации HDFS (должен содержать hdfs-site.xml и core-site.xml) с использованием относительных путей. По умолчанию используется каталог /plugins/hadoop/conf/ внутри каталога развёртывания (FE/BE). Путь по умолчанию можно изменить с помощью hadoop_config_dir в fe.conf/be.conf. На всех узлах FE и BE необходимо настроить одинаковый относительный путь. Пример: hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml | - | - |
| dfs.nameservices | - | Позволяет вручную настроить параметры кластера HDFS с высокой доступностью. При использовании hadoop.config.resources параметры автоматически считываются из hdfs-site.xml. Необходимо использовать вместе со следующими параметрами: dfs.ha.namenodes.your-nameservice, dfs.namenode.rpc-address.your-nameservice.nn1, dfs.client.failover.proxy.provider и т. д. | - | - |

> Для версий до 3.1 используйте прежние имена.

## Настройка аутентификации {#authentication-configuration}

HDFS поддерживает два способа аутентификации:

* Simple
* Kerberos

### Аутентификация Simple {#simple-authentication}

Аутентификация Simple подходит для кластеров HDFS, в которых не включён Kerberos.

При использовании аутентификации Simple можно задать следующие параметры или воспользоваться значениями по умолчанию:

```sql
"hdfs.authentication.type" = "simple"
```

В режиме аутентификации Simple можно указать имя пользователя с помощью параметра `hadoop.username`. Если он не задан, по умолчанию используется имя пользователя, от которого запущен текущий процесс.

Примеры:

Доступ к HDFS от имени пользователя `lakers`

```sql
"hdfs.authentication.type" = "simple",
"hadoop.username" = "lakers"
```

Доступ к HDFS от имени системного пользователя по умолчанию

```sql
"hdfs.authentication.type" = "simple"
```

### Аутентификация Kerberos {#kerberos-authentication}

Аутентификация Kerberos подходит для кластеров HDFS, в которых включён Kerberos.

При использовании аутентификации Kerberos необходимо задать следующие параметры:

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "<your_principal>",
"hdfs.authentication.kerberos.keytab" = "<your_keytab>"
```

В режиме аутентификации Kerberos необходимо задать principal Kerberos и путь к файлу keytab.

Doris будет обращаться к HDFS с идентификатором, заданным свойством `hdfs.authentication.kerberos.principal`, используя для аутентификации principal файл keytab, указанный в keytab.

> Примечание:
>
> Файл keytab должен находиться на каждом узле FE и BE по одинаковому пути, а пользователь, от которого запущен процесс Doris, должен иметь право на чтение этого файла.

Пример:

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "hdfs/hadoop@HADOOP.COM",
"hdfs.authentication.kerberos.keytab" = "/etc/security/keytabs/hdfs.keytab",
```
Сведения об устранении распространённых проблем с настройкой Kerberos см. в разделе [Часто задаваемые вопросы о Kerberos](../best-practices/kerberos.md/#faq).

## Настройка HDFS HA {#hdfs-ha-configuration}

Если включён режим HDFS HA, необходимо настроить параметры, связанные с `dfs.nameservices`:

```sql
'dfs.nameservices' = '<your-nameservice>',
'dfs.ha.namenodes.<your-nameservice>' = '<nn1>,<nn2>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn1>' = '<nn1_host:port>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn2>' = '<nn2_host:port>',
'dfs.client.failover.proxy.provider.<your-nameservice>' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

Пример:

```sql
'dfs.nameservices' = 'nameservice1',
'dfs.ha.namenodes.nameservice1' = 'nn1,nn2',
'dfs.namenode.rpc-address.nameservice1.nn1' = '172.21.0.2:8088',
'dfs.namenode.rpc-address.nameservice1.nn2' = '172.21.0.3:8088',
'dfs.client.failover.proxy.provider.nameservice1' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

Начиная с 4.1.5, перечисленные через запятую пути к XML-файлам в `hadoop.config.resources` не должны содержать сегмент родительского каталога `..`. Проверяются разделители в виде как прямой, так и обратной косой черты. Используйте обычные пути, например `conf/core-site.xml,conf/hdfs-site.xml`; не используйте `../` для доступа к родительскому каталогу.

## Файлы конфигурации {#configuration-files}

> Эта возможность поддерживается начиная с версии 3.1.0

Doris позволяет указать каталог файлов конфигурации HDFS с помощью параметра `hadoop.config.resources`.

Каталог файлов конфигурации должен содержать файлы `hdfs-site.xml` и `core-site.xml`. По умолчанию используется каталог `/plugins/hadoop_conf/` внутри каталога развёртывания (FE/BE). На всех узлах FE и BE необходимо настроить одинаковый относительный путь.

Если файлы конфигурации содержат перечисленные выше параметры, приоритет имеют параметры, явно заданные пользователем. Можно указать несколько файлов конфигурации, разделив их запятыми, например `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`.

**Примеры:**

```sql
-- Multiple configuration files
'hadoop.config.resources'='hdfs-cluster-1/core-site.xml,hdfs-cluster-1/hdfs-site.xml'
-- Single configuration file
'hadoop.config.resources'='hdfs-cluster-2/hdfs-site.xml'
```

## Оптимизация IO в HDFS {#hdfs-io-optimization}

В некоторых случаях высокая нагрузка на HDFS может приводить к длительному чтению реплик данных в HDFS, снижая общую производительность запросов. Ниже описаны настройки, которые помогают оптимизировать работу в таких ситуациях.

### Hedged Read {#hedged-read}

Клиент HDFS поддерживает функцию Hedged Read. Если запрос на чтение не возвращает результат дольше заданного порога, эта функция может запустить дополнительный поток для чтения тех же данных. Используется результат того запроса, который завершится первым.

Примечание: эта функция может увеличить нагрузку на кластер HDFS, поэтому используйте её с учётом этого.

Включить эту функцию можно следующим образом:

```sql
"dfs.client.hedged.read.threadpool.size" = "128",
"dfs.client.hedged.read.threshold.millis" = "500"
```

* `dfs.client.hedged.read.threadpool.size`

    Задаёт количество потоков для Hedged Read, совместно используемых одним клиентом HDFS. Обычно для одного кластера HDFS узлы BE используют общий клиент HDFS.

* `dfs.client.hedged.read.threshold.millis`

    Порог времени чтения в миллисекундах. Если запрос на чтение не возвращает результат дольше этого порога, запускается Hedged Read.

После включения функции в Query Profile можно увидеть связанные показатели:

* `TotalHedgedRead`

    Количество запусков Hedged Read.

* `HedgedReadWins`

    Количество успешных попыток Hedged Read, которые были запущены и вернули результат быстрее исходного запроса.

Обратите внимание: здесь приведены накопленные значения для отдельного клиента HDFS, а не для отдельного запроса. Один и тот же клиент HDFS повторно используется несколькими запросами.

### dfs.client.socket-timeout {#dfsclientsocket-timeout}

`dfs.client.socket-timeout` — параметр конфигурации клиента Hadoop HDFS, задающий время ожидания сокета в миллисекундах при установлении соединения с DataNode или NameNode либо чтении данных с этих узлов. Значение этого параметра по умолчанию обычно составляет 60,000 миллисекунд.

Уменьшение значения этого параметра позволяет клиенту быстрее завершать ожидание и повторять попытку или переключаться на другие узлы при сетевых задержках, медленных ответах DataNode или ошибках соединения. Это помогает сократить время ожидания и ускорить отклик системы. Например, в некоторых тестах установка меньшего значения `dfs.client.socket-timeout` (например, 5000 миллисекунд) позволяет быстро обнаруживать задержки или сбои DataNode и избегать длительного ожидания.

Примечание:

* Слишком малое время ожидания может приводить к частым ошибкам тайм-аута при нестабильной работе сети или высокой нагрузке на узлы, что влияет на стабильность выполнения задач.

* Рекомендуется подбирать значение этого параметра с учётом фактического состояния сети и нагрузки на систему, чтобы обеспечить баланс между скоростью отклика и стабильностью системы.

* Этот параметр следует задавать в файле конфигурации клиента (например, `hdfs-site.xml`), чтобы клиент использовал нужное время ожидания при взаимодействии с HDFS.

Таким образом, правильная настройка параметра `dfs.client.socket-timeout` может ускорить отклик при I/O, сохраняя стабильность и надёжность системы.

## Требования к портам для доступа к HDFS (только NameNode \& DataNode) {#hdfs-access-port-requirements-namenode--datanode-only}

Для доступа Doris к HDFS необходимо открыть следующие порты:

| Служба    | Назначение порта              | Порт по умолчанию | Протокол|
|-----------|-------------------------------|--------------|---------|
| NameNode  | RPC (клиентский доступ / доступ к метаданным) | 8020         |TCP      |
| DataNode  | Передача данных (блочный I/O)  | 9866         |TCP       |

Примечания:
- Порты могут быть изменены в `core-site.xml` и `hdfs-site.xml`. Используйте значения из фактической конфигурации.
- При включённой аутентификации Kerberos Doris также должен иметь доступ к службе Kerberos KDC. По умолчанию KDC прослушивает TCP-порт 88, однако фактический порт определяется конфигурацией KDC.

## Отладка HDFS {#debugging-hdfs}

Настройка среды Hadoop сложна, и в некоторых случаях могут возникать проблемы с подключением и низкая производительность доступа. Ниже приведены сторонние инструменты, которые помогают быстро диагностировать проблемы с подключением и основные проблемы с производительностью.

### Клиент HDFS {#hdfs-client}

* Java: <https://github.com/morningman/hdfs-client-java>

* CPP: <https://github.com/morningman/hdfs-client-cpp>

Эти два инструмента позволяют быстро проверить подключение к HDFS и производительность чтения. Большинство их зависимостей Hadoop совпадают с зависимостями Hadoop в Doris, поэтому они позволяют максимально точно воспроизводить сценарии доступа Doris к HDFS.

Версия на Java использует Java для доступа к HDFS и позволяет воспроизводить логику доступа к HDFS со стороны FE Doris.

Версия CPP обращается к HDFS через вызовы libhdfs из C++ и позволяет воспроизводить логику доступа к HDFS со стороны BE Doris.

Подробные инструкции по использованию приведены в README каждого репозитория кода.

---
{
    "title": "FQDN",
    "language": "ru",
    "description": "В этой статье описано, как включить режим FQDN (Fully Qualified Domain Name) в Apache Doris: настроить новый кластер, перенести существующий кластер в этот режим, развернуть Doris в Kubernetes и изменить IP-адрес сервера."
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenarios: Cluster deployment / Node changes / Kubernetes deployment -->

В этой статье описано, как включить использование FQDN (Fully Qualified Domain Name) в кластере Apache Doris. FQDN представляет собой полное доменное имя конкретного компьютера или хоста в Интернете.

После включения FQDN взаимодействие между узлами Doris полностью основано на FQDN. При добавлении узла указывайте его FQDN напрямую. Например, команда для добавления узла BE выглядит так:

```sql
ALTER SYSTEM ADD BACKEND "be_host:heartbeat_service_port";
```

В режиме FQDN в качестве `be_host` необходимо указать FQDN узла BE, а не его IP-адрес.

## Сценарии использования {#applicable-scenarios}

<!-- Knowledge type: Architecture decision -->

| Сценарий | Описание | Раздел с инструкциями |
| --- | --- | --- |
| Развертывание нового кластера | Включите FQDN при создании нового кластера, чтобы избежать последующей миграции | [Включение FQDN в новом кластере](#enable-fqdn-on-a-new-cluster) |
| Развертывание в Kubernetes | После перезапуска Pod его IP-адрес может измениться, но доменное имя остается прежним. FQDN обеспечивает непрерывную доступность сервиса. | [Развертывание Doris в K8s](#deploy-doris-on-k8s) |
| Изменение IP-адреса сервера | При переключении сетевых интерфейсов или замене машин не требуется изменять метаданные Doris | [Изменение IP-адреса сервера](#server-ip-change) |
| Миграция существующего кластера | Переведите кластер, уже использующий IP-адреса, в режим FQDN | [Включение FQDN в существующем кластере](#enable-fqdn-on-an-existing-cluster) |

## Предварительные требования {#prerequisites}

<!-- Knowledge type: Pre-deployment checks -->

Перед включением FQDN необходимо выполнить следующие условия:

- Установите `enable_fqdn_mode = true` в `fe.conf`.
- На каждой машине кластера должно быть настроено имя хоста.
- Файл `/etc/hosts` на каждой машине кластера должен содержать соответствия между IP-адресами и FQDN всех остальных машин.
- В файле `/etc/hosts` не допускаются повторяющиеся IP-адреса.

## Включение FQDN в новом кластере {#enable-fqdn-on-a-new-cluster}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: New cluster deployment -->

Рассмотрим развертывание кластера из 3 FE + 3 BE. Порядок действий следующий:

1. **Подготовьте машины**: Подготовьте машины в соответствии с размером кластера (в этом примере 6 машин).

2. **Проверьте уникальность имен хостов**: Выполните команду `host` на каждой машине и убедитесь, что возвращаемое имя уникально. Предположим, что имена хостов 6 машин: `fe1`, `fe2`, `fe3`, `be1`, `be2` и `be3`.

3. **Настройте `/etc/hosts`**: На всех 6 машинах укажите реальные IP-адреса для всех 6 FQDN в `/etc/hosts`:

    ```text
    172.22.0.1 fe1
    172.22.0.2 fe2
    172.22.0.3 fe3
    172.22.0.4 be1
    172.22.0.5 be2
    172.22.0.6 be3
    ```

4. **Проверьте сеть**: На любом узле (например, `fe1`) выполните `ping fe2`. Если имя разрешается в правильный IP-адрес и узел доступен, сетевое окружение готово.

5. **Включите FQDN в конфигурации**: На каждом узле FE задайте в `fe.conf` следующий параметр:

    ```text
    enable_fqdn_mode = true
    ```

6. **Разверните кластер**: Следуйте инструкциям в разделе [Развертывание вручную](../../install/deploy-manually/integrated-storage-compute-deploy-manually), чтобы завершить развертывание FE / BE.

7. **При необходимости добавьте Broker**: Разверните Broker на выбранных машинах и выполните:

    ```sql
    ALTER SYSTEM ADD BROKER broker_name "fe1:8000","be1:8000",...;
    ```

## Развертывание Doris в K8s {#deploy-doris-on-k8s}

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Kubernetes deployment -->

В среде Kubernetes нет гарантии, что IP-адрес Pod останется прежним после неожиданного перезапуска, однако его доменное имя сохраняется. После включения FQDN в Doris это свойство позволяет сохранить доступность сервиса после перезапуска Pod.

Полный порядок развертывания Doris в K8s приведен в разделе [Развертывание Doris в K8s](../../install/deploy-on-kubernetes/integrated-storage-compute/install-doris-cluster).

## Изменение IP-адреса сервера {#server-ip-change}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Node IP change / Network interface switch / Machine replacement -->

Если после завершения развертывания по инструкциям из раздела «Включение FQDN в новом кластере» потребуется изменить IP-адрес машины (например, для переключения сетевого интерфейса или замены машины), достаточно обновить файл `/etc/hosts` на каждой машине. Изменять метаданные кластера Doris не требуется.

## Включение FQDN в существующем кластере {#enable-fqdn-on-an-existing-cluster}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Migration of existing cluster -->

**Требование к версии**: Текущая версия Doris должна поддерживать следующий синтаксис:

```sql
ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>";
```

Если текущая версия его не поддерживает, сначала обновитесь до версии, в которой он поддерживается.

:::caution
Для выполнения следующих операций в кластере должно быть не менее 3 узлов Follower. В противном случае кластер не сможет нормально запуститься.
:::

### Включение FQDN на узлах FE {#enable-fqdn-on-fe-nodes}

Выполните следующие операции поочередно на узлах Follower и Observer, а **узел Master обработайте последним**:

1. **Остановите узел**: Остановите текущий процесс FE.

2. **Проверьте состояние узла**: С помощью клиента MySQL выполните `SHOW FRONTENDS` и убедитесь, что состояние `Alive` этого узла FE изменилось на `false`.

3. **Задайте FQDN**: Выполните следующий SQL (после остановки узла Master автоматически выбирается новый Master. Выполните эту инструкцию на новом Master):

    ```sql
    ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>";
    ```

4. **Измените конфигурацию узла**: В корневом каталоге FE остановленного узла откройте `conf/fe.conf` и добавьте:

    ```text
    enable_fqdn_mode = true
    ```

    Если после добавления этого параметра узел по-прежнему не может нормально запуститься, добавьте `enable_fqdn_mode = true` в `fe.conf` **всех** узлов FE, а затем запустите узел FE, который был только что остановлен.

5. **Запустите узел**: Запустите процесс FE, чтобы узел снова присоединился к кластеру.

### Включение FQDN на узлах BE {#enable-fqdn-on-be-nodes}

Включение FQDN на узле BE не требует перезапуска. Выполните следующую команду через MySQL:

```sql
ALTER SYSTEM MODIFY BACKEND "<backend_ip>:<HeartbeatPort>" HOSTNAME "<be_hostname>";
```

Если вы не знаете номер порта `HeartbeatPort`, узнайте его с помощью команды `SHOW BACKENDS`.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->

### Вопрос: Можно ли произвольно менять параметр конфигурации `enable_fqdn_mode`? {#q-can-the-enable_fqdn_mode-configuration-item-be-changed-at-will}

Нет, произвольно менять его нельзя. Чтобы перевести кластер, уже использующий IP-адреса, в режим FQDN, следуйте инструкциям в разделе [Включение FQDN в существующем кластере](#enable-fqdn-on-an-existing-cluster).

### Вопрос: Можно ли включить FQDN, если узлов Follower меньше 3? {#q-can-fqdn-be-enabled-when-there-are-fewer-than-3-follower-nodes}

Нет. Для выполнения процедуры миграции существующего кластера в нем должно быть не менее 3 узлов Follower. В противном случае кластер не сможет нормально запуститься.

### Вопрос: Нужно ли изменять метаданные Doris после изменения IP-адреса сервера? {#q-does-doris-metadata-need-to-be-modified-after-a-server-ip-change}

Нет. Достаточно обновить соответствия между IP-адресами и FQDN в `/etc/hosts` на всех машинах.

### Вопрос: Какое значение следует задать для `be_host` при добавлении узла? {#q-what-should-be_host-be-set-to-when-adding-a-node}

После включения FQDN в качестве `be_host` необходимо указать FQDN узла BE, а не его IP-адрес.

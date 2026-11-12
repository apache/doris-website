---
{
    "title": "Doris Operator",
    "language": "ru",
    "description": "Примечания к выпускам Doris Operator."
}
---

# Doris Operator {#doris-operator}

В этом документе перечислены примечания к выпускам Doris Operator в обратном хронологическом порядке.

## 26.0.1 {#2601}

Источник: [Примечания к выпуску 26.0.1](https://github.com/apache/doris-operator/issues/512)

В этом исправляющем выпуске улучшена совместимость уменьшения масштаба DDC с Doris 4.1.3, добавлены средства автоматизации выпуска в самом репозитории и обеспечена безопасная проверка лицензий в запросах на включение изменений от внешних участников.

### Новые возможности и улучшения {#features-and-improvements}

- В репозиторий добавлены инструменты выпуска для проверки окружения, упаковки исходного кода, подписания и загрузки, создания письма для голосования и завершения выпуска, а также автоматические тесты рабочих процессов. [#507](https://github.com/apache/doris-operator/pull/507)

### Исправления ошибок {#bug-fixes}

- Исправлено уменьшение масштаба FE и групп вычислительных узлов DDC с Doris 4.1.3: обработка расширенных результатов `SHOW FRONTENDS` и `SHOW BACKENDS`, поочерёдное удаление узлов и возможность безопасно повторять корректное удаление BE. [#510](https://github.com/apache/doris-operator/pull/510)

### Надёжность {#reliability}

- Проверка лицензий перенесена в рабочий процесс `pull_request` с минимальными привилегиями; обновлена обработка получения кода, чтобы безопасно проверять запросы на включение изменений из форков. [#511](https://github.com/apache/doris-operator/pull/511)

### Благодарности {#thanks}

- [morningman](https://github.com/morningman)
- [Al-assad](https://github.com/Al-assad)

## 26.0.0 {#2600}

Источник: [Примечания к выпуску 26.0.0](https://github.com/apache/doris-operator/issues/506)

В этой версии улучшены управление жизненным циклом DDC и надёжность: добавлены поэтапное корректное завершение работы групп вычислительных узлов, настраиваемые политики проверки готовности, поддержка mTLS для DCR и более понятное отображение состояния DDC. Также расширены возможности настройки Helm chart и внесены исправления, связанные с проверкой конфигурации и стабильностью.

### Новые возможности и улучшения {#features-and-improvements-1}

- Добавлено поэтапное корректное завершение работы групп вычислительных узлов DDC при последовательных обновлениях, уменьшении масштаба и удалении. Проверка совместимости sentinel позволяет использовать обычный процесс StatefulSet для неподдерживаемых образов. [#502](https://github.com/apache/doris-operator/pull/502)
- Добавлена возможность настраивать политику проверки готовности pod для `DorisCluster` и `DorisDisaggregatedCluster`. [#486](https://github.com/apache/doris-operator/pull/486)
- Добавлена поддержка mTLS для DCR. [#483](https://github.com/apache/doris-operator/pull/483)
- Сервис группы вычислительных узлов DDC разделён на внутренний headless service и внешний сервис для более плавных обновлений и переключения трафика. [#484](https://github.com/apache/doris-operator/pull/484)
- В Helm chart добавлена поддержка секретов на уровне компонентов. [#465](https://github.com/apache/doris-operator/pull/465)
- В Helm chart открыта настройка `serviceAccount` для развёрнутых pod. [#470](https://github.com/apache/doris-operator/pull/470)

### Исправления ошибок {#bug-fixes-1}

- Исправлено сведение данных о состоянии MetaService в DDC: ухудшение состояния MetaService теперь отражается в состоянии кластера. [#500](https://github.com/apache/doris-operator/pull/500)
- Исправлена паника из-за nil-карты в `CompareConfigmapAndTriggerRestart`, возникавшая, когда `dcr.Annotations` имеет значение nil. [#493](https://github.com/apache/doris-operator/pull/493)
- Исправлен JSON-тег адреса конечной точки FE и заново созданы CRD `DorisCluster`. [#497](https://github.com/apache/doris-operator/pull/497)
- Добавлено отклонение некорректных спецификаций FE для `DorisDisaggregatedCluster`, в которых `feSpec.replicas < feSpec.electionNumber`. [#498](https://github.com/apache/doris-operator/pull/498)
- Изменения шаблона хранилища групп вычислительных узлов DDC теперь отклоняются до применения неизменяемых шаблонов заявок на тома StatefulSet. [#496](https://github.com/apache/doris-operator/pull/496)
- Исправлено значение `storage_root_path` по умолчанию в конфигурации Helm для BE в `DorisDisaggregatedCluster`. [#477](https://github.com/apache/doris-operator/pull/477)

### Надёжность {#reliability-1}

- В веб-хуках `DorisCluster` и `DorisDisaggregatedCluster` добавлен запрет на использование встроенной учётной записи `admin` в качестве пользователя управления оператором. [#499](https://github.com/apache/doris-operator/pull/499)
- Для запросов на включение изменений добавлены проверки форматирования Go, vet/lint, сборки оператора, а также создаваемых манифестов и артефактов. [#501](https://github.com/apache/doris-operator/pull/501)

### Благодарности {#thanks-1}

- [ecniiv](https://github.com/ecniiv)
- [jonasbrami](https://github.com/jonasbrami)
- [catpineapple](https://github.com/catpineapple)
- [JinVei](https://github.com/JinVei)
- [Al-assad](https://github.com/Al-assad)

## 25.8.0 {#2580}

Источник: [Примечания к выпуску 25.8.0](https://github.com/apache/doris-operator/issues/472)

В этой версии добавлены важные возможности DDC, включая поддержку TLS, увеличение PVC и отладку pod. Также улучшены поддержка Helm, настройка ресурсов pod и надёжность.

### Новые возможности и улучшения {#features-and-improvements-2}

- Для `dorisctl` добавлена поддержка доступа по TLS. [#432](https://github.com/apache/doris-operator/pull/432)
- Добавлена поддержка TLS при удалении узлов оператором. [#434](https://github.com/apache/doris-operator/pull/434)
- Улучшены шаблоны Helm chart. [#452](https://github.com/apache/doris-operator/pull/452)
- Добавлена возможность задавать квоты ресурсов Deployment для Helm chart и chart оператора через `values.yaml`. [#462](https://github.com/apache/doris-operator/pull/462)
- Обеспечена совместимость поля `kubeVersion` в Helm chart с версиями Kubernetes, содержащими суффиксы предварительных выпусков, в том числе версиями EKS и GKE. [#463](https://github.com/apache/doris-operator/pull/463)
- Добавлены возможности отладки DDC. [#460](https://github.com/apache/doris-operator/pull/460) [#471](https://github.com/apache/doris-operator/pull/471)
- Добавлена передача параметров с учётом ресурсов CPU для pod BE. [#464](https://github.com/apache/doris-operator/pull/464)
- Добавлена поддержка расширения PVC для DDC. [#467](https://github.com/apache/doris-operator/pull/467)
- Добавлена настройка ограничений ресурсов для пользовательского поведения init container. [#469](https://github.com/apache/doris-operator/pull/469)

### Исправления ошибок {#bug-fixes-2}

- Исправлены проблемы в модульных тестах. [#430](https://github.com/apache/doris-operator/pull/430) [#433](https://github.com/apache/doris-operator/pull/433)
- Устранена утечка ресурсов из-за незакрытого SQL-соединения. [#437](https://github.com/apache/doris-operator/pull/437)
- Исправлен сбор сведений о PVC для FE. [#438](https://github.com/apache/doris-operator/pull/438)
- Исправлены сообщения в журнале ошибок, дублирующиеся переменные окружения и другие дефекты кода. [#440](https://github.com/apache/doris-operator/pull/440) [#442](https://github.com/apache/doris-operator/pull/442) [#449](https://github.com/apache/doris-operator/pull/449)
- Устранены уязвимости CVE и обновлены зависимости, связанные с безопасностью. [#453](https://github.com/apache/doris-operator/pull/453)
- Исправлено сопоставление определений структур SQL-клиента MySQL. [#468](https://github.com/apache/doris-operator/pull/468)

### Надёжность {#reliability-2}

- В контроллере MetaService для DDC функция `BuildVolumesVolumeMountsAndPVCs` повторно используется для создания PVC, что повышает согласованность логики. [#436](https://github.com/apache/doris-operator/pull/436)

### Загрузки {#downloads}

Сведения о форматах образов приведены в описании репозитория образов.

### Благодарности {#thanks-2}

- [intelligentfu8](https://github.com/intelligentfu8)
- [ztonny](https://github.com/ztonny)
- [matiasbertani](https://github.com/matiasbertani)
- [jonasbrami](https://github.com/jonasbrami)
- [gohalo](https://github.com/gohalo)
- [catpineapple](https://github.com/catpineapple)

## 25.7.0 {#2570}

Источник: [Примечания к выпуску 25.7.0](https://github.com/apache/doris-operator/issues/423)

В этой версии улучшены совместимость операций удаления узлов и сборка отладочного образа. Также исправлены монтирование сведений о pod DDC, тесты PVC и обработка событий.

### Новые возможности и улучшения {#features-and-improvements-3}

- Операции удаления узлов стали совместимы с переименованными группами вычислительных узлов. [#417](https://github.com/apache/doris-operator/pull/417)
- Обновлена версия Go, используемая для сборки отладочного образа. [#424](https://github.com/apache/doris-operator/pull/424)

### Исправления ошибок {#bug-fixes-3}

- Исправлены орфографические ошибки. [#413](https://github.com/apache/doris-operator/pull/413)
- Добавлено отсутствовавшее монтирование сведений о pod для контейнеров DDC. [#415](https://github.com/apache/doris-operator/pull/415)
- Исправлены падавшие модульные тесты создания PVC. [#420](https://github.com/apache/doris-operator/pull/420)
- Предотвращена ошибка обращения к nil-указателю, когда `EventString` имеет значение nil. [#422](https://github.com/apache/doris-operator/pull/422)

### Благодарности {#thanks-3}

- [intelligentfu8](https://github.com/intelligentfu8)
- [ztonny](https://github.com/ztonny)

## 25.6.0 {#2560}

Источник: [Примечания к выпуску 25.6.0](https://github.com/apache/doris-operator/issues/414)

В этой версии возможности `dorisctl` расширены на кластеры с разделёнными хранением и вычислениями, а также исправлено создание PVC при первоначальном развёртывании.

### Новые возможности и улучшения {#features-and-improvements-4}

- Добавлена возможность управлять кластерами Doris с разделёнными хранением и вычислениями с помощью `dorisctl`. [#412](https://github.com/apache/doris-operator/pull/412)

### Исправления ошибок {#bug-fixes-4}

- Исправлена ошибка, из-за которой PVC не создавались при первоначальном развёртывании. [#410](https://github.com/apache/doris-operator/pull/410)

### Благодарности {#thanks-4}

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.3 {#2553}

Источник: [Примечания к выпуску 25.5.3](https://github.com/apache/doris-operator/issues/408)

В этой версии улучшены образы по умолчанию и документация для развёртываний DDC, а также предотвращено появление внутренней аннотации согласования в пользовательских ресурсах.

### Новые возможности и улучшения {#features-and-improvements-5}

- Образ BE назначен образом по умолчанию для init container. [#405](https://github.com/apache/doris-operator/pull/405)
- В README добавлены описания двух возможностей. [#406](https://github.com/apache/doris-operator/pull/406)
- Добавлены примеры использования FoundationDB для разных сценариев. [#407](https://github.com/apache/doris-operator/pull/407)

### Исправления ошибок {#bug-fixes-5}

- Предотвращено появление в пользовательских ресурсах аннотации, используемой только для проверки состояния согласования. [#404](https://github.com/apache/doris-operator/pull/404)

### Благодарности {#thanks-5}

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.2 {#2552}

Источник: [Примечания к выпуску 25.5.2](https://github.com/apache/doris-operator/issues/403)

В этой версии улучшены согласование и отладка DDC.

### Новые возможности и улучшения {#features-and-improvements-6}

- Устранено избыточное согласование, когда состояние `DorisDisaggregatedCluster` уже согласовано. [#399](https://github.com/apache/doris-operator/pull/399)
- Для перехода в режим отладки добавлена аннотация `apache.com.doris/runmode`. [#400](https://github.com/apache/doris-operator/pull/400)
- Согласование `DorisDisaggregatedCluster` назначено режимом по умолчанию. [#402](https://github.com/apache/doris-operator/pull/402)

### Благодарности {#thanks-6}

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.1 {#2551}

Источник: [Примечания к выпуску 25.5.1](https://github.com/apache/doris-operator/issues/398)

В этой версии добавлена поддержка Kerberos для DDC, а версия выпуска компонентов с разделёнными хранением и вычислениями приведена в соответствие с версией оператора.

### Новые возможности и улучшения {#features-and-improvements-7}

- Добавлена поддержка Kerberos для DDC. [#396](https://github.com/apache/doris-operator/pull/396)

### Исправления ошибок {#bug-fixes-6}

- Версия выпуска компонентов с разделёнными хранением и вычислениями приведена в соответствие с версией оператора. [#395](https://github.com/apache/doris-operator/pull/395)

### Благодарности {#thanks-7}

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.0 {#2550}

Источник: [Примечания к выпуску 25.5.0](https://github.com/apache/doris-operator/issues/394)

В этой версии добавлена поддержка групп рабочей нагрузки и Helm chart для кластеров с разделёнными хранением и вычислениями. Также улучшена инициализация DDC и исправлены проблемы с образами, разрешениями и настройкой MetaService.

### Новые возможности и улучшения {#features-and-improvements-8}

- Добавлена поддержка групп рабочей нагрузки для кластеров Doris с разделёнными хранением и вычислениями. [#378](https://github.com/apache/doris-operator/pull/378)
- Добавлено согласование ресурса `DorisDisaggregatedCluster`. [#379](https://github.com/apache/doris-operator/pull/379)
- В Helm chart добавлена поддержка кластеров Doris с разделёнными хранением и вычислениями. [#379](https://github.com/apache/doris-operator/pull/379) [#386](https://github.com/apache/doris-operator/pull/386) [#388](https://github.com/apache/doris-operator/pull/388) [#393](https://github.com/apache/doris-operator/pull/393)
- Добавлена возможность пропускать стандартную проверку инициализации системы для DDC. [#389](https://github.com/apache/doris-operator/pull/389)

### Исправления ошибок {#bug-fixes-7}

- Скорректирован образ оператора по умолчанию. [#377](https://github.com/apache/doris-operator/pull/377)
- Добавлена агрегированная роль `ClusterRole`. [#380](https://github.com/apache/doris-operator/pull/380)
- Исправлено число реплик MetaService для кластеров с разделёнными хранением и вычислениями. [#382](https://github.com/apache/doris-operator/pull/382)

### Благодарности {#thanks-8}

- [wdxxl](https://github.com/wdxxl)
- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.4.0 {#2540}

Источник: [Примечания к выпуску 25.4.0](https://github.com/apache/doris-operator/issues/376)

Основные изменения этой версии — поддержка монтирования общих дисков в DCR и настройки аннотаций pod в Helm chart.

### Новые возможности и улучшения {#features-and-improvements-9}

- Добавлена возможность настраивать общие PVC, которые необходимо монтировать в pod. [#375](https://github.com/apache/doris-operator/pull/375)
- В Helm chart Doris добавлена поддержка аннотаций pod. [#327](https://github.com/apache/doris-operator/pull/327)

### Благодарности {#thanks-9}

- [catpineapple](https://github.com/catpineapple)
- [bluicezhen](https://github.com/bluicezhen)

## 25.3.0 {#2530}

Источник: [Примечания к выпуску 25.3.0](https://github.com/apache/doris-operator/issues/371)

В этой версии расширены возможности PersistentVolume для `DorisCluster` и `DorisDisaggregatedCluster`, исправлены ошибки и улучшены примеры проекта и способы сборки Helm.

### Новые возможности и улучшения {#features-and-improvements-10}

- В Makefile добавлена поддержка команды Helm `make` для выпусков Helm. [#362](https://github.com/apache/doris-operator/pull/362)
- Для DCR добавлены настройка шаблона PersistentVolume и его связь с файлами конфигурации. [#364](https://github.com/apache/doris-operator/pull/364)
- Для DDC добавлены настройка PersistentVolume и совместимость с `PersistentVolume`. [#369](https://github.com/apache/doris-operator/pull/369)

### Исправления ошибок {#bug-fixes-8}

- Предотвращено возможное появление недопустимых строк в именах PVC. [#368](https://github.com/apache/doris-operator/pull/368)
- Исправлен сбой увеличения масштаба кластера Doris с разделёнными хранением и вычислениями при заданном `adminUser`. [#367](https://github.com/apache/doris-operator/pull/367)

### Прочие изменения {#other-changes}

- Добавлен новый пример DDC с настройкой affinity и пароля. [#366](https://github.com/apache/doris-operator/pull/366)
- Удалена неиспользуемая документация API. [#370](https://github.com/apache/doris-operator/pull/370)

### Благодарности {#thanks-10}

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.2.1 {#2521}

Источник: [Примечания к выпуску 25.2.1](https://github.com/apache/doris-operator/issues/360)

В этой версии в Helm chart добавлены ресурсы для кластеров с разделёнными хранением и вычислениями, улучшены подстановка версий при выпуске и репозитории образов, а также исправлены ошибки Helm chart.

### Новые возможности и улучшения {#features-and-improvements-11}

- В Helm chart добавлены пользовательские ресурсы для развёртывания кластеров с разделёнными хранением и вычислениями. [#355](https://github.com/apache/doris-operator/pull/355)
- Поля версий сделаны переменными, значения которых можно заменять в процессе выпуска. [#354](https://github.com/apache/doris-operator/pull/354)
- Образы перенесены из репозитория SelectDB в репозиторий Apache. [#357](https://github.com/apache/doris-operator/pull/357)

### Исправления ошибок {#bug-fixes-9}

- Отменены отдельные изменения из PR 354. [#358](https://github.com/apache/doris-operator/pull/358)
- Исправлено поле `apiVersion` в Helm chart. [#359](https://github.com/apache/doris-operator/pull/359)

### Благодарности {#thanks-11}

- [xiacongling](https://github.com/xiacongling)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.2.0 {#2520}

Источник: [Примечания к выпуску 25.2.0](https://github.com/apache/doris-operator/issues/351)

В этой версии добавлена поддержка доступа к системам данных, защищённым Kerberos, обновлены версии Go и controller-runtime, улучшена работа во время выполнения, исправлены ошибки и обновлена документация.

### Новые возможности и улучшения {#features-and-improvements-12}

- В оператор добавлена поддержка Kerberos для доступа к системам данных, защищённым Kerberos. [#336](https://github.com/apache/doris-operator/pull/336) [#348](https://github.com/apache/doris-operator/pull/348)
- Улучшен пропуск инициализации BE и добавлены переменные окружения в Doris Core. [#338](https://github.com/apache/doris-operator/pull/338)

### Исправления ошибок {#bug-fixes-10}

- Исправлена ошибка, которая могла вызывать согласование во время ожидания развёртывания BE. [#341](https://github.com/apache/doris-operator/pull/341)

### Прочие изменения {#other-changes-1}

- Обновлён базовый образ в Dockerfile оператора, версия Go изменена на 1.23. [#337](https://github.com/apache/doris-operator/pull/337) [#346](https://github.com/apache/doris-operator/pull/346)
- Обновлены Go и controller-runtime: версия controller-runtime изменена с alpha v1 на v1. [#340](https://github.com/apache/doris-operator/pull/340)
- Версия `golang.org/x/net` повышена с 0.30.0 до 0.33.0. [#343](https://github.com/apache/doris-operator/pull/343)
- Обновлены файлы README. [#344](https://github.com/apache/doris-operator/pull/344) [#345](https://github.com/apache/doris-operator/pull/345) [#347](https://github.com/apache/doris-operator/pull/347) [#349](https://github.com/apache/doris-operator/pull/349) [#350](https://github.com/apache/doris-operator/pull/350)

### Загрузки {#downloads-1}

- Образ оператора: [Docker Hub](https://hub.docker.com/r/apache/doris/tags), теги с префиксом `operator`.
- Образы Doris: [Docker Hub](https://hub.docker.com/r/apache/doris/tags), теги с префиксами `ms`, `fe` и `be`.

### Благодарности {#thanks-12}

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.1.0 {#2510}

Источник: [Примечания к выпуску 25.1.0](https://github.com/apache/doris-operator/issues/333)

В этой версии улучшены размещение BE и обновление конфигурации, добавлены тесты контроллера, исправлена подготовка StatefulSet, а теги образов перенесены в репозиторий Apache.

### Новые возможности и улучшения {#features-and-improvements-13}

- Добавлена привязка BE к FE: оператор предпочитает размещать BE на узлах, где работают FE. [#328](https://github.com/apache/doris-operator/pull/328)
- Добавлено отслеживание изменений ConfigMap и перезапуск Doris при изменении конфигурации запуска. [#331](https://github.com/apache/doris-operator/pull/331)
- Добавлена возможность пропускать стандартную инициализацию системы для BE. [#321](https://github.com/apache/doris-operator/pull/321)
- Добавлены модульные тесты контроллера. [#322](https://github.com/apache/doris-operator/pull/322)

### Исправления ошибок {#bug-fixes-11}

- Исправлены параметры, передаваемые в `prepareStatefulsetApply`. [#326](https://github.com/apache/doris-operator/pull/326)

### Прочие изменения {#other-changes-2}

- Все теги образов перенесены из репозитория SelectDB в репозиторий Apache. [#329](https://github.com/apache/doris-operator/pull/329)

### Благодарности {#thanks-13}

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 24.2.0 {#2420}

Источник: [Примечания к выпуску 24.2.0](https://github.com/apache/doris-operator/issues/319)

В этой версии добавлены поддержка нескольких секретов для `DorisDisaggregatedCluster` и уменьшение масштаба BE в группах вычислительных узлов через вывод из эксплуатации. Также улучшены предоставление портов Arrow Flight SQL, очистка ресурсов, тесты, документация и примеры.

### Новые возможности и улучшения {#features-and-improvements-14}

- Добавлена поддержка уменьшения числа BE в группах вычислительных узлов DDC через вывод из эксплуатации. [#306](https://github.com/apache/doris-operator/pull/306)
- Для DDC добавлена возможность настройки имени пользователя и пароля, а также использования нескольких секретов. [#312](https://github.com/apache/doris-operator/pull/312)
- Порты Arrow Flight SQL открыты как порты контейнеров. [#295](https://github.com/apache/doris-operator/pull/295)
- Порты Arrow Flight SQL открыты в сервисах кластеров с разделёнными хранением и вычислениями. [#307](https://github.com/apache/doris-operator/pull/307)
- Расширено покрытие модульными тестами. [#315](https://github.com/apache/doris-operator/pull/315)
- Переработана очистка ресурсов групп вычислительных узлов. [#318](https://github.com/apache/doris-operator/pull/318)

### Исправления ошибок {#bug-fixes-12}

- Исправлена работа SQL-клиента при удалении групп вычислительных узлов. [#314](https://github.com/apache/doris-operator/pull/314)
- Исправлены метки сервисов. [#318](https://github.com/apache/doris-operator/pull/318)
- Исправлено удаление групп вычислительных узлов, когда `UniqueId` содержит дефис. [#318](https://github.com/apache/doris-operator/pull/318)
- Добавлены проверки безопасности при уменьшении числа FE во время обновления кластера. [#320](https://github.com/apache/doris-operator/pull/320)

### Прочие изменения {#other-changes-3}

- Улучшен README. [#303](https://github.com/apache/doris-operator/pull/303)
- Удалены неиспользуемые файлы, включая устаревший Dockerfile и код DDM. [#309](https://github.com/apache/doris-operator/pull/309) [#314](https://github.com/apache/doris-operator/pull/314)
- Улучшены примеры CRD `DorisDisaggregatedCluster`. [#313](https://github.com/apache/doris-operator/pull/313)

### Благодарности {#thanks-14}

- [jonasbrami](https://github.com/jonasbrami)
- [hechao-ustc](https://github.com/hechao-ustc)
- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)

## 24.1.0 {#2410}

Источник: [Примечания к выпуску 24.1.0](https://github.com/apache/doris-operator/issues/293)

В этой версии добавлена поддержка групп рабочей нагрузки для `DorisCluster`, введены последовательные перезапуски и исправлены проблемы с развёртыванием FE и доступом к ним.

Для групп рабочей нагрузки требуется официальный образ Apache Doris версии 2.1.7 или новее. Для более ранних версий Doris совместимый образ необходимо собрать вручную.

### Новые возможности и улучшения {#features-and-improvements-15}

- Для BE в Doris добавлена поддержка групп рабочей нагрузки. [#289](https://github.com/apache/doris-operator/pull/289)
- Для кластеров Doris добавлены последовательные перезапуски. [#292](https://github.com/apache/doris-operator/pull/292)
- Обновлена версия controller-gen в Makefile. [#275](https://github.com/apache/doris-operator/pull/275)
- В GitHub Actions добавлены проверки лицензий. [#278](https://github.com/apache/doris-operator/pull/278) [#279](https://github.com/apache/doris-operator/pull/279) [#280](https://github.com/apache/doris-operator/pull/280)
- Добавлен шаблон задач по умолчанию. [#288](https://github.com/apache/doris-operator/pull/288)

### Исправления ошибок {#bug-fixes-13}

- Исправлена ошибка обращения к nil-указателю, когда для FE в ресурсе `DorisCluster` не задано значение `electionNumber`. [#285](https://github.com/apache/doris-operator/pull/285)
- Исправлен адрес доступа к FE: теперь используются имя сервиса и пространство имён. [#291](https://github.com/apache/doris-operator/pull/291)

### Благодарности {#thanks-15}

- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)

## 24.0.0 {#2400}

Источник: [Примечания к выпуску 24.0.0](https://github.com/apache/doris-operator/issues/272)

В этой версии представлен пользовательский ресурс `DorisDisaggregatedCluster` (DDC) для развёртывания кластеров Apache Doris с разделёнными хранением и вычислениями. Также расширена поддержка развёртываний с совместными хранением и вычислениями через `DorisCluster` (DCR).

Для DDC требуется Apache Doris версии 3.0.2 или новее.

### Новые возможности {#new-features}

#### DorisDisaggregatedCluster {#dorisdisaggregatedcluster}

- Добавлен доступ к модулю FoundationDB. [#186](https://github.com/apache/doris-operator/pull/186)
- Добавлено развёртывание модуля MetaService. [#194](https://github.com/apache/doris-operator/pull/194)
- Добавлено развёртывание модуля FE. [#199](https://github.com/apache/doris-operator/pull/199)
- Добавлено развёртывание модуля групп вычислительных узлов. [#185](https://github.com/apache/doris-operator/pull/185) [#189](https://github.com/apache/doris-operator/pull/189) [#192](https://github.com/apache/doris-operator/pull/192) [#197](https://github.com/apache/doris-operator/pull/197)
- Добавлена поддержка точки входа образа для компонентов Doris с разделёнными хранением и вычислениями. [#195](https://github.com/apache/doris-operator/pull/195) [#196](https://github.com/apache/doris-operator/pull/196)
- Добавлена поддержка уменьшения числа FE. [#225](https://github.com/apache/doris-operator/pull/225)
- Добавлены уменьшение масштаба групп вычислительных узлов и очистка ресурсов. [#238](https://github.com/apache/doris-operator/pull/238)
- Добавлена поддержка уменьшения числа FE через интерфейс SQL. [#255](https://github.com/apache/doris-operator/pull/255)
- Добавлена поддержка уменьшения масштаба групп вычислительных узлов через интерфейс SQL. [#256](https://github.com/apache/doris-operator/pull/256)

#### DorisCluster {#doriscluster}

- Порт Arrow Flight SQL открыт через внешние сервисы. [#251](https://github.com/apache/doris-operator/pull/251)

### Улучшения {#improvements}

#### DorisDisaggregatedCluster {#dorisdisaggregatedcluster-1}

- Добавлена возможность создавать группы вычислительных узлов с помощью `be.conf` и настройки PVC. [#198](https://github.com/apache/doris-operator/pull/198)
- Улучшены README и примеры YAML-файлов DDC. [#203](https://github.com/apache/doris-operator/pull/203) [#210](https://github.com/apache/doris-operator/pull/210) [#211](https://github.com/apache/doris-operator/pull/211) [#214](https://github.com/apache/doris-operator/pull/214)
- Примеры в README обновлены для использования последней версии. [#220](https://github.com/apache/doris-operator/pull/220)
- В оператор добавлен переключатель для включения развёртываний DDC. [#204](https://github.com/apache/doris-operator/pull/204)
- Для подготовки системных окружений добавлен `SystemInitialization`. [#212](https://github.com/apache/doris-operator/pull/212)
- Терминология групп вычислительных узлов приведена в соответствие с изменениями названий в Doris. [#215](https://github.com/apache/doris-operator/pull/215) [#245](https://github.com/apache/doris-operator/pull/245)
- Удалён CRD для реплик MetaService. [#227](https://github.com/apache/doris-operator/pull/227)
- CRD MetaService переработан и включён в CRD `DorisDisaggregatedCluster`. [#234](https://github.com/apache/doris-operator/pull/234)
- Для нового интерфейса SQL идентификатор группы вычислительных узлов изменён на `UniqueId`. [#239](https://github.com/apache/doris-operator/pull/239)
- Добавлены точка входа SQL-образа FE и хеш-код идентификатора кластера. [#249](https://github.com/apache/doris-operator/pull/249)
- Операции DDC перенесены с интерфейса HTTP на интерфейс SQL. [#254](https://github.com/apache/doris-operator/pull/254)
- Для проверок работоспособности pod добавлен параметр `timeoutSeconds`. [#257](https://github.com/apache/doris-operator/pull/257)
- Добавлен параметр `logNotStore`, позволяющий FE пропускать создание PVC для журналов. [#266](https://github.com/apache/doris-operator/pull/266)
- Обновлены примеры и документация DDC. [#268](https://github.com/apache/doris-operator/pull/268)

#### DorisCluster {#doriscluster-1}

- Для проверок работоспособности pod добавлен параметр `timeoutSeconds`. [#257](https://github.com/apache/doris-operator/pull/257)

#### Прочие изменения {#other-changes-4}

- Добавлены модульные тесты для общих утилит. [#226](https://github.com/apache/doris-operator/pull/226)
- Добавлены модульные тесты для моделей ресурсов и контроллеров. [#232](https://github.com/apache/doris-operator/pull/232)
- Обновлена конфигурация Helm chart для Artifact Hub. [#244](https://github.com/apache/doris-operator/pull/244)
- Название организации изменено с SelectDB на Apache. [#247](https://github.com/apache/doris-operator/pull/247)

### Исправления ошибок {#bug-fixes-14}

#### DorisDisaggregatedCluster {#dorisdisaggregatedcluster-2}

- Исправлены affinity pod и обработка указателей PVC в StatefulSet. [#209](https://github.com/apache/doris-operator/pull/209)
- Исправлен путь к хранилищу BE по умолчанию. [#243](https://github.com/apache/doris-operator/pull/243)
- Исправлены перезапуски pod при первоначальном развёртывании, вызванные дублированием переменной окружения `ms_token`. [#259](https://github.com/apache/doris-operator/pull/259)
- Исправлен путь к ConfigMap BE, используемый точкой входа образа. [#261](https://github.com/apache/doris-operator/pull/261)
- Исправлено развёртывание при nil-значении `electionNumber`; также устранено постоянное обновление сервисов. [#262](https://github.com/apache/doris-operator/pull/262) [#266](https://github.com/apache/doris-operator/pull/266)
- Исправлено повторяющееся согласование. [#263](https://github.com/apache/doris-operator/pull/263) [#265](https://github.com/apache/doris-operator/pull/265)
- Исправлен путь к кешу BE по умолчанию. [#266](https://github.com/apache/doris-operator/pull/266)

#### DorisCluster {#doriscluster-2}

- Предотвращён перезапуск pod Doris при обновлении оператора. [#226](https://github.com/apache/doris-operator/pull/226)
- При объединении общих массивов переменных окружения pod используются глубокие копии. [#236](https://github.com/apache/doris-operator/pull/236)
- Исправлены сбои клиента MySQL при уменьшении числа FE в разных пространствах имён. [#240](https://github.com/apache/doris-operator/pull/240)
- Исправлены сбои развёртывания, когда `electionNumber` имеет значение nil. [#260](https://github.com/apache/doris-operator/pull/260)

#### Прочие изменения {#other-changes-5}

- Исправлены модульные тесты моделей ресурсов для StatefulSet. [#252](https://github.com/apache/doris-operator/pull/252)

### Благодарности {#thanks-16}

- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)
- [hechao-ustc](https://github.com/hechao-ustc)

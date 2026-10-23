---
{
    "title": "Проверки операционной системы",
    "language": "ru",
    "description": "Перед развёртыванием Doris проверьте и настройте среду операционной системы согласно контрольному списку."
}
---

<!-- Knowledge type: Guide -->
<!-- Applicable scenarios: Pre-deployment checks / System configuration / Environment validation -->

Перед развёртыванием Doris выполните следующие проверки и настройки операционной системы:

| Что проверить | Цель |
|--------|------|
| Отключение раздела подкачки | Исключить влияние политик ядра на производительность |
| Отключение Transparent Huge Pages (THP) | Предотвратить фрагментацию памяти и колебания производительности |
| Увеличение числа областей виртуальной памяти | Избежать исчерпания файловых дескрипторов |
| Отключение энергосберегающего режима CPU | Обеспечить стабильную производительность при высокой нагрузке |
| Сброс сетевых соединений при переполнении | Избежать зависания соединений при большом числе одновременных подключений |
| Открытие портов / отключение межсетевого экрана | Обеспечить взаимодействие между компонентами |
| Увеличение числа файловых дескрипторов | Обеспечить работу с большим количеством файлов данных таблиц |
| Установка службы NTP | Обеспечить погрешность времени в метаданных < 5000 мс |

## Отключение раздела подкачки {#disable-swap-partition}

<!-- Knowledge type: Operation steps -->

Отключение подкачки не позволяет ядру перемещать данные в раздел подкачки, что могло бы повлиять на производительность Doris.

**Временное отключение** (действует до перезагрузки):

```bash
swapoff -a
```

**Постоянное отключение**: закомментируйте строку swap в `/etc/fstab` и перезагрузите систему, чтобы изменения вступили в силу.

```bash
# /etc/fstab
# <file system>        <dir>         <type>    <options>             <dump> <pass>
tmpfs                  /tmp          tmpfs     nodev,nosuid          0      0
/dev/sda1              /             ext4      defaults,noatime      0      1
# /dev/sda2              none          swap      defaults              0      0
/dev/sda3              /home         ext4      defaults,noatime      0      2
```

## Отключение Transparent Huge Pages {#disable-transparent-huge-pages}

<!-- Knowledge type: Operation steps -->

Отключение THP (Transparent Huge Pages) уменьшает фрагментацию памяти и обеспечивает стабильное использование памяти в Doris.

**Временное отключение**:

```bash
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```

**Постоянное отключение**:

```bash
cat >> /etc/rc.d/rc.local << EOF
   echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
   echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
EOF
chmod +x /etc/rc.d/rc.local
```

## Увеличение числа областей виртуальной памяти {#increase-virtual-memory-areas}

<!-- Knowledge type: Operation steps -->

Увеличение числа VMA (областей виртуальной памяти) предотвращает сбои Doris с ошибками `mmap` / `Cannot allocate memory` при превышении лимита VMA для отдельного процесса.

```bash
cat >> /etc/sysctl.conf << EOF
vm.max_map_count = 2000000
EOF

sysctl -p
```

## Отключение энергосберегающего режима CPU {#disable-cpu-power-saving-mode}

<!-- Knowledge type: Operation steps -->

Отключение энергосберегающего режима обеспечивает стабильную частоту CPU при высокой нагрузке. Если CPU не поддерживает Scaling Governor, этот шаг можно пропустить.

```bash
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## Сброс сетевых соединений при переполнении {#reset-on-network-connection-overflow}

<!-- Knowledge type: Operation steps -->

Включение `tcp_abort_on_overflow` немедленно прерывает соединения при переполнении, предотвращая их длительное зависание при высокой нагрузке.

```bash
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_abort_on_overflow=1
EOF

sysctl -p
```

## Открытие портов {#open-ports}

<!-- Knowledge type: Operation steps -->

Если порт недоступен, проверьте, не блокирует ли его межсетевой экран:

```bash
sudo systemctl stop firewalld.service
sudo systemctl disable firewalld.service
```

Либо откройте соответствующие порты согласно настройкам портов Doris.

## Увеличение лимита файловых дескрипторов {#increase-file-handle-limits}

<!-- Knowledge type: Operation steps -->

Для управления данными таблиц Doris использует большое количество файлов, поэтому необходимо увеличить лимит файловых дескрипторов.

```bash
vi /etc/security/limits.conf
* soft nofile 1000000
* hard nofile 1000000
```

После вступления изменения в силу необходимо перезапустить сеанс.

## Установка службы NTP {#install-ntp-service}

<!-- Knowledge type: Operation steps -->

Убедитесь, что часы всех машин в кластере синхронизированы. Погрешность времени в метаданных должна быть < 5000 мс.

```bash
sudo systemctl start ntpd.service
sudo systemctl enable ntpd.service
```

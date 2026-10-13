---
{
    "title": "オペレーティングシステムの確認",
    "language": "ja",
    "description": "Doris のデプロイ前に、チェックリストに従って OS 環境を確認、設定します。"
}
---

<!-- Knowledge type: Guide -->
<!-- Applicable scenarios: Pre-deployment checks / System configuration / Environment validation -->

Doris をデプロイする前に、次の OS 項目を確認して設定してください。

| 確認項目 | 目的 |
|--------|------|
| スワップパーティションを無効にする | 性能に影響するカーネルの動作を避ける |
| Transparent Huge Pages（THP）を無効にする | メモリ断片化と性能の変動を防ぐ |
| 仮想メモリ領域の上限を増やす | ファイルハンドルの不足を防ぐ |
| CPU の省電力モードを無効にする | 高負荷時の性能を安定させる |
| ネットワーク接続があふれた場合にリセットする | 高並列時に接続が長時間待機するのを防ぐ |
| ポートを開く、またはファイアウォールを無効にする | コンポーネント間の通信を確保する |
| ファイルハンドルの上限を増やす | 多数のテーブルデータファイルを扱えるようにする |
| NTP サービスをインストールする | メタデータの時刻精度を 5000ms 未満に保つ |

## スワップパーティションの無効化

<!-- Knowledge type: Operation steps -->

スワップを無効にすると、カーネルがデータをスワップパーティションに移して Doris の性能を低下させることを防げます。

**一時的に無効化**（再起動すると元に戻ります）：

```bash
swapoff -a
```

**永続的に無効化**：`/etc/fstab` のスワップ行をコメントアウトし、再起動して反映します。

```bash
# /etc/fstab
# <file system>        <dir>         <type>    <options>             <dump> <pass>
tmpfs                  /tmp          tmpfs     nodev,nosuid          0      0
/dev/sda1              /             ext4      defaults,noatime      0      1
# /dev/sda2              none          swap      defaults              0      0
/dev/sda3              /home         ext4      defaults,noatime      0      2
```

## Transparent Huge Pages の無効化

<!-- Knowledge type: Operation steps -->

THP（Transparent Huge Pages）を無効にすると、メモリの断片化が減り、Doris のメモリ使用が安定します。

**一時的に無効化**：

```bash
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```

**永続的に無効化**：

```bash
cat >> /etc/rc.d/rc.local << EOF
   echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
   echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
EOF
chmod +x /etc/rc.d/rc.local
```

## 仮想メモリ領域の上限を増やす

<!-- Knowledge type: Operation steps -->

VMA（仮想メモリ領域）の上限を増やすと、プロセスごとの VMA 上限を超えたときに Doris が `mmap` / `Cannot allocate memory` エラーで失敗するのを防げます。

```bash
cat >> /etc/sysctl.conf << EOF
vm.max_map_count = 2000000
EOF

sysctl -p
```

## CPU の省電力モードを無効にする

<!-- Knowledge type: Operation steps -->

省電力モードを無効にすると、高負荷時の CPU 周波数が安定します。CPU が Scaling Governor に対応していない場合は、この手順を省略できます。

```bash
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## ネットワーク接続があふれた場合にリセットする

<!-- Knowledge type: Operation steps -->

`tcp_abort_on_overflow` を有効にすると、接続があふれた際に即座に切断し、高負荷時に接続が長時間待機するのを防げます。

```bash
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_abort_on_overflow=1
EOF

sysctl -p
```

## ポートを開く

<!-- Knowledge type: Operation steps -->

ポートに接続できない場合は、ファイアウォールを調べてください。

```bash
sudo systemctl stop firewalld.service
sudo systemctl disable firewalld.service
```

または、Doris のポート設定に合わせて必要なポートを開いてください。

## ファイルハンドルの上限を増やす

<!-- Knowledge type: Operation steps -->

Doris は多数のファイルでテーブルデータを管理するため、ファイルハンドルの上限を増やす必要があります。

```bash
vi /etc/security/limits.conf
* soft nofile 1000000
* hard nofile 1000000
```

変更を有効にするには、セッションを再起動する必要があります。

## NTP サービスのインストール

<!-- Knowledge type: Operation steps -->

クラスター内のすべてのマシンで時刻を同期してください。メタデータの時刻精度は 5000ms 未満にする必要があります。

```bash
sudo systemctl start ntpd.service
sudo systemctl enable ntpd.service
```

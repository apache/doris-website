---
{
  "title": "OS チェック",
  "language": "ja",
  "description": "Dorisをデプロイする際は、以下のオペレーティングシステム設定を確認してください："
}
---
Dorisを展開する際は、以下のオペレーティングシステム設定を確認してください：

- swapパーティションを無効化する
- transparent huge pagesを無効化する
- システムに十分な仮想メモリ空間があることを確認する
- CPUパワーセービングモードを無効化する
- オーバーフロー時に新しいネットワーク接続がリセットされることを確認する
- Doris関連のポートが開放されているか、ファイアウォールが無効化されていることを確認する
- システムが十分な数のオープンファイルディスクリプタを許可することを確認する
- クロック同期のためのNTPサービスをインストールおよび設定する

## Swapパーティションの無効化

Dorisを展開する際は、swapパーティションを無効化することを推奨します。カーネルはメモリ圧迫を検知した際にメモリデータをswap領域に移動させる可能性がありますが、カーネルのアプリケーション動作に対する理解が限定的であるため、これがDorisのパフォーマンスに悪影響を与える可能性があります。

一時的にswapを無効化するには（再起動後にswapは再度有効化されます）：

```bash
swapoff -a
```
swapを永続的に無効にするには、`/etc/fstab`を編集してswapパーティションエントリをコメントアウトし、マシンを再起動します：

```bash
# /etc/fstab
# <file system>        <dir>         <type>    <options>             <dump> <pass>
tmpfs                  /tmp          tmpfs     nodev,nosuid          0      0
/dev/sda1              /             ext4      defaults,noatime      0      1
# /dev/sda2              none          swap      defaults              0      0
/dev/sda3              /home         ext4      defaults,noatime      0      2
```
## Transparent Huge Pagesの無効化

高負荷、低レイテンシのシナリオでは、パフォーマンスの劣化とメモリの断片化を回避し、Dorisの安定したメモリ使用量を確保するために、Transparent Huge Pages (THP)を無効化することが推奨されます。

以下のコマンドを使用してTHPを一時的に無効化します：

```bash
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```
THPを永続的に無効にするには、再起動後に確実に有効になるよう、以下のコマンドを`/etc/rc.d/rc.local`に追加してください：

```bash
cat >> /etc/rc.d/rc.local << EOF
   echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
   echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
EOF
chmod +x /etc/rc.d/rc.local
```
## 十分な仮想メモリ領域の確保

Dorisが大容量のデータセットを処理できるようにするため、システムには十分な仮想メモリ空間が必要です。適切なメモリマッピングがないと、Dorisは起動時や実行時にToo many open filesのようなエラーが発生する可能性があります。

以下のコマンドで仮想メモリ領域を最低2000000に恒久的に変更でき、即座に有効になります：

```bash
cat >> /etc/sysctl.conf << EOF
vm.max_map_count = 2000000
EOF

# Take effect immediately
sysctl -p
```
## CPU省電力モードを無効化する

CPU省電力モードを無効化することで、高負荷時に安定した高性能を確保し、CPU周波数の低下による変動や遅延を防ぐことができます。

以下のコマンドを使用してCPU governorを"performance"に設定し、省電力モードを無効化します：

```bash
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```
## ネットワークオーバーフロー時の新規接続のリセット

TCP接続バッファがオーバーフローした際、新規接続を直ちにリセットするようにしてください。これにより、高負荷時のバッファブロッキングを防ぎ、応答性と安定性を向上させます。

以下のコマンドを使用してシステムを恒久的に設定し、新規接続を自動的にリセットすることができ、即座に効果が現れます：

```bash
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_abort_on_overflow=1
EOF

# Take effect immediately
sysctl -p
```
## Doris関連ポートを開く
Doris関連のポートがブロックされている場合、ファイアウォールを無効にして原因かどうかを確認できます。ファイアウォールが問題の場合は、Dorisコンポーネントの関連ポートを開いてください。

```bash
sudo systemctl stop firewalld.service
sudo systemctl disable firewalld.service
```
## システムのオープンファイルディスクリプタ制限の増加

Dorisは大量のファイルを管理するため、システムのファイルディスクリプタ制限を増加する必要があります。

オープンファイルの最大数を変更するには、`/etc/security/limits.conf`に以下を追加してください：

```bash
vi /etc/security/limits.conf 
* soft nofile 1000000
* hard nofile 1000000
```
## クラスターデプロイメントマシンにNTPサービスがインストールされていることを確認する

Dorisでは、メタデータのタイムスタンプ精度が5000ms以内である必要があります。クラスター内のすべてのノードで時刻を一致させ、メタデータの不整合を避けるために、NTPサービスを使用してすべてのマシンでクロックを同期する必要があります。

以下のコマンドを使用してNTPサービスを開始し、有効にします：

```bash
sudo systemctl start ntpd.service
sudo systemctl enable ntpd.service
```

---
{
  "title": "OSチェック",
  "language": "ja",
  "description": "Dorisをデプロイする際は、以下のオペレーティングシステム設定を確認してください："
}
---
Dorisを展開する際は、以下のオペレーティングシステム設定を確認してください：

- スワップパーティションを無効にする
- transparent huge pagesを無効にする
- システムに十分な仮想メモリ領域があることを確認する
- CPUの省電力モードを無効にする
- オーバーフロー時に新しいネットワーク接続がリセットされることを確認する
- Doris関連のポートが開放されているか、ファイアウォールが無効になっていることを確認する
- システムが十分な数のオープンファイルディスクリプタを許可することを確認する
- クロック同期のためにNTPサービスをインストールして設定する

## スワップパーティションの無効化

Dorisを展開する際は、スワップパーティションを無効にすることを推奨します。カーネルはメモリ圧迫を検知すると、メモリデータをスワップ領域に移動する場合がありますが、カーネルのアプリケーション動作に対する理解が限定的であるため、これはDorisのパフォーマンスに悪影響を与える可能性があります。

スワップを一時的に無効にするには（再起動後にスワップは再び有効になります）：

```bash
swapoff -a
```
swapを永続的に無効にするには、`/etc/fstab`を編集してswapパーティションのエントリをコメントアウトし、マシンを再起動してください：

```bash
# /etc/fstab
# <file system>        <dir>         <type>    <options>             <dump> <pass>
tmpfs                  /tmp          tmpfs     nodev,nosuid          0      0
/dev/sda1              /             ext4      defaults,noatime      0      1
# /dev/sda2              none          swap      defaults              0      0
/dev/sda3              /home         ext4      defaults,noatime      0      2
```
## Transparent Huge Pagesを無効にする

高負荷、低レイテンシのシナリオでは、パフォーマンスの低下とメモリの断片化を回避し、Dorisの安定したメモリ使用量を確保するために、Transparent Huge Pages（THP）を無効にすることが推奨されます。

以下のコマンドを使用してTHPを一時的に無効にします：

```bash
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```
THPを永続的に無効にするには、再起動後に有効になるよう以下のコマンドを`/etc/rc.d/rc.local`に追加してください：

```bash
cat >> /etc/rc.d/rc.local << EOF
   echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
   echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
EOF
chmod +x /etc/rc.d/rc.local
```
## 十分な仮想メモリ領域の確保

Dorisが大容量のデータセットを処理できるようにするため、システムには十分な仮想メモリ空間が必要です。適切なメモリマッピングがない場合、Dorisは起動時または実行時にToo many open filesのようなエラーが発生する可能性があります。

以下のコマンドで仮想メモリ領域を最低2000000に永続的に変更でき、即座に有効になります：

```bash
cat >> /etc/sysctl.conf << EOF
vm.max_map_count = 2000000
EOF

# Take effect immediately
sysctl -p
```
## CPU節電モードの無効化

CPU節電モードを無効化することで、高負荷時に安定した高性能を確保し、CPU周波数の低下による変動や遅延を防ぎます。

以下のコマンドを使用してCPUガバナーを"performance"に設定し、節電モードを無効化します：

```bash
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```
## ネットワークオーバーフロー時の新規接続のリセット

TCP接続バッファがオーバーフローした際に、新規接続を即座にリセットすることを確実にします。これにより、高負荷時のバッファブロッキングを防ぎ、応答性と安定性を向上させます。

以下のコマンドでシステムを恒久的に設定し、新規接続を自動的にリセットするようにできます。この設定は即座に有効になります：

```bash
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_abort_on_overflow=1
EOF

# Take effect immediately
sysctl -p
```
## Doris関連ポートを開放する
Doris関連のポートがブロックされている場合、ファイアウォールを無効にして原因かどうかを確認してみることができます。ファイアウォールが問題の場合、Dorisコンポーネント用の関連ポートを開放してください。

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
## クラスター展開マシンにNTPサービスがインストールされていることを確認する

Dorisでは、メタデータのタイムスタンプ精度が5000ms以内である必要があります。クラスター内のすべてのノードで時刻を一致させ、メタデータの不整合を回避するために、NTPサービスを使用してすべてのマシン間でクロックを同期する必要があります。

以下のコマンドを使用してNTPサービスを開始し、有効にします：

```bash
sudo systemctl start ntpd.service
sudo systemctl enable ntpd.service
```

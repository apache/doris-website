---
{
  "title": "コンパクション原理",
  "language": "ja",
  "description": "Apache DorisはLSM-Treeベースのストレージエンジンを使用しており、書き込み時にデータは新しいデータファイルに順次追記されます。"
}
---
## 1. Compactionの役割

Apache DorisはLSM-Tree ベースのストレージエンジンを使用しており、書き込み時には既存ファイルを直接更新するのではなく、新しいデータファイルに順次データが追加されます。
この設計により高い書き込み性能が保証されますが、時間の経過とともに異なるバージョンとサイズのデータファイルが蓄積され、以下の問題が発生します：
- クエリ性能の低下：クエリ時に複数ファイル間での多方向マージソートが必要
- ストレージ容量の無駄：削除マークが付いたデータや重複データを含有

Compaction（データ圧縮・整理）は、これらの問題を解決する重要なメカニズムです。バックグラウンドでデータファイルを自動的にマージ・再書き込みし、同一プライマリキーや隣接範囲のデータをより少数でより整理されたファイルに集約し、削除済みまたは期限切れデータをクリーンアップします。
これにより高いクエリ性能を維持すると同時に、ストレージ容量利用率を最適化します。

Dorisでは、Compactionは継続的かつ自動的なプロセスであり、手動でのトリガーは不要です。ただし、その原理と動作状況を理解することで、高同時実行・ビッグデータシナリオでの性能チューニングに役立ちます。

### 1.1 クエリ性能の向上

Dorisのデータインポートメカニズム：各インポートは、対象パーティションの各tabletに対してrowsetを生成します。
- 各rowsetは0からn個のsegmentを含有
- 各segmentはディスク上の順序付けされたファイルに対応

クエリ時、ストレージレイヤーは集約または重複排除された結果を返す必要があるため、複数のrowset/segmentのデータに対して多方向マージソートを実行します。
rowset数が増加するにつれて、マージパス数も増加し、クエリ効率の低下を招きます。

Compactionの役割：
- BEノードはバックグラウンドでこれらのrowsetを継続的にマージし、マージパス数を減少させることでクエリ効率を向上
- Compactionはtablet粒度で実行

### 1.2 データクリーニング

性能向上に加えて、Compactionはデータクリーニング責務も担当します：
1. 削除マーク付きデータのクリーニング
   - DorisのDELETE操作はデータを即座に削除せず、delete rowset（削除述語のみを含み、実際のデータは含まない）を生成します。Compaction時に、これらの述語にマッチするデータがフィルタリングされ、実際に削除されます
   - Merge-on-Write型テーブルの場合、削除マークが付いたデータもCompactionフェーズでクリーニングされます
2. 重複データの除去
   - Aggregateモデル：同一キーの行を集約
   - Uniqueモデル：同一キーの最新データのみを保持

これによりデータの正確性を確保すると同時に、ストレージ容量使用量を削減します。

## 2. 主要概念

### 2.1 Compaction Score

Compaction Scoreは、tablet内のデータ無秩序度を測定する指標であり、Compaction優先度を決定する基準でもあります。
これはクエリ実行時にそのtabletが参加する必要があるマージパス数と等価です。
- Scoreが高いほどクエリオーバーヘッドが大きい
- そのため、CompactionはScoreの高いtabletを優先的に処理

例：

```
"rowsets": [
    "[0-100] 3 DATA NONOVERLAPPING 0200000000001c30804822f519cf378fbe6f162b7de393a6 500.32 MB",
    "[101-101] 2 DATA OVERLAPPING 02000000000021d0804822f519cf378fbe6f162b7de393a6 180.46 MB",
    "[102-102] 1 DATA NONOVERLAPPING 0200000000002211804822f519cf378fbe6f162b7de393a6 50.59 MB"
]
```
- [0-100] rowsetは3つのセグメントがありますが重複はありません → 1つのパスを占有
- [101-101] rowsetは2つのセグメントがあり重複があります → 2つのパスを占有
- [102-102] rowsetは1つのパスを占有
したがって、このtabletのCompaction Score = 4です。

### 2.2 Compactionタイプ

- Cumulative Compaction: 小さな増分rowsetをマージしてマージ効率を向上させる
- Base Compaction: 特定のrowset以前のすべてのrowsetを新しいrowsetにマージする
- Full Compaction: すべてのrowsetをマージする
- Cumulative Point: BaseとCumulative Compactionを分ける境界点

理想的な戦略は: まずCumulative Compactionを通じて小さなrowsetをマージし、一定の規模まで蓄積した後、Base Compactionを実行することです。

## 3. Compaction戦略

### 3.1 Tablet選択戦略

CompactionはクエリパフォーマンスV向上を目的としているため、最も高いCompaction Scoreを持つtabletを優先します。

### 3.2 Rowset選択戦略

対象tabletを特定した後、Compactionに適したrowsetを選択する必要があります。原則は以下の通りです:
- 計算負荷を最小化しつつCompaction Scoreをできるだけ減らす
- 書き込み増幅率を制御する
- システムリソースの過度な占有を避ける

主な考慮事項:
1. 費用対効果
   - Cumulative Compaction: マージに参加するrowsetのサイズの差が大きすぎてはならない; 最大rowsetサイズ ≤ 合計の半分
   - Base Compaction: Base rowsetと他の候補rowsetの比率が ≥ 0.3のときのみトリガー
2. 書き込み増幅制御
   - Cumulative Compaction:
     - 候補rowset Score > 5のときのみトリガー
     - データ量がpromotion sizeを超えるときのみトリガー
   - Base Compaction: 候補rowset Score > 5のときのみトリガー
3. システムリソース制御
   - 単一Cumulative Compactionでのrowset数 ≤ 1000
   - 単一Base Compactionでのrowset数 ≤ 20

## 4. Compactionプロセス

![compaction_workflow](/images/compaction_workflow.png)

Compactionの実行はプロデューサー・コンシューマーモデルに従います:
1. Tabletスキャンとタスク生成
   - Compactionタスクプロデューサースレッドが定期的にすべてのtabletをスキャンし、それらのCompaction Scoreを計算する
   - 各ラウンドで各ディスクから最も高いScoreのtabletを選択する
   - Base Compactionは10ラウンドごとに選択され、他の9ラウンドはCumulative Compaction
2. 並行制御
   - 現在のディスクのCompactionタスク数が設定制限を超えているかチェック
   - 超えていなければ、tabletがCompactionに入ることを許可
3. Rowset選択
   - 類似サイズの連続したrowsetを入力として選択
   - データ量の大きな差異による非効率的な多方向マージを回避
4. タスク送信
   - tabletと候補rowsetをCompaction Taskにパッケージ
   - タスクタイプ（Base/Cumulative）に基づいて対応するスレッドプールキューに送信
5. タスク実行
   - Compactionスレッドプールがキューからタスクを取得
   - 多方向マージソートを実行し、複数のrowsetを新しいrowsetにマージ

### 5. 一般的なCompactionパラメーター

| パラメーター名 | 意味 | デフォルト値 |
|---|---|---|
| tive_compaction_rounds_for_each_base_compaction_round | 1つのbase compactionタスクが生成される前にいくつのラウンドのcumulative compactionタスクが生成されるか。このパラメーターを調整することで、cumulativeとbase compactionタスクの比率を制御できます | 9 |
| compaction_task_num_per_fast_disk | SSDディスクあたりの最大同時compactionタスク数 | 8 |
| compaction_task_num_per_disk | HDDディスクあたりの最大同時compactionタスク数 | 4 |
| max_base_compaction_threads | Base compactionスレッドプールのワーカースレッド数 | 4 |
| max_cumu_compaction_threads | Cumulative compactionスレッドプールのワーカースレッド数。-1はスレッドプールサイズがディスク数によって決定され、ディスクあたり1スレッドであることを意味します | -1 |
| base_compaction_min_rowset_num | base compactionをトリガーする条件。rowset数でトリガーされる場合、これはbase compactionに必要な最小rowset数です | 5 |
| base_compaction_max_compaction_score | base compactionに参加するrowsetの最大compaction score | 20 |
| cumulative_compaction_min_deltas | cumulative compactionに参加するrowsetの最小compaction score | 5 |
| cumulative_compaction_max_deltas | cumulative compactionに参加するrowsetの最大compaction score | 1000 |

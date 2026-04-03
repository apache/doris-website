---
{
  "title": "リリース 1.1.5",
  "language": "ja",
  "description": "このリリースでは、DorisチームはDelta 1.1.4から約36の問題またはパフォーマンス改善を修正しました。このリリースは1のbugfixリリースです。"
}
---
このリリースでは、Dorisチームは1.1.4以降、約36の問題またはパフォーマンス改善を修正しました。このリリースは1.1のバグフィックスリリースであり、すべてのユーザーにこのリリースへのアップグレードを推奨します。

# 動作の変更

「select year(birthday) as birthday」のようにエイリアス名が元の列名と同じで、それをgroup by、order by、having句で使用する場合、これまでのdorisの動作はMySQLとは異なっていました。このリリースでは、MySQLの動作に従うようにしました。Group by句とhaving句では最初に元の列を使用し、order byでは最初にエイリアスを使用します。これは少し混乱を招く可能性があるため、ここで簡単なアドバイスがあります。元の列名と同じエイリアスは使用しない方が良いでしょう。

# 機能

murmur_hash3_64のサポートを追加。[#14636](https://github.com/apache/doris/pull/14636)

# 改善

パフォーマンス向上のためconvert_tzにタイムゾーンキャッシュを追加。[#14616](https://github.com/apache/doris/pull/14616)

show句を呼び出す際にテーブル名で結果をソート。[#14492](https://github.com/apache/doris/pull/14492)

# バグ修正

select句にif定数式がある場合のコアダンプを修正。[#14858](https://github.com/apache/doris/pull/14858)

ColumnVector::insert_date_columnがクラッシュする可能性がある問題を修正。[#14839](https://github.com/apache/doris/pull/14839)

high_priority_flush_thread_num_per_storeのデフォルト値を6に更新し、ロードパフォーマンスが向上します。[#14775](https://github.com/apache/doris/pull/14775)

quick compactionのコア問題を修正。[#14731](https://github.com/apache/doris/pull/14731)

パーティション列が重複キーではない場合、spark loadでIndexOutOfBoundsエラーが発生する問題を修正。[#14661](https://github.com/apache/doris/pull/14661)

VCollectorIteratorのメモリリーク問題を修正。[#14549](https://github.com/apache/doris/pull/14549)

シーケンス列がある場合のcreate table likeを修正。[#14511](https://github.com/apache/doris/pull/14511)

total_bytesの使用はCPUを大量に消費するため、バッチサイズの計算にはavg rowsetを使用するように変更。[#14273](https://github.com/apache/doris/pull/14273)

結合条件付きright outer joinのコア問題を修正。[#14821](https://github.com/apache/doris/pull/14821)

tcmallocガベージコレクションのポリシーを最適化。[#14777](https://github.com/apache/doris/pull/14777) [#14738](https://github.com/apache/doris/pull/14738) [#14374](https://github.com/apache/doris/pull/14374)

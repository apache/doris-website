---
{
  "title": "リリース 1.1.5",
  "language": "ja",
  "description": "このリリースでは、DorisチームはDoris 1.1.4以降約36の問題やパフォーマンス改善を修正しました。このリリースはバージョン1のバグフィックスリリースです。"
}
---
このリリースでは、Doris Teamは1.1.4以降約36の問題またはパフォーマンス改善を修正しました。このリリースは1.1のバグ修正リリースであり、すべてのユーザーにこのリリースへのアップグレードを推奨します。

# 動作変更

"select year(birthday) as birthday"のようにエイリアス名が元のカラム名と同じで、それをgroup by、order by、having句で使用する場合、dorisの動作は過去にMySQLと異なっていました。このリリースでは、MySQLの動作に従うようにしました。Group byとhaving句では最初に元のカラムを使用し、order byではエイリアスを最初に使用します。ここは少し混乱するかもしれませんので、簡単なアドバイスとして、元のカラム名と同じエイリアスは使用しない方が良いでしょう。

# 機能

murmur_hash3_64のサポートを追加。[#14636](https://github.com/apache/doris/pull/14636)

# 改善

パフォーマンス向上のためconvert_tzにタイムゾーンキャッシュを追加。[#14616](https://github.com/apache/doris/pull/14616)

show句呼び出し時にテーブル名で結果をソート。[#14492](https://github.com/apache/doris/pull/14492)

# バグ修正

select句にif定数式がある場合のcoredumpを修正。[#14858](https://github.com/apache/doris/pull/14858)

ColumnVector::insert_date_columnがクラッシュする可能性がありました。[#14839](https://github.com/apache/doris/pull/14839)

high_priority_flush_thread_num_per_storeのデフォルト値を6に更新し、ロードパフォーマンスが改善されます。[#14775](https://github.com/apache/doris/pull/14775)

quick compactionのcoreを修正。[#14731](https://github.com/apache/doris/pull/14731)

パーティションカラムがduplicate keyでない場合、spark loadでIndexOutOfBoundsエラーが発生していました。[#14661](https://github.com/apache/doris/pull/14661)

VCollectorIteratorでのメモリリーク問題を修正。[#14549](https://github.com/apache/doris/pull/14549)

sequence columnがある場合のcreate table likeを修正。[#14511](https://github.com/apache/doris/pull/14511)

CPUを大量消費するtotal_bytesの使用ではなく、avg rowsetを使用してバッチサイズを計算するように変更。[#14273](https://github.com/apache/doris/pull/14273)

conjunctでのright outer joinのcoreを修正。[#14821](https://github.com/apache/doris/pull/14821)

tcmalloc gcのポリシーを最適化。[#14777](https://github.com/apache/doris/pull/14777) [#14738](https://github.com/apache/doris/pull/14738) [#14374](https://github.com/apache/doris/pull/14374)

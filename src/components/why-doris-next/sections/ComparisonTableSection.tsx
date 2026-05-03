import React, { JSX } from 'react';
import './ComparisonTableSection.scss';

export interface TableRow {
    label: string;
    doris: string[];
    competitor: string[];
    dorisStrong: boolean[];
}

export interface ComparisonTableSectionProps {
    rows: TableRow[];
    sub: string;
    competitorName: string;
    competitorMark: string;
}

function getLogoSrc(name: string): string {
    if (name === 'ClickHouse') {
        return '/images/ecomsystem-log/clickhouse-small.svg';
    }

    if (name === 'Elasticsearch') {
        return '/images/ecomsystem-log/es-small.svg';
    }

    if (name === 'Trino / Presto') {
        return '/images/ecomsystem-log/trino-small.png';
    }

    return '/images/ecomsystem-log/doris-small.webp';
}

// The `--ch` SCSS modifier was originally the "ClickHouse column" modifier;
// since the page only ever shows one competitor at a time, we reuse it as
// the generic "competitor column" treatment to avoid touching styles.
export function ComparisonTableSection({
    rows,
    sub,
    competitorName,
}: ComparisonTableSectionProps): JSX.Element {
    const dorisLogoSrc = '/images/ecomsystem-log/doris-small.webp';
    const competitorLogoSrc = getLogoSrc(competitorName);

    return (
        <section className="cmp-next__card cmp-tbl">
            <div className="cmp-next__card-head">
                <p className="cmp-next__card-sub">{sub}</p>
            </div>

            <div className="cmp-tbl__wrap">
                <div className="cmp-tbl__head">
                    <div className="cmp-tbl__col">
                        <span className="cmp-tbl__col-label">DIMENSION</span>
                    </div>
                    <div className="cmp-tbl__col">
                        <span className="cmp-tbl__col-name cmp-tbl__col-name--doris">
                            <span className="cmp-tbl__col-mark cmp-tbl__col-mark--doris" aria-hidden="true">
                                <img className="cmp-tbl__col-logo" src={dorisLogoSrc} alt="" draggable={false} />
                            </span>
                            Apache Doris
                            <span className="cmp-tbl__col-badge">RECOMMENDED</span>
                        </span>
                    </div>
                    <div className="cmp-tbl__col">
                        <span className="cmp-tbl__col-name cmp-tbl__col-name--ch">
                            <span className="cmp-tbl__col-mark cmp-tbl__col-mark--ch" aria-hidden="true">
                                <img className="cmp-tbl__col-logo" src={competitorLogoSrc} alt="" draggable={false} />
                            </span>
                            {competitorName}
                        </span>
                    </div>
                </div>

                {rows.map((row, i) => (
                    <div key={row.label} className="cmp-tbl__row">
                        <div className="cmp-tbl__cell cmp-tbl__cell--label">
                            <span className="cmp-tbl__label-num">0{i + 1}</span>
                            <span className="cmp-tbl__label-text">{row.label}</span>
                        </div>
                        <div className="cmp-tbl__cell cmp-tbl__cell--doris">
                            <span className="cmp-tbl__cell-tag cmp-tbl__cell-tag--doris" aria-hidden="true">
                                <span className="cmp-tbl__cell-tag-mark">
                                    <img className="cmp-tbl__cell-tag-logo" src={dorisLogoSrc} alt="" draggable={false} />
                                </span>
                                Apache Doris
                            </span>
                            <ul className="cmp-tbl__bullets">
                                {row.doris.map((b, j) => (
                                    <li key={j}>
                                        {row.dorisStrong[j] ? <strong>{b}</strong> : b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="cmp-tbl__cell cmp-tbl__cell--ch">
                            <span className="cmp-tbl__cell-tag cmp-tbl__cell-tag--ch" aria-hidden="true">
                                <span className="cmp-tbl__cell-tag-mark">
                                    <img className="cmp-tbl__cell-tag-logo" src={competitorLogoSrc} alt="" draggable={false} />
                                </span>
                                {competitorName}
                            </span>
                            <ul className="cmp-tbl__bullets">
                                {row.competitor.map((b, j) => <li key={j}>{b}</li>)}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

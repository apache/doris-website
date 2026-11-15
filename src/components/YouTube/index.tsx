import React, {useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import './styles.scss';

interface YouTubeProps {
    videoId: string;
    title: string;
    poster: string;
}

export default function YouTube({videoId, title, poster}: YouTubeProps): JSX.Element {
    const [playing, setPlaying] = useState(false);
    const playerRef = useRef<HTMLIFrameElement>(null);
    const posterUrl = useBaseUrl(poster);
    const id = encodeURIComponent(videoId);

    useEffect(() => {
        if (playing) playerRef.current?.focus();
    }, [playing]);

    return (
        <figure className="doris-youtube">
            <div className="doris-youtube__frame">
                {playing ? (
                    <iframe
                        ref={playerRef}
                        className="doris-youtube__player"
                        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`}
                        title={title}
                        width="960"
                        height="540"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                    />
                ) : (
                    <button
                        type="button"
                        className="doris-youtube__preview"
                        aria-label={translate({id: 'youtube.play', message: 'Play video: {title}'}, {title})}
                        onClick={() => setPlaying(true)}
                    >
                        <img className="doris-youtube__poster" src={posterUrl} alt="" width="1920" height="1080" loading="lazy" decoding="async" />
                        <span className="doris-youtube__play" aria-hidden="true">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </span>
                    </button>
                )}
            </div>
            <figcaption className="doris-youtube__caption">
                <span>{title}</span>
                <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">
                    {translate({id: 'youtube.watch', message: 'Watch on YouTube'})} <span aria-hidden="true">↗</span>
                </a>
            </figcaption>
        </figure>
    );
}

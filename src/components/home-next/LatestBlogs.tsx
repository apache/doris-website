import React, { JSX, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import { translate } from '@docusaurus/Translate';
import { usePluginData } from '@docusaurus/useGlobalData';
import { useDateTimeFormat } from '@docusaurus/theme-common/internal';
import { useLocalizedRoute } from '@site/src/utils/useLocalizedRoute';
import './LatestBlogs.scss';

interface RecentBlogPost {
    title: string;
    permalink: string;
    contentLocale: string;
    date: string;
    image: string | null;
}

export function LatestBlogs(): JSX.Element | null {
    const data = usePluginData('recent-blog-posts') as { posts: RecentBlogPost[] } | undefined;
    const posts = useMemo(() => data?.posts.slice(0, 3) ?? [], [data]);
    const localize = useLocalizedRoute();
    const dateFormat = useDateTimeFormat({ month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' });
    const trackRef = useRef<HTMLUListElement>(null);
    const [controls, setControls] = useState({ previous: false, next: false });

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return undefined;

        const updateControls = () => {
            const previous = track.scrollLeft > 2;
            const next = track.scrollWidth - track.clientWidth - track.scrollLeft > 2;
            setControls(current => current.previous === previous && current.next === next
                ? current : { previous, next });
        };

        track.scrollLeft = 0;
        updateControls();
        track.addEventListener('scroll', updateControls, { passive: true });
        const observer = new ResizeObserver(updateControls);
        observer.observe(track);
        return () => {
            track.removeEventListener('scroll', updateControls);
            observer.disconnect();
        };
    }, [posts]);

    const move = (direction: number) => {
        const track = trackRef.current;
        if (!track) return;
        const first = track.children[0] as HTMLElement | undefined;
        const second = track.children[1] as HTMLElement | undefined;
        const step = first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
        track.scrollBy({
            left: direction * step,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            move(event.key === 'ArrowLeft' ? -1 : 1);
        }
    };

    if (!posts.length) return null;

    return (
        <section className="homepage-latest-blogs" aria-label={translate({
            id: 'homepage.blogs.recent', message: 'Recent blog posts',
        })}>
            <div className="home-next-container homepage-latest-blogs__inner">
                <ul
                    ref={trackRef}
                    id="homepage-latest-blogs-track"
                    className="homepage-latest-blogs__track"
                    tabIndex={0}
                    aria-label={translate({
                        id: 'homepage.blogs.browse', message: 'Scroll horizontally to browse recent posts',
                    })}
                    onKeyDown={handleKeyDown}
                >
                    {posts.map(post => (
                        <li className="homepage-latest-blogs__post" key={post.permalink}>
                            <Link className="homepage-latest-blogs__story" to={post.permalink}
                                lang={post.contentLocale} title={post.title}>
                                <img
                                    className="homepage-latest-blogs__cover"
                                    src={post.image ?? '/images/brand-assets/doris-logo-horizontal-primary.svg'}
                                    alt=""
                                    width={88}
                                    height={56}
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="homepage-latest-blogs__copy">
                                    <time className="homepage-latest-blogs__date" dateTime={post.date}>
                                        {dateFormat.format(new Date(post.date))}
                                    </time>
                                    <h2 className="homepage-latest-blogs__title">{post.title}</h2>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="homepage-latest-blogs__actions">
                    <Link className="homepage-latest-blogs__all" to={localize('/blog/').href}>
                        {translate({ id: 'homepage.blogs.all', message: 'All posts' })}
                    </Link>
                    {posts.length > 1 && (
                        <div className="homepage-latest-blogs__navigation">
                            <button type="button" onClick={() => move(-1)} disabled={!controls.previous}
                                aria-label={translate({ id: 'homepage.blogs.previous', message: 'Previous posts' })}
                                aria-controls="homepage-latest-blogs-track">
                                <span aria-hidden="true">←</span>
                            </button>
                            <button type="button" onClick={() => move(1)} disabled={!controls.next}
                                aria-label={translate({ id: 'homepage.blogs.next', message: 'Next posts' })}
                                aria-controls="homepage-latest-blogs-track">
                                <span aria-hidden="true">→</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

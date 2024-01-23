import React, { useState } from 'react';
import usePhone from '../../hooks/use-phone';
import { Collapse, Tabs } from 'antd';
import { VariousAnalyticsData } from '../../constant/various-analytics.data';
import { ArrowDownIcon } from '../../components/Icons/arrow-down-icon';
import LinkWithArrow from '../../components/link-arrow';
import { useAnimationFrame } from '../../hooks/use-animation-frame';
import './index.scss';
import { Progress } from '../../components/progress/progress';

export function UserCaseCarousel() {
    const { isPhone } = usePhone();
    const [count, setCount] = useState<number>(0);
    const [activeKey, setActiveKey] = useState<string>('0');
    const [stop, setStop] = useState<boolean>(false);

    useAnimationFrame(deltaTime => {
        // Pass on a function to the setter of the state
        // to make sure we always have the latest state

        setCount(prevCount => {
            if (prevCount >= 100) {
                setActiveKey(activeKey => {
                    let nextKey = +activeKey + 1;
                    if (nextKey >= VariousAnalyticsData.length) {
                        nextKey = 0;
                    }
                    return nextKey.toString();
                });
                return 0;
            }
            if (deltaTime > 100) return prevCount;

            return prevCount + deltaTime * 0.01;
        });
    }, stop);

    return isPhone ? (
        <div className="cases-collapse">
            <Collapse
                bordered={false}
                defaultActiveKey={['0']}
                accordion
                expandIcon={ArrowDownIcon}
                expandIconPosition="right"
                items={VariousAnalyticsData.map(({ title, content, icon, links, backgroundClassName }, index) => {
                    return {
                        key: index,
                        label: (
                            <div className="flex items-center">
                                <div className="mr-4">{icon}</div>
                                <span className="text-base">{title}</span>
                            </div>
                        ),
                        children: (
                            <div
                                className={`font-misans text-start h-full ${backgroundClassName} text-[10px] leading-[17px]`}
                            >
                                <div className=" pt-3 pr-3">{content}</div>

                                <div className="flex mt-3 gap-2">
                                    {links.map(({ content, to }) => (
                                        <LinkWithArrow
                                            style={{ fontSize: '10px', lineHeight: '17px' }}
                                            className="text-start"
                                            to={to}
                                            text={content}
                                        />
                                    ))}
                                </div>
                            </div>
                        ),
                    };
                })}
            />
        </div>
    ) : (
        <div className="cases-tabs" onMouseMove={() => setStop(true)} onMouseLeave={() => setStop(false)}>
            <Tabs
                activeKey={activeKey}
                onChange={activeKey => {
                    setCount(0);
                    setActiveKey(activeKey);
                }}
                tabPosition={isPhone ? 'top' : 'left'}
                items={VariousAnalyticsData.map(({ content, title, links, backgroundClassName, icon }, index) => {
                    return {
                        label: (
                            <div className="font-misans text-start">
                                <span>{title}</span>
                                <div className="absolute -bottom-0 w-full">
                                    <Progress percent={count} />
                                </div>
                            </div>
                        ),
                        key: index.toString(),
                        children: (
                            <div
                                className={`font-misans text-start h-full ${backgroundClassName} py-14 pr-14 text-base leading-7`}
                            >
                                <div>{content}</div>

                                <div className="flex mt-14 gap-10">
                                    {links.map(({ content, to }) => (
                                        <LinkWithArrow className="text-start" to={to} text={content} />
                                    ))}
                                </div>
                            </div>
                        ),
                    };
                })}
            />
        </div>
    );
}

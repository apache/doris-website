import { css } from '@emotion/css';
import { Cascader, Input, Select } from 'antd';
import { SDTheme } from '../../../../utils/sd-theme';
import { ArrowDownIcon } from './icons/arrow-down-icon';

export interface Option {
    label: string;
    value: string;
    children?: Option[];
}

export interface DownloadCardFormSelectProps {
    value?: string | string[];
    onChange?: (value: string | string[]) => void;
    placeholder: string;
    label: string;
    options: Option[];
    isCascader?: boolean;
}

export function DownloadCardFormSelect({
    value = '',
    onChange,
    label,
    placeholder,
    options,
    isCascader = false,
}: DownloadCardFormSelectProps) {
    return (
        <div className="group relative z-0 w-full">
            {isCascader ? (
                <Cascader
                    displayRender={label => {
                        return label.length > 0 ? label[label.length - 1] : '';
                    }}
                    suffixIcon={<ArrowDownIcon />}
                    allowClear={false}
                    value={value as string[]}
                    onChange={e => {
                        return onChange && onChange(e as string[]);
                    }}
                    options={options}
                    className={`peer block h-[3.5rem] w-full appearance-none rounded-lg  bg-transparent text-sm text-[#1D1D1D] focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500 ${css`
                        &.ant-select {
                            div.ant-select-selector {
                                border: 1px solid #dfe5f0;
                            }
                        }
                    `}`}
                    popupClassName={css`
                        .ant-cascader-menus {
                            padding: 4px 0;
                            .ant-cascader-menu {
                                padding: 0;
                                @media (min-width: 640px) {
                                    &:first-child {
                                        min-width: 180px;
                                    }
                                    &:last-child {
                                        min-width: 192px;
                                    }
                                }

                                li.ant-cascader-menu-item-active {
                                    color: ${SDTheme.colorPrimary};
                                    font-weight: 400;
                                    background-color: transparent;
                                    &:hover {
                                        background-color: ${SDTheme.colorFillSecondary};
                                    }
                                }
                            }
                            li.ant-cascader-menu-item {
                                .ant-cascader-menu-item-content {
                                    overflow: hidden;
                                    white-space: nowrap;
                                    text-overflow: ellipsis;
                                }
                                &:hover {
                                    color: ${SDTheme.colorText};

                                    background-color: ${SDTheme.colorFillSecondary};
                                    border-radius: 0;
                                }
                            }
                        }
                    `}
                />
            ) : (
                <Select
                    suffixIcon={<ArrowDownIcon />}
                    popupClassName={css`
                        padding: 4px 0;
                        &.ant-select-dropdown {
                            .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
                                color: ${SDTheme.colorPrimary};
                                font-weight: 400;
                                background-color: transparent;
                                &:hover {
                                    background-color: ${SDTheme.colorFillSecondary};
                                }
                            }
                            .ant-select-item {
                                border-radius: 0;
                            }
                        }
                    `}
                    value={value}
                    onChange={e => onChange && onChange(e || '')}
                    className={`peer block h-[3.5rem] w-full appearance-none rounded-lg  bg-transparent text-sm text-[#1D1D1D] focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500 ${css`
                        &.ant-select {
                            div.ant-select-selector {
                                border: 1px solid #dfe5f0;
                            }
                        }
                    `}`}
                    options={options}
                />
            )}
            <label
                htmlFor={label}
                className="absolute left-2 top-4 z-10 origin-[0] -translate-y-7 scale-75 transform bg-[#fff]  px-1 text-sm text-[#8592A6] duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100  peer-hover:text-blue peer-focus:-translate-y-7 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-600 peer-[.ant-input-status-error]:text-[#ff4d4f] peer-[.ant-select-open]:text-blue-500  dark:text-gray-400"
            >
                {placeholder}
            </label>
        </div>
    );
}

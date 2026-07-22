import React, { ChangeEvent, DragEvent, JSX, useState } from 'react';
import type { ResponseLanguage } from './profile-analysis.types';

export const MAX_PROFILE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface ProfileUploaderProps {
    file: File | null;
    language: ResponseLanguage;
    disabled: boolean;
    onFileChange: (file: File | null) => void;
    onLanguageChange: (language: ResponseLanguage) => void;
    onAnalyze: () => void;
}

export function validateProfileFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith('.txt')) {
        return 'Select a .txt file. Other file types are not supported.';
    }
    if (file.size > MAX_PROFILE_FILE_SIZE_BYTES) {
        return 'The selected file is larger than 10 MiB.';
    }
    return null;
}

export function formatProfileFileSize(sizeInBytes: number): string {
    if (sizeInBytes < 1024) {
        return `${sizeInBytes} B`;
    }
    if (sizeInBytes < 1024 * 1024) {
        return `${(sizeInBytes / 1024).toFixed(1)} KiB`;
    }
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function ProfileUploader({
    file,
    language,
    disabled,
    onFileChange,
    onLanguageChange,
    onAnalyze,
}: ProfileUploaderProps): JSX.Element {
    const [validationError, setValidationError] = useState<string | null>(null);

    const acceptFile = (nextFile: File | null) => {
        if (!nextFile) {
            setValidationError(null);
            onFileChange(null);
            return;
        }

        const nextError = validateProfileFile(nextFile);
        setValidationError(nextError);
        onFileChange(nextError ? null : nextFile);
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        acceptFile(event.currentTarget.files?.item(0) ?? null);
        event.currentTarget.value = '';
    };

    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        if (disabled) {
            return;
        }
        if (event.dataTransfer.files.length > 1) {
            setValidationError('Select only one Profile file at a time.');
            onFileChange(null);
            return;
        }
        acceptFile(event.dataTransfer.files.item(0));
    };

    return (
        <section className="profile-analysis__uploader" aria-labelledby="profile-analysis-upload-title">
            <h2 id="profile-analysis-upload-title">Upload a Query Profile</h2>
            <p id="profile-analysis-file-help" className="profile-analysis__help">
                Choose one UTF-8 .txt file up to 10 MiB. The server deletes the uploaded file after this analysis.
            </p>

            <fieldset className="profile-analysis__language" disabled={disabled}>
                <legend>Response language</legend>
                <label>
                    <input
                        type="radio"
                        name="profile-analysis-language"
                        value="en"
                        checked={language === 'en'}
                        onChange={() => onLanguageChange('en')}
                    />
                    English
                </label>
                <label>
                    <input
                        type="radio"
                        name="profile-analysis-language"
                        value="zh-CN"
                        checked={language === 'zh-CN'}
                        onChange={() => onLanguageChange('zh-CN')}
                    />
                    Simplified Chinese
                </label>
            </fieldset>

            <label
                className={`profile-analysis__drop-zone${disabled ? ' profile-analysis__drop-zone--disabled' : ''}`}
                onDragOver={event => event.preventDefault()}
                onDrop={handleDrop}
            >
                <span className="profile-analysis__drop-zone-title">Choose a file or drag it here</span>
                <span className="profile-analysis__drop-zone-note">Apache Doris Query Profile in .txt format</span>
                <input
                    className="profile-analysis__file-input"
                    type="file"
                    accept=".txt,text/plain"
                    aria-label="Choose an Apache Doris Query Profile file"
                    aria-describedby="profile-analysis-file-help"
                    disabled={disabled}
                    onChange={handleInputChange}
                />
            </label>

            {validationError && (
                <div className="profile-analysis__validation-error" role="alert">
                    {validationError}
                </div>
            )}

            {file && (
                <div className="profile-analysis__file" aria-live="polite">
                    <span className="profile-analysis__file-name" title={file.name}>
                        {file.name}
                    </span>
                    <span className="profile-analysis__file-size">{formatProfileFileSize(file.size)}</span>
                </div>
            )}

            <button
                className="button button--primary profile-analysis__analyze-button"
                type="button"
                disabled={!file || disabled}
                onClick={onAnalyze}
            >
                {disabled ? 'Analyzing…' : 'Analyze Profile'}
            </button>
        </section>
    );
}

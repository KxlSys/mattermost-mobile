// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {render, waitFor} from '@testing-library/react-native';
import React from 'react';

import {useServerUrl} from '@context/server';
import {getServerCredentials} from '@init/credentials';
import NetworkManager from '@managers/network_manager';

import VideoRenderer, {getVideoSource, shouldAttachServerAuthHeaders} from './video_renderer';

import type {GalleryItemType} from '@typings/screens/gallery';
import type {ReactVideoSource} from 'react-native-video';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(),
}));

jest.mock('@init/credentials', () => ({
    getServerCredentials: jest.fn(),
}));

jest.mock('@managers/network_manager', () => ({
    getClient: jest.fn(),
}));

jest.mock('@managers/security_manager', () => ({
    canSaveToLocation: jest.fn().mockReturnValue(true),
}));

jest.mock('@calls/utils', () => ({
    getTranscriptionUri: jest.fn().mockReturnValue({tracks: [], selected: {type: 'disabled', value: ''}}),
    hasCaptions: jest.fn().mockReturnValue(false),
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: jest.fn().mockReturnValue({bottom: 0, top: 0, left: 0, right: 0}),
}));

jest.mock('@screens/gallery/lightbox_swipeout/context', () => ({
    useLightboxSharedValues: jest.fn().mockReturnValue({
        headerAndFooterHidden: {value: false},
    }),
}));

jest.mock('./hooks', () => ({
    useStateFromSharedValue: jest.fn().mockReturnValue(false),
}));

let lastRenderedSource: ReactVideoSource | undefined;
jest.mock('react-native-video', () => {
    const mockReact = require('react');
    const {View} = require('react-native');
    const MockVideo = mockReact.forwardRef((props: {source: ReactVideoSource}) => {
        lastRenderedSource = props.source;
        return <View testID='mock-video'/>;
    });
    MockVideo.displayName = 'MockVideo';
    return {
        __esModule: true,
        default: MockVideo,
        SelectedTrackType: {
            DISABLED: 'disabled',
        },
    };
});

jest.mock('./video_controls', () => 'VideoControls');
jest.mock('./error', () => 'VideoError');
jest.mock('@screens/gallery/footer/download_with_action', () => 'DownloadWithAction');

describe('P0.2 — Video streaming authentication', () => {
    const serverUrl = 'https://mattermost.example.com';

    beforeEach(() => {
        jest.clearAllMocks();
        lastRenderedSource = undefined;
        jest.mocked(useServerUrl).mockReturnValue(serverUrl);
    });

    describe('shouldAttachServerAuthHeaders helper', () => {
        it('1. should return true for Mattermost URL /api/v4/files/...', () => {
            const uri = 'https://mattermost.example.com/api/v4/files/abc123xyz';
            expect(shouldAttachServerAuthHeaders(uri, serverUrl)).toBe(true);
        });

        it('2. should return false for URL from another domain', () => {
            const uri = 'https://other-domain.com/api/v4/files/abc123xyz';
            expect(shouldAttachServerAuthHeaders(uri, serverUrl)).toBe(false);
            expect(shouldAttachServerAuthHeaders('https://youtube.com/watch?v=123', serverUrl)).toBe(false);
        });

        it('3. should return false for Mattermost URL outside /api/v4/', () => {
            const uri = 'https://mattermost.example.com/static/videos/demo.mp4';
            expect(shouldAttachServerAuthHeaders(uri, serverUrl)).toBe(false);
        });

        it('should return false for invalid or undefined URI', () => {
            expect(shouldAttachServerAuthHeaders(undefined, serverUrl)).toBe(false);
            expect(shouldAttachServerAuthHeaders('not-a-valid-url', serverUrl)).toBe(false);
        });
    });

    describe('getVideoSource helper', () => {
        const videoUri = 'https://mattermost.example.com/api/v4/files/video_file_1';

        it('1. should attach Authorization: Bearer <token> for valid Mattermost /api/v4/ files', () => {
            const source = getVideoSource(videoUri, serverUrl, undefined, 'Bearer valid_token_123');
            expect(source).toEqual({
                uri: videoUri,
                headers: {Authorization: 'Bearer valid_token_123'},
                textTracks: undefined,
            });
        });

        it('2. should NOT attach Authorization header for external domain URL', () => {
            const externalUri = 'https://external-cdn.com/api/v4/files/video_file_1';
            const source = getVideoSource(externalUri, serverUrl, undefined, 'Bearer valid_token_123');
            expect(source.headers).toBeUndefined();
        });

        it('3. should NOT attach Authorization header for Mattermost URL outside /api/v4/', () => {
            const staticUri = 'https://mattermost.example.com/public/sample.mp4';
            const source = getVideoSource(staticUri, serverUrl, undefined, 'Bearer valid_token_123');
            expect(source.headers).toBeUndefined();
        });

        it('4. should NOT attach Authorization header when authToken is absent/undefined', () => {
            const source = getVideoSource(videoUri, serverUrl, undefined, undefined);
            expect(source.headers).toBeUndefined();
        });
    });

    describe('VideoRenderer Component lifecycle & token resolution', () => {
        const mockItem: GalleryItemType = {
            id: 'video_file_1',
            name: 'sample_video.mp4',
            type: 'video',
            uri: 'https://mattermost.example.com/api/v4/files/video_file_1',
            width: 1920,
            height: 1080,
            lastPictureUpdate: 0,
            mime_type: 'video/mp4',
            cacheKey: 'video_file_1',
        };

        const defaultProps = {
            canDownloadFiles: true,
            enableSecureFilePreview: false,
            height: 800,
            width: 400,
            index: 0,
            initialIndex: 0,
            item: mockItem,
            isPageActive: {value: true} as any,
            hideHeaderAndFooter: jest.fn(),
        };

        it('5. should use token available via NetworkManager', () => {
            jest.mocked(NetworkManager.getClient).mockReturnValue({
                getRequestHeaders: jest.fn().mockReturnValue({Authorization: 'Bearer net_manager_token'}),
            } as any);

            render(<VideoRenderer {...(defaultProps as any)}/>);

            expect(lastRenderedSource).toBeDefined();
            expect(lastRenderedSource?.headers).toEqual({
                Authorization: 'Bearer net_manager_token',
            });
        });

        it('6. should fallback to getServerCredentials() when NetworkManager throws', async () => {
            jest.mocked(NetworkManager.getClient).mockImplementation(() => {
                throw new Error('Client not found');
            });

            jest.mocked(getServerCredentials).mockResolvedValue({
                token: 'fallback_keychain_token',
                serverUrl,
            } as any);

            render(<VideoRenderer {...(defaultProps as any)}/>);

            await waitFor(() => {
                expect(lastRenderedSource?.headers).toEqual({
                    Authorization: 'Bearer fallback_keychain_token',
                });
            });
        });

        it('7. demonstrates token renewal: ancien token -> renouvellement -> nouveau token utilisé par ReactVideoSource', () => {
            let currentToken = 'Bearer initial_token_v1';

            jest.mocked(NetworkManager.getClient).mockReturnValue({
                getRequestHeaders: jest.fn().mockImplementation(() => ({
                    Authorization: currentToken,
                })),
            } as any);

            const {rerender} = render(<VideoRenderer {...(defaultProps as any)}/>);

            // Phase 1: Ancien token actif
            expect(lastRenderedSource?.headers).toEqual({
                Authorization: 'Bearer initial_token_v1',
            });

            // Phase 2: Renouvellement de session / nouveau token
            currentToken = 'Bearer renewed_token_v2';

            // Phase 3: Prochain rendu de VideoRenderer
            rerender(<VideoRenderer {...(defaultProps as any)}/>);

            expect(lastRenderedSource?.headers).toEqual({
                Authorization: 'Bearer renewed_token_v2',
            });
        });
    });
});

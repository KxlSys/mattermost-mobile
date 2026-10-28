// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {screen} from '@testing-library/react-native';
import React from 'react';

import {getLicenseLoadMetric} from '@actions/remote/license';
import ExpoImage from '@components/expo_image';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import About from './about';

jest.mock('@actions/remote/license');
jest.mock('@screens/navigation');
jest.mock('@hooks/android_back_handler', () => jest.fn());
jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'https://test.mattermost.com'),
}));
jest.mock('@components/expo_image', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));

const config = {
    Version: '10.0.0',
    BuildNumber: '1',
    BuildHash: 'abc',
    BuildHashEnterprise: '',
    BuildDate: '',
    BuildEnterpriseReady: 'false',
    SQLDriverName: 'postgres',
    SchemaVersion: '1',
    TermsOfServiceLink: '',
    PrivacyPolicyLink: '',
} as unknown as ClientConfig;

describe('About', () => {
    beforeEach(() => {
        jest.mocked(getLicenseLoadMetric).mockResolvedValue(null);
    });

    it('should show the BokengiGp logo, name and Mattermost attribution', async () => {
        renderWithIntlAndTheme(<About config={config}/>);

        expect(await screen.findByTestId('about.title')).toHaveTextContent('BokengiGp Team Edition');
        expect(jest.mocked(ExpoImage).mock.calls[0][0]).toMatchObject({
            source: require('@assets/images/logo.png'),
            testID: 'about.logo',
        });
        expect(screen.getByTestId('about.notice_text')).toHaveTextContent(/^BokengiGp by Bokengi Group — based on Mattermost\./);
        expect(screen.getByTestId('about.copyright')).toHaveTextContent(/Mattermost, Inc\. All rights reserved/);
    });
});

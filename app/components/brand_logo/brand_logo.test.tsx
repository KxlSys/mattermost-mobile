// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {render} from '@testing-library/react-native';
import React from 'react';

import ExpoImage from '@components/expo_image';
import {Preferences} from '@constants';

import BrandLogo from './index';

jest.mock('@components/expo_image', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));

const logo = require('@assets/images/logo.png');
const logoWhite = require('@assets/images/logo_white.png');

describe('BrandLogo', () => {
    beforeEach(() => {
        jest.mocked(ExpoImage).mockClear();
    });

    it('should render the official logo on a light theme', () => {
        render(
            <BrandLogo
                size={80}
                testID='brand.logo'
                theme={Preferences.THEMES.denim}
            />,
        );

        expect(ExpoImage).toHaveBeenCalledTimes(1);
        expect(jest.mocked(ExpoImage).mock.calls[0][0]).toMatchObject({
            source: logo,
            style: {width: 80, height: 80},
            testID: 'brand.logo',
            contentFit: 'contain',
        });
        expect(jest.mocked(ExpoImage).mock.calls[0][0]).not.toHaveProperty('tintColor');
    });

    it('should render the white silhouette on a dark theme', () => {
        render(
            <BrandLogo
                size={32}
                theme={Preferences.THEMES.onyx}
            />,
        );

        expect(ExpoImage).toHaveBeenCalledTimes(1);
        expect(jest.mocked(ExpoImage).mock.calls[0][0]).toMatchObject({source: logoWhite});
        expect(jest.mocked(ExpoImage).mock.calls[0][0]).not.toHaveProperty('tintColor');
    });
});

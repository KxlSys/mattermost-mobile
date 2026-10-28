// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {render} from '@testing-library/react-native';
import React from 'react';

import ExpoImage from '@components/expo_image';
import {Preferences, View as ViewConstants} from '@constants';

import SystemAvatar from './index';

jest.mock('@components/expo_image', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));

describe('SystemAvatar', () => {
    it('should render the brand logo at profile picture size', () => {
        render(<SystemAvatar theme={Preferences.THEMES.denim}/>);

        expect(ExpoImage).toHaveBeenCalledTimes(1);
        expect(jest.mocked(ExpoImage).mock.calls[0][0]).toMatchObject({
            source: require('@assets/images/logo.png'),
            style: {width: ViewConstants.PROFILE_PICTURE_SIZE, height: ViewConstants.PROFILE_PICTURE_SIZE},
            testID: 'system_avatar.logo',
        });
    });
});

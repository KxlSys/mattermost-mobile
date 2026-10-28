// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useMemo} from 'react';
import tinyColor from 'tinycolor2';

import ExpoImage from '@components/expo_image';

// Official logo on light backgrounds, white silhouette of the same mark on dark ones (no tinting)
const logo = require('@assets/images/logo.png');
const logoWhite = require('@assets/images/logo_white.png');

type Props = {
    size: number;
    testID?: string;
    theme: Theme;
}

const BrandLogo = ({size, testID, theme}: Props) => {
    const style = useMemo(() => ({width: size, height: size}), [size]);
    const source = tinyColor(theme.centerChannelBg).isDark() ? logoWhite : logo;

    return (
        <ExpoImage
            cachePolicy='memory'
            contentFit='contain'
            source={source}
            style={style}
            testID={testID}
        />
    );
};

export default BrandLogo;

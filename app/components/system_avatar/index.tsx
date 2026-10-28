// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import BrandLogo from '@components/brand_logo';
import {View as ViewConstants} from '@constants';

type Props = {
    theme: Theme;
}

const SystemAvatar = ({theme}: Props) => {
    return (
        <BrandLogo
            size={ViewConstants.PROFILE_PICTURE_SIZE}
            testID='system_avatar.logo'
            theme={theme}
        />
    );
};

export default SystemAvatar;

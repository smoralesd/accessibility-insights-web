// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createLeftNavItems } from 'electron/common/left-nav-item-factory';
import { LeftNavActionCreator } from 'electron/flux/action-creator/left-nav-action-creator';
import { TestConfig } from 'electron/types/test-config';
import { LeftNavItem } from 'electron/types/left-nav-item';
import { Mock, MockBehavior } from 'typemoq';
import { ContentPageInfo } from 'electron/types/content-page-info';

describe('left nav item factory', () => {
    it('creates array of LeftNavItem objects as expected', () => {
        const configs: TestConfig[] = [
            {
                key: 'automated-checks',
                contentPageInfo: {
                    title: 'my title1',
                } as ContentPageInfo,
            } as TestConfig,
            {
                key: 'needs-review',
                contentPageInfo: {
                    title: 'my title2',
                } as ContentPageInfo,
            } as TestConfig,
        ];

        const expectedItems: LeftNavItem[] = [
            {
                key: 'automated-checks',
                displayName: 'my title1',
            } as LeftNavItem,
            {
                key: 'needs-review',
                displayName: 'my title2',
            } as LeftNavItem,
        ];

        const actionCreatorMock = Mock.ofType<LeftNavActionCreator>(undefined, MockBehavior.Strict);

        const actualItems = createLeftNavItems(configs, actionCreatorMock.object);

        expect(actualItems).toMatchObject(expectedItems);

        actionCreatorMock.verifyAll();
    });

    it('calls action creator as expected', () => {
        const configs: TestConfig[] = [
            {
                key: 'automated-checks',
                contentPageInfo: {
                    title: 'my title1',
                } as ContentPageInfo,
            } as TestConfig,
        ];

        const actionCreatorMock = Mock.ofType<LeftNavActionCreator>(undefined, MockBehavior.Strict);
        actionCreatorMock.setup(m => m.itemSelected('automated-checks')).verifiable();

        const leftNavItems = createLeftNavItems(configs, actionCreatorMock.object);

        leftNavItems[0].onSelect();

        actionCreatorMock.verifyAll();
    });
});

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import {
    DevToolsChromeAdapter,
    DevToolsChromeAdapterImpl,
} from 'background/dev-tools-chrome-adapter';
import { BrowserAdapter } from 'common/browser-adapters/browser-adapter';
import { DevToolInitializer } from 'Devtools/dev-tool-initializer';

export const prodInitializer = () => {
    const browserAdapter = new DevToolsChromeAdapterImpl();

    initializeDevTools(browserAdapter);
};

export const devInitializer = () => {
    const browserAdapter = new DevToolsChromeAdapterImpl();

    initializeDevTools(browserAdapter);
    initializeDebugTools(browserAdapter);
};

const initializeDevTools = (browserAdapter: DevToolsChromeAdapter) => {
    const devToolInitializer: DevToolInitializer = new DevToolInitializer(browserAdapter);
    devToolInitializer.initialize();
};

const initializeDebugTools = (browserAdapter: BrowserAdapter) => {
    const name = browserAdapter.getManifest().name;

    if (name === 'Accessibility Insights for Web - Dev') {
        chrome.devtools.panels.create(
            'AIWeb-DEV Debug Tools',
            null,
            '../debug-tools/debug-tools.html',
        );
    }
};

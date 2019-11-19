// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as React from 'react';
import * as ReactDOM from 'react-dom';

export const initializeDebugTools = () => {
    const container = document.querySelector('#debug-tools-container');

    ReactDOM.render(<span>AI Web Debug Tools</span>, container);
};

initializeDebugTools();

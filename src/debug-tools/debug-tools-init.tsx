// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { BaseStore } from 'common/base-store';
import { BrowserAdapter } from 'common/browser-adapters/browser-adapter';
import { ChromeAdapter } from 'common/browser-adapters/chrome-adapter';
import { initializeFabricIcons } from 'common/fabric-icons';
import { createDefaultLogger } from 'common/logging/default-logger';
import { RemoteActionMessageDispatcher } from 'common/message-creators/remote-action-message-dispatcher';
import { StoreActionMessageCreator } from 'common/message-creators/store-action-message-creator';
import { StoreActionMessageCreatorFactory } from 'common/message-creators/store-action-message-creator-factory';
import { StoreProxy } from 'common/store-proxy';
import { StoreNames } from 'common/stores/store-names';
import { FeatureFlagStoreData } from 'common/types/store-data/feature-flag-store-data';
import { PermissionsStateStoreData } from 'common/types/store-data/permissions-state-store-data';
import { ScopingStoreData } from 'common/types/store-data/scoping-store-data';
import { UserConfigurationStoreData } from 'common/types/store-data/user-configuration-store';
import { forEach, isEmpty } from 'lodash';
import { DetailsRow, FocusZone, GroupedList, IColumn, Selection, SelectionMode, SelectionZone, Spinner } from 'office-ui-fabric-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

export const initializeDebugTools = () => {
    initializeFabricIcons();
    const browserAdapter = new ChromeAdapter();

    const stores = createStoreProxies(browserAdapter);
    const storeActionMessageCreator = getStoreActionMessageCreator(browserAdapter, stores);

    const props = {
        global: stores,
        storeActionMessageCreator,
    };

    render(props);
};

const createStoreProxies = (browserAdapter: BrowserAdapter) => {
    const featureFlagStore = new StoreProxy<FeatureFlagStoreData>(StoreNames[StoreNames.FeatureFlagStore], browserAdapter);
    const scopingStore = new StoreProxy<ScopingStoreData>(StoreNames[StoreNames.ScopingPanelStateStore], browserAdapter);
    const userConfigurationStore = new StoreProxy<UserConfigurationStoreData>(
        StoreNames[StoreNames.UserConfigurationStore],
        browserAdapter,
    );
    const permissionsStore = new StoreProxy<PermissionsStateStoreData>(StoreNames[StoreNames.PermissionsStateStore], browserAdapter);

    return [featureFlagStore, scopingStore, userConfigurationStore, permissionsStore];
};

const getStoreActionMessageCreator = (browserAdapter: BrowserAdapter, stores: BaseStore<any>[]) => {
    const actionMessageDispatcher = new RemoteActionMessageDispatcher(browserAdapter.sendMessageToFrames, null, createDefaultLogger());

    const storeActionMessageCreatorFactory = new StoreActionMessageCreatorFactory(actionMessageDispatcher);

    return storeActionMessageCreatorFactory.fromStores(stores);
};

const render = (props: StoresTreeProps) => {
    const container = document.querySelector('#debug-tools-container');

    ReactDOM.render(<StoresTree {...props} />, container);
};

type StoresTreeProps = {
    global: BaseStore<any>[];
    storeActionMessageCreator: StoreActionMessageCreator;
};

type StoresTreeState = {
    global: {
        [storeId: string]: any;
    };
};

class StoresTree extends React.Component<StoresTreeProps, StoresTreeState> {
    private selection = new Selection();
    private selectionMode = SelectionMode.none;
    private compact = true;

    constructor(props: StoresTreeProps) {
        super(props);
        this.state = {
            global: {},
        };
    }

    public componentDidMount(): void {
        this.props.global.forEach(store => {
            store.addChangedListener(() => {
                this.setState({
                    global: {
                        ...this.state.global,
                        [store.getId()]: store.getState(),
                    },
                });
            });
        });

        this.props.storeActionMessageCreator.getAllStates();
    }

    public render(): JSX.Element {
        const global = this.state.global;

        if (isEmpty(global)) {
            return <Spinner label="loading..." />;
        }

        const columns: IColumn[] = [
            {
                key: 'key',
                name: 'property',
                fieldName: 'key',
                minWidth: 300,
            },
            {
                key: 'value',
                name: 'value',
                fieldName: 'value',
                minWidth: 300,
                onRender: item => JSON.stringify(item.value),
            },
        ];
        const groups = [];
        let items = [];

        let instanceCount: number = 0;

        forEach(global, (storeState, storeKey) => {
            const stateKeys = Object.keys(storeState);

            const currentGroup = {
                key: storeKey,
                name: storeKey,
                startIndex: instanceCount,
                count: stateKeys.length,
            };

            groups.push(currentGroup);

            const currentGroupItems = stateKeys.map(key => {
                return {
                    key,
                    value: storeState[key],
                };
            });

            items = items.concat(currentGroupItems);

            instanceCount += currentGroupItems.length;
        });

        this.selection.setItems(items);

        const onRenderCell = (nestingDepth: number, item: any, itemIndex: number): JSX.Element => {
            return (
                <DetailsRow
                    columns={columns}
                    groupNestingDepth={nestingDepth}
                    item={item}
                    itemIndex={itemIndex}
                    selection={this.selection}
                    selectionMode={this.selectionMode}
                    compact={this.compact}
                />
            );
        };

        return (
            <FocusZone>
                <SelectionZone selection={this.selection} selectionMode={this.selectionMode}>
                    <GroupedList
                        items={items}
                        onRenderCell={onRenderCell}
                        selection={this.selection}
                        selectionMode={this.selectionMode}
                        groups={groups}
                        compact={this.compact}
                    />
                </SelectionZone>
            </FocusZone>
        );
    }
}

initializeDebugTools();

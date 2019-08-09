let tabStateSnapshot = [];

async function onTabsUpdated() {
	tabStateSnapshot = await browser.tabs.query({ windowType: "normal" });

	if (typeof browser.tabs.moveInSuccession === 'function') {
		const activeTabInfos = tabStateSnapshot.filter((tabInfo) => {
			return tabInfo.active === true
		});

		for (activeTabInfo of activeTabInfos) {
			const successorTabIndex = activeTabInfo.index === 0 ? 1 : activeTabInfo.index - 1;

			const successorTabInfo = tabStateSnapshot.filter((tabInfo) => {
				return tabInfo.windowId === activeTabInfo.windowId &&
					tabInfo.index === successorTabIndex;
			})[0];

			if (!successorTabInfo) {
				return;
			}

			if (activeTabInfo.successorTabId !== successorTabInfo.id) {
				await browser.tabs.update(activeTabInfo.id, { successorTabId: successorTabInfo.id });
			}
		}
	}
}

async function onTabRemoved(removedTabId, removeInfo) {
	log("onTabRemoved:", removedTabId, removeInfo);

	const matchingTabInfo = tabStateSnapshot.filter((tabInfo) => {
		return tabInfo.active === true &&
			tabInfo.id === removedTabId &&
			tabInfo.windowId === removeInfo.windowId
	})[0];

	if (matchingTabInfo) {
		log("Removed tab matches criteria for forced activation.");

		const successorTabIndex = matchingTabInfo.index === 0 ? 1 : matchingTabInfo.index - 1;

		const successorTabInfo = tabStateSnapshot.filter((tabInfo) => {
			return tabInfo.windowId === matchingTabInfo.windowId &&
				tabInfo.index === successorTabIndex;
		})[0];

		if (successorTabInfo) {
			await browser.tabs.update(successorTabInfo.id, { active: true });
			log(`Activated tab ${successorTabInfo.id} in window ${successorTabInfo.windowId}.`);
		} else {
			log(`No matching successor tab was found.`);
		}
	}

	await onTabsUpdated();
}

browser.tabs.onActivated.addListener(onTabsUpdated);
browser.tabs.onAttached.addListener(onTabsUpdated);
browser.tabs.onCreated.addListener(onTabsUpdated);
browser.tabs.onDetached.addListener(onTabsUpdated);
browser.tabs.onHighlighted.addListener(onTabsUpdated);
browser.tabs.onMoved.addListener(onTabsUpdated);
browser.tabs.onRemoved.addListener(onTabRemoved);
browser.tabs.onReplaced.addListener(onTabsUpdated);
browser.tabs.onUpdated.addListener(onTabsUpdated);

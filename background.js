let tabStateSnapshot = [];

async function onTabsUpdated() {
	tabStateSnapshot = await browser.tabs.query({ windowType: "normal" });

	if (typeof browser.tabs.moveInSuccession === 'function') {
		const currentTabInfo = tabStateSnapshot.filter((tabInfo) => {
			return tabInfo.active === true
		})[0];

		if (!currentTabInfo) {
			return;
		}

		const tabToTheLeftInfo = tabStateSnapshot.filter((tabInfo) => {
			return tabInfo.windowId == currentTabInfo.windowId &&
				tabInfo.index == currentTabInfo.index - 1;
		})[0];

		if (!tabToTheLeftInfo) {
			return;
		}

		if (currentTabInfo.successorTabId !== tabToTheLeftInfo.id) {
			await browser.tabs.update(currentTabInfo.id, { successorTabId: tabToTheLeftInfo.id });
		}
	}
}

async function onTabRemoved(removedTabId, removeInfo) {
	log("onTabRemoved:", removedTabId, removeInfo);

	const matchingTabInfo = tabStateSnapshot.filter((tabInfo) => {
		return tabInfo.active == true &&
			tabInfo.id == removedTabId &&
			tabInfo.windowId == removeInfo.windowId &&
			tabInfo.index > 0;
	})[0];

	if (matchingTabInfo) {
		log("Removed tab matches criteria for left tab activation.");

		const tabToTheLeftInfo = tabStateSnapshot.filter((tabInfo) => {
			return tabInfo.windowId == matchingTabInfo.windowId &&
				tabInfo.index == matchingTabInfo.index - 1;
		})[0];

		if (tabToTheLeftInfo) {
			if (tabToTheLeftInfo.active === false) {
				await browser.tabs.update(tabToTheLeftInfo.id, { active: true });
				log(`Activated tab ${tabToTheLeftInfo.id} in window ${tabToTheLeftInfo.windowId}.`);
			}
		} else {
			log(`No matching tab to the left was found.`);
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

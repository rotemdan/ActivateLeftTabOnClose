let tabStateSnapshot = [];

async function updateTabStateSnapshot() {
	tabStateSnapshot = await browser.tabs.query({ windowType: "normal" });
}

async function onRemoved(removedTabId, removeInfo) {
	log("onRemoved:", removedTabId, removeInfo);

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
			await browser.tabs.update(tabToTheLeftInfo.id, { active: true });
			log(`Activated tab ${tabToTheLeftInfo.id} in window ${tabToTheLeftInfo.windowId}.`);
		} else {
			log(`No matching tab to the left was found.`);
		}
	}

	await updateTabStateSnapshot();
}

browser.tabs.onActivated.addListener(updateTabStateSnapshot);
browser.tabs.onAttached.addListener(updateTabStateSnapshot);
browser.tabs.onCreated.addListener(updateTabStateSnapshot);
browser.tabs.onDetached.addListener(updateTabStateSnapshot);
browser.tabs.onHighlighted.addListener(updateTabStateSnapshot);
browser.tabs.onMoved.addListener(updateTabStateSnapshot);
browser.tabs.onRemoved.addListener(onRemoved);
browser.tabs.onReplaced.addListener(updateTabStateSnapshot);
//browser.tabs.onUpdated.addListener(updateTabStateSnapshot);
//browser.tabs.onZoomChange.addListener(updateTabStateSnapshot);

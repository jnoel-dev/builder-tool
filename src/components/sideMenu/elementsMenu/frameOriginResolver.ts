import { parseElementsParam, FrameElement } from "@/components/contexts/FrameManager/frameUtils";

export type DropdownItem = { id: string; label: string; disabled: boolean };

type ElementsByFrameId = Record<string, FrameElement[]>;
type ParentEdge = { parentId: string; pageName: string };

function formatIdForDisplay(rawId: string): string {
  return rawId.replace(/([A-Z])/g, " $1").trim().toUpperCase();
}

function splitFrameListParam(rawParam: string | null): string[] {
  if (!rawParam) return [];
  return rawParam.split(/[|,]/).map((part) => part.trim()).filter(Boolean);
}

function isFrameLikeElement(element: FrameElement | undefined): element is FrameElement {
  return !!element && !!element.isFrameOrContainer && typeof element.id === "string";
}

function collectAllPageNames(urlParams: URLSearchParams, currentTopPageName: string): string[] {
  const pageNameSet = new Set<string>();
  for (const [paramKey] of urlParams.entries()) {
    if (paramKey.startsWith("elements.")) {
      pageNameSet.add(paramKey.slice("elements.".length));
    } else if (paramKey.startsWith("frames.")) {
      pageNameSet.add(paramKey.slice("frames.".length));
    }
  }
  pageNameSet.add(currentTopPageName);
  return Array.from(pageNameSet);
}

function buildElementsByPageMap(
  urlParams: URLSearchParams,
  pageNames: string[]
): Map<string, ElementsByFrameId> {
  const elementsByPageMap = new Map<string, ElementsByFrameId>();
  for (const pageName of pageNames) {
    const parsedByFrameId: ElementsByFrameId = parseElementsParam(urlParams.get(`elements.${pageName}`) || "");
    const listedFrameIds = splitFrameListParam(urlParams.get(`frames.${pageName}`));
    for (const frameId of listedFrameIds) {
      if (!Object.prototype.hasOwnProperty.call(parsedByFrameId, frameId)) {
        parsedByFrameId[frameId] = [];
      }
    }
    elementsByPageMap.set(pageName, parsedByFrameId);
  }
  return elementsByPageMap;
}

function getChildFrameIdsOnPage(elementsByFrameId: ElementsByFrameId): Set<string> {
  const childIds = new Set<string>();
  for (const elementList of Object.values(elementsByFrameId)) {
    for (const element of elementList || []) {
      if (isFrameLikeElement(element)) childIds.add(element.id);
    }
  }
  return childIds;
}

function buildParentEdgeIndex(
  elementsByPageMap: Map<string, ElementsByFrameId>
): Record<string, ParentEdge> {
  const parentEdgeIndex: Record<string, ParentEdge> = {};
  for (const [pageName, elementsByFrameId] of elementsByPageMap.entries()) {
    for (const [parentId, elementList] of Object.entries(elementsByFrameId)) {
      for (const element of elementList || []) {
        if (isFrameLikeElement(element)) parentEdgeIndex[element.id] = { parentId, pageName };
      }
    }
  }
  return parentEdgeIndex;
}

function buildRootPageSetByFrameId(
  elementsByPageMap: Map<string, ElementsByFrameId>,
  urlParams: URLSearchParams,
  pageNames: string[],
  currentTopPageName: string,
  runtimeFrameIdsOnCurrentPage: Set<string>
): Record<string, Set<string>> {
  const rootPageSetByFrameId: Record<string, Set<string>> = {};

  for (const pageName of pageNames) {
    const elementsByFrameId = elementsByPageMap.get(pageName) || {};
    const candidateFrameIds = new Set<string>([
      ...Object.keys(elementsByFrameId),
      ...splitFrameListParam(urlParams.get(`frames.${pageName}`)),
    ]);

    if (pageName === currentTopPageName) {
      for (const frameId of runtimeFrameIdsOnCurrentPage) candidateFrameIds.add(frameId);
    }

    const childIdsOnPage = getChildFrameIdsOnPage(elementsByFrameId);

    for (const frameId of candidateFrameIds) {
      if (childIdsOnPage.has(frameId)) continue;
      if (!rootPageSetByFrameId[frameId]) rootPageSetByFrameId[frameId] = new Set<string>();
      rootPageSetByFrameId[frameId].add(pageName);
    }
  }

  return rootPageSetByFrameId;
}

function collectAllFrameIds(
  elementsByPageMap: Map<string, ElementsByFrameId>,
  urlParams: URLSearchParams,
  pageNames: string[],
  runtimeFrameIdsOnCurrentPage: string[]
): Set<string> {
  const allFrameIds = new Set<string>(runtimeFrameIdsOnCurrentPage);
  for (const [, elementsByFrameId] of elementsByPageMap.entries()) {
    for (const frameId of Object.keys(elementsByFrameId)) allFrameIds.add(frameId);
    for (const elementList of Object.values(elementsByFrameId)) {
      for (const element of elementList || []) {
        if (isFrameLikeElement(element)) allFrameIds.add(element.id);
      }
    }
  }
  for (const pageName of pageNames) {
    for (const frameId of splitFrameListParam(urlParams.get(`frames.${pageName}`))) {
      allFrameIds.add(frameId);
    }
  }
  return allFrameIds;
}

function resolveOriginPageName(
  frameId: string,
  parentEdgeIndex: Record<string, ParentEdge>
): string | undefined {
  const visited = new Set<string>();
  let current = frameId;
  let lastOrigin: string | undefined;

  while (parentEdgeIndex[current]) {
    if (visited.has(current)) break;
    visited.add(current);
    const { parentId, pageName } = parentEdgeIndex[current];
    lastOrigin = pageName;
    current = parentId;
  }
  return lastOrigin;
}

export function buildFrameDropdownSections(args: {
  savedParamsRaw: string;
  runtimeFrameIdsOnCurrentPage: string[];
  currentTopPageName: string;
}): { itemsOnThisPage: DropdownItem[]; itemsOnOtherPages: DropdownItem[] } {
  const { savedParamsRaw, runtimeFrameIdsOnCurrentPage, currentTopPageName } = args;

  const urlParams = new URLSearchParams(savedParamsRaw);
  const pageNames = collectAllPageNames(urlParams, currentTopPageName);
  const elementsByPageMap = buildElementsByPageMap(urlParams, pageNames);
  const parentEdgeIndex = buildParentEdgeIndex(elementsByPageMap);

  const rootPageSetByFrameId = buildRootPageSetByFrameId(
    elementsByPageMap,
    urlParams,
    pageNames,
    currentTopPageName,
    new Set(runtimeFrameIdsOnCurrentPage)
  );

  const allFrameIds = collectAllFrameIds(
    elementsByPageMap,
    urlParams,
    pageNames,
    runtimeFrameIdsOnCurrentPage
  );

  const itemsOnThisPage: DropdownItem[] = [];
  const itemsOnOtherPages: DropdownItem[] = [];

  for (const frameId of allFrameIds) {
    const originFromEdges = resolveOriginPageName(frameId, parentEdgeIndex);

    if (originFromEdges) {
      const label = `${formatIdForDisplay(frameId)} — ${formatIdForDisplay(originFromEdges)}`;
      if (originFromEdges === currentTopPageName) {
        itemsOnThisPage.push({ id: frameId, label, disabled: false });
      } else {
        itemsOnOtherPages.push({ id: `${frameId}@${originFromEdges}`, label, disabled: true });
      }
      continue;
    }

    const rootPagesForFrame = rootPageSetByFrameId[frameId];
    if (!rootPagesForFrame || rootPagesForFrame.size === 0) continue;

    for (const pageName of rootPagesForFrame) {
      const hasDirectChildrenOnPage =
        (elementsByPageMap.get(pageName)?.[frameId] || []).length > 0;

      if (pageName !== currentTopPageName && !hasDirectChildrenOnPage) continue;

      const label = `${formatIdForDisplay(frameId)} — ${formatIdForDisplay(pageName)}`;
      if (pageName === currentTopPageName) {
        itemsOnThisPage.push({ id: frameId, label, disabled: false });
      } else {
        itemsOnOtherPages.push({ id: `${frameId}@${pageName}`, label, disabled: true });
      }
    }
  }

  return { itemsOnThisPage, itemsOnOtherPages };
}

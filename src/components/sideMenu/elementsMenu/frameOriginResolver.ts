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

function collectAllPageNames(urlParams: URLSearchParams, currentTopPageName: string): string[] {
  const pageNameSet = new Set<string>();
  for (const [paramKey] of urlParams.entries()) {
    if (paramKey.startsWith("elements.")) pageNameSet.add(paramKey.slice("elements.".length));
    if (paramKey.startsWith("frames.")) pageNameSet.add(paramKey.slice("frames.".length));
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
    const parsedByFrameId = parseElementsParam(urlParams.get(`elements.${pageName}`) || "");
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

function buildParentEdgeIndex(
  elementsByPageMap: Map<string, ElementsByFrameId>
): Record<string, ParentEdge> {
  const parentEdgeIndex: Record<string, ParentEdge> = {};
  for (const [pageName, elementsByFrameId] of elementsByPageMap.entries()) {
    for (const [parentId, elementList] of Object.entries(elementsByFrameId)) {
      for (const element of elementList || []) {
        if (element?.isFrameOrContainer && typeof element.id === "string") {
          parentEdgeIndex[element.id] = { parentId, pageName };
        }
      }
    }
  }
  return parentEdgeIndex;
}

/**
 * roots per page = frames present on that page that are not children on that same page.
 * includes frames for the current page so TopFrame appears immediately after real top-level navigation.
 */
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

    const candidateFrameIdSet = new Set<string>([
      ...Object.keys(elementsByFrameId),
      ...splitFrameListParam(urlParams.get(`frames.${pageName}`)),
    ]);

    if (pageName === currentTopPageName) {
      for (const frameId of runtimeFrameIdsOnCurrentPage) candidateFrameIdSet.add(frameId);
    }

    const childFrameIdSetOnPage = new Set<string>();
    for (const elementList of Object.values(elementsByFrameId)) {
      for (const element of elementList || []) {
        if (element?.isFrameOrContainer && typeof element.id === "string") {
          childFrameIdSetOnPage.add(element.id);
        }
      }
    }

    for (const candidateFrameId of candidateFrameIdSet) {
      if (!childFrameIdSetOnPage.has(candidateFrameId)) {
        if (!rootPageSetByFrameId[candidateFrameId]) {
          rootPageSetByFrameId[candidateFrameId] = new Set<string>();
        }
        rootPageSetByFrameId[candidateFrameId].add(pageName);
      }
    }
  }

  return rootPageSetByFrameId;
}

function resolveOriginPageName(
  frameId: string,
  parentEdgeIndex: Record<string, ParentEdge>
): string | undefined {
  const visitedFrameIdSet = new Set<string>();
  let currentFrameId = frameId;
  let lastOriginPageName: string | undefined;

  while (parentEdgeIndex[currentFrameId]) {
    if (visitedFrameIdSet.has(currentFrameId)) break;
    visitedFrameIdSet.add(currentFrameId);

    const edge = parentEdgeIndex[currentFrameId];
    lastOriginPageName = edge.pageName;
    currentFrameId = edge.parentId;
  }
  return lastOriginPageName;
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

  const allFrameIdSet = new Set<string>(runtimeFrameIdsOnCurrentPage);
  for (const [, elementsByFrameId] of elementsByPageMap.entries()) {
    for (const frameId of Object.keys(elementsByFrameId)) allFrameIdSet.add(frameId);
    for (const elementList of Object.values(elementsByFrameId)) {
      for (const element of elementList || []) {
        if (element?.isFrameOrContainer && typeof element.id === "string") {
          allFrameIdSet.add(element.id);
        }
      }
    }
  }
  for (const pageName of pageNames) {
    for (const frameId of splitFrameListParam(urlParams.get(`frames.${pageName}`))) {
      allFrameIdSet.add(frameId);
    }
  }

  const itemsOnThisPage: DropdownItem[] = [];
  const itemsOnOtherPages: DropdownItem[] = [];

  for (const frameId of allFrameIdSet) {
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

    const rootPageSet = rootPageSetByFrameId[frameId];
    if (!rootPageSet || rootPageSet.size === 0) continue;

    for (const pageName of rootPageSet) {
      // Do not surface roots on non-current pages if they have no direct children on that page.
      const directChildrenOnPage =
        (elementsByPageMap.get(pageName)?.[frameId] || []).length > 0;

      if (pageName !== currentTopPageName && !directChildrenOnPage) {
        continue; // filters out TopFrame for iframe internal pages
      }

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

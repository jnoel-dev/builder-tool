export const DEFAULT_FRAME_NAME = "TopFrame";
export const DEFAULT_PAGE_NAME = "HomePage";
export const FRAMES_PARAM_PREFIX = "frames.";
export const ELEMENTS_PARAM_PREFIX = "elements.";

export interface FrameElement {
  id: string;
  componentName: string;
  xPercent: number;
  yPercent: number;
  isFrameOrContainer: boolean;
  customProps: Record<string, any>;
}

export function isSameOrigin(event: MessageEvent): boolean {
  return event.origin === window.location.origin;
}

function deriveComponentNameFromId(elementId: string): string {
  const lastDashIndex = elementId.lastIndexOf("-");
  return lastDashIndex > 0 ? elementId.slice(0, lastDashIndex) : elementId;
}

export function parseElementsParam(elementsParam: string): Record<string, FrameElement[]> {
  const elementsByFrameName: Record<string, FrameElement[]> = {};
  if (!elementsParam) return elementsByFrameName;

  const frameEntries = elementsParam.split(";");
  for (const frameEntry of frameEntries) {
    if (!frameEntry) continue;

    const [frameName, serializedElements = ""] = frameEntry.split(":");
    if (!frameName) continue;

    const elementListForFrame: FrameElement[] = [];
    const serializedElementEntries = serializedElements.split("|").filter(Boolean);

    for (const serializedElement of serializedElementEntries) {
      const elementFields = serializedElement.split(",");
      if (elementFields.length < 4) continue; 
      const elementId = elementFields[0];
      const secondField = elementFields[1];

      let componentName: string;
      let nextIndex: number;

      const secondFieldIsNumber = /^\d+$/.test(secondField);
      if (secondFieldIsNumber) {
        componentName = deriveComponentNameFromId(elementId);
        nextIndex = 1;
      } else {
        componentName = secondField;
        nextIndex = 2;
      }

      const xPercentString = elementFields[nextIndex++] ?? "0";
      const yPercentString = elementFields[nextIndex++] ?? "0";
      const isFrameOrContainerString = elementFields[nextIndex++] ?? "false";

      const encodedCustomProps = elementFields.slice(nextIndex).join(",");
      let decodedCustomProps: Record<string, any> = {};
      try {
        decodedCustomProps = encodedCustomProps ? JSON.parse(decodeURIComponent(encodedCustomProps)) : {};
      } catch {
        decodedCustomProps = {};
      }

      elementListForFrame.push({
        id: elementId,
        componentName,
        xPercent: Number(xPercentString) / 100,
        yPercent: Number(yPercentString) / 100,
        isFrameOrContainer: isFrameOrContainerString === "true",
        customProps: decodedCustomProps,
      });
    }

    elementsByFrameName[frameName] = elementListForFrame;
  }

  return elementsByFrameName;
}


export function serializeElementsParam(elementsByFrame: Record<string, FrameElement[]>): string {
  const frameChunks: string[] = [];

  for (const [frameName, elementListForFrame] of Object.entries(elementsByFrame)) {
    const serializedElements: string[] = [];

    for (const element of elementListForFrame || []) {
      const { id, componentName, xPercent, yPercent, isFrameOrContainer, customProps } = element;

      const xPercentInt = Math.round((xPercent ?? 0) * 100);
      const yPercentInt = Math.round((yPercent ?? 0) * 100);
      const isFrameOrContainerString = isFrameOrContainer ? "true" : "false";
      const encodedProps = customProps && Object.keys(customProps).length > 0
        ? encodeURIComponent(JSON.stringify(customProps))
        : "";

      const shouldOmitComponentName = id.startsWith(`${componentName}-`);

      const fields: Array<string> = [
        id,
        ...(shouldOmitComponentName ? [] : [componentName]),
        String(xPercentInt),
        String(yPercentInt),
        isFrameOrContainerString,
      ];

      if (encodedProps) fields.push(encodedProps);

      serializedElements.push(fields.join(","));
    }

    frameChunks.push(`${frameName}:${serializedElements.join("|")}`);
  }

  return frameChunks.join(";");
}


export function findParentFrameName(
  childFrameId: string,
  elementsByFrameName: Record<string, FrameElement[]>
): string | null {
  for (const frameName of Object.keys(elementsByFrameName)) {
    const elementsForFrame = elementsByFrameName[frameName] || [];
    const containsChildFrame = elementsForFrame.some(
      (element) => element.isFrameOrContainer && element.id === childFrameId
    );
    if (containsChildFrame) {
      return frameName;
    }
  }
  return null;
}

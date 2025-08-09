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

export function parseElementsParam(elementsParam: string): Record<string, FrameElement[]> {
  const elementsByFrameName: Record<string, FrameElement[]> = {};

  if (!elementsParam) {
    return elementsByFrameName;
  }

  const frameEntries = elementsParam.split(";");
  for (const frameEntry of frameEntries) {
    if (!frameEntry) continue;

    const [frameName, serializedElements = ""] = frameEntry.split(":");
    if (!frameName) continue;

    const elementListForFrame: FrameElement[] = [];
    const serializedElementEntries = serializedElements.split("|").filter(Boolean);

    for (const serializedElement of serializedElementEntries) {
      const elementFields = serializedElement.split(",");
      if (elementFields.length < 6) continue;

      const [
        elementId,
        componentName,
        xPercentString,
        yPercentString,
        isFrameOrContainerString,
        encodedCustomProps,
      ] = elementFields;

      let decodedCustomProps: Record<string, any> = {};
      try {
        decodedCustomProps = encodedCustomProps
          ? JSON.parse(decodeURIComponent(encodedCustomProps))
          : {};
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

export function serializeElementsParam(
  elementsByFrameName: Record<string, FrameElement[]>
): string {
  const frameEntries: string[] = [];

  for (const frameName of Object.keys(elementsByFrameName)) {
    const elementsForFrame = elementsByFrameName[frameName] || [];

    const serializedElementStrings: string[] = [];
    for (const element of elementsForFrame) {
      const roundedXPercent = Math.round(element.xPercent * 100);
      const roundedYPercent = Math.round(element.yPercent * 100);
      const encodedCustomProps = encodeURIComponent(
        JSON.stringify(element.customProps || {})
      );

      serializedElementStrings.push(
        [
          element.id,
          element.componentName,
          roundedXPercent,
          roundedYPercent,
          element.isFrameOrContainer,
          encodedCustomProps,
        ].join(",")
      );
    }

    frameEntries.push(`${frameName}:${serializedElementStrings.join("|")}`);
  }

  return frameEntries.join(";");
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

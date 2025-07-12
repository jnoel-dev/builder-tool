"use client";

import React, {
	createContext,
	useState,
	useContext,
	useRef,
	useEffect,
	ReactNode,
} from "react";
import LZString from "lz-string";

export type FrameElement = {
	id: string;
	componentName: string;
	xPercent: number;
	yPercent: number;
  isFrameOrContainer: boolean;
};

export type FrameContextType = {
	selectedFrameName: string;
	setSelectedFrameName: (frameName: string) => void;
	frameNames: string[];
	addFrame: (frameName: string) => void;
	removeFrame: (frameElement: FrameElement) => void;
	addElementToFrame: (componentName: string, isFrameOrContainer: boolean) => string;
	removeElementFromFrame: (
		elementId: string,
		connectedFrameOrContainerName: string
	) => void;
	updateElementPosition: (
		elementId: string,
		xPercent: number,
		yPercent: number,
		connectedFrameOrContainerName: string
	) => void;
	allFrameElements: { [frameName: string]: FrameElement[] };
	frameContainerRefs: {
		[frameName: string]: React.RefObject<HTMLDivElement | null>;
	};
};

const FrameContext = createContext<FrameContextType | undefined>(undefined);

export function FrameManager({ children }: { children: ReactNode }) {
	const [frameNames, setFrameNames] = useState<string[]>([]);
	const [selectedFrameName, setSelectedFrameName] = useState<string>("");
	const [allFrameElements, setAllFrameElements] = useState<{
		[frameName: string]: FrameElement[];
	}>({});
	const [nextElementId, setNextElementId] = useState(0);

	const containerRefs = useRef<
		Record<string, React.RefObject<HTMLDivElement | null>>
	>({});

	const frameContainerRefs = containerRefs.current;


useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const framesParam = urlParams.get('frames');
  const elementsParam = urlParams.get('elements');
  if (!framesParam || !elementsParam) return;

  const frameNameList = framesParam.split(',');

  const elementsByFrame: Record<string, FrameElement[]> = {};
  for (const frameEntry of elementsParam.split(';')) {
    const [frameName, elementListString] = frameEntry.split(':');
    if (!frameName) continue;

    const elementArray: FrameElement[] = [];
    if (elementListString) {
      for (const elementEntry of elementListString.split('|')) {
        const [id, componentName, xInt, yInt, isFrameOrContainerStr] = elementEntry.split(',');
        const xPercent = Number(xInt) / 100;
        const yPercent = Number(yInt) / 100;
        const isFrameOrContainer = isFrameOrContainerStr === 'false';
        elementArray.push({ id, componentName, xPercent, yPercent, isFrameOrContainer });
      }
    }
    elementsByFrame[frameName] = elementArray;

  }

  setFrameNames(frameNameList);
  setAllFrameElements(elementsByFrame);

  let highestIdNumber = 0;
  for (const elementList of Object.values(elementsByFrame)) {
    for (const element of elementList) {
      const idParts = element.id.split('-');
      const idNumber = parseInt(idParts[idParts.length - 1], 10);
      if (!isNaN(idNumber) && idNumber > highestIdNumber) {
        highestIdNumber = idNumber;
      }
    }
  }
  setNextElementId(highestIdNumber);

  if (frameNameList.length > 0) {
    setSelectedFrameName(frameNameList[0]);
  }
}, []);

useEffect(() => {
  const serializedFrames = frameNames.join(',');

  const serializedElements = frameNames
    .map(frame => {
      const elementList = allFrameElements[frame] || [];
      const serializedEntries = elementList
        .map(element => {
          const xInt = Math.round(element.xPercent * 100);
          const yInt = Math.round(element.yPercent * 100);
          return [
            element.id,
            element.componentName,
            xInt,
            yInt,
            element.isFrameOrContainer
          ].join(',');
        })
        .join('|');

      return `${frame}:${serializedEntries}`;
    })
    .join(';');

  const newSearchParams = new URLSearchParams();
  newSearchParams.set('frames', serializedFrames);
  newSearchParams.set('elements', serializedElements);

  const newUrl =
    `${window.location.origin}${window.location.pathname}?${newSearchParams.toString()}`;

  window.history.replaceState(null, '', newUrl);
}, [frameNames, allFrameElements]);






	function addFrame(frameName: string) {
		
		setFrameNames((prev) =>
			prev.includes(frameName) ? prev : [...prev, frameName]
		);
		setSelectedFrameName((prev) => (prev === "" ? frameName : prev));
		if (!containerRefs.current[frameName]) {
			containerRefs.current[frameName] =
				React.createRef<HTMLDivElement | null>();
		}
	}

function removeFrame(frameElement: FrameElement) {
  if (!frameElement.isFrameOrContainer) return

  const framesToRemove: string[] = []

  function gatherFrames(frameId: string) {
    framesToRemove.push(frameId)
    const children = allFrameElements[frameId] || []
    for (const child of children) {
      if (child.isFrameOrContainer) {
        gatherFrames(child.id)
      }
    }
  }

  gatherFrames(frameElement.id)

  setFrameNames(current =>
    current.filter(name => !framesToRemove.includes(name))
  )

  setAllFrameElements(current => {
    const updated = { ...current }
    for (const name of framesToRemove) {
      delete updated[name]
    }
    return updated
  })

  for (const name of framesToRemove) {
    delete containerRefs.current[name]
  }
  setSelectedFrameName("TopFrame")
}

  function addElementToFrame(componentName: string, isFrameOrContainer: boolean) {
    const existing = Object.values(allFrameElements)
      .flat()
      .filter(e => e.componentName === componentName);

    const highest = existing
      .map(e => parseInt(e.id.split("-").pop()!, 10))
      .filter(n => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0);

    const nextIndex = highest + 1;
    const newId = `${componentName}-${nextIndex}`;

    setAllFrameElements(prev => {
      const clone = { ...prev };
      const list = clone[selectedFrameName] || [];
      clone[selectedFrameName] = [
        ...list,
        { id: newId, componentName, xPercent: 50, yPercent: 50, isFrameOrContainer },
      ];
      return clone;
    });

    return newId;
  }

  function removeElementFromFrame(elementId: string, frameName: string) {
    setAllFrameElements(prev => {
      const clone = { ...prev };
      clone[frameName] = (clone[frameName] || []).filter(e => e.id !== elementId);
      return clone;
    });
  }

	function updateElementPosition(
		elementId: string,
		xPercent: number,
		yPercent: number,
		connectedFrameOrContainerName: string
	) {
		setAllFrameElements((prev) => {
			const clone = { ...prev };
			clone[connectedFrameOrContainerName] = (
				clone[connectedFrameOrContainerName] || []
			).map((e) =>
				e.id === elementId ? { ...e, xPercent, yPercent } : e
			);
			return clone;
		});
	}

	return (
		<FrameContext.Provider
			value={{
				selectedFrameName,
				setSelectedFrameName,
				frameNames,
				addFrame,
				removeFrame,
				addElementToFrame,
				removeElementFromFrame,
				updateElementPosition,
				allFrameElements,
				frameContainerRefs,
			}}
		>
			{children}
		</FrameContext.Provider>
	);
}

export function useFrame() {
	const ctx = useContext(FrameContext);
	if (!ctx) throw new Error("useFrame must be used within FrameManager");
	return ctx;
}

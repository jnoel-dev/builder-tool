"use client";

import React, {
	createContext,
	useState,
	useContext,
	useRef,
	useEffect,
	ReactNode,
} from "react";


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
        const isFrameOrContainer = isFrameOrContainerStr === 'true';
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

  const allElements = Object.values(allFrameElements).flat();

  const matchingElements = allElements.filter((element) => {
    return element.componentName === componentName;
  });

  const numericSuffixes = matchingElements
    .map((element) => {
      const idParts = element.id.split("-");
      const suffix = parseInt(idParts[idParts.length - 1], 10);
      return isNaN(suffix) ? null : suffix;
    })
    .filter((suffix): suffix is number => suffix !== null);

  const highestIndex = numericSuffixes.length > 0
    ? Math.max(...numericSuffixes)
    : 0;

  const nextIndex = highestIndex + 1;
  const newElementId = `${componentName}-${nextIndex}`;

  setAllFrameElements((previousElements) => {
    const updatedElements = { ...previousElements };
    const currentFrameElements = updatedElements[selectedFrameName] || [];

    const newElement = {
      id: newElementId,
      componentName,
      xPercent: 50,
      yPercent: 50,
      isFrameOrContainer,
    };

    updatedElements[selectedFrameName] = [...currentFrameElements, newElement];
 
    return updatedElements;
  });

  return newElementId;
}

function removeElementFromFrame(elementId: string, frameName: string) {
  setAllFrameElements((previousElements) => {
    const updatedElements = { ...previousElements };
    const currentFrameElements = updatedElements[frameName] || [];

    const filteredElements = currentFrameElements.filter((element) => {
      return element.id !== elementId;
    });

    updatedElements[frameName] = filteredElements;
    return updatedElements;
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

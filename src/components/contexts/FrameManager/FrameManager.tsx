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
	replaceElementsInFrame: (
		frameName: string,
		newElements: FrameElement[]
	) => void;
	addFrame: (frameName: string) => void;
	removeFrame: (frameElement: FrameElement) => void;
	addElementToFrame: (
		componentName: string,
		isFrameOrContainer: boolean
	) => string;
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

	// "load" elements via URL params - set needed frames and elements
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const framesParam = urlParams.get("frames");
		const elementsParam = urlParams.get("elements");
		if (!framesParam || !elementsParam) return;
		const frameNameList = framesParam.split(",");

		const elementsByFrame: Record<string, FrameElement[]> = {};
		for (const frameEntry of elementsParam.split(";")) {
			const [frameName, elementListString] = frameEntry.split(":");
			if (!frameName) continue;

			const elementArray: FrameElement[] = [];
			if (elementListString) {
				for (const elementEntry of elementListString.split("|")) {
					const [
						id,
						componentName,
						xInt,
						yInt,
						isFrameOrContainerStr,
					] = elementEntry.split(",");
					const xPercent = Number(xInt) / 100;
					const yPercent = Number(yInt) / 100;
					const isFrameOrContainer = isFrameOrContainerStr === "true";
					elementArray.push({
						id,
						componentName,
						xPercent,
						yPercent,
						isFrameOrContainer,
					});
				}
			}
			elementsByFrame[frameName] = elementArray;
		}
		setFrameNames(frameNameList);
		setAllFrameElements(elementsByFrame);

		let highestIdNumber = 0;
		for (const elementList of Object.values(elementsByFrame)) {
			for (const element of elementList) {
				const idParts = element.id.split("-");
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

  // "save" elements and frames and construct URL params
	useEffect(() => {
		const serializedFrames = frameNames.join(",");

		const serializedElements = frameNames
			.map((frame) => {
				const elementList = allFrameElements[frame] || [];
				const serializedEntries = elementList
					.map((element) => {
						const xInt = Math.round(element.xPercent * 100);
						const yInt = Math.round(element.yPercent * 100);
						return [
							element.id,
							element.componentName,
							xInt,
							yInt,
							element.isFrameOrContainer,
						].join(",");
					})
					.join("|");

				return `${frame}:${serializedEntries}`;
			})
			.join(";");

		const newSearchParams = new URLSearchParams();
		newSearchParams.set("frames", serializedFrames);
		newSearchParams.set("elements", serializedElements);

		const newUrl = `${window.location.origin}${
			window.location.pathname
		}?${newSearchParams.toString()}`;

		window.history.replaceState(null, "", newUrl);
	}, [frameNames, allFrameElements]);


//used to remove iframe elements 
useEffect(() => {
	if (window.top !== window) return;
  function handleRemoveElementMessage(event: MessageEvent) {
	
	if (!event.data || typeof event.data !== 'object') return;

	const { type, elementId, frameName, element } = event.data;

	if (type === 'removeElement' && elementId && frameName) {
		console.log("in:", window.name, "received message from:", (event.source as Window)?.name ?? "unknown", "to remove element: ",elementId, "from: ",frameName, "full data: ",event.data);

	  removeElementFromFrame(elementId, frameName);
		console.log("huh2",element.isFrameOrContainer)
	  if (element.isFrameOrContainer) {
		console.log("removig")
		removeFrame(element)
	  }
	}
  }

  window.addEventListener('message', handleRemoveElementMessage);
  return () => window.removeEventListener('message', handleRemoveElementMessage);
}, []);

//used to update element postitions in iframes
useEffect(() => {
	if (window.top !== window) return;
  function handleUpdateElementPositionMessage(event: MessageEvent) {
	
	if (!event.data || typeof event.data !== 'object') return;

	const {
	  type,
	  elementId,
	  frameName,
	  xPercent,
	  yPercent
	} = event.data;

	if (type === 'updateElementPosition' && elementId && frameName) {
		console.log("in:", window.name, "received message from:", (event.source as Window)?.name ?? "unknown", "to update position");

	  updateElementPosition(elementId, xPercent, yPercent, frameName);
	}
  }

  window.addEventListener('message', handleUpdateElementPositionMessage);
  return () => window.removeEventListener('message', handleUpdateElementPositionMessage);
}, []);

useEffect(() => {
  if (window.top === window) return;

  function handleMessage(event: MessageEvent) {
    const data = event.data;

    if (
      !data ||
      typeof data !== 'object' ||
      data.type !== 'syncFrame' ||
      data.frameName !== window.name
    ) {
      return;
    }

    const incoming = data.elements;
    if (!incoming || typeof incoming !== 'object') return;

    console.log("in:", window.name, "received full sync from:", (event.source as Window)?.name ?? "unknown", incoming);

    // Replace the full allFrameElements tree
    setAllFrameElements(incoming);
  }

  window.addEventListener('message', handleMessage);
  window.top?.postMessage({ type: 'iframeReady' }, '*');

  return () => {
    window.removeEventListener('message', handleMessage);
  };
}, []);


  useEffect(() => {
  if (window.top !== window) return;

  function handleMessage(event: MessageEvent) {
    if (!event.data || typeof event.data !== 'object') return;
    if (event.data.type !== 'frameAdded' || !event.data.frameName) return;

    console.log("Top frame received frameAdded from:", (event.source as Window)?.name ?? 'unknown', "for frame:", event.data.frameName);
	addFrame(event.data.frameName);
    // handle frame addition logic here if needed
  }

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);


// used to replace all element data in iframes when loading 
function replaceElementsInFrame(
	frameName: string,
	newElements: FrameElement[]
) {
	setAllFrameElements((prev) => {
		const updated: { [key: string]: FrameElement[] } = { ...prev };
		updated[frameName] = newElements;
		console.log("UPDATED FRAME ELEMENTS: ",updated)
		return updated;
	});
}

  // used to add/remove frame data when frame/container is added/removed
function addFrame(newFrameName: string) {
  setFrameNames(existing =>
    existing.includes(newFrameName) ? existing : [...existing, newFrameName]
  );

  setSelectedFrameName(current =>
    current === "" ? newFrameName : current
  );

  if (!containerRefs.current[newFrameName]) {
    containerRefs.current[newFrameName] = React.createRef<HTMLDivElement | null>();
  }
}

function removeFrame(frameToRemove: FrameElement) {
	console.log("removing frame called with : ", frameToRemove)
  if (!frameToRemove.isFrameOrContainer) return;

  const frameIdsToRemove: string[] = [];

  const collectFrames = (id: string) => {
    frameIdsToRemove.push(id);
    const children = allFrameElements[id] || [];
    for (const child of children) {
      if (child.isFrameOrContainer) {
        collectFrames(child.id);
      }
    }
  };

  collectFrames(frameToRemove.id);

  setFrameNames(existing =>
    existing.filter(name => !frameIdsToRemove.includes(name))
  );

  setAllFrameElements(existing => {
    const updated = { ...existing };
    for (const name of frameIdsToRemove) {
      delete updated[name];
    }
    return updated;
  });

  for (const name of frameIdsToRemove) {
    delete containerRefs.current[name];
  }

  setSelectedFrameName("TopFrame");
}

   // used to add/remove element data when element is added/removed
function addElementToFrame(
  componentName: string,
  isFrameOrContainer: boolean
) {
  // get all elements from all frames
  const allExistingElements = Object.values(allFrameElements).flat();

  const elementsWithSameComponent = allExistingElements.filter(
    (element) => element.componentName === componentName
  );

  // find number of all existing elements and find the highest one and use it for new element
  const numericSuffixes = elementsWithSameComponent
    .map((element) => {
      const idParts = element.id.split("-");
      const numericSuffix = parseInt(idParts[idParts.length - 1], 10);
      return isNaN(numericSuffix) ? null : numericSuffix;
    })
    .filter((suffix): suffix is number => suffix !== null);

  const highestSuffix = numericSuffixes.length > 0 ? Math.max(...numericSuffixes) : 0;
  const newIndex = highestSuffix + 1;
  const newElementId = `${componentName}-${newIndex}`;

  // Add the new element to the selected frame
  setAllFrameElements(existingElements => {
    const updatedElements = { ...existingElements };
    const elementsInTargetFrame = updatedElements[selectedFrameName] || [];

    const newElement = {
      id: newElementId,
      componentName,
      xPercent: 50,
      yPercent: 50,
      isFrameOrContainer,
    };

    updatedElements[selectedFrameName] = [...elementsInTargetFrame, newElement];
	console.log("ELEMENT LIST for: ",window.name, "here: ", updatedElements)
    return updatedElements;
  });

  return newElementId;
}

function removeElementFromFrame(elementId: string, frameName: string) {
  // Remove element by ID from a specific frame
  setAllFrameElements(existingElements => {
    const updatedElements = { ...existingElements };
    const currentElements = updatedElements[frameName] || [];

    updatedElements[frameName] = currentElements.filter(
      (element) => element.id !== elementId
    );
	console.log("UPDATED ALLFRAMEELEMENTS: ",updatedElements, "IN FRAME: ",window.name)
    return updatedElements;
  });
}

  // used to update element postition
  function updateElementPosition(
    elementId: string,
    xPercent: number,
    yPercent: number,
    frameName: string
  ) {
    setAllFrameElements(currentElements => {
      const updatedElements = { ...currentElements };

      const updatedFrameElements = (updatedElements[frameName] || []).map(element =>
        element.id === elementId
          ? { ...element, xPercent, yPercent }
          : element
      );

      updatedElements[frameName] = updatedFrameElements;
      return updatedElements;
    });
  }


	return (
		<FrameContext.Provider
			value={{
				selectedFrameName,
				setSelectedFrameName,
				frameNames,
				replaceElementsInFrame,
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

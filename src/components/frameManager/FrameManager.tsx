"use client";

import React, { createContext, useState, useContext } from "react";

type FrameContextType = {
	selectedFrame: string;
	setSelectedFrame: (frame: string) => void;
	frames: string[];
	addFrame: (frame: string) => void;
	selectedPosition: string;
	setSelectedPosition: (position: string) => void;
};

const FrameContext = createContext<FrameContextType | undefined>(undefined);

export const FrameProvider = ({ children }: { children: React.ReactNode }) => {
	const [frames, setFrames] = useState<string[]>(["TopFrame"]);
	const [selectedFrame, setSelectedFrame] = useState("TopFrame");
    const [selectedPosition, setSelectedPosition] = useState('vertical');


	const addFrame = (frame: string) => {
		setFrames((prev) => (prev.includes(frame) ? prev : [...prev, frame]));
	};

	return (
		<FrameContext.Provider
			value={{ selectedFrame, setSelectedFrame, frames, addFrame, selectedPosition, setSelectedPosition,}}
		>
			{children}
		</FrameContext.Provider>
	);
};

export const useFrame = () => {
	const context = useContext(FrameContext);
	if (!context) {
		throw new Error("useFrame must be used within a FrameProvider");
	}
	return context;
};

"use client";

import * as React from "react";
import Divider from "@mui/material/Divider";
import AddElementButton from "@/components/sideMenu/elementsMenu/addElementButton/AddElementButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useFrame } from "@/components/contexts/FrameManager/FrameManager";
import { FormHelperText } from "@mui/material";

enum TabIndex {
	Frames,
	Panels,
	Inputs,
	Dialogs,
}

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function CustomTabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
		
			{...other}
		>
			{value === index && <Box>{children}</Box>}
		</div>
	);
}

function getTabProps(index: number) {
	return {
		id: `simple-tab-${index}`,
	};
}

export default function ElementsMenu() {
	const [selectedTab, setTab] = React.useState(TabIndex.Frames);
	const { currentFrame, setCurrentFrame, frameList } = useFrame();

	const handleTabChange = (event: React.SyntheticEvent, tabIndex: number) => {
		setTab(tabIndex);
	};

	const handleFrameChange = (event: SelectChangeEvent) => {

		setCurrentFrame(event.target.value as string);
	};

	return (
		<div>
			<Box display="flex" width="100%" alignItems="center">
				<FormControl size="small" sx={{ flex: 1, paddingTop: "4px" }}>
					<FormHelperText>Select a container</FormHelperText>
					<Select
						labelId="frame-select-label"
						id="frame-select-label"
						value={currentFrame}
						onChange={handleFrameChange}
						sx={{ textAlign: "center" }}
					>
						{frameList.map((frame) => {
							const displayName = frame
								.replace(/([A-Z])/g, " $1")
								.trim()
								.toUpperCase();

							return (
								<MenuItem key={frame} value={frame}>
									{displayName}
								</MenuItem>
							);
						})}
					</Select>
				</FormControl>
			</Box>

			<Box sx={{ width: "100%" }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs
						value={selectedTab}
						onChange={handleTabChange}
						textColor="secondary"
						indicatorColor="secondary"
						centered
					>
						<Tab label="Frames" {...getTabProps(TabIndex.Frames)} />
						<Tab label="Panels" {...getTabProps(TabIndex.Panels)} />
						<Tab label="Inputs" {...getTabProps(TabIndex.Inputs)} />
						<Tab label="Dialogs" {...getTabProps(TabIndex.Dialogs)} />
						
					</Tabs>
				</Box>

				{/* COMPONENT NAMES MUST MATCH WHAT IS DEFINED IN COMPONENT REGISTRY 
				- if component names are not used, display name will be used
				- strings are used here cause we add elements to frame in the same way we deserialize from URL*/}
				<CustomTabPanel value={selectedTab} index={TabIndex.Panels}>
					<AddElementButton displayName="Panel"/>
					<Divider component="li" />
					<AddElementButton displayName="PanelSVG" />
					<Divider component="li" />
					<AddElementButton displayName="PanelCanvas" />
					<Divider component="li" />
					<AddElementButton displayName="PanelTable" />
					<Divider component="li" />
					<AddElementButton displayName="PanelEmbedExamples" />
					<Divider component="li" />
					<AddElementButton displayName="PanelDisabled" />
					<Divider component="li" />
				</CustomTabPanel>

				<CustomTabPanel value={selectedTab} index={TabIndex.Inputs}>
					<AddElementButton displayName="Input" />
					<Divider component="li" />
					<AddElementButton displayName="InputReact" />
					<Divider component="li" />
					<AddElementButton displayName="InputComplex" />
					<Divider component="li" />
					<AddElementButton displayName="InputRedraw" />
					<Divider component="li" />
					<AddElementButton displayName="InputPointerEvent" />
					<Divider component="li" />
				</CustomTabPanel>

				<CustomTabPanel value={selectedTab} index={TabIndex.Dialogs}>
					<AddElementButton displayName="DialogNative" />
					<Divider component="li" />
					<AddElementButton displayName="DialogUI5" />
					<Divider component="li" />
					<AddElementButton displayName="DialogMUI" />
					<Divider component="li" />
					<AddElementButton displayName="DialogForge" />
					<Divider component="li" />
					<AddElementButton displayName="DialogFocusTrap" />
					<Divider component="li" />
				</CustomTabPanel>

				<CustomTabPanel value={selectedTab} index={TabIndex.Frames}>
					<AddElementButton
						displayName="Iframe"
						componentNames={["IframeSameDomain","IframeCrossDomain"]}
						isFrameOrContainer={true}
					/>
					<Divider component="li" />
					<AddElementButton
						displayName="PopupWindow"
						componentNames={["PopupWindowSameDomain","PopupWindowCrossDomain"]}
						isFrameOrContainer={true}
					/>
					<Divider component="li" />
					<AddElementButton
						displayName="Container"
						componentNames={["ContainerVertical","ContainerHorizontal"]}
						isFrameOrContainer={true}
					/>
					<Divider component="li" />
					<AddElementButton 
						displayName="Fragment"
						componentNames={["FragmentVertical","FragmentHorizontal"]}
						isFrameOrContainer={true}
					/>
					<Divider component="li" />
					<AddElementButton
						displayName="ShadowRoot"
						componentNames={["ShadowRootOpen","ShadowRootClosed"]}
						isFrameOrContainer={true}
					/>
					<Divider component="li" />

				</CustomTabPanel>
			</Box>
		</div>
	);
}
